import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getExperimentResults } from "@/lib/growthbook";

/** POST /api/growthbook/webhook — Receive experiment status updates */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { event, experimentId } = body as { event: string; experimentId?: string };

  if (event !== "experiment.completed" || !experimentId) {
    return NextResponse.json({ received: true });
  }

  // Find the optimization run for this experiment
  const run = await prisma.optimizationRun.findFirst({
    where: { growthbookExperimentId: experimentId, status: "experimenting" },
    include: { campaign: true },
  });

  if (!run) {
    return NextResponse.json({ received: true, message: "No matching optimization run" });
  }

  try {
    const results = await getExperimentResults(experimentId);

    // Find winner
    const winner = results.variations.find((v) => v.key === results.winner);
    if (!winner) {
      await prisma.optimizationRun.update({
        where: { id: run.id },
        data: { status: "failed", completedAt: new Date() },
      });
      return NextResponse.json({ received: true, message: "No winner found" });
    }

    // Record results
    for (const v of results.variations) {
      await prisma.optimizationRunVariant.create({
        data: {
          runId: run.id,
          variantId: v.key,
          conversionRate: v.conversionRate,
          isWinner: v.key === results.winner,
        },
      });
    }

    // Promote winner
    await prisma.$transaction(async (tx) => {
      // Set winner as control
      await tx.variant.update({
        where: { id: winner.key },
        data: { isControl: true, trafficPercentage: 100 },
      });

      // Archive losers
      const loserIds = results.variations
        .filter((v) => v.key !== results.winner)
        .map((v) => v.key);
      for (const loserId of loserIds) {
        await tx.variant.update({
          where: { id: loserId },
          data: { isControl: false, trafficPercentage: 0 },
        });
      }

      // Update run status
      await tx.optimizationRun.update({
        where: { id: run.id },
        data: { status: "completed", completedAt: new Date() },
      });

      // Update campaign
      await tx.campaign.update({
        where: { id: run.campaignId },
        data: { optimizationStatus: "idle", hasUnpublishedChanges: true },
      });
    });

    // Create notification
    const controlRate = results.variations.find((v) => v.key !== results.winner)?.conversionRate ?? 0;
    const lift = controlRate > 0 ? ((winner.conversionRate - controlRate) / controlRate) * 100 : 0;

    await prisma.notification.create({
      data: {
        accountId: run.campaign.accountId,
        type: "experiment_completed",
        title: `Winner found: ${run.campaign.name}`,
        body: `Conversion improved by ${lift.toFixed(1)}%`,
        linkUrl: `/app/campaigns/${run.campaignId}/analytics`,
      },
    });
  } catch {
    await prisma.optimizationRun.update({
      where: { id: run.id },
      data: { status: "failed", completedAt: new Date() },
    });
  }

  return NextResponse.json({ received: true });
}
