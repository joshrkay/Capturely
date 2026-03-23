"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CampaignTemplate } from "@/lib/templates";

interface Site {
  id: string;
  name: string;
  primaryDomain: string;
}

interface CampaignResponse {
  id: string;
}

interface UseTemplateButtonProps {
  template: CampaignTemplate;
}

export default function UseTemplateButton({ template }: UseTemplateButtonProps) {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [siteId, setSiteId] = useState("");
  const [loadingSites, setLoadingSites] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadSites() {
      try {
        const response = await fetch("/api/sites", { signal: controller.signal });

        if (!response.ok) {
          throw new Error("Failed to load sites");
        }

        const data: Site[] = await response.json();

        setSites(data);

        if (data.length === 1) {
          setSiteId(data[0].id);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setError("Unable to load sites. Please refresh and try again.");
      } finally {
        if (!controller.signal.aborted) {
          setLoadingSites(false);
        }
      }
    }

    void loadSites();

    return () => {
      controller.abort();
    };
  }, []);

  const handleUseTemplate = async () => {
    if (!siteId) {
      setError("Please select a site before continuing.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: template.name,
          siteId,
          type: template.type,
          templateId: template.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch((): { error?: string } => ({}));
        setError(data.error ?? "Failed to create campaign from template.");
        return;
      }

      const campaign: CampaignResponse = await response.json();
      router.push(`/app/campaigns/${campaign.id}/builder`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const hasNoSites = !loadingSites && sites.length === 0;
  const disabled = submitting || loadingSites || hasNoSites || !siteId;

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400" role="alert">
          {error}
        </div>
      )}

      {hasNoSites && (
        <div className="rounded-lg bg-zinc-100 p-3 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          No sites found. Add a site first to create a campaign from this template.
        </div>
      )}

      {sites.length > 1 && (
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Site</label>
          <select
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            required
            disabled={submitting}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="">Select a site</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name} ({site.primaryDomain})
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        type="button"
        onClick={handleUseTemplate}
        disabled={disabled}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {submitting ? "Creating..." : loadingSites ? "Loading sites..." : "Use Template"}
      </button>
    </div>
  );
}
