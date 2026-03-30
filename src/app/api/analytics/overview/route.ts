import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { canView } from "@/lib/rbac";

const analyticsOverviewQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(366).default(30),
});

type DailySubmissionRow = {
  day: Date | string;
  count: bigint | number;
};

/** GET /api/analytics/overview — Dashboard analytics */
export async function GET(req: NextRequest) {
  try {
    const ctx = await withAccountContext();
    if (!canView(ctx.role)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const parsed = analyticsOverviewQuerySchema.safeParse({
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

    // Aggregate experiment events
    const [impressions, conversions] = await Promise.all([
      prisma.experimentEvent.count({
        where: {
          campaign: { accountId: ctx.accountId },
          eventType: "impression",
          timestamp: { gte: since },
        },
      }),
      prisma.experimentEvent.count({
        where: {
          campaign: { accountId: ctx.accountId },
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

    // Top campaigns by submissions (all-time count, intentionally not period-scoped).
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

    // We use a small Postgres-specific grouped query here to avoid loading every
    // submission row into memory for large accounts. The tradeoff is SQL portability
    // in exchange for a bounded result set and predictable API cost.
    const dailyRows = await prisma.$queryRaw<DailySubmissionRow[]>`
      SELECT DATE("created_at" AT TIME ZONE 'UTC') AS day, COUNT(*)::bigint AS count
      FROM "submissions"
      WHERE "account_id" = ${ctx.accountId} AND "created_at" >= ${since}
      GROUP BY day
      ORDER BY day ASC
    `;

    const dailySubmissions = dailyRows.map((row) => ({
      date: row.day instanceof Date ? row.day.toISOString().split("T")[0] : String(row.day),
      count: Number(row.count),
    }));

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
      dailySubmissions,
    });
  } catch (err) {
    if (err instanceof AccountContextError) {
      return NextResponse.json({ error: err.message, code: "AUTH_ERROR" }, { status: err.statusCode });
    }
    throw err;
  }
}
