import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateChallengerVariants } from "@/lib/ai/claude";
import { createExperiment } from "@/lib/growthbook";
import { buildManifest, writeManifestToDisk } from "@/lib/manifest";

const MAX_CHALLENGERS = 3;
const MAX_RUNS_PER_MONTH = 30;

// Circuit breaker: pause if the last completed run's winner converted worse than this fraction of the control
const MIN_WINNER_LIFT_FRACTION = -0.05; // allow up to -5% before pausing

/**
 * POST /api/cron/optimize — Auto-optimization cron job.
 * Called by Vercel Cron or external scheduler every 15 minutes.
 *
 * Checks for:
 * 1. Campaigns needing challenger generation (auto_optimize=true, optimizationStatus=idle)
 * 2. Generates variants via Claude API
 * 3. Creates GrowthBook experiment
 * 4. Publishes updated manifest
 *
 * Protected by CRON_SECRET header.
 */
export async function POST(req: NextRequest) {
  // Verify cron secret
  const secret = req.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET ?? ""}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Array<{ campaignId: string; status: string; error?: string }> = [];

  // Find campaigns eligible for optimization
  const campaigns = await prisma.campaign.findMany({
    where: {
      autoOptimize: true,
      optimizationStatus: "idle",
      status: "published",
    },
    include: {
      variants: { where: { isControl: true } },
      site: true,
      account: { select: { planKey: true } },
      optimizationRuns: {
        where: {
          startedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        select: { id: true },
      },
    },
    take: 5, // Process up to 5 campaigns per invocation
  });

  for (const campaign of campaigns) {
    try {
      // Guard: check plan allows auto-optimization
      if (campaign.account.planKey !== "growth" && campaign.account.planKey !== "enterprise") {
        results.push({ campaignId: campaign.id, status: "skipped", error: "Plan does not support auto-optimization" });
        continue;
      }

      // Guard: max runs per month
      if (campaign.optimizationRuns.length >= MAX_RUNS_PER_MONTH) {
        results.push({ campaignId: campaign.id, status: "skipped", error: "Monthly optimization limit reached" });
        continue;
      }

      // Circuit breaker: check if the last completed run's winner regressed significantly
      const lastCompletedRun = await prisma.optimizationRun.findFirst({
        where: { campaignId: campaign.id, status: "completed" },
        include: { variants: true },
        orderBy: { completedAt: "desc" },
      });
      if (lastCompletedRun) {
        const runWinner = lastCompletedRun.variants.find((v) => v.isWinner);
        const runControl = lastCompletedRun.variants.find(
          (v) => v.variantId === lastCompletedRun.currentControlVariantId
        );
        if (
          runWinner?.conversionRate != null &&
          runControl?.conversionRate != null &&
          runControl.conversionRate > 0
        ) {
          const lift = (runWinner.conversionRate - runControl.conversionRate) / runControl.conversionRate;
          if (lift < MIN_WINNER_LIFT_FRACTION) {
            // Pause auto-optimization and notify
            await prisma.campaign.update({
              where: { id: campaign.id },
              data: { autoOptimize: false, optimizationStatus: "idle" },
            });
            await prisma.notification.create({
              data: {
                accountId: campaign.accountId,
                type: "optimization_circuit_breaker",
                title: `Optimization paused: ${campaign.name}`,
                body: `The last winner converted ${(lift * 100).toFixed(1)}% below the control. Auto-optimization paused to protect conversion rates.`,
                linkUrl: `/app/campaigns/${campaign.id}/optimization`,
              },
            });
            results.push({ campaignId: campaign.id, status: "skipped", error: "Circuit breaker: conversion regression detected" });
            continue;
          }
        }
      }

      const control = campaign.variants[0];
      if (!control) {
        results.push({ campaignId: campaign.id, status: "skipped", error: "No control variant" });
        continue;
      }

      // Update status to generating
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { optimizationStatus: "generating" },
      });

      // Get historical conversion rate
      const [impressions, conversions] = await Promise.all([
        prisma.experimentEvent.count({
          where: { campaignId: campaign.id, variationId: control.id, eventType: "impression" },
        }),
        prisma.experimentEvent.count({
          where: { campaignId: campaign.id, variationId: control.id, eventType: "conversion" },
        }),
      ]);
      const conversionRate = impressions > 0 ? (conversions / impressions) * 100 : 0;

      // Get past winners/losers for context
      const pastRuns = await prisma.optimizationRun.findMany({
        where: { campaignId: campaign.id, status: "completed" },
        include: { variants: { include: { run: false } } },
        orderBy: { completedAt: "desc" },
        take: 5,
      });

      const pastWinners = pastRuns
        .flatMap((r) => r.variants.filter((v) => v.isWinner))
        .map((v) => v.variantId)
        .join(", ");

      // Generate challenger variants via Claude
      const aiResult = await generateChallengerVariants({
        controlSchema: control.schemaJson,
        conversionRate,
        pastWinners: pastWinners || undefined,
        count: MAX_CHALLENGERS,
      });

      // Parse the AI response
      let challengers: Array<{ name: string; hypothesis: string; schema: unknown }>;
      try {
        let jsonStr = aiResult.content;
        const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (match) jsonStr = match[1];
        challengers = JSON.parse(jsonStr);
      } catch {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { optimizationStatus: "idle" },
        });
        results.push({ campaignId: campaign.id, status: "failed", error: "Failed to parse AI response" });
        continue;
      }

      // Validate challengers: must have email field, must have fields array
      const validChallengers = challengers.filter((c) => {
        try {
          const s = c.schema as { fields?: Array<{ type: string }> };
          return s.fields && Array.isArray(s.fields) && s.fields.some((f) => f.type === "email");
        } catch {
          return false;
        }
      });

      if (validChallengers.length === 0) {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { optimizationStatus: "idle" },
        });
        results.push({ campaignId: campaign.id, status: "failed", error: "No valid challengers generated" });
        continue;
      }

      // Create optimization run + variant records
      const totalVariants = 1 + validChallengers.length;
      const trafficPerVariant = Math.floor(100 / totalVariants);
      const controlTraffic = 100 - trafficPerVariant * validChallengers.length;

      const run = await prisma.$transaction(async (tx) => {
        // Create challenger variants
        const challengerIds: string[] = [];
        for (const challenger of validChallengers) {
          const v = await tx.variant.create({
            data: {
              campaignId: campaign.id,
              name: challenger.name,
              isControl: false,
              trafficPercentage: trafficPerVariant,
              schemaJson: JSON.stringify(challenger.schema),
              generatedBy: "auto_optimization",
            },
          });
          challengerIds.push(v.id);
        }

        // Update control traffic
        await tx.variant.update({
          where: { id: control.id },
          data: { trafficPercentage: controlTraffic },
        });

        // Create optimization run
        const r = await tx.optimizationRun.create({
          data: {
            campaignId: campaign.id,
            status: "experimenting",
            currentControlVariantId: control.id,
            challengerVariantIds: challengerIds,
          },
        });

        return r;
      });

      // Create GrowthBook experiment
      const allVariants = await prisma.variant.findMany({
        where: { campaignId: campaign.id },
        select: { id: true, name: true, trafficPercentage: true },
      });

      try {
        const experiment = await createExperiment({
          trackingKey: `capturely_opt_${campaign.id}_${run.id}`,
          name: `${campaign.name} — Auto-optimization`,
          variations: allVariants.map((v) => ({ name: v.name, key: v.id })),
          weights: allVariants.map((v) => v.trafficPercentage / 100),
        });

        await prisma.optimizationRun.update({
          where: { id: run.id },
          data: { growthbookExperimentId: experiment.id },
        });
      } catch {
        // GrowthBook might not be available — continue without it
      }

      // Update campaign status and republish manifest
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { optimizationStatus: "experimenting", hasUnpublishedChanges: false },
      });

      // Republish site manifest
      const site = await prisma.site.findUnique({
        where: { id: campaign.siteId },
        include: {
          campaigns: {
            where: { status: "published" },
            include: { variants: true },
          },
        },
      });
      if (site) {
        const manifest = buildManifest(site);
        await writeManifestToDisk(site.publicKey, manifest);
      }

      // Log AI usage
      await prisma.aiGenerationLog.create({
        data: {
          accountId: campaign.accountId,
          type: "variant_generation",
          inputContext: JSON.stringify({ campaignId: campaign.id, conversionRate }),
          outputSchema: aiResult.content,
          tokensUsed: aiResult.tokensUsed,
        },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          accountId: campaign.accountId,
          type: "optimization_started",
          title: `New challengers for ${campaign.name}`,
          body: `${validChallengers.length} challenger variants generated and published.`,
          linkUrl: `/app/campaigns/${campaign.id}/optimization`,
        },
      });

      results.push({ campaignId: campaign.id, status: "success" });
    } catch (err) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { optimizationStatus: "idle" },
      }).catch(() => {});
      results.push({ campaignId: campaign.id, status: "failed", error: String(err) });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
