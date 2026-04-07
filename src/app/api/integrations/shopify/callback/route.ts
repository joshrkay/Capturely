import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";
import {
  verifyHmac,
  exchangeCodeForToken,
  isValidShopDomain,
  injectScriptTag,
  listScriptTags,
  getInstallationPlan,
  migrateLegacyScriptTags,
} from "@/lib/shopify";

/** GET /api/integrations/shopify/callback — Handles Shopify OAuth callback */
export async function GET(req: NextRequest) {
  try {
    const ctx = await withAccountContext();

    const shop = req.nextUrl.searchParams.get("shop") ?? "";
    const code = req.nextUrl.searchParams.get("code") ?? "";
    const state = req.nextUrl.searchParams.get("state") ?? "";

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

    const widgetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://app.capturely.io"}/widget.js`;
    const installationPlan = getInstallationPlan(shop);

    let metadata: Record<string, unknown> = {
      shopDomain: shop,
      installMethod: installationPlan.method,
    };

    if (installationPlan.appEmbedActivationUrl) {
      metadata = {
        ...metadata,
        appEmbedActivationUrl: installationPlan.appEmbedActivationUrl,
        appEmbedStatus: "pending_activation",
      };
    }

    if (installationPlan.method === "theme_app_extension") {
      try {
        const migration = await migrateLegacyScriptTags(shop, accessToken, widgetUrl);
        if (migration.removedScriptTagIds.length > 0) {
          metadata = {
            ...metadata,
            migratedFromScriptTagsAt: new Date().toISOString(),
            removedLegacyScriptTagIds: migration.removedScriptTagIds,
          };
        }
      } catch {
        // Migration failure is non-fatal; store remains connected.
      }
    } else {
      let scriptTagId: number | undefined;
      try {
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

      metadata = {
        ...metadata,
        scriptTagId,
        installPathDeprecated: true,
      };
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
        metadata: JSON.stringify(metadata),
      },
      update: {
        status: "connected",
        credentials: JSON.stringify({ accessToken }),
        metadata: JSON.stringify(metadata),
      },
    });

    const response = NextResponse.redirect(
      new URL("/app/integrations?success=shopify_connected", req.url)
    );
    response.cookies.delete("shopify_oauth_nonce");
    return response;
  } catch (err) {
    if (err instanceof AccountContextError) {
      return NextResponse.redirect(
        new URL("/sign-in?redirect_url=/app/integrations", req.url)
      );
    }
    return NextResponse.redirect(
      new URL("/app/integrations?error=internal_error", req.url)
    );
  }
}
