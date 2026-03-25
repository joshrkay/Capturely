import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { verifyHmac, exchangeCodeForToken, isValidShopDomain, injectScriptTag, listScriptTags } from "@/lib/shopify";

/** GET /api/integrations/shopify/callback — Handles Shopify OAuth callback */
export async function GET(req: NextRequest) {
  try {
    const ctx = await withAccountContext();

    const shop = req.nextUrl.searchParams.get("shop") ?? "";
    const code = req.nextUrl.searchParams.get("code") ?? "";
    const state = req.nextUrl.searchParams.get("state") ?? "";
    const hmac = req.nextUrl.searchParams.get("hmac") ?? "";

    // Validate shop domain
    if (!isValidShopDomain(shop)) {
      return NextResponse.redirect(
        new URL("/app/integrations?error=invalid_shop", req.url)
      );
    }

    // Verify nonce from cookie
    const storedNonce = req.cookies.get("shopify_oauth_nonce")?.value;
    if (!storedNonce || storedNonce !== state) {
      return NextResponse.redirect(
        new URL("/app/integrations?error=invalid_state", req.url)
      );
    }

    // Verify HMAC
    const queryParams: Record<string, string> = {};
    req.nextUrl.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
    if (!verifyHmac(queryParams)) {
      return NextResponse.redirect(
        new URL("/app/integrations?error=invalid_hmac", req.url)
      );
    }

    // Exchange code for access token
    let accessToken: string;
    try {
      accessToken = await exchangeCodeForToken(shop, code);
    } catch {
      return NextResponse.redirect(
        new URL("/app/integrations?error=token_exchange_failed", req.url)
      );
    }

    // Inject widget.js script tag into the Shopify store
    const widgetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://app.capturely.io"}/widget.js`;
    let scriptTagId: number | undefined;
    try {
      // Avoid duplicate tags — check if already installed
      const existingTags = await listScriptTags(shop, accessToken);
      const alreadyInstalled = existingTags.some((t) => t.src === widgetUrl);
      if (!alreadyInstalled) {
        const tag = await injectScriptTag(shop, accessToken, widgetUrl);
        scriptTagId = tag.id;
      } else {
        scriptTagId = existingTags.find((t) => t.src === widgetUrl)?.id;
      }
    } catch {
      // Script tag injection failure is non-fatal; merchant can re-install manually
    }

    // Upsert integration record
    await prisma.integration.upsert({
      where: {
        accountId_platform: {
          accountId: ctx.accountId,
          platform: "shopify",
        },
      },
      create: {
        accountId: ctx.accountId,
        platform: "shopify",
        status: "connected",
        credentials: JSON.stringify({ accessToken }),
        metadata: JSON.stringify({ shopDomain: shop, scriptTagId }),
      },
      update: {
        status: "connected",
        credentials: JSON.stringify({ accessToken }),
        metadata: JSON.stringify({ shopDomain: shop, scriptTagId }),
      },
    });

    // Clear the nonce cookie
    const response = NextResponse.redirect(
      new URL("/app/integrations?success=shopify_connected", req.url)
    );
    response.cookies.delete("shopify_oauth_nonce");
    return response;
  } catch (err) {
    if (err instanceof AccountContextError) {
      // User not authenticated — redirect to sign in
      return NextResponse.redirect(
        new URL("/sign-in?redirect_url=/app/integrations", req.url)
      );
    }
    return NextResponse.redirect(
      new URL("/app/integrations?error=internal_error", req.url)
    );
  }
}
