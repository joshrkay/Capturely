import type { TargetingRule } from "@capturely/shared-forms";

/** Evaluate whether the current URL matches a targeting rule */
export function matchesTargeting(rule: TargetingRule, url: string): boolean {
  switch (rule.type) {
    case "all":
      return true;
    case "equals":
      return url === rule.value;
    case "contains":
      return url.includes(rule.value ?? "");
    case "starts_with":
      return url.startsWith(rule.value ?? "");
    case "does_not_contain":
      return !url.includes(rule.value ?? "");
    default:
      return false;
  }
}
