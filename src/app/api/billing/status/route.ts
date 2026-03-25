import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { canView } from "@/lib/rbac";
import { resolvePlan } from "@/lib/plans";

/**
 * GET /api/billing/status — Account billing status, plan, and usage.
 *
 * Plan tier, payment status, Stripe customer/subscription IDs, and billing cycle
 * dates are a read model: they are updated from Stripe via POST /api/stripe/webhook
 * (checkout, subscription, and invoice events). This handler does not call the Stripe
 * API and does not persist card numbers.
 */
export async function GET() {
  try {
    const ctx = await withAccountContext();
    if (!canView(ctx.role)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const account = await prisma.account.findUnique({
      where: { id: ctx.accountId },
      select: {
        planKey: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        paymentStatus: true,
        paymentGraceUntil: true,
        billingCycleStart: true,
        billingCycleEnd: true,
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const usage = await prisma.accountUsage.findUnique({
      where: { accountId: ctx.accountId },
    });

    const plan = resolvePlan(account.planKey);

    // Count sites
    const siteCount = await prisma.site.count({
      where: { accountId: ctx.accountId, status: "active" },
    });

    // Count campaigns
    const campaignCount = await prisma.campaign.count({
      where: { accountId: ctx.accountId },
    });

    return NextResponse.json({
      planKey: account.planKey,
      planName: plan.name,
      paymentStatus: account.paymentStatus,
      paymentGraceUntil: account.paymentGraceUntil,
      billingCycleStart: account.billingCycleStart,
      billingCycleEnd: account.billingCycleEnd,
      hasStripe: !!account.stripeCustomerId,
      limits: plan.limits,
      features: plan.features,
      usage: {
        submissionCount: usage?.submissionCount ?? 0,
        submissionLimit: plan.limits.submissionsPerMonth,
        aiGenerationsCount: usage?.aiGenerationsCount ?? 0,
        aiGenerationsLimit: plan.limits.aiGenerationsPerMonth,
        usageLocked: usage?.usageLocked ?? false,
        overageCount: usage?.overageCount ?? 0,
      },
      counts: {
        sites: siteCount,
        sitesLimit: plan.limits.sites,
        campaigns: campaignCount,
      },
    });
  } catch (err) {
    if (err instanceof AccountContextError) {
      return NextResponse.json({ error: err.message, code: "AUTH_ERROR" }, { status: err.statusCode });
    }
    throw err;
  }
}
