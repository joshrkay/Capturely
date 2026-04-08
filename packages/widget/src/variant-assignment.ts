import type { FormSchema, ManifestCampaign } from "@capturely/shared-forms";

/**
 * Deterministic sticky assignment: same visitor + experiment key → same variant.
 * Weights should match server-side traffic split (and GrowthBook experiment weights when used).
 */
export function pickWeightedVariant(
  experiment: { trackingKey: string; variantWeights: Record<string, number> },
  visitorId: string
): string {
  const entries = Object.entries(experiment.variantWeights).filter(([, w]) => w > 0);
  if (entries.length === 0) {
    throw new Error("No variants with positive traffic");
  }
  if (entries.length === 1) {
    return entries[0][0];
  }

  const total = entries.reduce((s, [, w]) => s + w, 0);
  const h = hashToUnit(`${visitorId}:${experiment.trackingKey}`);
  let cumulative = 0;
  for (const [id, w] of entries) {
    cumulative += w / total;
    if (h < cumulative) return id;
  }
  return entries[entries.length - 1][0];
}

function hashToUnit(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h) / 0x7fffffff;
}

export function selectVariantForCampaign(
  campaign: ManifestCampaign,
  visitorId: string
): { variantId: string; schema: FormSchema; experimentKey?: string } | null {
  const variantIds = Object.keys(campaign.variants);
  if (variantIds.length === 0) return null;

  if (campaign.experiment) {
    const variantId = pickWeightedVariant(campaign.experiment, visitorId);
    const schema = campaign.variants[variantId];
    if (!schema) return null;
    return { variantId, schema, experimentKey: campaign.experiment.trackingKey };
  }

  const variantId = variantIds[0];
  return { variantId, schema: campaign.variants[variantId] };
}
