"use client";

import { useState, useEffect, useRef } from "react";
import type { FormField, FormSchema, FormStyle } from "@capturely/shared-forms";
import { evaluateVisibility } from "@capturely/shared-forms";

// ─── Viewport Constants ───────────────────────────────────────────────────────

export const VIEWPORT_WIDTHS = {
  desktop: 1024,
  tablet: 768,
  mobile: 375,
} as const;

export type ViewportKey = keyof typeof VIEWPORT_WIDTHS;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FormPreviewProps {
  /** Parsed form schema from the active variant's schemaJson */
  schema: FormSchema;
  /** Campaign display type */
  campaignType: "popup" | "inline" | "slide-in" | "bar" | string;
  /** Device viewport to simulate */
  viewport?: ViewportKey;
  /** Display mode — popup renders with backdrop, inline renders flush */
  displayMode?: "popup" | "inline";
  /** Style overrides (falls back to schema.style) */
  style?: FormStyle;
  /** Optional className for the outermost container */
  className?: string;
}

// ─── Scale Hook ───────────────────────────────────────────────────────────────

function usePreviewScale(
  containerRef: React.RefObject<HTMLDivElement | null>,
  viewportWidth: number
): number {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const available = entry.contentRect.width - 32; // subtract p-4 * 2
      setScale(Math.min(1, available / viewportWidth));
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerRef, viewportWidth]);
  return scale;
}

// ─── Field Rendering ──────────────────────────────────────────────────────────

function FieldList({
  fields,
  style,
  submitLabel,
}: {
  fields: FormField[];
  style: FormStyle;
  submitLabel?: string;
}) {
  return (
    <div className="space-y-3">
      {fields.map((field) => {
        if (field.type === "hidden") return null;

        if (field.type === "submit") {
          return (
            <button
              key={field.fieldId}
              tabIndex={-1}
              aria-hidden="true"
              style={{
                backgroundColor: style.buttonColor,
                color: style.buttonTextColor,
                borderRadius: style.borderRadius,
              }}
              className="w-full py-2.5 text-sm font-medium"
            >
              {submitLabel || field.label}
            </button>
          );
        }

        if (field.type === "textarea") {
          return (
            <div key={field.fieldId}>
              <label className="mb-1 block text-xs font-medium">
                {field.label}
                {field.required && " *"}
              </label>
              <textarea
                placeholder={field.placeholder}
                className="w-full rounded border px-3 py-2 text-sm"
                style={{ borderRadius: style.borderRadius }}
                rows={3}
                readOnly
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>
          );
        }

        if (field.type === "checkbox") {
          return (
            <div key={field.fieldId} className="flex items-center gap-2">
              <input
                type="checkbox"
                readOnly
                tabIndex={-1}
                aria-hidden="true"
              />
              <label className="text-sm">{field.label}</label>
            </div>
          );
        }

        if (field.type === "radio") {
          return (
            <div key={field.fieldId}>
              <label className="mb-1 block text-xs font-medium">
                {field.label}
                {field.required && " *"}
              </label>
              <div className="space-y-1">
                {(field.options ?? []).map((opt) => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={field.fieldId}
                      readOnly
                      tabIndex={-1}
                      aria-hidden="true"
                    />
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
              <label className="mb-1 block text-xs font-medium">
                {field.label}
                {field.required && " *"}
              </label>
              <select
                className="w-full rounded border px-3 py-2 text-sm"
                style={{ borderRadius: style.borderRadius }}
                tabIndex={-1}
                aria-hidden="true"
              >
                <option>{field.placeholder ?? "Select..."}</option>
                {(field.options ?? []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        // text, email, phone
        return (
          <div key={field.fieldId}>
            <label className="mb-1 block text-xs font-medium">
              {field.label}
              {field.required && " *"}
            </label>
            <input
              type={field.type}
              placeholder={field.placeholder}
              className="w-full rounded border px-3 py-2 text-sm"
              style={{ borderRadius: style.borderRadius }}
              readOnly
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>
        );
      })}
    </div>
  );
}

function EmptyPlaceholder({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center">{text}</p>
    </div>
  );
}

// ─── FormPreview Component ────────────────────────────────────────────────────

export function FormPreview({
  schema,
  viewport = "desktop",
  displayMode = "inline",
  style: styleProp,
  className,
}: FormPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportWidth = VIEWPORT_WIDTHS[viewport];
  const scale = usePreviewScale(containerRef, viewportWidth);
  const style = (styleProp ?? schema.style ?? {}) as FormStyle;

  const fields = schema.fields ?? [];

  // Empty schema
  if (fields.length === 0) {
    return (
      <div
        ref={containerRef}
        role="presentation"
        aria-label="Form preview"
        className={`bg-zinc-100 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden ${className ?? ""}`}
      >
        <EmptyPlaceholder text="Add fields to see a preview" />
      </div>
    );
  }

  // Evaluate visibility — pass empty formValues since this is a static preview
  const visibleFields = fields.filter((f) =>
    evaluateVisibility(f as FormField, {})
  );

  // All fields hidden (excluding "hidden" type which is always null)
  const renderableVisible = visibleFields.filter((f) => f.type !== "hidden");
  if (renderableVisible.length === 0) {
    return (
      <div
        ref={containerRef}
        role="presentation"
        aria-label="Form preview"
        className={`bg-zinc-100 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden ${className ?? ""}`}
      >
        <EmptyPlaceholder text="No visible fields with current conditions" />
      </div>
    );
  }

  const scaledHeight = scale < 1 ? `${Math.round(viewportWidth * 0.6 * scale)}px` : undefined;

  return (
    <div
      ref={containerRef}
      role="presentation"
      aria-label="Form preview"
      className={`bg-zinc-100 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden p-4 ${className ?? ""}`}
    >
      <div
        style={{
          width: viewportWidth,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          height: scaledHeight,
        }}
      >
        {displayMode === "popup" ? (
          <div
            className="bg-black/40 rounded-lg flex items-center justify-center"
            style={{ minHeight: 400 }}
          >
            <div
              className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl p-6 w-full max-w-md"
              style={{
                backgroundColor: style.backgroundColor,
                color: style.textColor,
                fontFamily: style.fontFamily,
              }}
            >
              <FieldList
                fields={visibleFields}
                style={style}
                submitLabel={schema.submitLabel}
              />
            </div>
          </div>
        ) : (
          <div
            className="bg-white dark:bg-zinc-900 p-4"
            style={{
              backgroundColor: style.backgroundColor,
              color: style.textColor,
              fontFamily: style.fontFamily,
            }}
          >
            <FieldList
              fields={visibleFields}
              style={style}
              submitLabel={schema.submitLabel}
            />
          </div>
        )}
      </div>
    </div>
  );
}
