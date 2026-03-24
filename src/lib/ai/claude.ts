/**
 * Claude API client — server-side only.
 * All AI calls go through the server to protect the API key and enable metering.
 */
import Anthropic from "@anthropic-ai/sdk";
import {
  buildFormGenerationPrompt,
  buildFieldSuggestionPrompt,
  buildCopyGenerationPrompt,
  buildStyleSuggestionPrompt,
  buildVariantGenerationPrompt,
  buildCtaOptimizationPrompt,
} from "./prompts";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
});

export interface AiGenerationResult {
  content: string;
  tokensUsed: number;
}

function extractText(response: Anthropic.Message): string {
  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

function countTokens(response: Anthropic.Message): number {
  return (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0);
}

export async function generateFormSchema(params: {
  prompt: string;
  campaignType: string;
  industry?: string;
  siteUrl?: string;
  existingFields?: string;
}): Promise<AiGenerationResult> {
  const systemPrompt = buildFormGenerationPrompt(params.campaignType);

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

  return { content: extractText(response), tokensUsed: countTokens(response) };
}

export async function suggestFields(params: {
  currentFields: string;
  campaignType: string;
  industry?: string;
}): Promise<AiGenerationResult> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: buildFieldSuggestionPrompt(),
    messages: [{
      role: "user",
      content: `Campaign type: ${params.campaignType}\nCurrent fields:\n${params.currentFields}${params.industry ? `\nIndustry: ${params.industry}` : ""}`,
    }],
  });

  return { content: extractText(response), tokensUsed: countTokens(response) };
}

export async function generateCopy(params: {
  fieldType: string;
  fieldContext: string;
  campaignType: string;
}): Promise<AiGenerationResult> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: buildCopyGenerationPrompt(),
    messages: [{
      role: "user",
      content: `Field type: ${params.fieldType}\nContext: ${params.fieldContext}\nCampaign: ${params.campaignType}`,
    }],
  });

  return { content: extractText(response), tokensUsed: countTokens(response) };
}

export async function suggestStyle(params: {
  siteUrl?: string;
  brandColors?: string[];
  campaignType: string;
}): Promise<AiGenerationResult> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: buildStyleSuggestionPrompt(),
    messages: [{
      role: "user",
      content: `Campaign: ${params.campaignType}${params.siteUrl ? `\nSite: ${params.siteUrl}` : ""}${params.brandColors ? `\nBrand colors: ${params.brandColors.join(", ")}` : ""}`,
    }],
  });

  return { content: extractText(response), tokensUsed: countTokens(response) };
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
    system: buildVariantGenerationPrompt({
      count,
      pastWinners: params.pastWinners,
      pastLosers: params.pastLosers,
    }),
    messages: [{
      role: "user",
      content: `Control schema (conversion rate: ${params.conversionRate}%):\n${params.controlSchema}`,
    }],
  });

  return { content: extractText(response), tokensUsed: countTokens(response) };
}

export async function generateCtaOptions(params: {
  formContext: string;
  campaignType: string;
}): Promise<AiGenerationResult> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    system: buildCtaOptimizationPrompt(),
    messages: [{
      role: "user",
      content: `Campaign type: ${params.campaignType}\nForm context: ${params.formContext}`,
    }],
  });

  return { content: extractText(response), tokensUsed: countTokens(response) };
}
