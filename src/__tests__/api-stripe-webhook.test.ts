import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockVerifyWebhookSignature,
  mockProcessedStripeEventFindUnique,
  mockProcessedStripeEventCreate,
  mockAccountFindFirst,
  mockAccountUpdate,
} = vi.hoisted(() => ({
  mockVerifyWebhookSignature: vi.fn(),
  mockProcessedStripeEventFindUnique: vi.fn(),
  mockProcessedStripeEventCreate: vi.fn(),
  mockAccountFindFirst: vi.fn(),
  mockAccountUpdate: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  StripeConfigurationError: class StripeConfigurationError extends Error {
    readonly code = "STRIPE_NOT_CONFIGURED" as const;
  },
  verifyWebhookSignature: mockVerifyWebhookSignature,
  getPlanKeyForPriceId: (priceId: string) => {
    if (priceId === "price_starter_live") return "starter";
    if (priceId === "price_growth_live") return "growth";
    return null;
  },
}));

vi.mock("@/lib/email", () => ({
  sendPaymentFailedEmail: vi.fn(),
  sendPaymentResumedEmail: vi.fn(),
}));

vi.mock("@/lib/account-owner-email", () => ({
  getAccountOwnerEmail: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    processedStripeEvent: {
      findUnique: mockProcessedStripeEventFindUnique,
      create: mockProcessedStripeEventCreate,
    },
    account: {
      findFirst: mockAccountFindFirst,
      update: mockAccountUpdate,
    },
    accountUsage: {
      upsert: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
  },
}));

import { POST } from "@/app/api/stripe/webhook/route";

describe("POST /api/stripe/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessedStripeEventFindUnique.mockResolvedValue(null);
    mockProcessedStripeEventCreate.mockResolvedValue({ id: "pse_1" });
  });

  it("updates plan key from Stripe subscription price ID on subscription updates", async () => {
    mockVerifyWebhookSignature.mockResolvedValue({
      id: "evt_sub_updated_1",
      type: "customer.subscription.updated",
      data: {
        object: {
          customer: "cus_1",
          current_period_start: 1710000000,
          current_period_end: 1712592000,
          items: {
            data: [{ price: { id: "price_growth_live" } }],
          },
        },
      },
    });
    mockAccountFindFirst.mockResolvedValue({ id: "acc_1", stripeCustomerId: "cus_1" });
    mockAccountUpdate.mockResolvedValue({ id: "acc_1" });

    const res = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        body: "{}",
        headers: { "stripe-signature": "sig" },
      }) as never
    );

    expect(res.status).toBe(200);
    expect(mockAccountUpdate).toHaveBeenCalledWith({
      where: { id: "acc_1" },
      data: {
        planKey: "growth",
        billingCycleStart: new Date(1710000000 * 1000),
        billingCycleEnd: new Date(1712592000 * 1000),
      },
    });
  });
});
