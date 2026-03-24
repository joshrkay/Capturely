"use client";

import { useCallback, useMemo, useState } from "react";
import { IntegrationCard } from "./integration-card";

type Site = { id: string; name: string; publicKey: string };
type Webhook = { id: string; url: string; secret: string | null; active: boolean };

interface WebhooksCardProps {
  sites: Site[];
  status: "connected" | "disconnected" | "error";
  initialSiteId: string;
  initialWebhooks: Webhook[];
}

export function WebhooksCard({ sites, status, initialSiteId, initialWebhooks }: WebhooksCardProps) {
  const [siteId, setSiteId] = useState<string>(initialSiteId);
  const [webhooks, setWebhooks] = useState<Webhook[]>(initialWebhooks);
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const selectedSite = useMemo(() => sites.find((s) => s.id === siteId) ?? null, [sites, siteId]);

  const loadWebhooks = useCallback(async (nextSiteId: string) => {
    if (!nextSiteId) return;
    setIsLoading(true);
    setError(null);
    const res = await fetch(`/api/webhooks?siteId=${nextSiteId}`);
    if (!res.ok) {
      setIsLoading(false);
      setError("Unable to load webhooks.");
      return;
    }
    const data = (await res.json()) as { webhooks: Webhook[] };
    setWebhooks(data.webhooks);
    setIsLoading(false);
  }, []);

  const addWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteId || !url) return;
    setError(null);
    const res = await fetch("/api/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId, url, secret: secret || undefined }),
    });
    if (res.ok) {
      setUrl("");
      setSecret("");
      await loadWebhooks(siteId);
    } else {
      setError("Failed to create webhook. Check your input and try again.");
    }
  };

  const patchWebhook = async (id: string, payload: Partial<Webhook>) => {
    const res = await fetch(`/api/webhooks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      await loadWebhooks(siteId);
    } else {
      setError("Failed to update webhook.");
    }
  };

  const deleteWebhook = async (id: string) => {
    if (!window.confirm("Delete this webhook?")) return;
    const res = await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
    if (res.ok) {
      await loadWebhooks(siteId);
    } else {
      setError("Failed to delete webhook.");
    }
  };

  const testWebhook = async (targetUrl: string) => {
    await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "capturely.webhook.test", message: "Capturely test payload", timestamp: new Date().toISOString() }),
    });
  };

  return (
    <IntegrationCard
      icon="🪝"
      title="Custom Webhooks"
      description="Manage per-site webhook endpoints for submission delivery."
      status={status}
    >
      <div className="space-y-4">
        {sites.length === 0 && (
          <p className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            Create a site first to configure custom webhooks.
          </p>
        )}

        <div>
          <label className="mb-1 block text-sm text-zinc-700 dark:text-zinc-300">Site</label>
          <select
            value={siteId}
            onChange={(e) => {
              const nextSiteId = e.target.value;
              setSiteId(nextSiteId);
              void loadWebhooks(nextSiteId);
            }}
            className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            disabled={sites.length === 0}
          >
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </div>

        {selectedSite && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Selected site key: {selectedSite.publicKey}</p>
        )}

        <form onSubmit={addWebhook} className="space-y-2 rounded border border-zinc-200 p-3 dark:border-zinc-700">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Add Webhook</p>
          <input
            type="url"
            placeholder="https://example.com/webhook"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            required
            disabled={sites.length === 0}
          />
          <input
            type="text"
            placeholder="Secret (optional)"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            disabled={sites.length === 0}
          />
          <button
            type="submit"
            disabled={sites.length === 0}
            className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            Add Webhook
          </button>
        </form>

        <div className="space-y-2">
          {error && <p className="text-sm text-red-700 dark:text-red-300">{error}</p>}
          {isLoading ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading webhooks...</p>
          ) : webhooks.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">No webhooks configured for this site yet.</p>
          ) : (
            webhooks.map((webhook) => (
              <div key={webhook.id} className="rounded border border-zinc-200 p-3 dark:border-zinc-700">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="url"
                    value={webhook.url}
                    onChange={(e) => setWebhooks((curr) => curr.map((w) => (w.id === webhook.id ? { ...w, url: e.target.value } : w)))}
                    className="min-w-[220px] flex-1 rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                  <input
                    type="text"
                    value={webhook.secret ?? ""}
                    onChange={(e) =>
                      setWebhooks((curr) => curr.map((w) => (w.id === webhook.id ? { ...w, secret: e.target.value } : w)))
                    }
                    placeholder="Secret"
                    className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                  <label className="flex items-center gap-1 text-sm text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={webhook.active}
                      onChange={(e) =>
                        setWebhooks((curr) => curr.map((w) => (w.id === webhook.id ? { ...w, active: e.target.checked } : w)))
                      }
                    />
                    Active
                  </label>
                  <button
                    type="button"
                    onClick={() => patchWebhook(webhook.id, { url: webhook.url, secret: webhook.secret, active: webhook.active })}
                    className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => void testWebhook(webhook.url)}
                    className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700"
                  >
                    Test
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteWebhook(webhook.id)}
                    className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 dark:border-red-900 dark:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </IntegrationCard>
  );
}
