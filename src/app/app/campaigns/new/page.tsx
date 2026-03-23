"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TEMPLATES, type CampaignTemplate } from "@/lib/templates";
import { TemplatePreviewModal } from "./components/TemplatePreviewModal";
import {
  CATEGORY_CHIPS,
  type CategoryChip,
  getVisibleTemplates,
  createCampaignFromTemplate,
  getBuilderPath,
} from "./template-utils";

interface Site {
  id: string;
  name: string;
  primaryDomain: string;
}


export default function NewCampaignPage() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [name, setName] = useState("");
  const [siteId, setSiteId] = useState("");
  const [type, setType] = useState<"popup" | "inline">("popup");
  const [templateId, setTemplateId] = useState<string | undefined>();
  const [activeCategory, setActiveCategory] = useState<CategoryChip>("All");
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/sites")
      .then((r) => r.json())
      .then((data) => {
        setSites(data);
        if (data.length > 0) setSiteId(data[0].id);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, siteId, type, templateId }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to create campaign");
      setLoading(false);
      return;
    }

    const campaign = await res.json();
    router.push(getBuilderPath(campaign.id));
  };

  const handleUseTemplate = async (template: CampaignTemplate) => {
    if (!siteId || loading) return;
    setLoading(true);
    setError("");

    const result = await createCampaignFromTemplate(siteId, template.id);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push(getBuilderPath(result.campaignId));
  };

  const selectedPreviewTemplate = previewTemplateId
    ? TEMPLATES.find((template) => template.id === previewTemplateId)
    : null;

  const visibleTemplates = getVisibleTemplates(activeCategory);

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">Create Campaign</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Campaign name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Summer Sale Popup"
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Site</label>
          <select
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {sites.map((site) => (
              <option key={site.id} value={site.id}>{site.name} ({site.primaryDomain})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Type</label>
          <div className="flex gap-4">
            {(["popup", "inline"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium capitalize ${
                  type === t
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950 dark:text-indigo-300"
                    : "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Start from a template (optional)
          </label>
          <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Template categories">
            {CATEGORY_CHIPS.map((category) => (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={activeCategory === category}
                onClick={() => setActiveCategory(category)}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  activeCategory === category
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-zinc-300 text-zinc-600"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {visibleTemplates.map((template: CampaignTemplate) => (
              <div
                key={template.id}
                className={`rounded-lg border p-3 text-left text-sm ${
                  templateId === template.id
                    ? "border-indigo-600 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-950"
                    : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setTemplateId(templateId === template.id ? undefined : template.id)}
                  className="w-full text-left"
                >
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">{template.name}</div>
                  <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{template.description}</div>
                  <div className="mt-1 text-[11px] uppercase tracking-wide text-zinc-400">{template.id}</div>
                </button>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewTemplateId(template.id)}
                    className="rounded border border-zinc-300 px-2 py-1 text-xs"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUseTemplate(template)}
                    disabled={!siteId || loading}
                    className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
                  >
                    Use Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !name || !siteId}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Campaign"}
        </button>
      </form>

      {selectedPreviewTemplate && (
        <TemplatePreviewModal
          template={selectedPreviewTemplate}
          onClose={() => setPreviewTemplateId(null)}
        />
      )}
    </div>
  );
}
