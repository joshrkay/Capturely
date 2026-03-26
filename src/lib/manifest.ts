import type { SiteManifestV1, ManifestCampaign, FormSchema, ManifestCampaignExperiment } from "@capturely/shared-forms";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export interface SiteWithCampaigns {
  id: string;
  publicKey: string;
  campaigns?: Array<{
    id: string;
    type: string;
    targetingJson: string | null;
    triggerJson: string | null;
    frequencyJson: string | null;
    variants: Array<{
      id: string;
      schemaJson: string;
      trafficPercentage: number;
    }>;
    optimizationRuns?: Array<{ id: string; status: string }>;
  }>;
}

function buildCampaignExperiment(
  campaign: NonNullable<SiteWithCampaigns["campaigns"]>[number]
): ManifestCampaignExperiment | undefined {
  const weights: Record<string, number> = {};
  for (const v of campaign.variants) {
    weights[v.id] = v.trafficPercentage;
  }
  const positive = Object.entries(weights).filter(([, w]) => w > 0);
  if (positive.length <= 1) return undefined;

  const run = campaign.optimizationRuns?.[0];
  const trackingKey = run
    ? `capturely_opt_${campaign.id}_${run.id}`
    : `capturely_campaign_${campaign.id}`;

  return { trackingKey, variantWeights: weights };
}

/**
 * Build a site manifest from the database, including published campaigns.
 */
export function buildManifest(site: SiteWithCampaigns): SiteManifestV1 {
  const campaigns: ManifestCampaign[] = (site.campaigns ?? []).map((campaign) => {
    const variants: Record<string, FormSchema> = {};
    for (const variant of campaign.variants) {
      try {
        variants[variant.id] = JSON.parse(variant.schemaJson) as FormSchema;
      } catch {
        // Skip malformed schemas
      }
    }

    const experiment = buildCampaignExperiment(campaign);

    return {
      campaignId: campaign.id,
      type: campaign.type as "popup" | "inline",
      targeting: campaign.targetingJson ? JSON.parse(campaign.targetingJson) : { type: "all" },
      trigger: campaign.triggerJson ? JSON.parse(campaign.triggerJson) : { type: "immediate" },
      frequency: campaign.frequencyJson ? JSON.parse(campaign.frequencyJson) : undefined,
      variants,
      ...(experiment ? { experiment } : {}),
    };
  });

  return {
    version: 1,
    siteId: site.id,
    publicKey: site.publicKey,
    campaigns,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Write the manifest JSON under `public/manifests` or `CAPTURELY_MANIFEST_DIR` when set (e.g. mounted volume / CI artifact).
 */
export async function writeManifestToDisk(
  publicKey: string,
  manifest: SiteManifestV1
): Promise<string> {
  const base =
    process.env.CAPTURELY_MANIFEST_DIR?.trim() ||
    join(process.cwd(), "public", "manifests");
  await mkdir(base, { recursive: true });
  const filePath = join(base, `${publicKey}.json`);
  await writeFile(filePath, JSON.stringify(manifest, null, 2), "utf-8");
  return filePath;
}
