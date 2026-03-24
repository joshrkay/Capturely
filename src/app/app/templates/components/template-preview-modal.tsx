"use client";

import { useEffect } from "react";
import type { FormSchema, FormStyle } from "@capturely/shared-forms";
import type { CampaignTemplate } from "@/lib/templates";
import { FormPreview } from "@/app/app/campaigns/[id]/builder/components/FormPreview";
import { UseTemplateButton, type SiteOption } from "./use-template-button";

interface TemplatePreviewModalProps {
  template: CampaignTemplate;
  sites: SiteOption[];
  onClose: () => void;
}

export function TemplatePreviewModal({ template, sites, onClose }: TemplatePreviewModalProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${template.name} template preview`}
        className="w-full max-w-4xl rounded-xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{template.name}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{template.description}</p>
          </div>
          <button
            type="button"
            className="rounded border border-zinc-300 px-2 py-1 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <FormPreview
          schema={template.schema as FormSchema}
          style={template.schema.style as FormStyle}
          campaignType={template.type}
          displayMode={template.type === "popup" ? "popup" : "inline"}
          viewport="desktop"
        />

        <div className="mt-4 flex justify-end">
          <UseTemplateButton template={template} sites={sites} />
        </div>
      </div>
    </div>
  );
}
