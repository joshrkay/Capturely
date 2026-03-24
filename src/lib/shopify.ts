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

interface ShopifyScriptTag {
  id: number;
  src: string;
  event: string;
  created_at: string;
}

/**
 * Inject a script tag into a Shopify store via the Admin REST API.
 * Called after successful OAuth to install widget.js automatically.
 */
export async function injectScriptTag(
  shopDomain: string,
  accessToken: string,
  scriptSrc: string
): Promise<ShopifyScriptTag> {
  const response = await fetch(
    `https://${shopDomain}/admin/api/2024-01/script_tags.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({
        script_tag: {
          event: "onload",
          src: scriptSrc,
        },
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Shopify script tag injection failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as { script_tag: ShopifyScriptTag };
  return data.script_tag;
}

/**
 * List all script tags installed on a Shopify store.
 */
export async function listScriptTags(
  shopDomain: string,
  accessToken: string
): Promise<ShopifyScriptTag[]> {
  const response = await fetch(
    `https://${shopDomain}/admin/api/2024-01/script_tags.json`,
    {
      headers: { "X-Shopify-Access-Token": accessToken },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Shopify list script tags failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as { script_tags: ShopifyScriptTag[] };
  return data.script_tags;
}

/**
 * Delete a script tag from a Shopify store.
 */
export async function deleteScriptTag(
  shopDomain: string,
  accessToken: string,
  scriptTagId: number
): Promise<void> {
  const response = await fetch(
    `https://${shopDomain}/admin/api/2024-01/script_tags/${scriptTagId}.json`,
    {
      method: "DELETE",
      headers: { "X-Shopify-Access-Token": accessToken },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Shopify delete script tag failed: ${response.status} ${text}`);
  }
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
