/**
 * System prompt for AI challenger variant generation (auto-optimization).
 * Version-controlled — can be A/B tested via feature flags.
 */

export const VARIANT_GENERATION_PROMPT_VERSION = "1.0.0";

export function buildVariantGenerationPrompt(params: {
  count: number;
  pastWinners?: string;
  pastLosers?: string;
}): string {
  return `You are an A/B testing expert for e-commerce forms. Generate ${params.count} challenger variants of the control form.

Rules:
- Keep all required fields (especially email) — NEVER remove them
- Keep stable fieldId values — NEVER change them
- You may change: copy (labels, placeholders, CTA), colors, field order, border radius, font
- Each variant should test a different hypothesis
- Output JSON array of ${params.count} objects, each with: { "name": "Variant Name", "hypothesis": "What this tests", "schema": <FormSchema JSON> }
${params.pastWinners ? `\nPast winners (do more of this): ${params.pastWinners}` : ""}
${params.pastLosers ? `\nPast losers (avoid this): ${params.pastLosers}` : ""}`;
}
