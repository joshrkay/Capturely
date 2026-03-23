export type {
  FieldType,
  FieldOption,
  VisibilityCondition,
  FormField,
  FormStyle,
  FormSchema,
  TargetingRule,
  TriggerConfig,
  FrequencyConfig,
  DeviceTarget,
  TargetingConfig,
  ManifestCampaign,
  SiteManifestV1,
} from "./types";

export { evaluateVisibility, evaluateCondition, getVisibleFields } from "./visibility";
export { validateSubmission } from "./validation";
export type { ValidationError, ValidationResult } from "./validation";
export { normalizeFields, buildSubmissionPayload } from "./normalize";
