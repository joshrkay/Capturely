import { NextRequest, NextResponse } from "next/server";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { prisma } from "@/lib/db";
import { canManageBilling } from "@/lib/rbac";
import { deleteAccountSchema } from "../schemas";

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await withAccountContext();

    if (!canManageBilling(ctx.role)) {
      return NextResponse.json(
        { error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = deleteAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid confirmation", code: "INVALID_CONFIRMATION" },
        { status: 400 }
      );
    }

    await prisma.account.delete({
      where: { id: ctx.accountId },
    });

    return NextResponse.json({ deleted: true });
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
