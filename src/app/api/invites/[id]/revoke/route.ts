import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { canManageTeam } from "@/lib/rbac";

/** POST /api/invites/:id/revoke — Revoke a pending invite */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await withAccountContext();
    const { id } = await params;

    if (!canManageTeam(ctx.role)) {
      return NextResponse.json(
        { error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const invite = await prisma.invite.findFirst({
      where: { id, accountId: ctx.accountId },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invite not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (invite.status !== "pending") {
      return NextResponse.json(
        { error: `Cannot revoke invite with status: ${invite.status}`, code: "INVALID_STATUS" },
        { status: 400 }
      );
    }

    const updated = await prisma.invite.update({
      where: { id },
      data: { status: "revoked" },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    });

    return NextResponse.json({ invite: updated });
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
