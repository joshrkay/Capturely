import { NextRequest, NextResponse } from "next/server";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { prisma } from "@/lib/db";
import { canManageTeam, canView } from "@/lib/rbac";
import { updateSettingsSchema } from "./schemas";

function validationError(details: unknown) {
  return NextResponse.json(
    {
      error: "Invalid input",
      code: "VALIDATION_ERROR",
      details,
    },
    { status: 400 }
  );
}

function forbiddenError(reason: string) {
  return NextResponse.json(
    {
      error: "Forbidden",
      code: "FORBIDDEN",
      details: { reason },
    },
    { status: 403 }
  );
}

/** PATCH /api/settings — Update account settings */
export async function PATCH(req: NextRequest) {
  try {
    const { accountId, role } = await withAccountContext();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return validationError({
        formErrors: ["Request body must be valid JSON."],
        fieldErrors: {},
      });
    }

    const parsed = updateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error.flatten());
    }

    const { name, timezone, language, notifications } = parsed.data;

    const hasProfileUpdates =
      name !== undefined || timezone !== undefined || language !== undefined;
    if (hasProfileUpdates && !canManageTeam(role)) {
      return forbiddenError(
        "Updating name, timezone, or language requires team management permissions."
      );
    }

    if (notifications !== undefined && !canView(role)) {
      return forbiddenError(
        "Updating notification preferences requires account member access."
      );
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (timezone !== undefined) data.timezone = timezone;
    if (language !== undefined) data.language = language;
    if (notifications !== undefined) data.notificationPreferences = notifications;

    await prisma.account.update({
      where: { id: accountId },
      data: data as never,
    });

    return NextResponse.json({ updated: true });
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
