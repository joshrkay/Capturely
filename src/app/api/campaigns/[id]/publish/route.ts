import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { canManageCampaigns } from "@/lib/rbac";
import { republishSiteManifest } from "@/lib/manifest-publish";
import { buildManifest, writeManifestToDisk } from "@/lib/manifest";
import { validateFormSchemaJson } from "@capturely/shared-forms";

type PreflightCategory = "schema" | "variants" | "control" | "traffic_sum" | "site" | "public_key";

interface PreflightIssue {
  code: string;
  category: PreflightCategory;
  message: string;
  variantId?: string;
  variantName?: string;
  path?: string;
}

interface PublishPreflight {
  passed: boolean;
  errors: PreflightIssue[];
  warnings?: PreflightIssue[];
}

interface PublishFailure {
  variantId: string | null;
  variantName: string | null;
  rule: string;
  message: string;
}

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

    const preflightErrors: PreflightIssue[] = [];
    const preflightWarnings: PreflightIssue[] = [];

    if (campaign.variants.length === 0) {
      preflightErrors.push({
        code: "PUBLISH_VARIANTS_MISSING",
        category: "variants",
        message: "Campaign must include at least one variant before publishing.",
      });
    }

    const controlVariants = campaign.variants.filter((variant) => variant.isControl);
    if (controlVariants.length === 0) {
      preflightErrors.push({
        code: "PUBLISH_CONTROL_MISSING",
        category: "control",
        message: "Exactly one control variant is required, but none was found.",
      });
    } else if (controlVariants.length > 1) {
      preflightErrors.push({
        code: "PUBLISH_CONTROL_MULTIPLE",
        category: "control",
        message: "Exactly one control variant is required, but multiple were found.",
      });
    }

    const trafficSum = campaign.variants.reduce((sum, variant) => sum + variant.trafficPercentage, 0);
    if (trafficSum !== 100) {
      preflightErrors.push({
        code: "PUBLISH_TRAFFIC_SUM_INVALID",
        category: "traffic_sum",
        message: `Variant traffic allocation must sum to 100; received ${trafficSum}.`,
      });
    }

    for (const variant of campaign.variants) {
      if (variant.trafficPercentage < 0 || variant.trafficPercentage > 100) {
        preflightErrors.push({
          code: "PUBLISH_TRAFFIC_OUT_OF_RANGE",
          category: "traffic_sum",
          message: "Variant traffic percentage must be between 0 and 100.",
          variantId: variant.id,
          variantName: variant.name,
        });
      }

      const schemaResult = validateFormSchemaJson(variant.schemaJson);
      if (!schemaResult.valid) {
        for (const issue of schemaResult.errors) {
          preflightErrors.push({
            code: "PUBLISH_SCHEMA_INVALID",
            category: "schema",
            message: issue.message,
            path: issue.path,
            variantId: variant.id,
            variantName: variant.name,
          });
        }
      }
    }

    if (!campaign.site) {
      preflightErrors.push({
        code: "PUBLISH_SITE_MISSING",
        category: "site",
        message: "Campaign must be associated to a site before publishing.",
      });
    } else if (!campaign.site.publicKey) {
      preflightErrors.push({
        code: "PUBLISH_SITE_PUBLIC_KEY_MISSING",
        category: "public_key",
        message: "Site must have a public key before publishing.",
      });
    }

    const preflight: PublishPreflight = {
      passed: preflightErrors.length === 0,
      errors: preflightErrors,
      ...(preflightWarnings.length > 0 ? { warnings: preflightWarnings } : {}),
    };

    if (!preflight.passed) {
      const failures: PublishFailure[] = preflightErrors.map((issue) => ({
        variantId: issue.variantId ?? null,
        variantName: issue.variantName ?? null,
        rule: issue.code,
        message: issue.path ? `${issue.message} (${issue.path})` : issue.message,
      }));

      return NextResponse.json(
        {
          code: "PUBLISH_PREFLIGHT_FAILED",
          failures,
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

    await republishSiteManifest(campaign.siteId);

    return NextResponse.json({
      status: "published",
      campaignId: id,
      variantCount: campaign.variants.length,
      preflight,
    });
  } catch (err) {
    if (err instanceof AccountContextError) {
      return NextResponse.json({ error: err.message, code: "AUTH_ERROR" }, { status: err.statusCode });
    }
    throw err;
  }
}
