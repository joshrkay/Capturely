import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { canManageCampaigns } from "@/lib/rbac";
import { createExperiment, getExperiment, updateExperiment } from "@/lib/growthbook";

const createExperimentSchema = z.object({
  campaignId: z.string().min(1),
  name: z.string().min(1).max(200),
});

/** POST /api/experiments — Create a GrowthBook experiment for a campaign */
export async function POST(req: NextRequest) {
  try {
    const ctx = await withAccountContext();
    if (!canManageCampaigns(ctx.role)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createExperimentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() }, { status: 400 });
    }

    const campaign = await prisma.campaign.findFirst({
      where: { id: parsed.data.campaignId, accountId: ctx.accountId },
      include: { variants: true },
    });
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found", code: "NOT_FOUND" }, { status: 404 });
    }

    if (campaign.variants.length < 2) {
      return NextResponse.json({ error: "Need at least 2 variants for an experiment", code: "VALIDATION_ERROR" }, { status: 400 });
    }

    const trackingKey = `capturely_${campaign.id}`;
    const variations = campaign.variants.map((v) => ({
      name: v.name,
      key: v.id,
    }));
    const weights = campaign.variants.map((v) => v.trafficPercentage / 100);

    const experiment = await createExperiment({
      trackingKey,
      name: parsed.data.name,
      variations,
      weights,
    });

    // Store GrowthBook feature keys on variants
    for (const v of campaign.variants) {
      await prisma.variant.update({
        where: { id: v.id },
        data: { growthbookFeatureKey: trackingKey },
      });
    }

    return NextResponse.json(experiment, { status: 201 });
  } catch (err) {
    if (err instanceof AccountContextError) {
      return NextResponse.json({ error: err.message, code: "AUTH_ERROR" }, { status: err.statusCode });
    }
    throw err;
  }
}

/** GET /api/experiments?experimentId=... — Get experiment status from GrowthBook */
export async function GET(req: NextRequest) {
  try {
    const ctx = await withAccountContext();

    const { searchParams } = new URL(req.url);
    const experimentId = searchParams.get("experimentId");
    if (!experimentId) {
      return NextResponse.json({ error: "experimentId required", code: "VALIDATION_ERROR" }, { status: 400 });
    }

    const experiment = await getExperiment(experimentId);
    return NextResponse.json(experiment);
  } catch (err) {
    if (err instanceof AccountContextError) {
      return NextResponse.json({ error: err.message, code: "AUTH_ERROR" }, { status: err.statusCode });
    }
    throw err;
  }
}

/** PATCH /api/experiments — Update experiment (traffic weights, status) */
export async function PATCH(req: NextRequest) {
  try {
    const ctx = await withAccountContext();
    if (!canManageCampaigns(ctx.role)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const body = await req.json();
    const { experimentId, ...updates } = body;
    if (!experimentId) {
      return NextResponse.json({ error: "experimentId required", code: "VALIDATION_ERROR" }, { status: 400 });
    }

    const experiment = await updateExperiment(experimentId, updates);
    return NextResponse.json(experiment);
  } catch (err) {
    if (err instanceof AccountContextError) {
      return NextResponse.json({ error: err.message, code: "AUTH_ERROR" }, { status: err.statusCode });
    }
    throw err;
  }
}
