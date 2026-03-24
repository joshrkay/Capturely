/**
 * Centralized prompt exports for AI generation.
 * All system prompts live here — version-controlled and testable.
 */

export {
  buildFormGenerationPrompt,
  FORM_GENERATION_PROMPT_VERSION,
} from "./form-generation";

export {
  buildFieldSuggestionPrompt,
  FIELD_SUGGESTION_PROMPT_VERSION,
} from "./field-suggestion";

export {
  buildCopyGenerationPrompt,
  COPY_GENERATION_PROMPT_VERSION,
} from "./copy-generation";

export {
  buildStyleSuggestionPrompt,
  STYLE_SUGGESTION_PROMPT_VERSION,
} from "./style-suggestion";

export {
  buildVariantGenerationPrompt,
  VARIANT_GENERATION_PROMPT_VERSION,
} from "./variant-generation";

export {
  buildCtaOptimizationPrompt,
  CTA_OPTIMIZATION_PROMPT_VERSION,
} from "./cta-optimization";
