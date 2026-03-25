"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CampaignSettingsPanel } from "./components/display-settings";
import { StyleEditor } from "./components/style-editor";
import { MultiStepEditor } from "./components/multi-step-editor";
import { AiChatPanel } from "../../components/ai-chat-panel";
import { FormPreview, type ViewportKey } from "./components/FormPreview";
import { ViewportToggle } from "./components/ViewportToggle";
import { ExportModal } from "./components/export-modal";
import { VariantManagerPanel } from "./_components/VariantManagerPanel";
import { SpamSettings } from "./components/spam-settings";
import { UnpublishedChangesBadge } from "../../components/unpublished-changes-badge";
import type { FormField, FormSchema } from "./types";
import { resolvePlan } from "@/lib/plans";
import type { FieldType } from "@capturely/shared-forms";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Variant {
  id: string;
  campaignId: string;
  name: string;
  isControl: boolean;
  trafficPercentage: number;
  schemaJson: string;
  schemaVersion: number;
  generatedBy: string;
}

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  hasUnpublishedChanges: boolean;
  autoOptimize: boolean;
  targetingJson: string | null;
  triggerJson: string | null;
  frequencyJson: string | null;
  spamConfigJson: string | null;
  variants: Variant[];
  site: { id: string; name: string; publicKey: string };
  accountPlanKey: string;
}

type PublishPreflightCategory = "schema" | "variants" | "control" | "traffic_sum" | "site" | "public_key";

interface PublishPreflightIssue {
  code: string;
  category: PublishPreflightCategory;
  message: string;
  variantId?: string;
  variantName?: string;
  path?: string;
}

interface PublishResponse {
  ok: boolean;
  error?: string;
  code?: string;
  preflight?: {
    passed: boolean;
    errors: PublishPreflightIssue[];
    warnings?: PublishPreflightIssue[];
  };
}

const FIELD_TYPES: { type: FieldType; label: string }[] = [
  { type: "text", label: "Text" },
  { type: "email", label: "Email" },
  { type: "phone", label: "Phone" },
  { type: "textarea", label: "Text Area" },
  { type: "dropdown", label: "Dropdown" },
  { type: "radio", label: "Radio" },
  { type: "checkbox", label: "Checkbox" },
  { type: "hidden", label: "Hidden" },
];

// ─── Sortable Field ───────────────────────────────────────────────────────────

