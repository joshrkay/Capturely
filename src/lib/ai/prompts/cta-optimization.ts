export const CTA_OPTIMIZATION_PROMPT_VERSION = "v1";

export const CTA_OPTIMIZATION_SYSTEM_PROMPT = `Generate 5 CTA button text options ranked by conversion likelihood. Output JSON array: [{ "text": "...", "rationale": "..." }]`;

export function buildCtaOptimizationUserPrompt(params: {
  formContext: string;
  campaignType: string;
}): string {
  return `Campaign type: ${params.campaignType}\nForm context: ${params.formContext}`;
}
