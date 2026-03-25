import type { FieldType, FormField, FormSchema } from "./types";
import { getVisibleFields } from "./visibility";

export interface ValidationError {
  fieldId: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface SchemaValidationIssue {
  path: string;
  message: string;
}

export interface SchemaValidationResult {
  valid: boolean;
  errors: SchemaValidationIssue[];
}

export interface SchemaJsonValidationResult extends SchemaValidationResult {
  schema?: FormSchema;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[\d\s\-().]{7,20}$/;
const VALID_FIELD_TYPES = new Set<FieldType>([
  "text",
  "email",
  "phone",
  "textarea",
  "dropdown",
  "radio",
  "checkbox",
  "hidden",
  "submit",
]);
const FIELD_TYPES_WITH_OPTIONS = new Set<FieldType>(["dropdown", "radio"]);
const REQUIRED_STYLE_KEYS: Array<keyof NonNullable<FormSchema["style"]>> = [
  "backgroundColor",
  "textColor",
  "buttonColor",
  "buttonTextColor",
  "borderRadius",
  "fontFamily",
];

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function validateField(field: unknown, index: number): SchemaValidationIssue[] {
  const errors: SchemaValidationIssue[] = [];
  const pathBase = `fields[${index}]`;
  const parsedField = asRecord(field);

  if (!parsedField) {
    return [{ path: pathBase, message: "Field must be an object" }];
  }

  const fieldId = parsedField.fieldId;
  if (typeof fieldId !== "string" || fieldId.trim().length === 0) {
    errors.push({ path: `${pathBase}.fieldId`, message: "fieldId is required" });
  }

  const label = parsedField.label;
  if (typeof label !== "string" || label.trim().length === 0) {
    errors.push({ path: `${pathBase}.label`, message: "label is required" });
  }

  const type = parsedField.type;
  if (typeof type !== "string" || !VALID_FIELD_TYPES.has(type as FieldType)) {
    errors.push({ path: `${pathBase}.type`, message: "Invalid field type" });
  }

  const typedFieldType = typeof type === "string" ? (type as FieldType) : null;
  const options = parsedField.options;

  if (typedFieldType && FIELD_TYPES_WITH_OPTIONS.has(typedFieldType)) {
    if (!Array.isArray(options) || options.length === 0) {
      errors.push({ path: `${pathBase}.options`, message: `Options are required for ${typedFieldType} fields` });
    } else {
      options.forEach((option, optionIndex) => {
        const parsedOption = asRecord(option);
        if (!parsedOption) {
          errors.push({
            path: `${pathBase}.options[${optionIndex}]`,
            message: "Option must be an object",
          });
          return;
        }

        if (typeof parsedOption.value !== "string" || parsedOption.value.trim().length === 0) {
          errors.push({
            path: `${pathBase}.options[${optionIndex}].value`,
            message: "Option value is required",
          });
        }

        if (typeof parsedOption.label !== "string" || parsedOption.label.trim().length === 0) {
          errors.push({
            path: `${pathBase}.options[${optionIndex}].label`,
            message: "Option label is required",
          });
        }
      });
    }
  }

  if (typedFieldType && !FIELD_TYPES_WITH_OPTIONS.has(typedFieldType) && options !== undefined) {
    if (!Array.isArray(options) || options.length > 0) {
      errors.push({
        path: `${pathBase}.options`,
        message: `Options are only allowed for dropdown or radio fields`,
      });
    }
  }

  return errors;
}

/**
 * Validate persisted campaign form schema shape.
 */
export function validateFormSchema(schema: unknown): SchemaValidationResult {
  const errors: SchemaValidationIssue[] = [];
  const parsedSchema = asRecord(schema);

  if (!parsedSchema) {
    return { valid: false, errors: [{ path: "schema", message: "Schema must be an object" }] };
  }

  if (!Array.isArray(parsedSchema.fields)) {
    errors.push({ path: "fields", message: "fields must be an array" });
  } else {
    if (parsedSchema.fields.length === 0) {
      errors.push({ path: "fields", message: "At least one field is required" });
    }

    parsedSchema.fields.forEach((field, index) => {
      errors.push(...validateField(field, index));
    });

    const hasSubmit = parsedSchema.fields.some((field) => {
      const parsedField = asRecord(field);
      return parsedField?.type === "submit";
    });
    if (!hasSubmit) {
      errors.push({ path: "fields", message: "At least one submit field is required" });
    }
  }

  const style = asRecord(parsedSchema.style);
  if (!style) {
    errors.push({ path: "style", message: "style is required" });
  } else {
    REQUIRED_STYLE_KEYS.forEach((key) => {
      const value = style[key];
      if (typeof value !== "string" || value.trim().length === 0) {
        errors.push({ path: `style.${key}`, message: `${key} is required` });
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Parse schemaJson and validate schema shape.
 */
export function validateFormSchemaJson(schemaJson: string): SchemaJsonValidationResult {
  try {
    const parsed = JSON.parse(schemaJson) as unknown;
    const result = validateFormSchema(parsed);
    if (!result.valid) {
      return result;
    }

    return { valid: true, errors: [], schema: parsed as FormSchema };
  } catch {
    return {
      valid: false,
      errors: [{ path: "schemaJson", message: "schemaJson must be valid JSON" }],
    };
  }
}

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
