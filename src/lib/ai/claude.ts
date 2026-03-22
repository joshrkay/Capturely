/**
 * Claude API client — server-side only.
 * All AI calls go through the server to protect the API key and enable metering.
 */
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
});

export interface AiGenerationResult {
  content: string;
  tokensUsed: number;
}

export async function generateFormSchema(params: {
  prompt: string;
  campaignType: string;
  industry?: string;
  siteUrl?: string;
  existingFields?: string;
}): Promise<AiGenerationResult> {
  const systemPrompt = `You are an AI form builder for Capturely, an e-commerce form builder SaaS.
Generate a JSON form schema based on the user's description.

Output ONLY valid JSON matching this TypeScript interface:
{
  "fields": [
    {
      "fieldId": "field_<random_8chars>",
      "type": "text" | "email" | "phone" | "textarea" | "dropdown" | "radio" | "checkbox" | "hidden" | "submit",
      "label": "string",
      "placeholder": "string (optional)",
      "required": boolean,
      "options": [{ "value": "string", "label": "string" }] (for dropdown/radio only),
      "visibilityCondition": { "dependsOn": "fieldId", "operator": "equals|not_equals|contains|not_empty", "value": "string" } (optional)
    }
  ],
  "style": {
    "backgroundColor": "#hex",
    "textColor": "#hex",
    "buttonColor": "#hex",
    "buttonTextColor": "#hex",
    "borderRadius": "8px",
    "fontFamily": "Inter, sans-serif"
  },
  "submitLabel": "string"
}

Rules:
- Always include an email field
- Always include a submit field as the last field
- Use stable, unique fieldId values (field_<random>)
- For e-commerce: prioritize conversion - fewer fields = higher conversion
- Generate appropriate placeholder text
- Choose colors that work well together
- Campaign type: ${params.campaignType}`;

  const userContent = params.prompt
    + (params.industry ? `\nIndustry: ${params.industry}` : "")
    + (params.siteUrl ? `\nSite URL: ${params.siteUrl}` : "")
    + (params.existingFields ? `\nExisting fields to keep: ${params.existingFields}` : "");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: userContent }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  return {
    content: text,
    tokensUsed: (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0),
  };
}

export async function suggestFields(params: {
  currentFields: string;
  campaignType: string;
  industry?: string;
}): Promise<AiGenerationResult> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: `You are a form optimization expert. Given the current form fields, suggest additional fields that would improve data capture without hurting conversion rates.
Output JSON array: [{ "fieldId": "field_<random>", "type": "...", "label": "...", "rationale": "..." }]`,
    messages: [{
      role: "user",
      content: `Campaign type: ${params.campaignType}\nCurrent fields:\n${params.currentFields}${params.industry ? `\nIndustry: ${params.industry}` : ""}`,
    }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  return {
    content: text,
    tokensUsed: (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0),
  };
}

export async function generateCopy(params: {
  fieldType: string;
  fieldContext: string;
  campaignType: string;
}): Promise<AiGenerationResult> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: `Generate form field copy optimized for conversion. Output JSON: { "label": "...", "placeholder": "...", "helperText": "..." , "alternatives": [{ "label": "...", "placeholder": "..." }] }`,
    messages: [{
      role: "user",
      content: `Field type: ${params.fieldType}\nContext: ${params.fieldContext}\nCampaign: ${params.campaignType}`,
    }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  return {
    content: text,
    tokensUsed: (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0),
  };
}

export async function suggestStyle(params: {
  siteUrl?: string;
  brandColors?: string[];
  campaignType: string;
}): Promise<AiGenerationResult> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: `Suggest a form style that matches the brand. Output JSON matching FormStyle: { "backgroundColor": "#hex", "textColor": "#hex", "buttonColor": "#hex", "buttonTextColor": "#hex", "borderRadius": "Npx", "fontFamily": "..." }`,
    messages: [{
      role: "user",
      content: `Campaign: ${params.campaignType}${params.siteUrl ? `\nSite: ${params.siteUrl}` : ""}${params.brandColors ? `\nBrand colors: ${params.brandColors.join(", ")}` : ""}`,
    }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  return {
    content: text,
    tokensUsed: (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0),
  };
}

export async function generateChallengerVariants(params: {
  controlSchema: string;
  conversionRate: number;
  pastWinners?: string;
  pastLosers?: string;
  count?: number;
}): Promise<AiGenerationResult> {
  const count = params.count ?? 3;
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: `You are an A/B testing expert for e-commerce forms. Generate ${count} challenger variants of the control form.

Rules:
- Keep all required fields (especially email) — NEVER remove them
- Keep stable fieldId values — NEVER change them
- You may change: copy (labels, placeholders, CTA), colors, field order, border radius, font
- Each variant should test a different hypothesis
- Output JSON array of ${count} objects, each with: { "name": "Variant Name", "hypothesis": "What this tests", "schema": <FormSchema JSON> }
${params.pastWinners ? `\nPast winners (do more of this): ${params.pastWinners}` : ""}
${params.pastLosers ? `\nPast losers (avoid this): ${params.pastLosers}` : ""}`,
    messages: [{
      role: "user",
      content: `Control schema (conversion rate: ${params.conversionRate}%):\n${params.controlSchema}`,
    }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  return {
    content: text,
    tokensUsed: (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0),
  };
}

export async function generateCtaOptions(params: {
  formContext: string;
  campaignType: string;
}): Promise<AiGenerationResult> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    system: `Generate 5 CTA button text options ranked by conversion likelihood. Output JSON array: [{ "text": "...", "rationale": "..." }]`,
    messages: [{
      role: "user",
      content: `Campaign type: ${params.campaignType}\nForm context: ${params.formContext}`,
    }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  return {
    content: text,
    tokensUsed: (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0),
  };
}
