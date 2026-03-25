import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { canManageCampaigns } from "@/lib/rbac";
import { resolvePlan } from "@/lib/plans";
import { validateFormSchemaJson } from "@capturely/shared-forms";

const createVariantSchema = z.object({
  name: z.string().min(1).max(100),
  schemaJson: z.string().min(2),
});

const updateVariantSchema = z.object({
  variantId: z.string().cuid(),
  name: z.string().min(1).max(100).optional(),
  schemaJson: z.string().min(2).optional(),
  trafficPercentage: z.number().int().min(0).max(100).optional(),
  isControl: z.boolean().optional(),
});

const deleteVariantSchema = z.object({
  variantId: z.string().cuid(),
});


function schemaValidationErrorResponse(issues: Array<{ path: string; message: string }>, variant?: { id?: string; name?: string }) {
  return NextResponse.json(
    {
      error: "Invalid variant schema",
      code: "SCHEMA_VALIDATION_ERROR",
      details: {
        variantId: variant?.id,
        variantName: variant?.name,
        issues,
      },
    },
    { status: 400 }
  );
}

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

    const schemaValidation = validateFormSchemaJson(parsed.data.schemaJson);
    if (!schemaValidation.valid) {
      return schemaValidationErrorResponse(schemaValidation.errors);
    }

    // Auto-balance traffic
    const variantCount = campaign.variants.length + 1;
    const newPercentage = Math.floor(100 / variantCount);

    const { variant, allVariants } = await prisma.$transaction(async (tx) => {
      // Rebalance existing variants
      for (const v of campaign.variants) {
        await tx.variant.update({
          where: { id: v.id },
          data: { trafficPercentage: newPercentage },
        });
      }

      // Create new variant with remaining traffic
      const remaining = 100 - newPercentage * campaign.variants.length;
      const created = await tx.variant.create({
        data: {
          campaignId: id,
          name: parsed.data.name,
          isControl: false,
          trafficPercentage: remaining,
          schemaJson: parsed.data.schemaJson,
        },
      });

      const all = await tx.variant.findMany({
        where: { campaignId: id },
        select: { id: true, name: true, trafficPercentage: true, isControl: true },
      });

      return { variant: created, allVariants: all };
    });

    await prisma.campaign.update({
      where: { id },
      data: { hasUnpublishedChanges: true },
    });

    return NextResponse.json({ variant, allVariants }, { status: 201 });
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
    const parsed = updateVariantSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { variantId, ...rest } = parsed.data;

    if (rest.schemaJson !== undefined) {
      const schemaValidation = validateFormSchemaJson(rest.schemaJson);
      if (!schemaValidation.valid) {
        return schemaValidationErrorResponse(schemaValidation.errors, { id: variantId });
      }
    }

    const variant = await prisma.variant.update({
      where: { id: variantId },
      data: {
        ...(rest.name !== undefined && { name: rest.name }),
        ...(rest.schemaJson !== undefined && { schemaJson: rest.schemaJson }),
        ...(rest.trafficPercentage !== undefined && { trafficPercentage: rest.trafficPercentage }),
        ...(rest.isControl !== undefined && { isControl: rest.isControl }),
        schemaVersion: { increment: 1 },
      },
    });

    await prisma.campaign.update({
      where: { id },
      data: { hasUnpublishedChanges: true },
    });

    return NextResponse.json({ variant });
  } catch (err) {
    if (err instanceof AccountContextError) {
      return NextResponse.json({ error: err.message, code: "AUTH_ERROR" }, { status: err.statusCode });
    }
    throw err;
  }
}

/** DELETE /api/campaigns/:id/variants — Delete a non-control variant */
export async function DELETE(
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
      include: { variants: true },
    });
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = deleteVariantSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { variantId } = parsed.data;

    const variantToDelete = campaign.variants.find((v) => v.id === variantId);
    if (!variantToDelete) {
      return NextResponse.json({ error: "Variant not found", code: "NOT_FOUND" }, { status: 404 });
    }
    if (variantToDelete.isControl) {
      return NextResponse.json(
        { error: "Cannot delete control variant", code: "CONTROL_DELETE_FORBIDDEN" },
        { status: 400 }
      );
    }

    const remainingVariants = campaign.variants.filter((v) => v.id !== variantId);
    const n = remainingVariants.length;
    const base = Math.floor(100 / n);
    const control = remainingVariants.find((v) => v.isControl) ?? remainingVariants[0];

    const allVariants = await prisma.$transaction(async (tx) => {
      await tx.variant.delete({ where: { id: variantId } });

      for (const v of remainingVariants) {
        const traffic = v.id === control.id ? base + (100 - base * n) : base;
        await tx.variant.update({
          where: { id: v.id },
          data: { trafficPercentage: traffic },
        });
      }

      return tx.variant.findMany({
        where: { campaignId: id },
        select: { id: true, name: true, trafficPercentage: true, isControl: true },
      });
    });

    await prisma.campaign.update({
      where: { id },
      data: { hasUnpublishedChanges: true },
    });

    return NextResponse.json({ deleted: true, allVariants });
  } catch (err) {
    if (err instanceof AccountContextError) {
      return NextResponse.json({ error: err.message, code: "AUTH_ERROR" }, { status: err.statusCode });
    }
    throw err;
  }
}
