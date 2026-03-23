"use client";

import type { CampaignTemplate } from "@/lib/templates";

interface TemplateCardProps {
  template: CampaignTemplate;
  onPreview: (template: CampaignTemplate) => void;
  onUseTemplate: (template: CampaignTemplate) => void;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  "Lead Generation": "from-violet-500/70 to-indigo-500/70",
  "E-commerce": "from-amber-500/70 to-orange-500/70",
  Feedback: "from-emerald-500/70 to-teal-500/70",
  General: "from-sky-500/70 to-cyan-500/70",
};

function getCategoryGradient(category: string) {
  return CATEGORY_GRADIENTS[category] ?? "from-zinc-500/70 to-zinc-700/70";
}

export function TemplateCard({ template, onPreview, onUseTemplate }: TemplateCardProps) {
  return (
    <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className={`h-28 bg-gradient-to-br ${getCategoryGradient(template.category)} p-4`}>
        <div
          className="h-full rounded-lg border border-white/40 bg-white/20 p-3 backdrop-blur-[1px]"
          style={{
            borderRadius: template.schema.style.borderRadius,
          }}
        >
          <div className="mb-2 h-2 w-2/3 rounded bg-white/70" />
          <div className="mb-2 h-2 w-full rounded bg-white/60" />
          <div className="h-8 w-1/2 rounded bg-white/80" />
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{template.name}</h3>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {template.category}
          </span>
        </div>

        <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{template.description}</p>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => onPreview(template)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => onUseTemplate(template)}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
          >
            Use Template
          </button>
        </div>
      </div>
    </article>
  );
}
