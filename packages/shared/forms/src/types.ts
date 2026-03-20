/** Supported form field types */
export type FieldType =
  | "text"
  | "email"
  | "phone"
  | "textarea"
  | "dropdown"
  | "radio"
  | "checkbox"
  | "hidden"
  | "submit";

/** A single option for dropdown or radio fields */
export interface FieldOption {
  /** Stable value used in submission payload */
  value: string;
  /** Display label shown to the user */
  label: string;
}

/** Visibility condition for conditional logic */
export interface VisibilityCondition {
  /** field_id of the field this depends on */
  dependsOn: string;
  /** Comparison operator */
  operator: "equals" | "not_equals" | "contains" | "not_empty";
  /** Value to compare against (not used for not_empty) */
  value?: string;
}

/** A single form field definition */
export interface FormField {
  /** Stable unique identifier for this field */
  fieldId: string;
  /** Field type */
  type: FieldType;
  /** Display label */
  label: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether this field is required */
  required?: boolean;
  /** Options for dropdown/radio fields */
  options?: FieldOption[];
  /** Default value */
  defaultValue?: string;
  /** Visibility condition — if set, field only shows when condition is met */
  visibilityCondition?: VisibilityCondition;
}

/** Style configuration for a form variant */
export interface FormStyle {
  backgroundColor?: string;
  textColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  borderRadius?: string;
  fontFamily?: string;
}

/** Complete schema for a form variant */
export interface FormSchema {
  fields: FormField[];
  style?: FormStyle;
  submitLabel?: string;
}

/** URL targeting rule */
export interface TargetingRule {
  type: "all" | "equals" | "contains" | "starts_with" | "does_not_contain";
  value?: string;
}

/** Trigger configuration */
export interface TriggerConfig {
  type: "immediate" | "delay" | "scroll" | "exit_intent" | "click";
  /** Delay in milliseconds (for delay trigger) */
  delayMs?: number;
  /** Scroll percentage 0-100 (for scroll trigger) */
  scrollPercent?: number;
  /** CSS selector for click trigger */
  clickSelector?: string;
}

/** Frequency control */
export interface FrequencyConfig {
  /** Show once per session */
  perSession?: boolean;
  /** Show once every N days */
  everyDays?: number;
  /** Maximum total shows */
  maxShows?: number;
}

/** A single campaign in the manifest */
export interface ManifestCampaign {
  campaignId: string;
  type: "popup" | "inline";
  targeting: TargetingRule;
  trigger: TriggerConfig;
  frequency?: FrequencyConfig;
  /** Map of variant ID -> form schema */
  variants: Record<string, FormSchema>;
}

/** Top-level site manifest (v1) */
export interface SiteManifestV1 {
  version: 1;
  siteId: string;
  publicKey: string;
  campaigns: ManifestCampaign[];
  updatedAt: string;
}
