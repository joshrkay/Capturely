import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { canManageSites, canView } from "@/lib/rbac";

const platformEnum = z.enum(["shopify", "wordpress", "zapier", "custom"]);
const statusEnum = z.enum(["connected", "disconnected", "error"]);

const upsertIntegrationSchema = z.object({
  platform: platformEnum,
  status: statusEnum.optional(),
  metadata: z.string().optional(),
});

export async function GET() {
  try {
    const ctx = await withAccountContext();
    if (!canView(ctx.role)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const integrations = await prisma.integration.findMany({
      where: { accountId: ctx.accountId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ integrations });
  } catch (error) {
    if (error instanceof AccountContextError) {
      return NextResponse.json({ error: error.message, code: "AUTH_ERROR" }, { status: error.statusCode });
    }
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await withAccountContext();
    if (!canManageSites(ctx.role)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = upsertIntegrationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const integration = await prisma.integration.upsert({
      where: {
        accountId_platform: {
          accountId: ctx.accountId,
          platform: parsed.data.platform,
        },
      },
      create: {
        accountId: ctx.accountId,
        platform: parsed.data.platform,
        status: parsed.data.status ?? "connected",
        metadata: parsed.data.metadata ?? null,
      },
      update: {
        status: parsed.data.status ?? "connected",
        metadata: parsed.data.metadata ?? null,
      },
    });

    return NextResponse.json({ integration }, { status: 201 });
  } catch (error) {
    if (error instanceof AccountContextError) {
      return NextResponse.json({ error: error.message, code: "AUTH_ERROR" }, { status: error.statusCode });
    }
    throw error;
  }
}
