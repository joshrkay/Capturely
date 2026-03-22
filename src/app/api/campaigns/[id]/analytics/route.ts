import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { canView } from "@/lib/rbac";

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
    const days = parseInt(searchParams.get("days") ?? "30", 10);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Per-variant metrics
    const variantMetrics = await Promise.all(
      campaign.variants.map(async (variant) => {
        const [impressions, conversions, submissions] = await Promise.all([
          prisma.experimentEvent.count({
            where: { campaignId: id, variationId: variant.id, eventType: "impression", timestamp: { gte: since } },
          }),
          prisma.experimentEvent.count({
            where: { campaignId: id, variationId: variant.id, eventType: "conversion", timestamp: { gte: since } },
          }),
          prisma.submission.count({
            where: { campaignId: id, variantId: variant.id, createdAt: { gte: since } },
          }),
        ]);

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
      })
    );

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
