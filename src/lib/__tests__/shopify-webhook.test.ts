import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  ShopifyWebhookConfigurationError,
  verifyShopifyWebhookSignature,
} from "@/lib/shopify-webhook";
import { createHmac } from "crypto";

describe("shopify webhook signature verification", () => {
  const originalSecret = process.env.SHOPIFY_API_SECRET;

  beforeEach(() => {
    process.env.SHOPIFY_API_SECRET = "test_shopify_secret";
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.SHOPIFY_API_SECRET;
    } else {
      process.env.SHOPIFY_API_SECRET = originalSecret;
    }
  });

  it("accepts a valid base64 signature", () => {
    const payload = JSON.stringify({ topic: "customers/redact" });
    const signature = createHmac("sha256", process.env.SHOPIFY_API_SECRET!)
      .update(payload)
      .digest("base64");

    expect(verifyShopifyWebhookSignature(payload, signature)).toBe(true);
  });

  it("rejects invalid signatures", () => {
    const payload = JSON.stringify({ topic: "customers/redact" });
    expect(verifyShopifyWebhookSignature(payload, "not-valid")).toBe(false);
  });

  it("throws when API secret is missing", () => {
    delete process.env.SHOPIFY_API_SECRET;
    expect(() => verifyShopifyWebhookSignature("{}", "abc")).toThrow(
      ShopifyWebhookConfigurationError
    );
  });
});
