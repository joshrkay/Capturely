import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { canManageCampaigns, canView } from "@/lib/rbac";

const formOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

const formFieldSchema = z.object({
  fieldId: z.string().min(1),
  type: z.string().min(1),
  label: z.string().min(1),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  options: z.array(formOptionSchema).optional(),
}).passthrough();

const formStyleSchema = z.object({
  backgroundColor: z.string().min(1),
  textColor: z.string().min(1),
  buttonColor: z.string().min(1),
  buttonTextColor: z.string().min(1),
  borderRadius: z.string().min(1),
  fontFamily: z.string().min(1),
}).passthrough();

const campaignSchemaPayloadSchema = z.object({
  fields: z.array(formFieldSchema),
  style: formStyleSchema,
  submitLabel: z.string().min(1),
}).passthrough();

const createCampaignSchema = z.object({
  siteId: z.string().min(1),
  name: z.string().min(1).max(200),
  type: z.enum(["popup", "inline"]).default("popup"),
  templateId: z.string().optional(),
  schema: campaignSchemaPayloadSchema.optional(),
  optimizationGoalText: z.string().max(2000).optional().nullable(),
  optimizationGoalKind: z
    .enum(["maximize_submissions", "maximize_qualified_leads", "maximize_field_completion"])
    .optional(),
  optimizationGoalFieldKey: z.string().max(200).optional().nullable(),
});

const globalForCampaignIdempotency = globalThis as typeof globalThis & {
  campaignCreateIdempotencyCache?: Map<string, string>;
};

const campaignCreateIdempotencyCache =
  globalForCampaignIdempotency.campaignCreateIdempotencyCache ??
  (globalForCampaignIdempotency.campaignCreateIdempotencyCache = new Map<string, string>());

/** POST /api/campaigns — Create a new campaign with a default Control variant */
export async function POST(req: NextRequest) {
  try {
    const ctx = await withAccountContext();
    if (!canManageCampaigns(ctx.role)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const idempotencyKeyHeader = req.headers.get("idempotency-key")?.trim();
    const idempotencyCacheKey = idempotencyKeyHeader ? `${ctx.accountId}:${idempotencyKeyHeader}` : null;
    if (idempotencyCacheKey) {
      const existingCampaignId = campaignCreateIdempotencyCache.get(idempotencyCacheKey);
      if (existingCampaignId) {
        const existingCampaign = await prisma.campaign.findUnique({
          where: { id: existingCampaignId },
          include: { variants: true },
        });
        if (existingCampaign) {
          return NextResponse.json(existingCampaign, { status: 200 });
        }
        campaignCreateIdempotencyCache.delete(idempotencyCacheKey);
      }
    }

    const body = await req.json();
    const parsed = createCampaignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify site belongs to account
    const site = await prisma.site.findFirst({
      where: { id: parsed.data.siteId, accountId: ctx.accountId },
    });
    if (!site) {
      return NextResponse.json({ error: "Site not found", code: "NOT_FOUND" }, { status: 404 });
    }

    // Resolve initial schema for control variant
    let schemaJson = JSON.stringify({
      fields: [
        { fieldId: "field_email_default", type: "email", label: "Email", placeholder: "you@example.com", required: true },
        { fieldId: "field_submit_default", type: "submit", label: "Submit" },
      ],
      style: {
        backgroundColor: "#ffffff",
        textColor: "#1a1a2e",
        buttonColor: "#6366f1",
        buttonTextColor: "#ffffff",
        borderRadius: "8px",
        fontFamily: "Inter, sans-serif",
      },
      submitLabel: "Submit",
    });

    if (parsed.data.schema) {
      schemaJson = JSON.stringify(parsed.data.schema);
    } else if (parsed.data.templateId) {
      const { getTemplate } = await import("@/lib/templates");
      const template = getTemplate(parsed.data.templateId);
      if (template) {
        schemaJson = JSON.stringify(template.schema);
      }
    }

    // Create campaign + control variant in transaction
    const campaign = await prisma.$transaction(async (tx) => {
      const c = await tx.campaign.create({
        data: {
          accountId: ctx.accountId,
          siteId: parsed.data.siteId,
          name: parsed.data.name,
          type: parsed.data.type as "popup" | "inline",
          ...(parsed.data.optimizationGoalText !== undefined
            ? { optimizationGoalText: parsed.data.optimizationGoalText }
            : {}),
          ...(parsed.data.optimizationGoalKind !== undefined
            ? { optimizationGoalKind: parsed.data.optimizationGoalKind }
            : {}),
          ...(parsed.data.optimizationGoalFieldKey !== undefined
            ? { optimizationGoalFieldKey: parsed.data.optimizationGoalFieldKey }
            : {}),
        },
      });

      await tx.variant.create({
        data: {
          campaignId: c.id,
          name: "Control",
          isControl: true,
          trafficPercentage: 100,
          schemaJson,
        },
      });

      return c;
    });

    const result = await prisma.campaign.findUnique({
      where: { id: campaign.id },
      include: { variants: true },
    });

    if (idempotencyCacheKey && result) {
      campaignCreateIdempotencyCache.set(idempotencyCacheKey, result.id);
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof AccountContextError) {
      return NextResponse.json({ error: err.message, code: "AUTH_ERROR" }, { status: err.statusCode });
    }
    throw err;
  }
}

/** GET /api/campaigns — List campaigns for account */
export async function GET(req: NextRequest) {
  try {
    const ctx = await withAccountContext();
    if (!canView(ctx.role)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { accountId: ctx.accountId };
    if (siteId) where.siteId = siteId;
    if (status) where.status = status;

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        variants: { select: { id: true, name: true, isControl: true, trafficPercentage: true } },
        site: { select: { id: true, name: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(campaigns);
  } catch (err) {
    if (err instanceof AccountContextError) {
      return NextResponse.json({ error: err.message, code: "AUTH_ERROR" }, { status: err.statusCode });
    }
    throw err;
  }
}
