import { prisma } from './prisma';

function getUtcToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function incrementImpressions(params: {
  accountId: string;
  siteId: string;
  campaignId: string;
  experimentId?: string | null;
  variantId?: string | null;
}): Promise<void> {
  const date = getUtcToday();

  await prisma.dailyMetric.upsert({
    where: {
      campaign_variant_date: {
        campaignId: params.campaignId,
        variantId: params.variantId ?? '',
        date,
      },
    },
    update: {
      impressionsCount: { increment: 1 },
    },
    create: {
      accountId: params.accountId,
      siteId: params.siteId,
      campaignId: params.campaignId,
      experimentId: params.experimentId ?? null,
      variantId: params.variantId ?? '',
      date,
      impressionsCount: 1,
    },
  });
}

export async function incrementSubmissions(params: {
  accountId: string;
  siteId: string;
  campaignId: string;
  experimentId?: string | null;
  variantId?: string | null;
}): Promise<void> {
  const date = getUtcToday();

  await prisma.dailyMetric.upsert({
    where: {
      campaign_variant_date: {
        campaignId: params.campaignId,
        variantId: params.variantId ?? '',
        date,
      },
    },
    update: {
      submissionsCount: { increment: 1 },
    },
    create: {
      accountId: params.accountId,
      siteId: params.siteId,
      campaignId: params.campaignId,
      experimentId: params.experimentId ?? null,
      variantId: params.variantId ?? '',
      date,
      submissionsCount: 1,
    },
  });
}

export async function incrementParticipants(params: {
  accountId: string;
  siteId: string;
  campaignId: string;
  experimentId?: string | null;
  variantId?: string | null;
}): Promise<void> {
  const date = getUtcToday();

  await prisma.dailyMetric.upsert({
    where: {
      campaign_variant_date: {
        campaignId: params.campaignId,
        variantId: params.variantId ?? '',
        date,
      },
    },
    update: {
      participantsCount: { increment: 1 },
    },
    create: {
      accountId: params.accountId,
      siteId: params.siteId,
      campaignId: params.campaignId,
      experimentId: params.experimentId ?? null,
      variantId: params.variantId ?? '',
      date,
      participantsCount: 1,
    },
  });
}
