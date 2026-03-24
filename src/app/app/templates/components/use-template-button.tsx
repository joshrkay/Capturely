"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CampaignTemplate } from "@/lib/templates";

export interface SiteOption {
  id: string;
  name: string;
  primaryDomain: string;
}

interface UseTemplateButtonProps {
  template: CampaignTemplate;
  sites: SiteOption[];
}

export function UseTemplateButton({ template, sites }: UseTemplateButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [siteId, setSiteId] = useState(sites[0]?.id ?? "");

  const createCampaign = async () => {
    if (!siteId) {
      setError("Select a site before using this template.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: template.name,
          siteId,
          type: template.type,
          templateId: template.id,
          schema: template.schema,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(data.error ?? "Failed to create campaign from template.");
        return;
      }

      const campaign = (await response.json()) as { id: string };
      router.push(`/app/campaigns/${campaign.id}/builder`);
    } catch {
      setError("Failed to create campaign from template.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-2">
      {sites.length > 1 && (
        <select
          value={siteId}
          onChange={(event) => setSiteId(event.target.value)}
          className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          aria-label={`Select site for ${template.name}`}
        >
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name} ({site.primaryDomain})
            </option>
          ))}
        </select>
      )}

      <button
        type="button"
        onClick={createCampaign}
        disabled={loading || !siteId}
        className="rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {loading ? "Creating..." : "Use Template"}
      </button>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      {sites.length === 0 && <p className="text-xs text-red-600 dark:text-red-400">No sites found. Create a site first.</p>}
    </div>
  );
}
