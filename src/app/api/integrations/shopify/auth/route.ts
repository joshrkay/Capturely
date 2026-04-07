import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { isValidShopDomain, buildShopifyAuthUrl } from "@/lib/shopify";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";

/** GET /api/integrations/shopify/auth — Initiates Shopify OAuth redirect */
export async function GET(req: NextRequest) {
  try {
    const ctx = await withAccountContext();
    const shop = req.nextUrl.searchParams.get("shop");

    if (!shop || !isValidShopDomain(shop)) {
      return NextResponse.json(
        { error: "Invalid shop domain", code: "INVALID_SHOP" },
        { status: 400 }
      );
    }

    const nonce = randomBytes(16).toString("hex");
    const authUrl = buildShopifyAuthUrl(shop, nonce);

    await prisma.oAuthAttempt.create({
      data: {
        nonce,
        accountId: ctx.accountId,
        shopDomain: shop,
      },
    });

    const response = NextResponse.redirect(authUrl);
    response.cookies.set("shopify_oauth_nonce", nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    return response;
  } catch (err) {
    if (err instanceof AccountContextError) {
      return NextResponse.redirect(
        new URL("/sign-in?redirect_url=/app/integrations", req.url)
      );
    }
    return NextResponse.json(
      { error: "Failed to initialize OAuth", code: "OAUTH_INIT_FAILED" },
      { status: 500 }
    );
  }
}
