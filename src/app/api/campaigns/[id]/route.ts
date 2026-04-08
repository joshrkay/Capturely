import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { canManageCampaigns, canView } from "@/lib/rbac";

const updateCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  status: z.enum(["draft", "published", "paused", "archived"]).optional(),
  targetingJson: z.string().optional(),
  triggerJson: z.string().optional(),
  frequencyJson: z.string().optional(),
  spamConfigJson: z.string().optional().nullable(),
  webhookUrl: z.string().url().optional().nullable(),
  autoOptimize: z.boolean().optional(),
  optimizationGoalText: z.string().max(2000).optional().nullable(),
  optimizationGoalKind: z
    .enum(["maximize_submissions", "maximize_qualified_leads", "maximize_field_completion"])
    .optional(),
  optimizationGoalFieldKey: z.string().max(200).optional().nullable(),
});

/** GET /api/campaigns/:id */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await withAccountContext();
    if (!canView(ctx.role)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const { id } = await params;
    const campaign = await prisma.campaign.findFirst({
      where: { id, accountId: ctx.accountId },
      include: {
        variants: true,
        site: { select: { id: true, name: true, publicKey: true } },
        account: { select: { planKey: true } },
        _count: { select: { submissions: true } },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const { account, ...rest } = campaign;
    return NextResponse.json({ ...rest, accountPlanKey: account.planKey });
  } catch (err) {
    if (err instanceof AccountContextError) {
      return NextResponse.json({ error: err.message, code: "AUTH_ERROR" }, { status: err.statusCode });
    }
    throw err;
  }
}

/** PATCH /api/campaigns/:id */
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
    const existing = await prisma.campaign.findFirst({
      where: { id, accountId: ctx.accountId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Campaign not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateCampaignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.status !== undefined) data.status = parsed.data.status;
    if (parsed.data.targetingJson !== undefined) data.targetingJson = parsed.data.targetingJson;
    if (parsed.data.triggerJson !== undefined) data.triggerJson = parsed.data.triggerJson;
    if (parsed.data.frequencyJson !== undefined) data.frequencyJson = parsed.data.frequencyJson;
    if (parsed.data.spamConfigJson !== undefined) data.spamConfigJson = parsed.data.spamConfigJson;
    if (parsed.data.webhookUrl !== undefined) data.webhookUrl = parsed.data.webhookUrl;
    if (parsed.data.autoOptimize !== undefined) data.autoOptimize = parsed.data.autoOptimize;
    if (parsed.data.optimizationGoalText !== undefined) data.optimizationGoalText = parsed.data.optimizationGoalText;
    if (parsed.data.optimizationGoalKind !== undefined) data.optimizationGoalKind = parsed.data.optimizationGoalKind;
    if (parsed.data.optimizationGoalFieldKey !== undefined) {
      data.optimizationGoalFieldKey = parsed.data.optimizationGoalFieldKey;
    }
    data.hasUnpublishedChanges = true;

    const updated = await prisma.campaign.update({
      where: { id },
      data,
      include: { variants: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AccountContextError) {
      return NextResponse.json({ error: err.message, code: "AUTH_ERROR" }, { status: err.statusCode });
    }
    throw err;
  }
}
