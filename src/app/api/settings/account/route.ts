import { NextRequest, NextResponse } from "next/server";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { prisma } from "@/lib/db";
import { canManageBilling } from "@/lib/rbac";
import { deleteAccountSchema } from "../schemas";

/** DELETE /api/settings/account — Delete account */
export async function DELETE(req: NextRequest) {
  try {
    const { accountId, role } = await withAccountContext();

    if (!canManageBilling(role)) {
      return NextResponse.json(
        { error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid input",
          code: "VALIDATION_ERROR",
          details: {
            formErrors: ["Request body must be valid JSON."],
            fieldErrors: {},
          },
        },
        { status: 400 }
      );
    }

    const parsed = deleteAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Confirmation text must be DELETE",
          code: "CONFIRMATION_MISMATCH",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    await prisma.account.delete({ where: { id: accountId } });

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
