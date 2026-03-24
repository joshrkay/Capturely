import { createHmac } from "crypto";

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY ?? "";
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET ?? "";
const SHOPIFY_SCOPES = process.env.SHOPIFY_SCOPES ?? "read_themes,write_script_tags";

/**
 * Validates a Shopify shop domain. Must match *.myshopify.com pattern.
 */
export function isValidShopDomain(shop: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shop);
}

/**
 * Build the Shopify OAuth authorization URL.
 */
export function buildShopifyAuthUrl(shop: string, nonce: string): string {
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/integrations/shopify/callback`;
  const params = new URLSearchParams({
    client_id: SHOPIFY_API_KEY,
    scope: SHOPIFY_SCOPES,
    redirect_uri: redirectUri,
    state: nonce,
  });
  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
}

/**
 * Verify the HMAC signature on Shopify's OAuth callback query parameters.
 */
export function verifyHmac(
  query: Record<string, string>
): boolean {
  const { hmac, ...rest } = query;
  if (!hmac) return false;

  const message = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join("&");

  const digest = createHmac("sha256", SHOPIFY_API_SECRET)
    .update(message)
    .digest("hex");

  return digest === hmac;
}

/**
 * Exchange the temporary authorization code for a permanent access token.
 */
export async function exchangeCodeForToken(
  shop: string,
  code: string
): Promise<string> {
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Shopify token exchange failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}
