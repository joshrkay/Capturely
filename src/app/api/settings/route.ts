import { NextRequest, NextResponse } from "next/server";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { prisma } from "@/lib/db";
import { canManageTeam, canView } from "@/lib/rbac";
import { updateSettingsSchema } from "./schemas";
import { parseNotificationPreferences, serializeNotificationPreferences } from "@/lib/settings";

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await withAccountContext();

    if (!canView(ctx.role)) {
      return NextResponse.json(
        { error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = updateSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { notificationPreferences, name, timezone, language } = parsed.data;
    const hasAccountFields =
      name !== undefined || timezone !== undefined || language !== undefined;

    if (hasAccountFields && !canManageTeam(ctx.role)) {
      return NextResponse.json(
        { error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const account = await prisma.account.update({
      where: { id: ctx.accountId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(timezone !== undefined ? { timezone } : {}),
        ...(language !== undefined ? { language } : {}),
        ...(notificationPreferences !== undefined
          ? {
              notificationPreferences: serializeNotificationPreferences(
                notificationPreferences
              ),
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        timezone: true,
        language: true,
        notificationPreferences: true,
      },
    });

    return NextResponse.json({
      account: {
        ...account,
        notificationPreferences: parseNotificationPreferences(
          account.notificationPreferences
        ),
      },
    });
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
