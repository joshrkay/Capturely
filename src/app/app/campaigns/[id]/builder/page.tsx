"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CampaignSettingsPanel } from "./components/display-settings";
import { VariantManagerPanel } from "./_components/VariantManagerPanel";
import { resolvePlan } from "@/lib/plans";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormField {
  fieldId: string;
  type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  visibilityCondition?: {
    dependsOn: string;
    operator: string;
    value?: string;
  };
}

interface FormStyle {
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  borderRadius: string;
  fontFamily: string;
  padding?: string;
  buttonBorderRadius?: string;
  buttonHoverColor?: string;
  boxShadow?: string;
}

interface FormSchema {
  fields: FormField[];
  style: FormStyle;
  submitLabel: string;
}

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
  variants: Variant[];
  site: { id: string; name: string; publicKey: string };
  accountPlanKey: string;
}

const FIELD_TYPES = [
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
}: {
  field: FormField;
  allFields: FormField[];
  onChange: (updated: FormField) => void;
  onDelete: () => void;
}) {
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
                    visibilityCondition: { ...field.visibilityCondition!, operator: e.target.value },
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
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<Array<{ prompt: string; response: string }>>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, campaignType }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "AI generation failed");
        return;
      }

      const data = await res.json();
      setHistory((prev) => [...prev, { prompt, response: data.schema }]);

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
        setError("AI returned an invalid schema. Try rephrasing your prompt.");
      }

      setPrompt("");
    } catch {
      setError("Failed to connect to AI service");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">AI Copilot</h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">Describe your form and AI will generate it for you.</p>

      {error && (
        <div className="rounded bg-red-50 p-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</div>
      )}

      <div className="max-h-48 space-y-2 overflow-y-auto">
        {history.map((h, i) => (
          <div key={i} className="rounded bg-zinc-50 p-2 text-xs dark:bg-zinc-800">
            <div className="font-medium text-zinc-700 dark:text-zinc-300">{h.prompt}</div>
            <div className="mt-1 text-zinc-500 dark:text-zinc-400">Schema applied</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          placeholder="e.g. Lead capture form for a coffee shop"
          disabled={loading}
          className="flex-1 rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "..." : "Generate"}
        </button>
      </div>
    </div>
  );
}

// ─── Form Preview ─────────────────────────────────────────────────────────────

function FormPreview({ schema, campaignType }: { schema: FormSchema; campaignType: string }) {
  const { style } = schema;

  return (
    <div className="flex items-center justify-center p-8">
      <div
        className={`w-full max-w-md ${campaignType === "popup" ? "shadow-2xl" : "shadow-md"}`}
        style={{
          backgroundColor: style.backgroundColor,
          color: style.textColor,
          borderRadius: style.borderRadius,
          fontFamily: style.fontFamily,
          padding: "24px",
        }}
      >
        <div className="space-y-3">
          {schema.fields.map((field) => {
            if (field.type === "submit") {
              return (
                <button
                  key={field.fieldId}
                  style={{
                    backgroundColor: style.buttonColor,
                    color: style.buttonTextColor,
                    borderRadius: style.borderRadius,
                  }}
                  className="w-full py-2.5 text-sm font-medium"
                >
                  {schema.submitLabel || field.label}
                </button>
              );
            }
            if (field.type === "hidden") return null;
            if (field.type === "textarea") {
              return (
                <div key={field.fieldId}>
                  <label className="mb-1 block text-xs font-medium">{field.label}{field.required && " *"}</label>
                  <textarea placeholder={field.placeholder} className="w-full rounded border px-3 py-2 text-sm" style={{ borderRadius: style.borderRadius }} rows={3} readOnly />
                </div>
              );
            }
            if (field.type === "checkbox") {
              return (
                <div key={field.fieldId} className="flex items-center gap-2">
                  <input type="checkbox" readOnly />
                  <label className="text-sm">{field.label}</label>
                </div>
              );
            }
            if (field.type === "radio") {
              return (
                <div key={field.fieldId}>
                  <label className="mb-1 block text-xs font-medium">{field.label}{field.required && " *"}</label>
                  <div className="space-y-1">
                    {(field.options ?? []).map((opt) => (
                      <div key={opt.value} className="flex items-center gap-2">
                        <input type="radio" name={field.fieldId} readOnly />
                        <span className="text-sm">{opt.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            if (field.type === "dropdown") {
              return (
                <div key={field.fieldId}>
                  <label className="mb-1 block text-xs font-medium">{field.label}{field.required && " *"}</label>
                  <select className="w-full rounded border px-3 py-2 text-sm" style={{ borderRadius: style.borderRadius }}>
                    <option>{field.placeholder ?? "Select..."}</option>
                    {(field.options ?? []).map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              );
            }
            return (
              <div key={field.fieldId}>
                <label className="mb-1 block text-xs font-medium">{field.label}{field.required && " *"}</label>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  className="w-full rounded border px-3 py-2 text-sm"
                  style={{ borderRadius: style.borderRadius }}
                  readOnly
                />
              </div>
            );
          })}
        </div>
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
  const [rightTab, setRightTab] = useState<"field" | "style" | "settings" | "ai">("field");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Load campaign
  useEffect(() => {
    fetch(`/api/campaigns/${id}`)
      .then((r) => r.json())
      .then((data: Campaign) => {
        setCampaign(data);
        const control = data.variants.find((v) => v.isControl) ?? data.variants[0];
        if (control) {
          setActiveVariantId(control.id);
          try { setSchema(JSON.parse(control.schemaJson)); } catch { /* ignore */ }
        }
      });
  }, [id]);

  // When active variant changes
  useEffect(() => {
    if (!campaign) return;
    const variant = campaign.variants.find((v) => v.id === activeVariantId);
    if (variant) {
      try { setSchema(JSON.parse(variant.schemaJson)); } catch { /* ignore */ }
    }
  }, [activeVariantId, campaign]);

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

  const addField = useCallback((type: string) => {
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
    updateSchema({ ...schema, fields: schema.fields.filter((f) => f.fieldId !== fieldId) });
    setSelectedFieldId(null);
  }, [schema, updateSchema]);

  const handleSave = async () => {
    if (!schema || !campaign) return;
    setSaving(true);
    setMessage("");

    // Save variant schema
    await fetch(`/api/campaigns/${id}/variants`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId: activeVariantId, schemaJson: JSON.stringify(schema) }),
    });

    // Save campaign settings
    const updates: Record<string, unknown> = {};
    if (campaign.targetingJson) updates.targetingJson = campaign.targetingJson;
    if (campaign.triggerJson) updates.triggerJson = campaign.triggerJson;
    if (campaign.frequencyJson) updates.frequencyJson = campaign.frequencyJson;

    if (Object.keys(updates).length > 0) {
      await fetch(`/api/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    }

    setMessage("Draft saved");
    setSaving(false);
    setTimeout(() => setMessage(""), 2000);
  };

  const handlePublish = async () => {
    await handleSave();
    setPublishing(true);
    setMessage("");

    const res = await fetch(`/api/campaigns/${id}/publish`, { method: "POST" });
    if (!res.ok) {
      const data = await res.json();
      setMessage(`Error: ${data.error}`);
    } else {
      setMessage("Published!");
      setCampaign((prev) => prev ? { ...prev, status: "published", hasUnpublishedChanges: false } : prev);
    }
    setPublishing(false);
    setTimeout(() => setMessage(""), 3000);
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
            <span className="text-xs text-amber-600">unsaved changes</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {message && <span className="text-xs text-zinc-500">{message}</span>}

          {/* Variant manager */}
          <VariantManagerPanel
            campaignId={campaign.id}
            variants={campaign.variants}
            activeVariantId={activeVariantId}
            onActiveVariantChange={setActiveVariantId}
            onVariantsChange={(updated) =>
              setCampaign((prev) => prev ? { ...prev, variants: updated } : prev)
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
            onClick={handlePublish}
            disabled={publishing}
            className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {publishing ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>

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
        <div className="flex-1 overflow-y-auto bg-zinc-100 dark:bg-zinc-950">
          <FormPreview schema={schema} campaignType={campaign.type} />
        </div>

        {/* Right: Settings */}
        <div className="w-72 shrink-0 border-l border-zinc-200 bg-white p-3 overflow-y-auto dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-3 flex gap-1">
            {(["field", "style", "settings", "ai"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className={`rounded px-2 py-1 text-xs font-medium capitalize ${
                  rightTab === tab
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
                }`}
              >
                {tab === "ai" ? "AI" : tab}
              </button>
            ))}
          </div>

          {rightTab === "field" && selectedField && (
            <FieldSettingsPanel
              field={selectedField}
              allFields={schema.fields}
              onChange={handleFieldChange}
              onDelete={() => deleteField(selectedField.fieldId)}
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
          {rightTab === "settings" && (
            <CampaignSettingsPanel campaign={campaign} onUpdate={handleCampaignUpdate} />
          )}
          {rightTab === "ai" && (
            <AiCopilotPanel campaignType={campaign.type} onApplySchema={updateSchema} />
          )}
        </div>
      </div>
    </div>
  );
}
