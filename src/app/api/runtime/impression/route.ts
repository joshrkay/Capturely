import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { incrementImpressions } from '@/lib/daily-metric';
import { corsHeaders, handleCorsPreflightResponse, validateOrigin } from '@/lib/cors';
import { checkRateLimit } from '@/lib/rate-limit';
import crypto from 'crypto';

const impressionSchema = z.object({
  public_key: z.string().min(1),
  campaign_id: z.string().min(1),
  variant_id: z.string().nullable().optional(),
  page_url: z.string().optional(),
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
    const result = impressionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400, headers }
      );
    }

    const { public_key, campaign_id, variant_id, page_url } = result.data;

    // Validate origin
    const originCheck = await validateOrigin(origin, public_key);
    if (!originCheck.valid || !originCheck.site) {
      return NextResponse.json(
        { error: 'Invalid origin' },
        { status: 403, headers }
      );
    }

    // Rate limit by public_key + IP hash
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
    const rateLimitKey = `impression:${public_key}:${ipHash}`;
    const rateCheck = checkRateLimit(rateLimitKey);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers }
      );
    }

    // Verify campaign is active
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaign_id,
        siteId: originCheck.site.id,
        accountId: originCheck.site.accountId,
        status: 'active',
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found or inactive' },
        { status: 404, headers }
      );
    }

    // Increment daily metric
    await incrementImpressions({
      accountId: originCheck.site.accountId,
      siteId: originCheck.site.id,
      campaignId: campaign_id,
      variantId: variant_id ?? null,
    });

    return NextResponse.json({ ok: true }, { status: 200, headers });
  } catch (error) {
    console.error('Impression error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    );
  }
}
