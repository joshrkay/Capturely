"use client";

import type { CampaignTemplate } from "@/lib/templates";
import { FormPreview } from "../../[id]/builder/components/FormPreview";

interface TemplatePreviewModalProps {
  template: CampaignTemplate;
  onClose: () => void;
}

export function TemplatePreviewModal({ template, onClose }: TemplatePreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{template.name} Preview</h3>
          <button type="button" onClick={onClose} className="text-xs text-zinc-500">Close</button>
        </div>
        <FormPreview
          schema={template.schema}
          campaignType={template.type}
          displayMode={template.type === "popup" ? "popup" : "inline"}
        />
      </div>
    </div>
  );
}
