import type { FormField } from "./types";
import { getVisibleFields } from "./visibility";

export interface ValidationError {
  fieldId: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[\d\s\-().]{7,20}$/;

/**
 * Validate a submission payload against form fields.
 * Only validates visible fields (conditional logic respected).
 */
export function validateSubmission(
  fields: FormField[],
  payload: Record<string, string>,
  formValues?: Record<string, string>
): ValidationResult {
  const errors: ValidationError[] = [];
  const values = formValues ?? payload;
  const visibleFields = getVisibleFields(fields, values);

  for (const field of visibleFields) {
    // Skip submit buttons
    if (field.type === "submit") continue;

    const value = payload[field.fieldId] ?? "";

    // Required check
    if (field.required && value.trim().length === 0) {
      errors.push({
        fieldId: field.fieldId,
        message: `${field.label} is required`,
      });
      continue;
    }

    // Type-specific validation (only if value is non-empty)
    if (value.trim().length > 0) {
      if (field.type === "email" && !EMAIL_REGEX.test(value)) {
        errors.push({
          fieldId: field.fieldId,
          message: "Invalid email address",
        });
      }

      if (field.type === "phone" && !PHONE_REGEX.test(value)) {
        errors.push({
          fieldId: field.fieldId,
          message: "Invalid phone number",
        });
      }

      // Validate dropdown/radio values against allowed options
      if (
        (field.type === "dropdown" || field.type === "radio") &&
        field.options &&
        field.options.length > 0
      ) {
        const allowedValues = field.options.map((o) => o.value);
        if (!allowedValues.includes(value)) {
          errors.push({
            fieldId: field.fieldId,
            message: `Invalid option for ${field.label}`,
          });
        }
      }
    }
  }

  // Check for unexpected fields in payload
  const visibleFieldIds = new Set(
    visibleFields.filter((f) => f.type !== "submit").map((f) => f.fieldId)
  );
  for (const key of Object.keys(payload)) {
    if (!visibleFieldIds.has(key)) {
      errors.push({
        fieldId: key,
        message: `Unexpected field: ${key}`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
