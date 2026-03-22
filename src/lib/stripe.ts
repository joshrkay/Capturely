/**
 * Stripe client and billing helpers — server-side only.
 */
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is required");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-02-25.clover",
  typescript: true,
});

/** Stripe price IDs mapped to plan keys */
const PLAN_PRICE_MAP: Record<string, string> = {
  starter: process.env.STRIPE_STARTER_PRICE_ID ?? "price_starter",
  growth: process.env.STRIPE_GROWTH_PRICE_ID ?? "price_growth",
};

export function getPriceIdForPlan(planKey: string): string | null {
  return PLAN_PRICE_MAP[planKey] ?? null;
}

export async function createCheckoutSession(params: {
  accountId: string;
  planKey: string;
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const priceId = getPriceIdForPlan(params.planKey);
  if (!priceId) {
    throw new Error(`No price configured for plan: ${params.planKey}`);
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      accountId: params.accountId,
      planKey: params.planKey,
    },
  };

  if (params.customerId) {
    sessionParams.customer = params.customerId;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return session.url ?? "";
}

export async function createBillingPortalSession(params: {
  customerId: string;
  returnUrl: string;
}): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });
  return session.url;
}

export async function verifyWebhookSignature(
  payload: string,
  signature: string
): Promise<Stripe.Event> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is required");
  }
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
