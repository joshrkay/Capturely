"use client";

import Link from "next/link";
import { useState } from "react";
import { IntegrationCard } from "./integration-card";

type Integration = {
  id: string;
  metadata: string | null;
  status: "connected" | "disconnected" | "error";
};

type ShopifyMetadata = {
  shopDomain?: string;
  installMethod?: "theme_app_extension" | "script_tag";
  appEmbedActivationUrl?: string;
  appEmbedStatus?: "pending_activation" | "activated";
  installPathDeprecated?: boolean;
  migratedFromScriptTagsAt?: string;
  removedLegacyScriptTagIds?: number[];
};

export function ShopifyCard({ integration }: { integration: Integration | null }) {
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const status = integration?.status ?? "disconnected";

  let metadata: ShopifyMetadata = {};
  if (integration?.metadata) {
    try {
      metadata = JSON.parse(integration.metadata) as ShopifyMetadata;
    } catch {
      metadata = {};
    }
  }

  const shopDomain = metadata.shopDomain ?? null;
  const installMethod = metadata.installMethod ?? "script_tag";

  const disconnect = async () => {
    if (!integration?.id) return;
    setIsDisconnecting(true);
    try {
      await fetch(`/api/integrations/${integration.id}`, { method: "DELETE" });
      window.location.reload();
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <IntegrationCard
      icon="🛍️"
      title="Shopify"
      description="Connect your Shopify storefront using a Theme App Extension (app embed), with legacy script-tag fallback for older installs."
      status={status}
    >
      {status === "connected" ? (
        <div className="space-y-3">
          {shopDomain && <p className="text-sm text-zinc-600 dark:text-zinc-400">Connected shop: {shopDomain}</p>}

          {installMethod === "theme_app_extension" ? (
            <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
              <p className="font-medium">Recommended install path: Theme App Extension</p>
              <p className="mt-1">
                Capturely now uses Shopify app embeds. Open your theme editor and enable the Capturely app embed to finish activation.
              </p>
              {metadata.appEmbedActivationUrl && (
                <a
                  href={metadata.appEmbedActivationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  Open theme editor
                </a>
              )}
              {metadata.migratedFromScriptTagsAt && (
                <p className="mt-2 text-xs">
                  Legacy script-tag install was migrated on {new Date(metadata.migratedFromScriptTagsAt).toLocaleDateString()}.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
              <p className="font-medium">Legacy install path: Script tag</p>
              <p className="mt-1">
                This store is using a deprecated script-tag installation. Reconnect after Theme App Extension is configured to migrate automatically.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Link
              href="/app/integrations/shopify/connect"
              className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Manage
            </Link>
            <button
              type="button"
              onClick={disconnect}
              disabled={isDisconnecting}
              className="rounded border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {isDisconnecting ? "Disconnecting..." : "Disconnect"}
            </button>
          </div>
        </div>
      ) : (
        <Link
          href="/app/integrations/shopify/connect"
          className="inline-flex rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Connect Shopify
        </Link>
      )}
    </IntegrationCard>
  );
}
