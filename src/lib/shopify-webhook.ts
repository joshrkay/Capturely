import { createHmac, timingSafeEqual } from "crypto";

export class ShopifyWebhookConfigurationError extends Error {
  readonly code = "SHOPIFY_API_SECRET_NOT_CONFIGURED" as const;

  constructor(message: string) {
    super(message);
    this.name = "ShopifyWebhookConfigurationError";
  }
}

function getShopifyApiSecret(): string {
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) {
    throw new ShopifyWebhookConfigurationError(
      "SHOPIFY_API_SECRET is not configured"
    );
  }
  return secret;
}

export function verifyShopifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const expected = createHmac("sha256", getShopifyApiSecret())
    .update(payload)
    .digest("base64");

  const expectedBuf = Buffer.from(expected, "utf8");
  const receivedBuf = Buffer.from(signature.trim(), "utf8");

  if (expectedBuf.length !== receivedBuf.length) {
    return false;
  }

  return timingSafeEqual(expectedBuf, receivedBuf);
}
