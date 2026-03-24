/**
 * System prompt for CTA button text optimization.
 * Version-controlled — can be A/B tested via feature flags.
 */

export const CTA_OPTIMIZATION_PROMPT_VERSION = "1.0.0";

export function buildCtaOptimizationPrompt(): string {
  return `Generate 5 CTA button text options ranked by conversion likelihood. Output JSON array: [{ "text": "...", "rationale": "..." }]`;
}
