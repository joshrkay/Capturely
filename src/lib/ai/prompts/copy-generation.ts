export const COPY_GENERATION_PROMPT_VERSION = "v1";

export const COPY_GENERATION_SYSTEM_PROMPT = `Generate form field copy optimized for conversion. Output JSON: { "label": "...", "placeholder": "...", "helperText": "..." , "alternatives": [{ "label": "...", "placeholder": "..." }] }`;

export function buildCopyGenerationUserPrompt(params: {
  fieldType: string;
  fieldContext: string;
  campaignType: string;
}): string {
  return `Field type: ${params.fieldType}\nContext: ${params.fieldContext}\nCampaign: ${params.campaignType}`;
}
