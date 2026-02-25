import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAccountId } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const accountId = await getAccountId();
    const { campaignId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '30d';

    // Verify campaign belongs to account (tenant scoping)
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, accountId },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    const daysBack = range === '7d' ? 7 : range === '90d' ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    startDate.setUTCHours(0, 0, 0, 0);

    // Overall totals
    const totals = await prisma.dailyMetric.aggregate({
      where: { campaignId, date: { gte: startDate } },
      _sum: {
        impressionsCount: true,
        submissionsCount: true,
      },
    });

    const totalImp = totals._sum.impressionsCount || 0;
    const totalSub = totals._sum.submissionsCount || 0;

    // Per-variant aggregates
    const variantMetrics = await prisma.dailyMetric.groupBy({
      by: ['variantId'],
      where: { campaignId, date: { gte: startDate } },
      _sum: {
        impressionsCount: true,
        submissionsCount: true,
      },
    });

    // Daily timeseries per variant
    const timeseries = await prisma.dailyMetric.groupBy({
      by: ['variantId', 'date'],
      where: { campaignId, date: { gte: startDate } },
      _sum: {
        impressionsCount: true,
        submissionsCount: true,
      },
      orderBy: { date: 'asc' },
    });

    // Map variant IDs to names from campaign config
    const config = campaign.config as any;
    const variants = config?.variants || [];
    const variantNameMap = new Map<string, string>(
      variants.map((v: any) => [v.id, v.name])
    );

    return NextResponse.json({
      campaignId,
      campaignName: campaign.name,
      totals: {
        impressions: totalImp,
        submissions: totalSub,
        conversionRate: totalImp > 0 ? (totalSub / totalImp) * 100 : 0,
      },
      variants: variantMetrics.map((vm) => {
        const imp = vm._sum.impressionsCount || 0;
        const sub = vm._sum.submissionsCount || 0;
        return {
          variantId: vm.variantId || '',
          variantName: variantNameMap.get(vm.variantId || '') || 'Unknown',
          impressions: imp,
          submissions: sub,
          conversionRate: imp > 0 ? (sub / imp) * 100 : 0,
        };
      }),
      timeseries: timeseries.map((t) => {
        const imp = t._sum.impressionsCount || 0;
        const sub = t._sum.submissionsCount || 0;
        return {
          variantId: t.variantId || '',
          date: t.date.toISOString().split('T')[0],
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
    console.error('Campaign analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
