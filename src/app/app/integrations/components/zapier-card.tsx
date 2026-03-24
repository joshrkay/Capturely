"use client";

import { useState } from "react";
import { IntegrationCard } from "./integration-card";

export function ZapierCard({ status, webhookUrl }: { status: "connected" | "disconnected" | "error"; webhookUrl: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <IntegrationCard
      icon="⚡"
      title="Zapier"
      description="Forward new submissions into Zapier automations using the Capturely runtime webhook endpoint."
      status={status}
    >
      <div className="space-y-3">
        <div className="rounded border border-zinc-200 bg-zinc-50 p-2 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          {webhookUrl}
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {copied ? "Copied!" : "Copy URL"}
        </button>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          In Zapier, use &quot;Webhooks by Zapier&quot; and choose Catch Hook, then paste this URL as your
          destination.
        </p>
      </div>
    </IntegrationCard>
  );
}
