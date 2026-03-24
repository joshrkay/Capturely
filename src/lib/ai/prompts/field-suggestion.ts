export const FIELD_SUGGESTION_PROMPT_VERSION = "v1";

export const FIELD_SUGGESTION_SYSTEM_PROMPT = `You are a form optimization expert. Given the current form fields, suggest additional fields that would improve data capture without hurting conversion rates.
Output JSON array: [{ "fieldId": "field_<random>", "type": "...", "label": "...", "rationale": "..." }]`;

export function buildFieldSuggestionUserPrompt(params: {
  currentFields: string;
  campaignType: string;
  industry?: string;
}): string {
  return (
    `Campaign type: ${params.campaignType}\nCurrent fields:\n${params.currentFields}`
    + (params.industry ? `\nIndustry: ${params.industry}` : "")
  );
}
