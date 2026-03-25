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

type SitesApiResponse = {
  sites?: Site[];
};

interface FormSchema {
  fields: Array<Record<string, unknown>>;
  style: Record<string, unknown>;
  submitLabel: string;
  steps?: Array<{ label: string; fieldIds: string[] }>;
  progressBarStyle?: "dots" | "bar" | "steps" | "none";
}

type CreationMode = "manual" | "template" | "ai";
const NEW_CAMPAIGN_DRAFT_STORAGE_KEY = "capturely:new-campaign-draft";
type NewCampaignDraft = {
  name?: string;
  type?: "popup" | "inline";
  creationMode?: CreationMode;
  templateId?: string;
  aiSchema?: FormSchema | null;
};

function getStoredDraft(): NewCampaignDraft {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(NEW_CAMPAIGN_DRAFT_STORAGE_KEY);
  if (!raw) return {};

  try {
    return JSON.parse(raw) as NewCampaignDraft;
  } catch {
    window.localStorage.removeItem(NEW_CAMPAIGN_DRAFT_STORAGE_KEY);
    return {};
  }
}

function extractSchemaFromAiResponse(schemaText: string): FormSchema {
  let jsonStr = schemaText;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }
  return JSON.parse(jsonStr) as FormSchema;
}

type OptimizationGoalKind = "maximize_submissions" | "maximize_qualified_leads" | "maximize_field_completion";
export function parseSitesApiResponse(data: unknown): SitesApiResponse {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Invalid sites payload");
  }

  const payload = data as { sites?: unknown };
  if (payload.sites !== undefined && !Array.isArray(payload.sites)) {
    throw new Error("Invalid sites payload");
  }

  return { sites: payload.sites as Site[] | undefined };
}

