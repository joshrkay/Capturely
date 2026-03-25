import type { OptimizationGoalKind } from "@/generated/prisma/enums";

export type { OptimizationGoalKind };

export interface OptimizationGoalInput {
  kind: OptimizationGoalKind;
  text: string | null;
  fieldKey: string | null;
}

/**
 * Human-readable metric for dashboards and GrowthBook experiment naming.
 */
export function goalMetricLabel(goal: OptimizationGoalInput): string {
  switch (goal.kind) {
    case "maximize_submissions":
      return "Form submissions";
    case "maximize_qualified_leads":
      return "Qualified leads (rich contact info)";
    case "maximize_field_completion":
      return goal.fieldKey
        ? `Submissions with “${goal.fieldKey}” completed`
        : "Field completion (set field in campaign settings)";
  }
}

export function goalMetricDescription(goal: OptimizationGoalInput): string {
  const base = goal.text?.trim()
    ? `Stated goal: ${goal.text.trim()}`
    : "Default: maximize successful form submissions.";
  switch (goal.kind) {
    case "maximize_submissions":
      return `${base} Success = at least one valid submission.`;
    case "maximize_qualified_leads":
      return `${base} Success = submission with email plus additional signals (phone, company, etc.) where present.`;
    case "maximize_field_completion":
      return `${base} Success = submission where the target field is non-empty.`;
  }
}

/**
 * Text block for AI control generation (form schema aligned to intent).
 */
export function goalPromptBlock(goal: OptimizationGoalInput): string {
  const lines = [
    `Optimization goal type: ${goal.kind.replace(/_/g, " ")}`,
    goalMetricDescription(goal),
  ];
  if (goal.fieldKey) {
    lines.push(`Target fieldId for completion goal: ${goal.fieldKey}`);
  }
  return lines.join("\n");
}

/**
 * Text block for challenger / variant generation.
 */
export function goalChallengerPromptBlock(goal: OptimizationGoalInput, conversionRatePercent: number): string {
  return (
    `${goalPromptBlock(goal)}\n`
    + `Current control estimated conversion rate: ${conversionRatePercent.toFixed(2)}% (submission / impression where applicable).\n`
    + "Propose variants that plausibly improve **this** goal — not generic conversion unless it matches the goal above."
  );
}

/**
 * Whether a submission payload satisfies the campaign goal (for analytics / future automation).
 */
export function submissionMatchesGoal(
  goal: OptimizationGoalInput,
  fields: Record<string, string>
): boolean {
  const lower = (k: string) => fields[k] ?? fields[k.charAt(0).toUpperCase() + k.slice(1)] ?? "";

  switch (goal.kind) {
    case "maximize_submissions":
      return Object.keys(fields).some((k) => !k.startsWith("_") && String(fields[k] ?? "").trim().length > 0);
    case "maximize_qualified_leads": {
      const email = lower("email");
      if (!email.trim()) return false;
      const phone = lower("phone");
      const company = lower("company");
      return phone.trim().length > 0 || company.trim().length > 0;
    }
    case "maximize_field_completion": {
      if (!goal.fieldKey) return false;
      return String(lower(goal.fieldKey)).trim().length > 0;
    }
  }
}
