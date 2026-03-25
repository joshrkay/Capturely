import { prisma } from "@/lib/db";
import { buildManifest, writeManifestToDisk } from "@/lib/manifest";

const siteInclude = {
  campaigns: {
    where: { status: "published" as const },
    include: {
      variants: true,
      optimizationRuns: {
        where: { status: "experimenting" as const },
        orderBy: { startedAt: "desc" as const },
        take: 1,
      },
    },
  },
} as const;

/**
 * Rebuild and write the site manifest after campaign or variant changes.
 * Idempotent for a given DB state.
 */
export async function republishSiteManifest(siteId: string): Promise<{ ok: boolean; publicKey?: string }> {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: siteInclude,
  });
  if (!site) {
    return { ok: false };
  }
  const manifest = buildManifest(site);
  await writeManifestToDisk(site.publicKey, manifest);
  return { ok: true, publicKey: site.publicKey };
}
