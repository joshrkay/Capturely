import { describe, it, expect } from "vitest";
import {
  FORM_GENERATION_SYSTEM_PROMPT,
  buildFormGenerationUserPrompt,
  FORM_GENERATION_PROMPT_VERSION,
} from "../form-generation";
import {
  FIELD_SUGGESTION_SYSTEM_PROMPT,
  buildFieldSuggestionUserPrompt,
  FIELD_SUGGESTION_PROMPT_VERSION,
} from "../field-suggestion";
import {
  COPY_GENERATION_SYSTEM_PROMPT,
  buildCopyGenerationUserPrompt,
  COPY_GENERATION_PROMPT_VERSION,
} from "../copy-generation";
import {
  STYLE_SUGGESTION_SYSTEM_PROMPT,
  buildStyleSuggestionUserPrompt,
  STYLE_SUGGESTION_PROMPT_VERSION,
} from "../style-suggestion";
import {
  CTA_OPTIMIZATION_SYSTEM_PROMPT,
  buildCtaOptimizationUserPrompt,
  CTA_OPTIMIZATION_PROMPT_VERSION,
} from "../cta-optimization";
import {
  buildVariantGenerationSystemPrompt,
  buildVariantGenerationUserPrompt,
  VARIANT_GENERATION_PROMPT_VERSION,
} from "../variant-generation";

// ─── Version constants ────────────────────────────────────────────────────────

describe("prompt version constants", () => {
  it("all prompts have a version string", () => {
    expect(FORM_GENERATION_PROMPT_VERSION).toMatch(/^v\d+$/);
    expect(FIELD_SUGGESTION_PROMPT_VERSION).toMatch(/^v\d+$/);
    expect(COPY_GENERATION_PROMPT_VERSION).toMatch(/^v\d+$/);
    expect(STYLE_SUGGESTION_PROMPT_VERSION).toMatch(/^v\d+$/);
    expect(CTA_OPTIMIZATION_PROMPT_VERSION).toMatch(/^v\d+$/);
    expect(VARIANT_GENERATION_PROMPT_VERSION).toMatch(/^v\d+$/);
  });
});

// ─── Form generation ──────────────────────────────────────────────────────────

describe("form generation prompt", () => {
  it("system prompt mentions JSON output and required rules", () => {
    expect(FORM_GENERATION_SYSTEM_PROMPT).toContain("JSON");
    expect(FORM_GENERATION_SYSTEM_PROMPT).toContain("email");
    expect(FORM_GENERATION_SYSTEM_PROMPT).toContain("submit");
    expect(FORM_GENERATION_SYSTEM_PROMPT).toContain("fieldId");
  });

  it("user prompt includes all params", () => {
    const prompt = buildFormGenerationUserPrompt({
      prompt: "Email capture for a coffee shop",
      campaignType: "popup",
      industry: "food",
      siteUrl: "https://coffee.example.com",
      existingFields: "name, email",
    });
    expect(prompt).toContain("Email capture for a coffee shop");
    expect(prompt).toContain("popup");
    expect(prompt).toContain("food");
    expect(prompt).toContain("https://coffee.example.com");
    expect(prompt).toContain("name, email");
  });

  it("user prompt works with minimal params", () => {
    const prompt = buildFormGenerationUserPrompt({
      prompt: "Simple contact form",
      campaignType: "inline",
    });
    expect(prompt).toContain("Simple contact form");
    expect(prompt).toContain("inline");
    expect(prompt).not.toContain("undefined");
  });
});

// ─── Field suggestion ─────────────────────────────────────────────────────────

describe("field suggestion prompt", () => {
  it("system prompt describes JSON output format", () => {
    expect(FIELD_SUGGESTION_SYSTEM_PROMPT).toContain("JSON array");
    expect(FIELD_SUGGESTION_SYSTEM_PROMPT).toContain("fieldId");
    expect(FIELD_SUGGESTION_SYSTEM_PROMPT).toContain("rationale");
  });

  it("user prompt includes campaign type and current fields", () => {
    const prompt = buildFieldSuggestionUserPrompt({
      campaignType: "popup",
      currentFields: "email, name",
      industry: "ecommerce",
    });
    expect(prompt).toContain("popup");
    expect(prompt).toContain("email, name");
    expect(prompt).toContain("ecommerce");
  });
});

