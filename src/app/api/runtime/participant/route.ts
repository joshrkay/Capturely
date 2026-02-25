import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { incrementParticipants } from '@/lib/daily-metric';
import { corsHeaders, handleCorsPreflightResponse, validateOrigin } from '@/lib/cors';

const participantSchema = z.object({
  public_key: z.string().min(1),
  experiment_id: z.string().min(1),
  campaign_id: z.string().min(1),
  variant_id: z.string().min(1),
  visitor_id: z.string().min(1),
});

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleCorsPreflightResponse(origin);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    const body = await request.json();
    const result = participantSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400, headers }
      );
    }

    const { public_key, experiment_id, campaign_id, variant_id, visitor_id } = result.data;

    // Validate origin
    const originCheck = await validateOrigin(origin, public_key);
    if (!originCheck.valid || !originCheck.site) {
      return NextResponse.json(
        { error: 'Invalid origin' },
        { status: 403, headers }
      );
    }

    // Verify experiment/campaign
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaign_id,
        siteId: originCheck.site.id,
        accountId: originCheck.site.accountId,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404, headers }
      );
    }

    // Upsert participant — only new participants get counted
    try {
      await prisma.experimentParticipant.create({
        data: {
          accountId: originCheck.site.accountId,
          siteId: originCheck.site.id,
          experimentId: experiment_id,
          campaignId: campaign_id,
          variantId: variant_id,
          visitorId: visitor_id,
        },
      });

      // New participant — increment daily metric
      await incrementParticipants({
        accountId: originCheck.site.accountId,
        siteId: originCheck.site.id,
        campaignId: campaign_id,
        experimentId: experiment_id,
        variantId: variant_id,
      });

      return NextResponse.json(
        { ok: true, new_participant: true, variant_id },
        { status: 200, headers }
      );
    } catch (error: any) {
      // Unique constraint violation — visitor already assigned
      if (error?.code === 'P2002') {
        const existing = await prisma.experimentParticipant.findUnique({
          where: {
            experiment_visitor: { experimentId: experiment_id, visitorId: visitor_id },
          },
        });
        return NextResponse.json(
          { ok: true, new_participant: false, variant_id: existing?.variantId },
          { status: 200, headers }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Participant error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    );
  }
}
