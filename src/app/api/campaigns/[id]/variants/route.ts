import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { canManageCampaigns } from "@/lib/rbac";
import { resolvePlan } from "@/lib/plans";

const createVariantSchema = z.object({
  name: z.string().min(1).max(100),
  schemaJson: z.string().min(2),
});

const updateVariantSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  schemaJson: z.string().min(2).optional(),
  trafficPercentage: z.number().min(0).max(100).optional(),
  isControl: z.boolean().optional(),
});

/** POST /api/campaigns/:id/variants — Add a variant (A/B testing) */
export async function POST(
  req: NextRequest,
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
      include: { variants: true, account: { select: { planKey: true } } },
    });
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found", code: "NOT_FOUND" }, { status: 404 });
    }

    // Check variant limit
    const plan = resolvePlan(campaign.account.planKey);
    if (campaign.variants.length >= plan.limits.maxVariants) {
      return NextResponse.json(
        { error: "Variant limit reached for your plan", code: "PLAN_LIMIT" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createVariantSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Auto-balance traffic
    const variantCount = campaign.variants.length + 1;
    const newPercentage = Math.floor(100 / variantCount);

    const variant = await prisma.$transaction(async (tx) => {
      // Rebalance existing variants
      for (const v of campaign.variants) {
        await tx.variant.update({
          where: { id: v.id },
          data: { trafficPercentage: newPercentage },
        });
      }

      // Create new variant with remaining traffic
      const remaining = 100 - newPercentage * campaign.variants.length;
      return tx.variant.create({
        data: {
          campaignId: id,
          name: parsed.data.name,
          isControl: false,
          trafficPercentage: remaining,
          schemaJson: parsed.data.schemaJson,
        },
      });
    });

    await prisma.campaign.update({
      where: { id },
      data: { hasUnpublishedChanges: true },
    });

    return NextResponse.json(variant, { status: 201 });
  } catch (err) {
    if (err instanceof AccountContextError) {
      return NextResponse.json({ error: err.message, code: "AUTH_ERROR" }, { status: err.statusCode });
    }
    throw err;
  }
}

/** PATCH /api/campaigns/:id/variants — Update a variant (pass variantId in body) */
export async function PATCH(
  req: NextRequest,
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
    });
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const body = await req.json();
    const { variantId, ...rest } = body;
    if (!variantId) {
      return NextResponse.json({ error: "variantId required", code: "VALIDATION_ERROR" }, { status: 400 });
    }

    const parsed = updateVariantSchema.safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const variant = await prisma.variant.update({
      where: { id: variantId },
      data: {
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.schemaJson !== undefined && { schemaJson: parsed.data.schemaJson }),
        ...(parsed.data.trafficPercentage !== undefined && { trafficPercentage: parsed.data.trafficPercentage }),
        ...(parsed.data.isControl !== undefined && { isControl: parsed.data.isControl }),
        schemaVersion: { increment: 1 },
      },
    });

    await prisma.campaign.update({
      where: { id },
      data: { hasUnpublishedChanges: true },
    });

    return NextResponse.json(variant);
  } catch (err) {
    if (err instanceof AccountContextError) {
      return NextResponse.json({ error: err.message, code: "AUTH_ERROR" }, { status: err.statusCode });
    }
    throw err;
  }
}
