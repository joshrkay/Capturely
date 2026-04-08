import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { canView } from "@/lib/rbac";
import {
  goalMetricDescription,
  goalMetricLabel,
  submissionMatchesGoal,
} from "@/lib/optimization-goal";

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

    const goalInput = {
      kind: campaign.optimizationGoalKind,
      text: campaign.optimizationGoalText,
      fieldKey: campaign.optimizationGoalFieldKey,
    };

    const recentSubmissions = await prisma.submission.findMany({
      where: {
        campaignId: id,
        createdAt: { gte: since },
        status: { not: "spam" },
      },
      select: { fieldsJson: true },
      take: 5000,
    });

    let goalAlignedSubmissions = 0;
    for (const row of recentSubmissions) {
      try {
        const fields = JSON.parse(row.fieldsJson) as Record<string, string>;
        if (submissionMatchesGoal(goalInput, fields)) goalAlignedSubmissions += 1;
      } catch {
        // skip malformed
      }
    }

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
      optimizationGoal: {
        kind: goalInput.kind,
        text: goalInput.text,
        fieldKey: goalInput.fieldKey,
        metricLabel: goalMetricLabel(goalInput),
        metricDescription: goalMetricDescription(goalInput),
        goalAlignedSubmissions,
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
