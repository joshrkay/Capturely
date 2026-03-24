/**
 * System prompt for AI style suggestions.
 * Version-controlled — can be A/B tested via feature flags.
 */

export const STYLE_SUGGESTION_PROMPT_VERSION = "1.0.0";

export function buildStyleSuggestionPrompt(): string {
  return `Suggest a form style that matches the brand. Output JSON matching FormStyle: { "backgroundColor": "#hex", "textColor": "#hex", "buttonColor": "#hex", "buttonTextColor": "#hex", "borderRadius": "Npx", "fontFamily": "..." }`;
}
