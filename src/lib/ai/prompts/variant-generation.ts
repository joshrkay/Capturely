export const VARIANT_GENERATION_PROMPT_VERSION = "v1";

export function buildVariantGenerationSystemPrompt(params: {
  count: number;
  pastWinners?: string;
  pastLosers?: string;
}): string {
  return (
    `You are an A/B testing expert for e-commerce forms. Generate ${params.count} challenger variants of the control form.

Rules:
- Keep all required fields (especially email) — NEVER remove them
- Keep stable fieldId values — NEVER change them
- You may change: copy (labels, placeholders, CTA), colors, field order, border radius, font
- Each variant should test a different hypothesis aimed at the stated optimization goal (not generic tweaks unless they serve that goal)
- Output JSON array of ${params.count} objects, each with: { "name": "Variant Name", "hypothesis": "What this tests", "schema": <FormSchema JSON> }`
    + (params.pastWinners ? `\nPast winners (do more of this): ${params.pastWinners}` : "")
    + (params.pastLosers ? `\nPast losers (avoid this): ${params.pastLosers}` : "")
  );
}

export function buildVariantGenerationUserPrompt(params: {
  controlSchema: string;
  conversionRate: number;
  optimizationGoalBlock?: string;
}): string {
  const goal = params.optimizationGoalBlock
    ? `\n\n---\n${params.optimizationGoalBlock}\n`
    : "";
  return `Control schema (baseline submission rate vs impressions: ${params.conversionRate}%):${goal}\n${params.controlSchema}`;
}
