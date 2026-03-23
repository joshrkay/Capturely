"use client";

import { useEffect } from "react";
import type { CampaignTemplate } from "@/lib/templates";
import { FormPreview } from "@/app/app/campaigns/[id]/builder/components/FormPreview";

interface TemplatePreviewModalProps {
  template: CampaignTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate: (template: CampaignTemplate) => void;
}

function getDisplayMode(type: CampaignTemplate["type"]): "popup" | "inline" {
  return type === "popup" ? "popup" : "inline";
}

export function TemplatePreviewModal({
  template,
  isOpen,
  onClose,
  onUseTemplate,
}: TemplatePreviewModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !template) return null;

  const displayMode = getDisplayMode(template.type);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${template.name} preview`}
        className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-zinc-200 p-4 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{template.name}</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{template.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            aria-label="Close preview"
          >
            Close
          </button>
        </header>

        <div className="max-h-[calc(90vh-8.25rem)] overflow-auto p-4">
          <FormPreview
            schema={template.schema}
            campaignType={template.type}
            displayMode={displayMode}
            className="min-h-[360px]"
          />
        </div>

        <footer className="flex justify-end border-t border-zinc-200 p-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => onUseTemplate(template)}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Use Template
          </button>
        </footer>
      </div>
    </div>
  );
}
