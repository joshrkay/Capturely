import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/runtime-token";
import { fireWebhook } from "@/lib/webhooks";
import { checkSpam, parseSpamConfig } from "@/lib/spam";

const submitSchema = z.object({
  publicKey: z.string().min(1),
  campaignId: z.string().optional(),
  variantId: z.string().optional(),
  experimentId: z.string().optional(),
  visitorId: z.string().optional(),
  submissionId: z.string().uuid("submissionId must be a valid UUID"),
  fields: z.record(z.string(), z.string()),
  recaptchaToken: z.string().optional(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/** OPTIONS /api/runtime/submit — CORS preflight */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/** POST /api/runtime/submit — Submit form data */
export async function POST(req: NextRequest) {
  try {
    // Verify token
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing token", code: "UNAUTHORIZED" },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.slice(7);
    const tokenPk = verifyToken(token);
    if (!tokenPk) {
      return NextResponse.json(
        { error: "Invalid or expired token", code: "TOKEN_INVALID" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Parse body
    const body = await req.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400, headers: corsHeaders }
      );
    }

    const { publicKey, campaignId, variantId, experimentId, visitorId, submissionId, fields, recaptchaToken } = parsed.data;

    // Token public key must match payload
    if (tokenPk !== publicKey) {
      return NextResponse.json(
        { error: "Token mismatch", code: "TOKEN_MISMATCH" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Honeypot: if a field named "_hp" is non-empty, silently accept but discard
    if (fields._hp && fields._hp.length > 0) {
      return NextResponse.json({ ok: true, submissionId }, { headers: corsHeaders });
    }

    // Look up site
    const site = await prisma.site.findUnique({
      where: { publicKey },
      select: { id: true, accountId: true, status: true },
    });

    if (!site) {
      return NextResponse.json(
        { error: "Site not found", code: "NOT_FOUND" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Extract common fields
    const email: string | null = fields["email"] ?? fields["Email"] ?? null;
    const phone: string | null = fields["phone"] ?? fields["Phone"] ?? null;
    const name: string | null = fields["name"] ?? fields["Name"] ?? fields["full_name"] ?? null;

    // Extract client IP for spam protection
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    // Spam protection: check campaign-level spam config
    let isSpam = false;
    if (campaignId) {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { spamConfigJson: true },
      });
      const spamConfig = parseSpamConfig(campaign?.spamConfigJson ?? null);
      if (spamConfig) {
        const spamResult = await checkSpam({
          config: spamConfig,
          ip,
          email: email ?? undefined,
          campaignId,
          recaptchaToken,
        });
        isSpam = spamResult.isSpam;
      }
    }

    // Idempotent upsert — if this submissionId already exists for this site, skip
    try {
      await prisma.submission.create({
        data: {
          accountId: site.accountId,
          siteId: site.id,
          campaignId: campaignId ?? null,
          variantId: variantId ?? null,
          submissionId,
          email,
          phone,
          name,
          fieldsJson: JSON.stringify(fields),
          ipAddress: ip !== "unknown" ? ip : null,
          ...(isSpam ? { status: "spam" } : {}),
        },
      });
    } catch (error: unknown) {
      // Unique constraint violation = duplicate submission, return success (idempotent)
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code: string }).code === "P2002"
      ) {
        return NextResponse.json({ ok: true, submissionId, duplicate: true }, { headers: corsHeaders });
      }
      throw error;
    }

    // Skip usage increment and webhooks for spam submissions
    if (isSpam) {
      return NextResponse.json({ ok: true, submissionId }, { status: 201, headers: corsHeaders });
    }

    // Increment usage counter atomically
    await prisma.accountUsage.upsert({
      where: { accountId: site.accountId },
      create: {
        accountId: site.accountId,
        submissionCount: 1,
      },
      update: {
        submissionCount: { increment: 1 },
      },
    });

    // Write ExperimentEvent conversion for A/B testing (non-blocking)
    if (experimentId && variantId && visitorId) {
      prisma.experimentEvent.create({
        data: {
          visitorId,
          experimentKey: experimentId,
          variationId: variantId,
          eventType: "conversion",
          campaignId: campaignId ?? null,
          siteId: site.id,
        },
      }).catch(() => {
        // Best-effort — don't fail the submission for analytics
      });
    }

    // Fire webhook if configured (non-blocking)
    if (campaignId) {
      fireWebhook(site.id, campaignId, {
        submissionId,
        email,
        phone,
        name,
        fields,
        campaignId,
        variantId: variantId ?? null,
        createdAt: new Date().toISOString(),
      }).catch(() => {
        // Best-effort — don't fail the submission for webhooks
      });
    }

    return NextResponse.json(
      { ok: true, submissionId },
      { status: 201, headers: corsHeaders }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal error", code: "INTERNAL_ERROR" },
      { status: 500, headers: corsHeaders }
    );
  }
}
