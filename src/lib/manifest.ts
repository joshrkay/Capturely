import type { SiteManifestV1, ManifestCampaign, FormSchema } from "@capturely/shared-forms";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

interface SiteWithCampaigns {
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
    }>;
  }>;
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

    return {
      campaignId: campaign.id,
      type: campaign.type as "popup" | "inline",
      targeting: campaign.targetingJson ? JSON.parse(campaign.targetingJson) : { type: "all" },
      trigger: campaign.triggerJson ? JSON.parse(campaign.triggerJson) : { type: "immediate" },
      frequency: campaign.frequencyJson ? JSON.parse(campaign.frequencyJson) : undefined,
      variants,
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
 * Write the manifest JSON to the local dev "CDN" directory.
 * In production, this would write to a real CDN/storage.
 */
export async function writeManifestToDisk(
  publicKey: string,
  manifest: SiteManifestV1
): Promise<string> {
  const dir = join(process.cwd(), "public", "manifests");
  await mkdir(dir, { recursive: true });
  const filePath = join(dir, `${publicKey}.json`);
  await writeFile(filePath, JSON.stringify(manifest, null, 2), "utf-8");
  return filePath;
}
