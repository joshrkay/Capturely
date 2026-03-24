"use client";

import Link from "next/link";
import { useState } from "react";
import { IntegrationCard } from "./integration-card";

type Integration = {
  id: string;
  metadata: string | null;
  status: "connected" | "disconnected" | "error";
};

export function ShopifyCard({ integration }: { integration: Integration | null }) {
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const status = integration?.status ?? "disconnected";

  let shopDomain: string | null = null;
  if (integration?.metadata) {
    try {
      const parsed = JSON.parse(integration.metadata) as { shopDomain?: string };
      shopDomain = parsed.shopDomain ?? null;
    } catch {
      shopDomain = null;
    }
  }

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
      description="Connect your Shopify storefront for native Capturely embedding and sync."
      status={status}
    >
      {status === "connected" ? (
        <div className="space-y-3">
          {shopDomain && <p className="text-sm text-zinc-600 dark:text-zinc-400">Connected shop: {shopDomain}</p>}
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
