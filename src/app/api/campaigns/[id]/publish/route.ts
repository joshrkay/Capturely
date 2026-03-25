import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { canManageCampaigns } from "@/lib/rbac";
import { buildManifest, writeManifestToDisk } from "@/lib/manifest";
import { validateFormSchemaJson } from "@capturely/shared-forms";

/** POST /api/campaigns/:id/publish — Validate, build manifest, publish */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await withAccountContext();
    if (!canManageCampaigns(ctx.role)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const { id } = await params;
    const campaign = await prisma.campaign.findFirst({
      where: { id, accountId: ctx.accountId },
      include: {
        variants: true,
        site: true,
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found", code: "NOT_FOUND" }, { status: 404 });
    }

    // Validate: must have at least one variant with valid schema
    if (campaign.variants.length === 0) {
      return NextResponse.json({ error: "Campaign has no variants", code: "VALIDATION_ERROR" }, { status: 400 });
    }

    const variantErrors = campaign.variants
      .map((variant) => {
        const result = validateFormSchemaJson(variant.schemaJson);
        if (result.valid) {
          return null;
        }

        return {
          variantId: variant.id,
          variantName: variant.name,
          issues: result.errors,
        };
      })
      .filter((variantError): variantError is { variantId: string; variantName: string; issues: Array<{ path: string; message: string }> } => variantError !== null);

    if (variantErrors.length > 0) {
      return NextResponse.json(
        {
          error: "One or more variants have invalid schema",
          code: "SCHEMA_VALIDATION_ERROR",
          details: {
            variants: variantErrors,
          },
        },
        { status: 400 }
      );
    }

    // Update campaign status
    await prisma.campaign.update({
      where: { id },
      data: {
        status: "published",
        hasUnpublishedChanges: false,
      },
    });

    // Build and write manifest for the entire site
    const site = await prisma.site.findUnique({
      where: { id: campaign.siteId },
      include: {
        campaigns: {
          where: { status: "published" },
          include: { variants: true },
        },
      },
    });

    if (site) {
      const manifest = buildManifest(site);
      await writeManifestToDisk(site.publicKey, manifest);
    }

    return NextResponse.json({
      status: "published",
      campaignId: id,
      variantCount: campaign.variants.length,
    });
  } catch (err) {
    if (err instanceof AccountContextError) {
      return NextResponse.json({ error: err.message, code: "AUTH_ERROR" }, { status: err.statusCode });
    }
    throw err;
  }
}
