import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { canManageSites } from "@/lib/rbac";

const updateWebhookSchema = z.object({
  url: z.string().url().optional(),
  secret: z.string().nullable().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAccountContext();
    const { id } = await params;
    if (!canManageSites(ctx.role)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const existing = await prisma.webhook.findFirst({
      where: { id, site: { accountId: ctx.accountId } },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Webhook not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateWebhookSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const webhook = await prisma.webhook.update({
      where: { id },
      data: {
        ...(parsed.data.url !== undefined ? { url: parsed.data.url } : {}),
        ...(parsed.data.secret !== undefined ? { secret: parsed.data.secret } : {}),
        ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
      },
    });

    return NextResponse.json({ webhook });
  } catch (error) {
    if (error instanceof AccountContextError) {
      return NextResponse.json({ error: error.message, code: "AUTH_ERROR" }, { status: error.statusCode });
    }
    throw error;
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAccountContext();
    const { id } = await params;
    if (!canManageSites(ctx.role)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const existing = await prisma.webhook.findFirst({
      where: { id, site: { accountId: ctx.accountId } },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Webhook not found", code: "NOT_FOUND" }, { status: 404 });
    }

    await prisma.webhook.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AccountContextError) {
      return NextResponse.json({ error: error.message, code: "AUTH_ERROR" }, { status: error.statusCode });
    }
    throw error;
  }
}
