import { NextResponse } from "next/server";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { prisma } from "@/lib/db";
import { canManageTeam } from "@/lib/rbac";

export async function GET() {
  try {
    const ctx = await withAccountContext();

    if (!canManageTeam(ctx.role)) {
      return NextResponse.json(
        { error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const sites = await prisma.site.findMany({
      where: { accountId: ctx.accountId },
      select: {
        id: true,
        name: true,
        publicKey: true,
        secretKey: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ sites });
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
