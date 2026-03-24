import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { canManageSites, canView } from "@/lib/rbac";

const createWebhookSchema = z.object({
  siteId: z.string().min(1),
  url: z.string().url(),
  secret: z.string().optional(),
  active: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await withAccountContext();
    if (!canView(ctx.role)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");
    if (!siteId) {
      return NextResponse.json({ error: "siteId is required", code: "VALIDATION_ERROR" }, { status: 400 });
    }

    const site = await prisma.site.findFirst({
      where: { id: siteId, accountId: ctx.accountId },
      select: { id: true },
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const webhooks = await prisma.webhook.findMany({
      where: { siteId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ webhooks });
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
    const parsed = createWebhookSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const site = await prisma.site.findFirst({
      where: { id: parsed.data.siteId, accountId: ctx.accountId },
      select: { id: true },
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const webhook = await prisma.webhook.create({
      data: {
        siteId: parsed.data.siteId,
        url: parsed.data.url,
        secret: parsed.data.secret ?? null,
        active: parsed.data.active ?? true,
      },
    });

    return NextResponse.json({ webhook }, { status: 201 });
  } catch (error) {
    if (error instanceof AccountContextError) {
      return NextResponse.json({ error: error.message, code: "AUTH_ERROR" }, { status: error.statusCode });
    }
    throw error;
  }
}
