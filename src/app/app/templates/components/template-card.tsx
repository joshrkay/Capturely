"use client";

import { useState } from "react";
import type { CampaignTemplate } from "@/lib/templates";
import { TemplatePreviewModal } from "./template-preview-modal";
import { UseTemplateButton, type SiteOption } from "./use-template-button";

interface TemplateCardProps {
  template: CampaignTemplate;
  sites: SiteOption[];
}

const categoryStyles: Record<string, string> = {
  "Lead Generation": "from-blue-500/20 to-indigo-500/20 text-blue-700 dark:text-blue-300",
  "E-commerce": "from-emerald-500/20 to-lime-500/20 text-emerald-700 dark:text-emerald-300",
  General: "from-zinc-500/20 to-slate-500/20 text-zinc-700 dark:text-zinc-300",
  Feedback: "from-amber-500/20 to-orange-500/20 text-amber-700 dark:text-amber-300",
};

export function TemplateCard({ template, sites }: TemplateCardProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const gradient = categoryStyles[template.category] ?? categoryStyles.General;

  return (
    <>
      <article className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className={`mb-4 h-32 rounded-lg bg-gradient-to-br ${gradient}`}>
          <div className="flex h-full items-center justify-center text-sm font-medium">{template.type.toUpperCase()}</div>
        </div>

        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{template.name}</h3>
          <span className="rounded-full border border-zinc-300 px-2 py-0.5 text-xs text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
            {template.category}
          </span>
        </div>

        <p className="min-h-10 text-sm text-zinc-600 dark:text-zinc-400">{template.description}</p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            Preview
          </button>
          <UseTemplateButton template={template} sites={sites} />
        </div>
      </article>

      {isPreviewOpen && (
        <TemplatePreviewModal
          template={template}
          sites={sites}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </>
  );
}
