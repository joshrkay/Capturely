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
  field?: string;
  reason?: string;
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

export interface SchemaValidationOptions {
  requireSubmitField?: boolean;
  requireEmailField?: boolean;
}

function createIssue(path: string, message: string): SchemaValidationIssue {
  return { path, message, field: path, reason: message };
}

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
    return [createIssue(pathBase, "Field must be an object")];
  }

  const fieldId = parsedField.fieldId;
  if (typeof fieldId !== "string" || fieldId.trim().length === 0) {
    errors.push(createIssue(`${pathBase}.fieldId`, "fieldId is required"));
  }

  const label = parsedField.label;
  if (typeof label !== "string" || label.trim().length === 0) {
    errors.push(createIssue(`${pathBase}.label`, "label is required"));
  }

  const type = parsedField.type;
  if (typeof type !== "string" || !VALID_FIELD_TYPES.has(type as FieldType)) {
    errors.push(createIssue(`${pathBase}.type`, "Invalid field type"));
  }

  const typedFieldType = typeof type === "string" ? (type as FieldType) : null;
  const options = parsedField.options;

  if (typedFieldType && FIELD_TYPES_WITH_OPTIONS.has(typedFieldType)) {
    if (!Array.isArray(options) || options.length === 0) {
      errors.push(createIssue(`${pathBase}.options`, `Options are required for ${typedFieldType} fields`));
    } else {
      options.forEach((option, optionIndex) => {
        const parsedOption = asRecord(option);
        if (!parsedOption) {
          errors.push(createIssue(`${pathBase}.options[${optionIndex}]`, "Option must be an object"));
          return;
        }

        if (typeof parsedOption.value !== "string" || parsedOption.value.trim().length === 0) {
          errors.push(createIssue(`${pathBase}.options[${optionIndex}].value`, "Option value is required"));
        }

        if (typeof parsedOption.label !== "string" || parsedOption.label.trim().length === 0) {
          errors.push(createIssue(`${pathBase}.options[${optionIndex}].label`, "Option label is required"));
        }
      });
    }
  }

  if (typedFieldType && !FIELD_TYPES_WITH_OPTIONS.has(typedFieldType) && options !== undefined) {
    if (!Array.isArray(options) || options.length > 0) {
      errors.push(createIssue(`${pathBase}.options`, "Options are only allowed for dropdown or radio fields"));
    }
  }

  return errors;
}

/**
 * Validate persisted campaign form schema shape.
 */
export function validateFormSchema(
  schema: unknown,
  options: SchemaValidationOptions = {}
): SchemaValidationResult {
  const errors: SchemaValidationIssue[] = [];
  const parsedSchema = asRecord(schema);
  const requireSubmitField = options.requireSubmitField ?? true;
  const requireEmailField = options.requireEmailField ?? false;

  if (!parsedSchema) {
    return { valid: false, errors: [createIssue("schema", "Schema must be an object")] };
  }

  if (!Array.isArray(parsedSchema.fields)) {
    errors.push(createIssue("fields", "fields must be an array"));
  } else {
    if (parsedSchema.fields.length === 0) {
      errors.push(createIssue("fields", "At least one field is required"));
    }

    parsedSchema.fields.forEach((field, index) => {
      errors.push(...validateField(field, index));
    });

    const hasSubmit = parsedSchema.fields.some((field) => {
      const parsedField = asRecord(field);
      return parsedField?.type === "submit";
    });
    if (requireSubmitField && !hasSubmit) {
      errors.push(createIssue("fields", "At least one submit field is required"));
    }

    const hasEmail = parsedSchema.fields.some((field) => {
      const parsedField = asRecord(field);
      return parsedField?.type === "email";
    });
    if (requireEmailField && !hasEmail) {
      errors.push(createIssue("fields", "At least one email field is required"));
    }
  }

  const steps = parsedSchema.steps;
  if (steps !== undefined) {
    if (!Array.isArray(steps)) {
      errors.push(createIssue("steps", "steps must be an array when provided"));
    } else {
      const fieldIds = new Set(
        (Array.isArray(parsedSchema.fields) ? parsedSchema.fields : [])
          .map((field) => asRecord(field)?.fieldId)
          .filter((fieldId): fieldId is string => typeof fieldId === "string" && fieldId.trim().length > 0)
      );
      const assignedFieldIds = new Set<string>();

      steps.forEach((step, stepIndex) => {
        const parsedStep = asRecord(step);
        const pathBase = `steps[${stepIndex}]`;
        if (!parsedStep) {
          errors.push(createIssue(pathBase, "Step must be an object"));
          return;
        }

        if (typeof parsedStep.label !== "string" || parsedStep.label.trim().length === 0) {
          errors.push(createIssue(`${pathBase}.label`, "label is required"));
        }

        if (!Array.isArray(parsedStep.fieldIds)) {
          errors.push(createIssue(`${pathBase}.fieldIds`, "fieldIds must be an array"));
          return;
        }

        parsedStep.fieldIds.forEach((fieldId, fieldIndex) => {
          const fieldPath = `${pathBase}.fieldIds[${fieldIndex}]`;
          if (typeof fieldId !== "string" || fieldId.trim().length === 0) {
            errors.push(createIssue(fieldPath, "fieldId reference must be a non-empty string"));
            return;
          }

          if (!fieldIds.has(fieldId)) {
            errors.push(createIssue(fieldPath, `Unknown fieldId reference: ${fieldId}`));
            return;
          }

          if (assignedFieldIds.has(fieldId)) {
            errors.push(createIssue(fieldPath, `fieldId is already assigned to another step: ${fieldId}`));
            return;
          }

          assignedFieldIds.add(fieldId);
        });
      });
    }
  }

  const style = asRecord(parsedSchema.style);
  if (!style) {
    errors.push(createIssue("style", "style is required"));
  } else {
    REQUIRED_STYLE_KEYS.forEach((key) => {
      const value = style[key];
      if (typeof value !== "string" || value.trim().length === 0) {
        errors.push(createIssue(`style.${key}`, `${key} is required`));
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Parse schemaJson and validate schema shape.
 */
export function validateFormSchemaJson(
  schemaJson: string,
  options: SchemaValidationOptions = {}
): SchemaJsonValidationResult {
  try {
    const parsed = JSON.parse(schemaJson) as unknown;
    const result = validateFormSchema(parsed, options);
    if (!result.valid) {
      return result;
    }

    return { valid: true, errors: [], schema: parsed as FormSchema };
  } catch {
    return {
      valid: false,
      errors: [createIssue("schemaJson", "schemaJson must be valid JSON")],
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
