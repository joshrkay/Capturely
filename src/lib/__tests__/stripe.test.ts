import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

describe("stripe helpers", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("maps plan keys from configured Stripe price IDs", async () => {
    process.env.STRIPE_STARTER_PRICE_ID = "price_starter_live";
    process.env.STRIPE_GROWTH_PRICE_ID = "price_growth_live";

    const { getPriceIdForPlan, getPlanKeyForPriceId } = await import("@/lib/stripe");

    expect(getPriceIdForPlan("starter")).toBe("price_starter_live");
    expect(getPriceIdForPlan("growth")).toBe("price_growth_live");
    expect(getPlanKeyForPriceId("price_growth_live")).toBe("growth");
  });

  it("throws a configuration error when a plan price is not configured", async () => {
    delete process.env.STRIPE_STARTER_PRICE_ID;
    process.env.STRIPE_GROWTH_PRICE_ID = "price_growth_live";

    const { createCheckoutSession, StripeConfigurationError } = await import("@/lib/stripe");

    await expect(
      createCheckoutSession({
        accountId: "acc_1",
        planKey: "starter",
        successUrl: "http://localhost/success",
        cancelUrl: "http://localhost/cancel",
      })
    ).rejects.toBeInstanceOf(StripeConfigurationError);
  });
});
