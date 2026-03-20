import type { FormField, VisibilityCondition } from "./types";

/**
 * Evaluate whether a field should be visible given current form values.
 * Returns true if the field has no condition or if the condition is met.
 */
export function evaluateVisibility(
  field: FormField,
  formValues: Record<string, string>
): boolean {
  if (!field.visibilityCondition) {
    return true;
  }
  return evaluateCondition(field.visibilityCondition, formValues);
}

/**
 * Evaluate a single visibility condition against current form values.
 */
export function evaluateCondition(
  condition: VisibilityCondition,
  formValues: Record<string, string>
): boolean {
  const currentValue = formValues[condition.dependsOn] ?? "";

  switch (condition.operator) {
    case "equals":
      return currentValue === (condition.value ?? "");
    case "not_equals":
      return currentValue !== (condition.value ?? "");
    case "contains":
      return currentValue.includes(condition.value ?? "");
    case "not_empty":
      return currentValue.trim().length > 0;
    default:
      return true;
  }
}

/**
 * Filter form fields to only those currently visible, given form values.
 */
export function getVisibleFields(
  fields: FormField[],
  formValues: Record<string, string>
): FormField[] {
  return fields.filter((field) => evaluateVisibility(field, formValues));
}
