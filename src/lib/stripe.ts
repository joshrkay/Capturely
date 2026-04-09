/**
 * Stripe client and billing helpers — server-side only.
 */
import Stripe from "stripe";

let _stripe: Stripe | null = null;

/** Thrown when Stripe or webhook env is missing at runtime (lazy init). */
export class StripeConfigurationError extends Error {
  readonly code = "STRIPE_NOT_CONFIGURED" as const;

  constructor(message: string) {
    super(message);
    this.name = "StripeConfigurationError";
  }
}

export function getStripeClient(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new StripeConfigurationError("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(key, {
      apiVersion: "2026-02-25.clover",
      typescript: true,
    });
  }
  return _stripe;
}

const PLAN_PRICE_ENV_MAP = {
  starter: "STRIPE_STARTER_PRICE_ID",
  growth: "STRIPE_GROWTH_PRICE_ID",
} as const;

export function getPriceIdForPlan(planKey: string): string | null {
  const envKey = PLAN_PRICE_ENV_MAP[planKey as keyof typeof PLAN_PRICE_ENV_MAP];
  if (!envKey) {
    return null;
  }

  const priceId = process.env[envKey];
  return priceId && priceId.trim() !== "" ? priceId : null;
}

export function getPlanKeyForPriceId(planPriceId: string): string | null {
  for (const planKey of Object.keys(PLAN_PRICE_ENV_MAP)) {
    const configuredPriceId = getPriceIdForPlan(planKey);
    if (configuredPriceId === planPriceId) {
      return planKey;
    }
  }
  return null;
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
    throw new StripeConfigurationError(`No Stripe price ID configured for plan: ${params.planKey}`);
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

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.create(sessionParams);
  return session.url ?? "";
}

export async function createBillingPortalSession(params: {
  customerId: string;
  returnUrl: string;
}): Promise<string> {
  const stripe = getStripeClient();
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
    throw new StripeConfigurationError("STRIPE_WEBHOOK_SECRET is not configured");
  }
  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
