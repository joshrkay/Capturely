import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { canManageSites } from "@/lib/rbac";

const updateIntegrationSchema = z.object({
  status: z.enum(["connected", "disconnected", "error"]).optional(),
  metadata: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAccountContext();
    const { id } = await params;

    if (!canManageSites(ctx.role)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const existing = await prisma.integration.findFirst({
      where: { id, accountId: ctx.accountId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Integration not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateIntegrationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const integration = await prisma.integration.update({
      where: { id },
      data: {
        ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
        ...(parsed.data.metadata !== undefined ? { metadata: parsed.data.metadata } : {}),
      },
    });

    return NextResponse.json({ integration });
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

    const existing = await prisma.integration.findFirst({
      where: { id, accountId: ctx.accountId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Integration not found", code: "NOT_FOUND" }, { status: 404 });
    }

    await prisma.integration.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AccountContextError) {
      return NextResponse.json({ error: error.message, code: "AUTH_ERROR" }, { status: error.statusCode });
    }
    throw error;
  }
}