function SortableField({
  field,
  isSelected,
  onClick,
}: {
  field: FormField;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.fieldId });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer ${
        isSelected
          ? "border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-950"
          : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
      }`}
      onClick={onClick}
    >
      <div {...attributes} {...listeners} className="cursor-grab text-zinc-400 hover:text-zinc-600">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="5" cy="4" r="1.5" /><circle cx="11" cy="4" r="1.5" /><circle cx="5" cy="8" r="1.5" /><circle cx="11" cy="8" r="1.5" /><circle cx="5" cy="12" r="1.5" /><circle cx="11" cy="12" r="1.5" /></svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{field.type}</span>
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{field.label}</span>
          {field.required && <span className="text-red-500 text-xs">*</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Field Settings Panel ─────────────────────────────────────────────────────

function FieldSettingsPanel({
  field,
  allFields,
  onChange,
  onDelete,
  campaignType,
}: {
  field: FormField;
  allFields: FormField[];
  onChange: (updated: FormField) => void;
  onDelete: () => void;
  campaignType?: string;
}) {
  const [ctaOptions, setCtaOptions] = useState<Array<{ text: string; rationale: string }>>([]);
  const [ctaLoading, setCtaLoading] = useState(false);
  const [ctaError, setCtaError] = useState("");

  async function handleSuggestCta() {
    setCtaLoading(true);
    setCtaError("");
    setCtaOptions([]);
    try {
      const formContext = allFields.map((f) => f.label).join(", ");
      const res = await fetch("/api/ai/suggest-cta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignType: campaignType ?? "popup", formContext }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setCtaError((data as { error?: string }).error ?? "Failed to generate CTA options");
        return;
      }
      const data = await res.json() as { options: Array<{ text: string; rationale: string }> };
      setCtaOptions(data.options ?? []);
    } catch {
      setCtaError("Failed to connect to AI service");
    } finally {
      setCtaLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Field Settings</h3>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Label</label>
        <input
          type="text"
          value={field.label}
          onChange={(e) => onChange({ ...field, label: e.target.value })}
          className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      {field.type === "submit" && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Button text</label>
            <button
              type="button"
              onClick={() => void handleSuggestCta()}
              disabled={ctaLoading}
              className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 disabled:opacity-50"
            >
              {ctaLoading ? "Generating…" : "Suggest CTA"}
            </button>
          </div>
          {ctaError && (
            <p className="mb-1 text-xs text-red-500">{ctaError}</p>
          )}
          {ctaOptions.length > 0 && (
            <div className="mb-2 space-y-1">
              {ctaOptions.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onChange({ ...field, label: opt.text });
                    setCtaOptions([]);
                  }}
                  title={opt.rationale}
                  className="block w-full rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-left text-xs text-zinc-700 hover:border-indigo-400 hover:bg-indigo-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                >
                  {opt.text}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {field.type !== "submit" && field.type !== "checkbox" && field.type !== "hidden" && (
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Placeholder</label>
          <input
            type="text"
            value={field.placeholder ?? ""}
            onChange={(e) => onChange({ ...field, placeholder: e.target.value })}
            className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
      )}

      {field.type !== "submit" && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={field.required ?? false}
            onChange={(e) => onChange({ ...field, required: e.target.checked })}
            className="rounded"
          />
          <label className="text-sm text-zinc-600 dark:text-zinc-400">Required</label>
        </div>
      )}

      {(field.type === "dropdown" || field.type === "radio") && (
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Options</label>
          {(field.options ?? []).map((opt, i) => (
            <div key={i} className="mb-1 flex gap-1">
              <input
                type="text"
                value={opt.value}
                onChange={(e) => {
                  const newOptions = [...(field.options ?? [])];
                  newOptions[i] = { ...newOptions[i], value: e.target.value };
                  onChange({ ...field, options: newOptions });
                }}
                placeholder="value"
                className="w-1/2 rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
              <input
                type="text"
                value={opt.label}
                onChange={(e) => {
                  const newOptions = [...(field.options ?? [])];
                  newOptions[i] = { ...newOptions[i], label: e.target.value };
                  onChange({ ...field, options: newOptions });
                }}
                placeholder="label"
                className="w-1/2 rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
              <button
                type="button"
                onClick={() => {
                  const newOptions = (field.options ?? []).filter((_, idx) => idx !== i);
                  onChange({ ...field, options: newOptions });
                }}
                className="text-red-500 text-xs hover:text-red-700"
              >
                x
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange({ ...field, options: [...(field.options ?? []), { value: "", label: "" }] })}
            className="mt-1 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            + Add option
          </button>
        </div>
      )}

      {/* Conditional Logic */}
      {field.type !== "submit" && (
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Conditional Logic</label>
          <div className="space-y-2">
            <select
              value={field.visibilityCondition?.dependsOn ?? ""}
              onChange={(e) => {
                if (!e.target.value) {
                  onChange({ ...field, visibilityCondition: undefined });
                } else {
                  onChange({
                    ...field,
                    visibilityCondition: {
                      dependsOn: e.target.value,
                      operator: field.visibilityCondition?.operator ?? "equals",
                      value: field.visibilityCondition?.value,
                    },
                  });
                }
              }}
              className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="">Always visible</option>
              {allFields
                .filter((f) => f.fieldId !== field.fieldId && f.type !== "submit")
                .map((f) => (
                  <option key={f.fieldId} value={f.fieldId}>{f.label}</option>
                ))}
            </select>
            {field.visibilityCondition && (
              <>
                <select
                  value={field.visibilityCondition.operator}
                  onChange={(e) => onChange({
                    ...field,
                    visibilityCondition: { ...field.visibilityCondition!, operator: e.target.value as "equals" | "not_equals" | "contains" | "not_empty" },
                  })}
                  className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  <option value="equals">equals</option>
                  <option value="not_equals">not equals</option>
                  <option value="contains">contains</option>
                  <option value="not_empty">not empty</option>
                </select>
                {field.visibilityCondition.operator !== "not_empty" && (
                  <input
                    type="text"
                    value={field.visibilityCondition.value ?? ""}
                    onChange={(e) => onChange({
                      ...field,
                      visibilityCondition: { ...field.visibilityCondition!, value: e.target.value },
                    })}
                    placeholder="Value"
                    className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {field.type !== "submit" && (
        <button
          type="button"
          onClick={onDelete}
          className="w-full rounded border border-red-200 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
        >
          Delete field
        </button>
      )}
    </div>
  );
}

// ─── AI Copilot Panel ─────────────────────────────────────────────────────────

function AiCopilotPanel({
  campaignType,
  onApplySchema,
}: {
  campaignType: string;
  onApplySchema: (schema: FormSchema) => void;
}) {
  type AiChatMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: number;
    status?: "loading" | "success" | "error";
    error?: string;
    promptForRetry?: string;
  };

  const STARTER_PROMPTS = [
    "Build a lead capture form for a coffee shop with name, email, and favorite drink.",
    "Create a booking request form for a salon with service type, date, and notes.",
    "Generate a waitlist form for a product launch with email and referral source.",
    "Design a demo request form for SaaS with company size, role, and goals.",
  ];

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [relativeNow, setRelativeNow] = useState(Date.now());
  const bottomSentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setRelativeNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    bottomSentinelRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const formatRelativeTimestamp = (createdAt: number) => {
    const diffSeconds = Math.round((createdAt - relativeNow) / 1000);
    const abs = Math.abs(diffSeconds);
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

    if (abs < 60) return rtf.format(diffSeconds, "second");
    if (abs < 3600) return rtf.format(Math.round(diffSeconds / 60), "minute");
    if (abs < 86_400) return rtf.format(Math.round(diffSeconds / 3600), "hour");
    return rtf.format(Math.round(diffSeconds / 86_400), "day");
  };

  const sendPrompt = async (inputPrompt: string, retryMessageId?: string) => {
    const trimmedPrompt = inputPrompt.trim();
    if (!trimmedPrompt) return;
    setLoading(true);
    const now = Date.now();
    const assistantMessageId = retryMessageId ?? `${now}-assistant`;

    if (retryMessageId) {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === retryMessageId
            ? {
                ...message,
                content: "",
                createdAt: now,
                status: "loading",
                error: undefined,
              }
            : message,
        ),
      );
    } else {
      const userMessage: AiChatMessage = {
        id: `${now}-user`,
        role: "user",
        content: trimmedPrompt,
        createdAt: now,
      };
      const assistantLoadingMessage: AiChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        createdAt: now,
        status: "loading",
        promptForRetry: trimmedPrompt,
      };
      setMessages((prev) => [...prev, userMessage, assistantLoadingMessage]);
    }

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmedPrompt, campaignType }),
      });

      let errorText = "AI generation failed";
      if (!res.ok) {
        try {
          const data = await res.json();
          errorText = data.error ?? errorText;
        } catch {
          // noop - keep fallback error text
        }
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantMessageId
              ? {
                  ...message,
                  createdAt: Date.now(),
                  status: "error",
                  error: errorText,
                  promptForRetry: trimmedPrompt,
                }
              : message,
          ),
        );
        return;
      }

      const data = await res.json();
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMessageId
            ? {
                ...message,
                content: "Schema applied",
                createdAt: Date.now(),
                status: "success",
                error: undefined,
                promptForRetry: trimmedPrompt,
              }
            : message,
        ),
      );

      // Try to parse and apply the schema
      try {
        // Extract JSON from the response (may be wrapped in markdown code blocks)
        let jsonStr = data.schema;
        const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1];
        }
        const schema = JSON.parse(jsonStr) as FormSchema;
        onApplySchema(schema);
      } catch {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantMessageId
              ? {
                  ...message,
                  status: "error",
                  error: "AI returned an invalid schema. Try rephrasing your prompt.",
                  promptForRetry: trimmedPrompt,
                }
              : message,
          ),
        );
      }

      setPrompt("");
    } catch {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMessageId
            ? {
                ...message,
                createdAt: Date.now(),
                status: "error",
                error: "Failed to connect to AI service",
                promptForRetry: trimmedPrompt,
              }
            : message,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">AI Copilot</h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">Describe your form and AI will generate it for you.</p>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {STARTER_PROMPTS.map((starterPrompt) => (
            <button
              key={starterPrompt}
              type="button"
              onClick={() => {
                setPrompt(starterPrompt);
                void sendPrompt(starterPrompt);
              }}
              disabled={loading}
              className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-indigo-800/70 dark:bg-indigo-900/40 dark:text-indigo-200 dark:hover:bg-indigo-900/60"
            >
              {starterPrompt}
            </button>
          ))}
        </div>
      )}

      <div className="max-h-56 space-y-2 overflow-y-auto rounded border border-zinc-200 bg-zinc-50/40 p-2 dark:border-zinc-800 dark:bg-zinc-900/30">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[88%] rounded-2xl px-3 py-2 text-xs shadow-sm ${
                message.role === "user"
                  ? "rounded-br-sm bg-indigo-600 text-white"
                  : "rounded-bl-sm bg-white text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              {message.role === "assistant" && message.status === "loading" ? (
                <div className="flex items-center gap-1 py-1" aria-label="Assistant is typing">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.2s] dark:bg-zinc-500" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.1s] dark:bg-zinc-500" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-500" />
                </div>
              ) : (
                <div>{message.content}</div>
              )}

              <div className="mt-1 text-[10px] opacity-75">{formatRelativeTimestamp(message.createdAt)}</div>

              {message.role === "assistant" && message.status === "error" && message.error && (
                <div className="mt-2 rounded border border-red-200 bg-red-50 p-2 text-[11px] text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
                  <div>{message.error}</div>
                  {message.promptForRetry && (
                    <button
                      type="button"
                      onClick={() => void sendPrompt(message.promptForRetry!, message.id)}
                      disabled={loading}
                      className="mt-1 font-semibold underline decoration-dotted underline-offset-2 hover:text-red-800 disabled:opacity-60 dark:hover:text-red-200"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomSentinelRef} />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void sendPrompt(prompt);
            }
          }}
          placeholder="e.g. Lead capture form for a coffee shop"
          disabled={loading}
          className="flex-1 rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="button"
          onClick={() => void sendPrompt(prompt)}
          disabled={loading || !prompt.trim()}
          className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "..." : "Generate"}
        </button>
      </div>
    </div>
  );
}


// ─── Main Builder Page ────────────────────────────────────────────────────────

export default function BuilderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [activeVariantId, setActiveVariantId] = useState<string>("");
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<"field" | "style" | "settings" | "ai" | "steps" | "spam">("field");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");
  const [viewport, setViewport] = useState<ViewportKey>("desktop");
  const [displayMode, setDisplayMode] = useState<"popup" | "inline">("popup");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishResponse | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const loadVariantSchema = useCallback((variantId: string, campaignData: Campaign | null) => {
    if (!campaignData) return;
    const variant = campaignData.variants.find((v) => v.id === variantId);
    if (!variant) return;
    try {
      setSchema(JSON.parse(variant.schemaJson));
    } catch {
      // ignore malformed schema
    }
  }, []);

  // Load campaign
  useEffect(() => {
    fetch(`/api/campaigns/${id}`)
      .then((r) => r.json())
      .then((data: Campaign) => {
        setCampaign(data);
        const control = data.variants.find((v) => v.isControl) ?? data.variants[0];
        if (control) {
          setActiveVariantId(control.id);
          loadVariantSchema(control.id, data);
        }
      });
  }, [id, loadVariantSchema]);

  const updateSchema = useCallback((updated: FormSchema) => {
    setSchema(updated);
  }, []);

  const handleFieldChange = useCallback((updatedField: FormField) => {
    if (!schema) return;
    updateSchema({
      ...schema,
      fields: schema.fields.map((f) => f.fieldId === updatedField.fieldId ? updatedField : f),
    });
  }, [schema, updateSchema]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    if (!schema) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = schema.fields.findIndex((f) => f.fieldId === active.id);
    const newIndex = schema.fields.findIndex((f) => f.fieldId === over.id);

    // Submit can't be moved above other fields
    const submitIndex = schema.fields.findIndex((f) => f.type === "submit");
    if (schema.fields[oldIndex].type === "submit") return;
    if (newIndex >= submitIndex && submitIndex >= 0) return;

    updateSchema({ ...schema, fields: arrayMove(schema.fields, oldIndex, newIndex) });
  }, [schema, updateSchema]);

  const addField = useCallback((type: FieldType) => {
    if (!schema) return;
    const fieldId = `field_${Math.random().toString(36).slice(2, 10)}`;
    const newField: FormField = {
      fieldId,
      type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      required: false,
    };
    if (type === "dropdown" || type === "radio") {
      newField.options = [{ value: "option1", label: "Option 1" }];
    }

    // Insert before submit
    const submitIndex = schema.fields.findIndex((f) => f.type === "submit");
    const fields = [...schema.fields];
    if (submitIndex >= 0) {
      fields.splice(submitIndex, 0, newField);
    } else {
      fields.push(newField);
    }

    updateSchema({ ...schema, fields });
    setSelectedFieldId(fieldId);
    setRightTab("field");
  }, [schema, updateSchema]);

  const deleteField = useCallback((fieldId: string) => {
    if (!schema) return;
    const updatedSteps = schema.steps?.map((step) => ({
      ...step,
      fieldIds: step.fieldIds.filter((id) => id !== fieldId),
    }));
    updateSchema({
      ...schema,
      fields: schema.fields.filter((f) => f.fieldId !== fieldId),
      steps: updatedSteps,
    });
    setSelectedFieldId(null);
  }, [schema, updateSchema]);

  const handleSave = async (): Promise<boolean> => {
    if (!schema || !campaign) return false;
    setSaving(true);
    setMessage("");

    const formatValidationMessage = (data: unknown, fallbackPrefix: string) => {
      const parsed = (typeof data === "object" && data !== null) ? data as {
        error?: string;
        details?: {
          variantName?: string;
          variantId?: string;
          issues?: Array<{ path?: string; message?: string }>;
          variants?: Array<{
            variantName?: string;
            variantId?: string;
            issues?: Array<{ path?: string; message?: string }>;
          }>;
        };
      } : null;

      const variantIssues = parsed?.details?.variants?.flatMap((variant) => {
        const variantLabel = variant.variantName ?? variant.variantId ?? "Variant";
        return (variant.issues ?? []).map((issue) => `${variantLabel}: ${issue.path ?? "schema"} - ${issue.message ?? "Invalid value"}`);
      }) ?? [];
      const directIssues = (parsed?.details?.issues ?? []).map((issue) => {
        const variantLabel = parsed?.details?.variantName ?? parsed?.details?.variantId ?? "Variant";
        return `${variantLabel}: ${issue.path ?? "schema"} - ${issue.message ?? "Invalid value"}`;
      });

      const allIssues = [...variantIssues, ...directIssues];
      if (allIssues.length > 0) {
        return `${fallbackPrefix}: ${allIssues.join("; ")}`;
      }

      return `${fallbackPrefix}: ${parsed?.error ?? "Request failed"}`;
    };

    let schemaSaved = false;
    let settingsSaved = true;
    let settingsFailureMessage = "";

    // Save variant schema
    const schemaRes = await fetch(`/api/campaigns/${id}/variants`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId: activeVariantId, schemaJson: JSON.stringify(schema) }),
    });
    schemaSaved = schemaRes.ok;

    // Save campaign settings
    const updates: Record<string, unknown> = {};
    if (campaign.targetingJson) updates.targetingJson = campaign.targetingJson;
    if (campaign.triggerJson) updates.triggerJson = campaign.triggerJson;
    if (campaign.frequencyJson) updates.frequencyJson = campaign.frequencyJson;

    if (Object.keys(updates).length > 0) {
      const settingsRes = await fetch(`/api/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      settingsSaved = settingsRes.ok;

      if (!settingsRes.ok) {
        const settingsData = await settingsRes.json().catch(() => null);
        settingsFailureMessage = formatValidationMessage(settingsData, "Settings save failed");
        if (schemaSaved) {
          setMessage(settingsFailureMessage);
        }
      }
    }

    if (schemaSaved && settingsSaved) {
      setMessage("Draft saved");
      setSaving(false);
      setTimeout(() => setMessage(""), 2000);
      return true;
    }

    if (!schemaSaved) {
      const schemaData = await schemaRes.json().catch(() => null);
      setMessage(formatValidationMessage(schemaData, "Schema save failed"));
    }

    if (schemaSaved && !settingsSaved) {
      setSaving(false);
      setTimeout(() => setMessage(""), 4000);
      return false;
    }

    if (!schemaSaved && !settingsSaved) {
      setMessage((prev) => `${prev} | ${settingsFailureMessage || "Settings save failed"}`);
    }

    setSaving(false);
    setTimeout(() => setMessage(""), 4000);
    return false;
  };

  const handlePublish = async (): Promise<PublishResponse> => {
    const saveOk = await handleSave();
    if (!saveOk) {
      return {
        ok: false,
        code: "DRAFT_SAVE_FAILED",
        error: "Failed to save draft before publish.",
      };
    }
    setPublishing(true);
    setMessage("");
    setPublishResult(null);

    const res = await fetch(`/api/campaigns/${id}/publish`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const response: PublishResponse = {
        ok: false,
        error: (data as { error?: string }).error ?? "Publish failed.",
        code: (data as { code?: string }).code,
        preflight: (data as { preflight?: PublishResponse["preflight"] }).preflight,
      };
      setPublishResult(response);
      if (response.preflight?.errors.length) {
        const firstIssue = response.preflight.errors[0];
        const variantLabel = firstIssue.variantName ? `${firstIssue.variantName}: ` : "";
        setMessage(`Publish blocked [${firstIssue.category}] ${variantLabel}${firstIssue.message}`);
      } else {
        setMessage(`Error: ${response.error}`);
      }
      setPublishing(false);
      setTimeout(() => setMessage(""), 3000);
      return response;
    } else {
      setMessage("Published!");
      setCampaign((prev) => prev ? { ...prev, status: "published", hasUnpublishedChanges: false } : prev);
      const response: PublishResponse = {
        ok: true,
        preflight: (data as { preflight?: PublishResponse["preflight"] }).preflight,
      };
      setPublishResult(response);
      setPublishing(false);
      setTimeout(() => setMessage(""), 3000);
      return response;
    }
  };

  const handleCampaignUpdate = (updates: Record<string, unknown>) => {
    setCampaign((prev) => prev ? { ...prev, ...updates } : prev);
  };

  if (!campaign || !schema) {
    return <div className="p-8 text-zinc-500">Loading builder...</div>;
  }

  const selectedField = schema.fields.find((f) => f.fieldId === selectedFieldId);

  return (
    <div className="flex h-[calc(100vh-73px)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/app/campaigns")} className="text-sm text-zinc-500 hover:text-zinc-700">
            &larr; Back
          </button>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{campaign.name}</h2>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            campaign.status === "published" ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-600"
          }`}>
            {campaign.status}
          </span>
          {campaign.hasUnpublishedChanges && (
            <UnpublishedChangesBadge />
          )}
        </div>
        <div className="flex items-center gap-2">
          {message && <span className="text-xs text-zinc-500">{message}</span>}

          {/* Variant manager */}
          <VariantManagerPanel
            campaignId={campaign.id}
            variants={campaign.variants}
            activeVariantId={activeVariantId}
            onActiveVariantChange={(variantId) => {
              setActiveVariantId(variantId);
              loadVariantSchema(variantId, campaign);
            }}
            onVariantsChange={(updated) =>
              setCampaign((prev) => {
                if (!prev) return prev;
                const updatedCampaign = { ...prev, variants: updated };
                loadVariantSchema(activeVariantId, updatedCampaign);
                return updatedCampaign;
              })
            }
            plan={resolvePlan(campaign.accountPlanKey)}
            canEdit={true}
          />

          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-300 disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-200"
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Publish / Get Code
          </button>
        </div>
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onPublish={handlePublish}
        publishing={publishing}
        campaign={campaign}
        publishResult={publishResult}
      />

      {/* Three-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Field Palette */}
        <div className="w-56 shrink-0 border-r border-zinc-200 bg-zinc-50 p-3 overflow-y-auto dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Add Field</h3>
          <div className="grid grid-cols-2 gap-1.5">
            {FIELD_TYPES.map(({ type, label }) => (
              <button
                key={type}
                onClick={() => addField(type)}
                className="rounded border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 hover:border-indigo-300 hover:bg-indigo-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-indigo-600"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Fields</h3>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={schema.fields.map((f) => f.fieldId)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1.5">
                  {schema.fields.map((field) => (
                    <SortableField
                      key={field.fieldId}
                      field={field}
                      isSelected={selectedFieldId === field.fieldId}
                      onClick={() => {
                        setSelectedFieldId(field.fieldId);
                        setRightTab("field");
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* Center: Preview */}
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-100 dark:bg-zinc-950">
          {/* Preview toolbar */}
          <div className="flex items-center gap-3 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
            <ViewportToggle value={viewport} onChange={setViewport} />
            <div className="inline-flex rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              {(["popup", "inline"] as const).map((mode, i) => (
                <button
                  key={mode}
                  onClick={() => setDisplayMode(mode)}
                  className={[
                    "px-3 py-1.5 text-xs capitalize focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset",
                    i === 0 ? "border-r border-zinc-200 dark:border-zinc-800" : "",
                    displayMode === mode
                      ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 font-medium"
                      : "text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <FormPreview
              schema={schema}
              campaignType={campaign.type as "popup" | "inline" | "slide-in" | "bar"}
              viewport={viewport}
              displayMode={displayMode}
            />
          </div>
        </div>

        {/* Right: Settings */}
        <div className="w-72 shrink-0 border-l border-zinc-200 bg-white p-3 overflow-y-auto dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-3 flex gap-1">
            {(["field", "style", "steps", "settings", "spam", "ai"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className={`rounded px-2 py-1 text-xs font-medium capitalize ${
                  rightTab === tab
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
                }`}
              >
                {tab === "ai" ? "AI" : tab === "steps" ? "Steps" : tab === "spam" ? "Spam" : tab}
              </button>
            ))}
          </div>

          {rightTab === "field" && selectedField && (
            <FieldSettingsPanel
              field={selectedField}
              allFields={schema.fields}
              onChange={handleFieldChange}
              onDelete={() => deleteField(selectedField.fieldId)}
              campaignType={campaign?.type}
            />
          )}
          {rightTab === "field" && !selectedField && (
            <p className="text-xs text-zinc-400">Select a field to edit its settings</p>
          )}
          {rightTab === "style" && (
            <StyleEditor
              style={schema.style}
              submitLabel={schema.submitLabel}
              onChange={(style) => updateSchema({ ...schema, style })}
              onSubmitLabelChange={(label) => updateSchema({ ...schema, submitLabel: label })}
            />
          )}
          {rightTab === "steps" && (
            <MultiStepEditor schema={schema} onSchemaChange={updateSchema} />
          )}
          {rightTab === "settings" && (
            <CampaignSettingsPanel campaign={campaign} onUpdate={handleCampaignUpdate} />
          )}
          {rightTab === "spam" && (
            <SpamSettings campaign={campaign} onUpdate={handleCampaignUpdate} />
          )}
          {rightTab === "ai" && (
            <AiChatPanel campaignType={campaign.type} onApplySchema={updateSchema} />
          )}
        </div>
      </div>
    </div>
  );
}
