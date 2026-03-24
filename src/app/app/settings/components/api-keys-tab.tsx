"use client";

import { useEffect, useMemo, useState } from "react";
import { SETTINGS_API_PATHS } from "@/lib/settings";

interface SiteKeys {
  id: string;
  name: string;
  publicKey: string;
  secretKey: string;
}

function maskSecret(): string {
  return "sk_••••••••";
}

function copyWithFallback(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }

  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("Document unavailable"));
      return;
    }
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "absolute";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.select();
    try {
      const copied = document.execCommand("copy");
      if (!copied) {
        reject(new Error("Copy command failed"));
      } else {
        resolve();
      }
    } finally {
      document.body.removeChild(textArea);
    }
  });
}

export function ApiKeysTab() {
  const [sites, setSites] = useState<SiteKeys[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [flashSiteId, setFlashSiteId] = useState<string | null>(null);

  const loadSites = async () => {
    setLoading(true);
    const res = await fetch(SETTINGS_API_PATHS.keys);
    const data = (await res.json()) as { sites: SiteKeys[] };
    setSites(data.sites ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadSites();
  }, []);

  const byId = useMemo(() => Object.fromEntries(sites.map((site) => [site.id, site])), [sites]);

  const handleRotate = async (id: string) => {
    const site = byId[id];
    if (!site) return;
    const confirmed = window.confirm(
      `This will invalidate the current keys for ${site.name}. Continue?`
    );
    if (!confirmed) return;

    const res = await fetch(SETTINGS_API_PATHS.rotateSiteKeys(id), { method: "POST" });
    if (res.ok) {
      await loadSites();
      setFlashSiteId(id);
      window.setTimeout(() => setFlashSiteId(null), 5000);
    }
  };

  if (loading) {
    return <div className="h-28 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-900" />;
  }

  if (sites.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No sites yet. Create a site to generate API keys. <a className="underline" href="/app/sites">Go to Sites</a>
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">API Keys</h3>
      {sites.map((site) => (
        <div
          key={site.id}
          className={`rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 ${flashSiteId === site.id ? "bg-green-50 dark:bg-green-900/20" : ""}`}
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="font-medium text-zinc-900 dark:text-zinc-100">{site.name}</p>
            <button
              type="button"
              onClick={() => handleRotate(site.id)}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Regenerate Keys
            </button>
          </div>
          <div className="grid gap-2 text-sm">
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Public key:</span> {site.publicKey}
              <button className="ml-2 underline" onClick={() => copyWithFallback(site.publicKey)} type="button">Copy</button>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Secret key:</span>{" "}
              {revealed[site.id] ? site.secretKey : maskSecret()}
              <button
                className="ml-2 underline"
                onClick={() => setRevealed((prev) => ({ ...prev, [site.id]: !prev[site.id] }))}
                type="button"
              >
                {revealed[site.id] ? "Hide" : "Reveal"}
              </button>
              <button className="ml-2 underline" onClick={() => copyWithFallback(site.secretKey)} type="button">Copy</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
