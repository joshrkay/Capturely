import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { canManageBilling } from "@/lib/rbac";
import { createBillingPortalSession, StripeConfigurationError } from "@/lib/stripe";

/** POST /api/billing/portal — Create Stripe billing portal session */
export async function POST() {
  try {
    const ctx = await withAccountContext();
    if (!canManageBilling(ctx.role)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const account = await prisma.account.findUnique({
      where: { id: ctx.accountId },
      select: { stripeCustomerId: true },
    });

    if (!account?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing account. Please subscribe first.", code: "NO_BILLING" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const url = await createBillingPortalSession({
      customerId: account.stripeCustomerId,
      returnUrl: `${baseUrl}/app/billing`,
    });

    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof AccountContextError) {
      return NextResponse.json({ error: err.message, code: "AUTH_ERROR" }, { status: err.statusCode });
    }
    if (err instanceof StripeConfigurationError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 503 }
      );
    }
    throw err;
  }
}
