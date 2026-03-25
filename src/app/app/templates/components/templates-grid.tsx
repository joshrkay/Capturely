"use client";

import { useEffect, useState } from "react";
import type { CampaignTemplate } from "@/lib/templates";
import { TemplateCard } from "./template-card";
import type { SiteOption } from "./use-template-button";

interface TemplatesGridProps {
  templates: CampaignTemplate[];
}

interface SitesResponse {
  sites?: SiteOption[];
}

export function TemplatesGrid({ templates }: TemplatesGridProps) {
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [hasSiteLoadError, setHasSiteLoadError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadSites = async () => {
      try {
        const response = await fetch("/api/sites");
        if (!response.ok) {
          if (mounted) setHasSiteLoadError(true);
          return;
        }

        const data = (await response.json()) as SitesResponse | SiteOption[];
        if (!mounted) return;

        if (Array.isArray(data)) {
          setSites(data);
          return;
        }

        setSites(data.sites ?? []);
      } catch {
        if (mounted) setHasSiteLoadError(true);
      }
    };

    void loadSites();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-3">
      {hasSiteLoadError && (
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Unable to load sites. You can still preview templates.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} sites={sites} />
        ))}
      </div>
    </div>
  );
}
