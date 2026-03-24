export const STYLE_SUGGESTION_PROMPT_VERSION = "v1";

export const STYLE_SUGGESTION_SYSTEM_PROMPT = `Suggest a form style that matches the brand. Output JSON matching FormStyle: { "backgroundColor": "#hex", "textColor": "#hex", "buttonColor": "#hex", "buttonTextColor": "#hex", "borderRadius": "Npx", "fontFamily": "..." }`;

export function buildStyleSuggestionUserPrompt(params: {
  campaignType: string;
  siteUrl?: string;
  brandColors?: string[];
}): string {
  return (
    `Campaign: ${params.campaignType}`
    + (params.siteUrl ? `\nSite: ${params.siteUrl}` : "")
    + (params.brandColors ? `\nBrand colors: ${params.brandColors.join(", ")}` : "")
  );
}