// ─── Copy generation ──────────────────────────────────────────────────────────

describe("copy generation prompt", () => {
  it("system prompt describes JSON output with alternatives", () => {
    expect(COPY_GENERATION_SYSTEM_PROMPT).toContain("label");
    expect(COPY_GENERATION_SYSTEM_PROMPT).toContain("placeholder");
    expect(COPY_GENERATION_SYSTEM_PROMPT).toContain("alternatives");
  });

  it("user prompt includes field type and context", () => {
    const prompt = buildCopyGenerationUserPrompt({
      fieldType: "email",
      fieldContext: "Newsletter signup",
      campaignType: "popup",
    });
    expect(prompt).toContain("email");
    expect(prompt).toContain("Newsletter signup");
    expect(prompt).toContain("popup");
  });
});

// ─── Style suggestion ─────────────────────────────────────────────────────────

describe("style suggestion prompt", () => {
  it("system prompt describes FormStyle JSON shape", () => {
    expect(STYLE_SUGGESTION_SYSTEM_PROMPT).toContain("backgroundColor");
    expect(STYLE_SUGGESTION_SYSTEM_PROMPT).toContain("buttonColor");
    expect(STYLE_SUGGESTION_SYSTEM_PROMPT).toContain("fontFamily");
  });

  it("user prompt includes site URL and brand colors if provided", () => {
    const prompt = buildStyleSuggestionUserPrompt({
      campaignType: "popup",
      siteUrl: "https://brand.example.com",
      brandColors: ["#ff0000", "#00ff00"],
    });
    expect(prompt).toContain("https://brand.example.com");
    expect(prompt).toContain("#ff0000");
    expect(prompt).toContain("#00ff00");
  });

  it("user prompt works without optional params", () => {
    const prompt = buildStyleSuggestionUserPrompt({ campaignType: "inline" });
    expect(prompt).toContain("inline");
    expect(prompt).not.toContain("undefined");
  });
});

// ─── CTA optimization ─────────────────────────────────────────────────────────

describe("CTA optimization prompt", () => {
  it("system prompt asks for 5 ranked options", () => {
    expect(CTA_OPTIMIZATION_SYSTEM_PROMPT).toContain("5");
    expect(CTA_OPTIMIZATION_SYSTEM_PROMPT).toContain("JSON array");
    expect(CTA_OPTIMIZATION_SYSTEM_PROMPT).toContain("rationale");
  });

  it("user prompt includes campaign type and form context", () => {
    const prompt = buildCtaOptimizationUserPrompt({
      campaignType: "popup",
      formContext: "email, first name",
    });
    expect(prompt).toContain("popup");
    expect(prompt).toContain("email, first name");
  });
});

// ─── Variant generation ───────────────────────────────────────────────────────

describe("variant generation prompt", () => {
  it("system prompt includes challenger count and field stability rules", () => {
    const system = buildVariantGenerationSystemPrompt({ count: 3 });
    expect(system).toContain("3");
    expect(system).toContain("fieldId");
    expect(system).toContain("email");
    expect(system).toContain("hypothesis");
  });

  it("system prompt includes past winners/losers when provided", () => {
    const system = buildVariantGenerationSystemPrompt({
      count: 2,
      pastWinners: "shorter copy",
      pastLosers: "red button",
    });
    expect(system).toContain("shorter copy");
    expect(system).toContain("red button");
  });

  it("user prompt includes control schema and conversion rate", () => {
    const prompt = buildVariantGenerationUserPrompt({
      controlSchema: '{"fields":[]}',
      conversionRate: 3.5,
    });
    expect(prompt).toContain('{"fields":[]}');
    expect(prompt).toContain("3.5");
  });
});
