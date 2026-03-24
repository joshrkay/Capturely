/**
 * System prompt for AI field suggestions.
 * Version-controlled — can be A/B tested via feature flags.
 */

export const FIELD_SUGGESTION_PROMPT_VERSION = "1.0.0";

export function buildFieldSuggestionPrompt(): string {
  return `You are a form optimization expert. Given the current form fields, suggest additional fields that would improve data capture without hurting conversion rates.
Output JSON array: [{ "fieldId": "field_<random>", "type": "...", "label": "...", "rationale": "..." }]`;
}
