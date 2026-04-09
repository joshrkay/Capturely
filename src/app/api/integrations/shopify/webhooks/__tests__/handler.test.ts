import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockVerifyShopifyWebhookSignature,
  mockIntegrationFindMany,
  mockSubmissionDeleteMany,
  mockSubmissionFindMany,
  mockIntegrationDeleteMany,
  mockSiteDeleteMany,
  mockCampaignDeleteMany,
  mockWebhookDeleteMany,
  mockNotificationDeleteMany,
  mockOptimizationRunDeleteMany,
  mockAiGenerationLogDeleteMany,
  mockExperimentEventDeleteMany,
} = vi.hoisted(() => ({
  mockVerifyShopifyWebhookSignature: vi.fn(),
  mockIntegrationFindMany: vi.fn(),
  mockSubmissionDeleteMany: vi.fn(),
  mockSubmissionFindMany: vi.fn(),
  mockIntegrationDeleteMany: vi.fn(),
  mockSiteDeleteMany: vi.fn(),
  mockCampaignDeleteMany: vi.fn(),
  mockWebhookDeleteMany: vi.fn(),
  mockNotificationDeleteMany: vi.fn(),
  mockOptimizationRunDeleteMany: vi.fn(),
  mockAiGenerationLogDeleteMany: vi.fn(),
  mockExperimentEventDeleteMany: vi.fn(),
}));

vi.mock("@/lib/shopify-webhook", () => ({
  ShopifyWebhookConfigurationError: class ShopifyWebhookConfigurationError extends Error {
    readonly code = "SHOPIFY_API_SECRET_NOT_CONFIGURED" as const;
  },
  verifyShopifyWebhookSignature: mockVerifyShopifyWebhookSignature,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    integration: {
      findMany: mockIntegrationFindMany,
      deleteMany: mockIntegrationDeleteMany,
    },
    submission: {
      deleteMany: mockSubmissionDeleteMany,
      findMany: mockSubmissionFindMany,
    },
    site: {
      deleteMany: mockSiteDeleteMany,
    },
    campaign: {
      deleteMany: mockCampaignDeleteMany,
    },
    webhook: {
      deleteMany: mockWebhookDeleteMany,
    },
    notification: {
      deleteMany: mockNotificationDeleteMany,
    },
    optimizationRun: {
      deleteMany: mockOptimizationRunDeleteMany,
    },
    aiGenerationLog: {
      deleteMany: mockAiGenerationLogDeleteMany,
    },
    experimentEvent: {
      deleteMany: mockExperimentEventDeleteMany,
    },
  },
}));

import { handleShopifyGdprWebhook } from "@/app/api/integrations/shopify/webhooks/_shared";

describe("shopify GDPR webhook handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyShopifyWebhookSignature.mockReturnValue(true);
    mockIntegrationFindMany.mockResolvedValue([
      {
        accountId: "acc_1",
        metadata: JSON.stringify({ shopDomain: "store.myshopify.com" }),
      },
    ]);
    mockSubmissionDeleteMany.mockResolvedValue({ count: 1 });
    mockSubmissionFindMany.mockResolvedValue([{ id: "sub_1" }]);
    mockIntegrationDeleteMany.mockResolvedValue({ count: 1 });
    mockSiteDeleteMany.mockResolvedValue({ count: 1 });
    mockCampaignDeleteMany.mockResolvedValue({ count: 1 });
    mockWebhookDeleteMany.mockResolvedValue({ count: 1 });
    mockNotificationDeleteMany.mockResolvedValue({ count: 1 });
    mockOptimizationRunDeleteMany.mockResolvedValue({ count: 1 });
    mockAiGenerationLogDeleteMany.mockResolvedValue({ count: 1 });
    mockExperimentEventDeleteMany.mockResolvedValue({ count: 1 });
  });

  it("returns 401 when HMAC header is missing", async () => {
    const req = new Request("http://localhost", { method: "POST", body: "{}" });

    const res = await handleShopifyGdprWebhook("customers_redact", req as never);

    expect(res.status).toBe(401);
  });

  it("returns 401 when signature is invalid", async () => {
    mockVerifyShopifyWebhookSignature.mockReturnValue(false);
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ shop_domain: "store.myshopify.com" }),
      headers: { "x-shopify-hmac-sha256": "bad" },
    });

    const res = await handleShopifyGdprWebhook("customers_redact", req as never);

    expect(res.status).toBe(401);
  });

  it("deletes customer submissions and returns 200 for customers/redact", async () => {
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({
        shop_domain: "store.myshopify.com",
        customer: { email: "customer@example.com" },
      }),
      headers: { "x-shopify-hmac-sha256": "sig" },
    });

    const res = await handleShopifyGdprWebhook("customers_redact", req as never);

    expect(res.status).toBe(200);
    expect(mockSubmissionDeleteMany).toHaveBeenCalledWith({
      where: {
        accountId: "acc_1",
        OR: [{ email: "customer@example.com" }],
      },
    });
  });

  it("returns matching submissions for customers/data_request", async () => {
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({
        shop_domain: "store.myshopify.com",
        customer: { email: "customer@example.com" },
      }),
      headers: { "x-shopify-hmac-sha256": "sig" },
    });

    const res = await handleShopifyGdprWebhook("customers_data_request", req as never);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      requested: true,
      submissions: [{ id: "sub_1" }],
    });
  });

  it("deletes account-scoped data for shop/redact", async () => {
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ shop_domain: "store.myshopify.com" }),
      headers: { "x-shopify-hmac-sha256": "sig" },
    });

    const res = await handleShopifyGdprWebhook("shop_redact", req as never);

    expect(res.status).toBe(200);
    expect(mockCampaignDeleteMany).toHaveBeenCalledWith({ where: { accountId: "acc_1" } });
    expect(mockSiteDeleteMany).toHaveBeenCalledWith({ where: { accountId: "acc_1" } });
    expect(mockIntegrationDeleteMany).toHaveBeenCalledWith({ where: { accountId: "acc_1" } });
  });
});
