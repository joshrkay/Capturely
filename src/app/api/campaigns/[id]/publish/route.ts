import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { canManageCampaigns } from "@/lib/rbac";
import { republishSiteManifest } from "@/lib/manifest-publish";

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

    for (const variant of campaign.variants) {
      try {
        const schema = JSON.parse(variant.schemaJson);
        if (!schema.fields || !Array.isArray(schema.fields) || schema.fields.length === 0) {
          return NextResponse.json(
            { error: `Variant "${variant.name}" has no fields`, code: "VALIDATION_ERROR" },
            { status: 400 }
          );
        }
        // Must have an email field
        const hasEmail = schema.fields.some((f: { type: string }) => f.type === "email");
        if (!hasEmail) {
          return NextResponse.json(
            { error: `Variant "${variant.name}" must have an email field`, code: "VALIDATION_ERROR" },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: `Variant "${variant.name}" has invalid schema JSON`, code: "VALIDATION_ERROR" },
          { status: 400 }
        );
      }
    }

    // Update campaign status
    await prisma.campaign.update({
      where: { id },
      data: {
        status: "published",
        hasUnpublishedChanges: false,
      },
    });

    await republishSiteManifest(campaign.siteId);

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
