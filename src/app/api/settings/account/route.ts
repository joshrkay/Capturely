import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AccountContextError, withAccountContext } from "@/lib/account";
import { MemberRole } from "@/generated/prisma/client";
import { deleteAccountSchema } from "@/lib/settings";

/** DELETE /api/settings/account */
export async function DELETE(req: NextRequest) {
  try {
    const ctx = await withAccountContext();

    if (ctx.role !== MemberRole.owner) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = deleteAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await prisma.account.delete({ where: { id: ctx.accountId } });

    return NextResponse.json({ success: true });
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
