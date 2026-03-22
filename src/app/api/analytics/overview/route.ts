import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { canView } from "@/lib/rbac";

/** GET /api/analytics/overview — Dashboard analytics */
export async function GET(req: NextRequest) {
  try {
    const ctx = await withAccountContext();
    if (!canView(ctx.role)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") ?? "30", 10);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get campaigns for this account
    const campaigns = await prisma.campaign.findMany({
      where: { accountId: ctx.accountId },
      select: { id: true },
    });
    const campaignIds = campaigns.map((c) => c.id);

    // Aggregate experiment events
    const [impressions, conversions] = await Promise.all([
      prisma.experimentEvent.count({
        where: {
          campaignId: { in: campaignIds },
          eventType: "impression",
          timestamp: { gte: since },
        },
      }),
      prisma.experimentEvent.count({
        where: {
          campaignId: { in: campaignIds },
          eventType: "conversion",
          timestamp: { gte: since },
        },
      }),
    ]);

    const conversionRate = impressions > 0 ? (conversions / impressions) * 100 : 0;

    // Submissions count
    const totalSubmissions = await prisma.submission.count({
      where: { accountId: ctx.accountId, createdAt: { gte: since } },
    });

    // Top campaigns by submissions
    const topCampaigns = await prisma.campaign.findMany({
      where: { accountId: ctx.accountId },
      include: {
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: { submissions: { _count: "desc" } },
      take: 5,
    });

    // Daily submission counts for chart
    const submissions = await prisma.submission.findMany({
      where: { accountId: ctx.accountId, createdAt: { gte: since } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const dailyCounts: Record<string, number> = {};
    for (const s of submissions) {
      const day = s.createdAt.toISOString().split("T")[0];
      dailyCounts[day] = (dailyCounts[day] ?? 0) + 1;
    }

    return NextResponse.json({
      period: { days, since: since.toISOString() },
      metrics: {
        impressions,
        conversions,
        conversionRate: Math.round(conversionRate * 100) / 100,
        totalSubmissions,
      },
      topCampaigns: topCampaigns.map((c) => ({
        id: c.id,
        name: c.name,
        submissions: c._count.submissions,
      })),
      dailySubmissions: Object.entries(dailyCounts).map(([date, count]) => ({ date, count })),
    });
  } catch (err) {
    if (err instanceof AccountContextError) {
      return NextResponse.json({ error: err.message, code: "AUTH_ERROR" }, { status: err.statusCode });
    }
    throw err;
  }
}
