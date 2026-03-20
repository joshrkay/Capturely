import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { canManageSites } from "@/lib/rbac";
import { generatePublicKey, generateSecretKey } from "@/lib/keys";

/** POST /api/sites/:id/rotate-keys — Rotate public and secret keys */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await withAccountContext();
    const { id } = await params;

    if (!canManageSites(ctx.role)) {
      return NextResponse.json(
        { error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const existing = await prisma.site.findFirst({
      where: { id, accountId: ctx.accountId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Site not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const site = await prisma.site.update({
      where: { id },
      data: {
        publicKey: generatePublicKey(),
        secretKey: generateSecretKey(),
      },
      select: {
        id: true,
        name: true,
        publicKey: true,
        secretKey: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ site });
  } catch (error) {
    if (error instanceof AccountContextError) {
      return NextResponse.json(
        { error: error.message, code: "AUTH_ERROR" },
        { status: error.statusCode }
      );
    }
    throw error;
  }
}
