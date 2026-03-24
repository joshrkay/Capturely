/**
 * Claude API client — server-side only.
 * All AI calls go through the server to protect the API key and enable metering.
 */
import Anthropic from "@anthropic-ai/sdk";
import {
  FORM_GENERATION_SYSTEM_PROMPT,
  buildFormGenerationUserPrompt,
} from "./prompts/form-generation";
import {
  FIELD_SUGGESTION_SYSTEM_PROMPT,
  buildFieldSuggestionUserPrompt,
} from "./prompts/field-suggestion";
import {
  COPY_GENERATION_SYSTEM_PROMPT,
  buildCopyGenerationUserPrompt,
} from "./prompts/copy-generation";
import {
  STYLE_SUGGESTION_SYSTEM_PROMPT,
  buildStyleSuggestionUserPrompt,
} from "./prompts/style-suggestion";
import {
  CTA_OPTIMIZATION_SYSTEM_PROMPT,
  buildCtaOptimizationUserPrompt,
} from "./prompts/cta-optimization";
import {
  buildVariantGenerationSystemPrompt,
  buildVariantGenerationUserPrompt,
} from "./prompts/variant-generation";

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
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: FORM_GENERATION_SYSTEM_PROMPT + `\n- Campaign type: ${params.campaignType}`,
    messages: [{ role: "user", content: buildFormGenerationUserPrompt(params) }],
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
    system: FIELD_SUGGESTION_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildFieldSuggestionUserPrompt(params) }],
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
    system: COPY_GENERATION_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildCopyGenerationUserPrompt(params) }],
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
    system: STYLE_SUGGESTION_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildStyleSuggestionUserPrompt(params) }],
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
    system: buildVariantGenerationSystemPrompt({ count, pastWinners: params.pastWinners, pastLosers: params.pastLosers }),
    messages: [{
      role: "user",
      content: buildVariantGenerationUserPrompt({ controlSchema: params.controlSchema, conversionRate: params.conversionRate }),
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
    system: CTA_OPTIMIZATION_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildCtaOptimizationUserPrompt(params) }],
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
