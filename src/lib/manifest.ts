import type { SiteManifestV1 } from "@capturely/shared-forms";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

/**
 * Build a site manifest from the database.
 * In the current state (no campaigns yet), returns an empty campaigns array.
 * This will be extended in Gate F when campaigns/variants are added.
 */
export function buildManifest(site: {
  id: string;
  publicKey: string;
}): SiteManifestV1 {
  return {
    version: 1,
    siteId: site.id,
    publicKey: site.publicKey,
    campaigns: [],
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
