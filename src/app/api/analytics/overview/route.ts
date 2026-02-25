import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAccountId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const accountId = await getAccountId();
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '30d';
    const siteId = searchParams.get('site_id');

    const daysBack = range === '7d' ? 7 : range === '90d' ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    startDate.setUTCHours(0, 0, 0, 0);

    const where: any = {
      accountId,
      date: { gte: startDate },
    };
    if (siteId) {
      where.siteId = siteId;
    }

    // 1. Aggregate totals
    const totals = await prisma.dailyMetric.aggregate({
      where,
      _sum: {
        impressionsCount: true,
        submissionsCount: true,
      },
    });

    const totalImpressions = totals._sum.impressionsCount || 0;
    const totalSubmissions = totals._sum.submissionsCount || 0;

    // 2. Time series grouped by date
    const timeseries = await prisma.dailyMetric.groupBy({
      by: ['date'],
      where,
      _sum: {
        impressionsCount: true,
        submissionsCount: true,
      },
      orderBy: { date: 'asc' },
    });

    // 3. Top campaigns by submissions
    const topCampaignsRaw = await prisma.dailyMetric.groupBy({
      by: ['campaignId'],
      where,
      _sum: {
        impressionsCount: true,
        submissionsCount: true,
      },
      orderBy: { _sum: { submissionsCount: 'desc' } },
      take: 10,
    });

    // Enrich with campaign names
    const campaignIds = topCampaignsRaw.map((c) => c.campaignId);
    const campaigns = await prisma.campaign.findMany({
      where: { id: { in: campaignIds } },
      select: { id: true, name: true, status: true, type: true },
    });

    const campaignMap = new Map(campaigns.map((c) => [c.id, c]));

    // 4. Active campaigns count
    const campaignWhere: any = { accountId };
    if (siteId) campaignWhere.siteId = siteId;
    const activeCampaigns = await prisma.campaign.count({
      where: { ...campaignWhere, status: 'active' },
    });

    return NextResponse.json({
      totals: {
        impressions: totalImpressions,
        submissions: totalSubmissions,
        conversionRate: totalImpressions > 0
          ? (totalSubmissions / totalImpressions) * 100
          : 0,
        activeCampaigns,
      },
      timeseries: timeseries.map((t) => {
        const imp = t._sum.impressionsCount || 0;
        const sub = t._sum.submissionsCount || 0;
        return {
          date: t.date.toISOString().split('T')[0],
          impressions: imp,
          submissions: sub,
          conversionRate: imp > 0 ? (sub / imp) * 100 : 0,
        };
      }),
      topCampaigns: topCampaignsRaw.map((tc) => {
        const campaign = campaignMap.get(tc.campaignId);
        const imp = tc._sum.impressionsCount || 0;
        const sub = tc._sum.submissionsCount || 0;
        return {
          campaignId: tc.campaignId,
          name: campaign?.name || 'Unknown',
          status: campaign?.status || 'unknown',
          type: campaign?.type || 'unknown',
          impressions: imp,
          submissions: sub,
          conversionRate: imp > 0 ? (sub / imp) * 100 : 0,
        };
      }),
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Analytics overview error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
