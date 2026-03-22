/**
 * Plan definitions and resolver — server-side only.
 * Defines plan tiers, limits, and feature flags.
 */

export enum PlanKey {
  FREE = "free",
  STARTER = "starter",
  GROWTH = "growth",
  ENTERPRISE = "enterprise",
}

export interface PlanConfig {
  key: PlanKey;
  name: string;
  price: number; // monthly price in cents
  limits: {
    sites: number;
    submissionsPerMonth: number;
    maxVariants: number;
    aiGenerationsPerMonth: number;
  };
  graceMultiplier: number; // 1.2 = 20% grace window
  features: {
    abTesting: boolean;
    aiCopilot: boolean;
    autoOptimization: boolean;
    webhooks: boolean;
    prioritySupport: boolean;
  };
}

const PLANS: Record<PlanKey, PlanConfig> = {
  [PlanKey.FREE]: {
    key: PlanKey.FREE,
    name: "Free",
    price: 0,
    limits: {
      sites: 1,
      submissionsPerMonth: 100,
      maxVariants: 1,
      aiGenerationsPerMonth: 0,
    },
    graceMultiplier: 1.2,
    features: {
      abTesting: false,
      aiCopilot: false,
      autoOptimization: false,
      webhooks: false,
      prioritySupport: false,
    },
  },
  [PlanKey.STARTER]: {
    key: PlanKey.STARTER,
    name: "Starter",
    price: 1900, // $19/mo
    limits: {
      sites: 3,
      submissionsPerMonth: 1000,
      maxVariants: 2,
      aiGenerationsPerMonth: 0,
    },
    graceMultiplier: 1.2,
    features: {
      abTesting: true,
      aiCopilot: false,
      autoOptimization: false,
      webhooks: true,
      prioritySupport: false,
    },
  },
  [PlanKey.GROWTH]: {
    key: PlanKey.GROWTH,
    name: "Growth",
    price: 4900, // $49/mo
    limits: {
      sites: 10,
      submissionsPerMonth: 10000,
      maxVariants: 5,
      aiGenerationsPerMonth: 500,
    },
    graceMultiplier: 1.2,
    features: {
      abTesting: true,
      aiCopilot: true,
      autoOptimization: true,
      webhooks: true,
      prioritySupport: true,
    },
  },
  [PlanKey.ENTERPRISE]: {
    key: PlanKey.ENTERPRISE,
    name: "Enterprise",
    price: 0, // custom
    limits: {
      sites: Infinity,
      submissionsPerMonth: Infinity,
      maxVariants: Infinity,
      aiGenerationsPerMonth: Infinity,
    },
    graceMultiplier: 1.2,
    features: {
      abTesting: true,
      aiCopilot: true,
      autoOptimization: true,
      webhooks: true,
      prioritySupport: true,
    },
  },
};

export function resolvePlan(planKey: string): PlanConfig {
  const plan = PLANS[planKey as PlanKey];
  if (!plan) {
    return PLANS[PlanKey.FREE];
  }
  return plan;
}

export function getPlanLimit(planKey: string): number {
  return resolvePlan(planKey).limits.submissionsPerMonth;
}

export function getGraceLimit(planKey: string): number {
  const plan = resolvePlan(planKey);
  return Math.floor(plan.limits.submissionsPerMonth * plan.graceMultiplier);
}

export function getAllPlans(): PlanConfig[] {
  return [PLANS[PlanKey.FREE], PLANS[PlanKey.STARTER], PLANS[PlanKey.GROWTH], PLANS[PlanKey.ENTERPRISE]];
}
