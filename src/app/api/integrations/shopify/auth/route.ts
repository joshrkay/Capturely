import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { isValidShopDomain, buildShopifyAuthUrl } from "@/lib/shopify";

/** GET /api/integrations/shopify/auth — Initiates Shopify OAuth redirect */
export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get("shop");

  if (!shop || !isValidShopDomain(shop)) {
    return NextResponse.json(
      { error: "Invalid shop domain", code: "INVALID_SHOP" },
      { status: 400 }
    );
  }

  const nonce = randomBytes(16).toString("hex");
  const authUrl = buildShopifyAuthUrl(shop, nonce);

  const response = NextResponse.redirect(authUrl);
  // Store nonce in a cookie for verification on callback
  response.cookies.set("shopify_oauth_nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return response;
}