function AiChatPanel({
  standalone,
  campaignType,
  onApplySchema,
  optimizationGoalText,
  onOptimizationGoalTextChange,
  optimizationGoalKind,
  onOptimizationGoalKindChange,
  optimizationGoalFieldKey,
  onOptimizationGoalFieldKeyChange,
}: {
  standalone?: boolean;
  campaignType: "popup" | "inline";
  onApplySchema: (schema: FormSchema) => void;
  optimizationGoalText: string;
  onOptimizationGoalTextChange: (value: string) => void;
  optimizationGoalKind: OptimizationGoalKind;
  onOptimizationGoalKindChange: (value: OptimizationGoalKind) => void;
  optimizationGoalFieldKey: string;
  onOptimizationGoalFieldKeyChange: (value: string) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<Array<{ prompt: string; createdAt: number }>>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          campaignType,
          ...(optimizationGoalText.trim()
            ? {
                optimizationGoalText: optimizationGoalText.trim(),
                optimizationGoalKind,
                ...(optimizationGoalKind === "maximize_field_completion" && optimizationGoalFieldKey.trim()
                  ? { optimizationGoalFieldKey: optimizationGoalFieldKey.trim() }
                  : {}),
              }
            : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "AI generation failed");
        return;
      }

      const data = await res.json();

      try {
        const schema = extractSchemaFromAiResponse(data.schema);
        onApplySchema(schema);
        setHistory((prev) => [...prev, { prompt, createdAt: Date.now() }]);
        setPrompt("");
      } catch {
        setError("AI returned an invalid schema. Try rephrasing your prompt.");
      }
    } catch {
      setError("Failed to connect to AI service");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">AI Generator</h3>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        {standalone
          ? "Generate a schema, then create your campaign directly with that AI output."
          : "Describe your campaign and AI will generate the schema for you."}
      </p>

      <div className="mt-4 space-y-2 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3 dark:border-indigo-900/40 dark:bg-indigo-950/30">
        <div className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">Optimization goal (optional)</div>
        <p className="text-[11px] text-indigo-800/90 dark:text-indigo-300/90">
          State the business outcome you want (e.g. more qualified leads, higher demo bookings). This steers the control form and future auto-optimization.
        </p>
        <select
          value={optimizationGoalKind}
          onChange={(e) => onOptimizationGoalKindChange(e.target.value as OptimizationGoalKind)}
          className="w-full rounded border border-indigo-200 bg-white px-2 py-1.5 text-xs dark:border-indigo-800 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <option value="maximize_submissions">Maximize submissions</option>
          <option value="maximize_qualified_leads">Maximize qualified leads (richer contact info)</option>
          <option value="maximize_field_completion">Maximize completion of a specific field</option>
        </select>
        <textarea
          value={optimizationGoalText}
          onChange={(e) => onOptimizationGoalTextChange(e.target.value)}
          placeholder="e.g. Capture company + role so our sales team can qualify Shopify Plus merchants."
          rows={2}
          className="w-full rounded border border-indigo-200 bg-white px-2 py-1.5 text-xs dark:border-indigo-800 dark:bg-zinc-900 dark:text-zinc-100"
        />
        {optimizationGoalKind === "maximize_field_completion" && (
          <input
            type="text"
            value={optimizationGoalFieldKey}
            onChange={(e) => onOptimizationGoalFieldKeyChange(e.target.value)}
            placeholder="fieldId to optimize (e.g. field_company_abc123)"
            className="w-full rounded border border-indigo-200 bg-white px-2 py-1.5 text-xs dark:border-indigo-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
        )}
      </div>

      {error && (
        <div className="mt-3 rounded bg-red-50 p-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</div>
      )}

      <div className="mt-3 max-h-40 space-y-2 overflow-y-auto">
        {history.map((entry) => (
          <div key={entry.createdAt} className="rounded bg-zinc-50 p-2 text-xs dark:bg-zinc-800">
            <div className="font-medium text-zinc-700 dark:text-zinc-300">{entry.prompt}</div>
            <div className="mt-1 text-zinc-500 dark:text-zinc-400">Schema applied</div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          placeholder="e.g. Lead capture popup for a seasonal sale"
          disabled={loading}
          className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="rounded bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "..." : "Generate"}
        </button>
      </div>
    </div>
  );
}

export default function NewCampaignPage() {
  const storedDraft = getStoredDraft();
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [name, setName] = useState(storedDraft.name ?? "");
  const [siteId, setSiteId] = useState("");
  const [type, setType] = useState<"popup" | "inline">("popup");
  const [creationMode, setCreationMode] = useState<CreationMode>("manual");
  const [templateId, setTemplateId] = useState<string | undefined>();
  const [aiSchema, setAiSchema] = useState<FormSchema | null>(null);
  const [optimizationGoalText, setOptimizationGoalText] = useState("");
  const [optimizationGoalKind, setOptimizationGoalKind] = useState<OptimizationGoalKind>("maximize_submissions");
  const [optimizationGoalFieldKey, setOptimizationGoalFieldKey] = useState("");
  const [type, setType] = useState<"popup" | "inline">(storedDraft.type === "inline" ? "inline" : "popup");
  const [creationMode, setCreationMode] = useState<CreationMode>(
    storedDraft.creationMode === "template" || storedDraft.creationMode === "ai" ? storedDraft.creationMode : "manual"
  );
  const [templateId, setTemplateId] = useState<string | undefined>(storedDraft.templateId);
  const [aiSchema, setAiSchema] = useState<FormSchema | null>(storedDraft.aiSchema ?? null);
  const [activeCategory, setActiveCategory] = useState<CategoryChip>("All");
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(null);
  const [createdControlVariantId, setCreatedControlVariantId] = useState<string | null>(null);
  const [templateCreateKey, setTemplateCreateKey] = useState<string>(() => crypto.randomUUID());

  const resetCreateAttempt = () => {
    setTemplateCreateKey(crypto.randomUUID());
    setCreatedCampaignId(null);
    setCreatedControlVariantId(null);
  };

  useEffect(() => {
    fetch("/api/sites")
      .then(async (r) => {
        if (!r.ok) {
          throw new Error("Failed to load sites.");
        }
        return r.json();
      })
      .then((rawData) => {
        const data = parseSitesApiResponse(rawData);
        setSites(data.sites ?? []);
        if ((data.sites ?? []).length > 0) setSiteId((data.sites ?? [])[0].id);
      })
      .catch(() => {
        setSites([]);
        setError("Failed to load sites. Please refresh and try again.");
      });
  }, []);

  useEffect(() => {
    localStorage.setItem(
      NEW_CAMPAIGN_DRAFT_STORAGE_KEY,
      JSON.stringify({ name, type, creationMode, templateId, aiSchema })
    );
  }, [name, type, creationMode, templateId, aiSchema]);

  const createCampaignRecord = async () => {
    const payload: Record<string, unknown> = {
      name,
      siteId,
      type,
      templateId: creationMode === "template" ? templateId : undefined,
    };
    if (creationMode === "ai") {
      if (optimizationGoalText.trim()) {
        payload.optimizationGoalText = optimizationGoalText.trim();
      }
      payload.optimizationGoalKind = optimizationGoalKind;
      if (optimizationGoalKind === "maximize_field_completion" && optimizationGoalFieldKey.trim()) {
        payload.optimizationGoalFieldKey = optimizationGoalFieldKey.trim();
      }
    }
    return fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  };

  const applyAiSchemaToCampaign = async (campaignId: string, controlVariantId: string) => {
    const patchRes = await fetch(`/api/campaigns/${campaignId}/variants`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        variantId: controlVariantId,
        schemaJson: JSON.stringify(aiSchema),
      }),
    });

    if (!patchRes.ok) {
      const data = await patchRes.json();
      setError(data.error ?? "Campaign created, but failed to apply AI schema.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (creationMode === "template" && templateId) {
      const result = await createCampaignFromTemplate(siteId, templateId, fetch, { idempotencyKey: templateCreateKey });
      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }

      localStorage.removeItem(NEW_CAMPAIGN_DRAFT_STORAGE_KEY);
      setTemplateCreateKey(crypto.randomUUID());
      router.push(getBuilderPath(result.campaignId));
      return;
    }

    const res = createdCampaignId && creationMode === "ai" ? null : await createCampaignRecord();

    if (res && !res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to create campaign");
      setLoading(false);
      return;
    }

    const campaign =
      createdCampaignId && creationMode === "ai"
        ? { id: createdCampaignId, variants: [{ id: createdControlVariantId, isControl: true }] }
        : await res?.json();

    if (!campaign) {
      setError("Failed to resolve campaign after create.");
      setLoading(false);
      return;
    }

    if (creationMode === "ai" && aiSchema) {
      const controlVariant = campaign.variants?.find((variant: { isControl: boolean; id: string | null }) => variant.isControl);
      if (!controlVariant) {
        setError("Campaign created but control variant is missing.");
        setCreatedCampaignId(campaign.id);
        setLoading(false);
        return;
      }

      if (!controlVariant.id) {
        setError("Campaign created but control variant id is missing.");
        setCreatedCampaignId(campaign.id);
        setLoading(false);
        return;
      }

      setCreatedCampaignId(campaign.id);
      setCreatedControlVariantId(controlVariant.id);
      const schemaApplied = await applyAiSchemaToCampaign(campaign.id, controlVariant.id);
      if (!schemaApplied) {
        setLoading(false);
        return;
      }
    }

    localStorage.removeItem(NEW_CAMPAIGN_DRAFT_STORAGE_KEY);
    setCreatedCampaignId(null);
    setCreatedControlVariantId(null);
    setTemplateCreateKey(crypto.randomUUID());
    router.push(getBuilderPath(campaign.id));
  };

  const handleUseTemplate = async (template: CampaignTemplate) => {
    if (!siteId || loading) return;
    setLoading(true);
    setError("");

    const result = await createCampaignFromTemplate(siteId, template.id, fetch, { idempotencyKey: templateCreateKey });
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    localStorage.removeItem(NEW_CAMPAIGN_DRAFT_STORAGE_KEY);
    setTemplateCreateKey(crypto.randomUUID());
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
            {createdCampaignId && creationMode === "ai" && (
              <div className="mt-2">
                <a href={getBuilderPath(createdCampaignId)} className="font-medium underline">
                  Open draft in builder
                </a>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Campaign name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              resetCreateAttempt();
              setName(e.target.value);
            }}
            placeholder="e.g. Summer Sale Popup"
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Site</label>
          <select
            value={siteId}
            onChange={(e) => {
              resetCreateAttempt();
              setSiteId(e.target.value);
            }}
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
                onClick={() => {
                  resetCreateAttempt();
                  setType(t);
                }}
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
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Creation mode</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: "manual", label: "Manual" },
              { value: "template", label: "Template" },
              { value: "ai", label: "AI Generator" },
            ] as const).map((mode) => (
              <button
                key={mode.value}
                type="button"
                onClick={() => {
                  resetCreateAttempt();
                  setCreationMode(mode.value);
                }}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  creationMode === mode.value
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950 dark:text-indigo-300"
                    : "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {creationMode === "template" && (
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
                    onClick={() => {
                      resetCreateAttempt();
                      setTemplateId(templateId === template.id ? undefined : template.id);
                    }}
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
        )}

        {creationMode === "ai" && (
          <AiChatPanel
            standalone
            campaignType={type}
            onApplySchema={setAiSchema}
            optimizationGoalText={optimizationGoalText}
            onOptimizationGoalTextChange={setOptimizationGoalText}
            optimizationGoalKind={optimizationGoalKind}
            onOptimizationGoalKindChange={setOptimizationGoalKind}
            optimizationGoalFieldKey={optimizationGoalFieldKey}
            onOptimizationGoalFieldKeyChange={setOptimizationGoalFieldKey}
          />
        )}

        <button
          type="submit"
          disabled={loading || !name || !siteId || (creationMode === "ai" && !aiSchema)}
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
