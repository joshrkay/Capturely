import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { canView } from "@/lib/rbac";

const campaignAnalyticsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(366).default(30),
});

/** GET /api/campaigns/:id/analytics — Per-campaign analytics */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await withAccountContext();
    if (!canView(ctx.role)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const { id } = await params;
    const campaign = await prisma.campaign.findFirst({
      where: { id, accountId: ctx.accountId },
      include: { variants: true },
    });
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const parsed = campaignAnalyticsQuerySchema.safeParse({
      days: searchParams.get("days") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { days } = parsed.data;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Use bounded groupBy queries instead of O(variants) count calls.
    const [eventCounts, submissionCounts] = await Promise.all([
      prisma.experimentEvent.groupBy({
        by: ["variationId", "eventType"],
        where: {
          campaignId: id,
          variationId: { in: campaign.variants.map((variant) => variant.id) },
          timestamp: { gte: since },
        },
        _count: { _all: true },
      }),
      prisma.submission.groupBy({
        by: ["variantId"],
        where: { campaignId: id, variantId: { not: null }, createdAt: { gte: since } },
        _count: { _all: true },
      }),
    ]);

    const eventByVariant = new Map<string, { impressions: number; conversions: number }>();
    for (const row of eventCounts) {
      const current = eventByVariant.get(row.variationId) ?? { impressions: 0, conversions: 0 };
      if (row.eventType === "impression") {
        current.impressions = row._count._all;
      } else {
        current.conversions = row._count._all;
      }
      eventByVariant.set(row.variationId, current);
    }

    const submissionsByVariant = new Map<string, number>();
    for (const row of submissionCounts) {
      if (!row.variantId) continue;
      submissionsByVariant.set(row.variantId, row._count._all);
    }

    const variantMetrics = campaign.variants.map((variant) => {
      const eventCountsForVariant = eventByVariant.get(variant.id) ?? { impressions: 0, conversions: 0 };
      const submissions = submissionsByVariant.get(variant.id) ?? 0;
      const impressions = eventCountsForVariant.impressions;
      const conversions = eventCountsForVariant.conversions;

      return {
        variantId: variant.id,
        variantName: variant.name,
        isControl: variant.isControl,
        trafficPercentage: variant.trafficPercentage,
        impressions,
        conversions,
        submissions,
        conversionRate: impressions > 0 ? Math.round((conversions / impressions) * 10000) / 100 : 0,
      };
    });

    // Total campaign metrics
    const totalImpressions = variantMetrics.reduce((sum, v) => sum + v.impressions, 0);
    const totalConversions = variantMetrics.reduce((sum, v) => sum + v.conversions, 0);
    const totalSubmissions = variantMetrics.reduce((sum, v) => sum + v.submissions, 0);

    return NextResponse.json({
      campaignId: id,
      campaignName: campaign.name,
      period: { days, since: since.toISOString() },
      totals: {
        impressions: totalImpressions,
        conversions: totalConversions,
        submissions: totalSubmissions,
        conversionRate: totalImpressions > 0 ? Math.round((totalConversions / totalImpressions) * 10000) / 100 : 0,
      },
      variants: variantMetrics,
    });
  } catch (err) {
    if (err instanceof AccountContextError) {
      return NextResponse.json({ error: err.message, code: "AUTH_ERROR" }, { status: err.statusCode });
    }
    throw err;
  }
}
