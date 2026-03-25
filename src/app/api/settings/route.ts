import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AccountContextError, withAccountContext } from "@/lib/account";
import {
  canUpdateSettings,
  parseNotificationPreferences,
  serializeNotificationPreferences,
  updateSettingsSchema,
} from "@/lib/settings";

/** GET /api/settings */
export async function GET() {
  try {
    const ctx = await withAccountContext();

    const account = await prisma.account.findUniqueOrThrow({
      where: { id: ctx.accountId },
      select: {
        id: true,
        name: true,
        notificationPreferencesJson: true,
      },
    });

    return NextResponse.json({
      settings: {
        accountId: account.id,
        displayName: account.name,
        notificationPreferences: parseNotificationPreferences(account.notificationPreferencesJson),
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

/** PATCH /api/settings */
export async function PATCH(req: NextRequest) {
  try {
    const ctx = await withAccountContext();

    if (!canUpdateSettings(ctx.role)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.account.update({
      where: { id: ctx.accountId },
      data: {
        ...(parsed.data.displayName !== undefined ? { name: parsed.data.displayName } : {}),
        ...(parsed.data.notificationPreferences !== undefined
          ? {
              notificationPreferencesJson: serializeNotificationPreferences(
                parsed.data.notificationPreferences
              ),
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        notificationPreferencesJson: true,
      },
    });

    return NextResponse.json({
      settings: {
        accountId: updated.id,
        displayName: updated.name,
        notificationPreferences: parseNotificationPreferences(updated.notificationPreferencesJson),
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
