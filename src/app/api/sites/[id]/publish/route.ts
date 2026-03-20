import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { canManageSites } from "@/lib/rbac";
import { buildManifest, writeManifestToDisk } from "@/lib/manifest";

/** POST /api/sites/:id/publish — Publish manifest for this site */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await withAccountContext();
    const { id } = await params;

    if (!canManageSites(ctx.role)) {
      return NextResponse.json(
        { error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const site = await prisma.site.findFirst({
      where: { id, accountId: ctx.accountId, status: "active" },
    });

    if (!site) {
      return NextResponse.json(
        { error: "Site not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const manifest = buildManifest(site);
    await writeManifestToDisk(site.publicKey, manifest);

    return NextResponse.json({
      message: "Manifest published",
      publicKey: site.publicKey,
      campaignCount: manifest.campaigns.length,
    });
  } catch (error) {
    if (error instanceof AccountContextError) {
      return NextResponse.json(
        { error: error.message, code: "AUTH_ERROR" },
        { status: error.statusCode }
      );
    }
    throw error;
  }
}
