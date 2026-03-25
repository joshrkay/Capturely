import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { canManageBilling } from "@/lib/rbac";
import { createCheckoutSession, StripeConfigurationError } from "@/lib/stripe";

const checkoutSchema = z.object({
  planKey: z.enum(["starter", "growth"]),
});

/** POST /api/billing/checkout — Create Stripe Checkout session */
export async function POST(req: NextRequest) {
  try {
    const ctx = await withAccountContext();
    if (!canManageBilling(ctx.role)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const account = await prisma.account.findUnique({
      where: { id: ctx.accountId },
      select: { stripeCustomerId: true },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const url = await createCheckoutSession({
      accountId: ctx.accountId,
      planKey: parsed.data.planKey,
      customerId: account?.stripeCustomerId ?? undefined,
      successUrl: `${baseUrl}/app/billing?success=true`,
      cancelUrl: `${baseUrl}/app/billing?canceled=true`,
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
