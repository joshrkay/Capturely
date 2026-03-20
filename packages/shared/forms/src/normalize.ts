import type { FormField } from "./types";

/**
 * Normalize form fields: ensure stable field_ids, trim whitespace,
 * and enforce structural rules (submit is always last).
 */
export function normalizeFields(fields: FormField[]): FormField[] {
  const normalized = fields.map((field) => ({
    ...field,
    label: field.label.trim(),
    placeholder: field.placeholder?.trim(),
    options: field.options?.map((o) => ({
      value: o.value.trim(),
      label: o.label.trim(),
    })),
  }));

  // Ensure submit button is always last
  const submitIdx = normalized.findIndex((f) => f.type === "submit");
  if (submitIdx !== -1 && submitIdx !== normalized.length - 1) {
    const [submit] = normalized.splice(submitIdx, 1);
    normalized.push(submit);
  }

  return normalized;
}

/**
 * Build a strict payload from form values, including only visible non-submit fields.
 * Hidden fields use their default value.
 */
export function buildSubmissionPayload(
  fields: FormField[],
  formValues: Record<string, string>
): Record<string, string> {
  const payload: Record<string, string> = {};

  for (const field of fields) {
    if (field.type === "submit") continue;

    if (field.type === "hidden") {
      payload[field.fieldId] = field.defaultValue ?? "";
    } else {
      const value = formValues[field.fieldId];
      if (value !== undefined) {
        payload[field.fieldId] = value;
      }
    }
  }

  return payload;
}
