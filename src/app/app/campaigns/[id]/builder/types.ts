import type { FieldType } from "@capturely/shared-forms";

export interface FormField {
  fieldId: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  visibilityCondition?: {
    dependsOn: string;
    operator: "equals" | "not_equals" | "contains" | "not_empty";
    value?: string;
  };
}

export interface FormStyle {
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

export interface FormSchema {
  fields: FormField[];
  style: FormStyle;
  submitLabel: string;
  steps?: Array<{ label: string; fieldIds: string[] }>;
  progressBarStyle?: "dots" | "bar" | "steps" | "none";
}
