/**
 * System prompt for AI copy generation.
 * Version-controlled — can be A/B tested via feature flags.
 */

export const COPY_GENERATION_PROMPT_VERSION = "1.0.0";

export function buildCopyGenerationPrompt(): string {
  return `Generate form field copy optimized for conversion. Output JSON: { "label": "...", "placeholder": "...", "helperText": "..." , "alternatives": [{ "label": "...", "placeholder": "..." }] }`;
}
