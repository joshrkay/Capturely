import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { canView } from "@/lib/rbac";

/** GET /api/notifications — List notifications */
export async function GET(req: NextRequest) {
  try {
    const ctx = await withAccountContext();
    if (!canView(ctx.role)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "true";

    const where: Record<string, unknown> = { accountId: ctx.accountId };
    if (unreadOnly) {
      where.readAt = null;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { accountId: ctx.accountId, readAt: null },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    if (err instanceof AccountContextError) {
      return NextResponse.json({ error: err.message, code: "AUTH_ERROR" }, { status: err.statusCode });
    }
    throw err;
  }
}

/** PATCH /api/notifications — Mark notifications as read */
export async function PATCH(req: NextRequest) {
  try {
    const ctx = await withAccountContext();
    const body = await req.json();
    const { notificationIds } = body as { notificationIds?: string[] };

    if (notificationIds && notificationIds.length > 0) {
      await prisma.notification.updateMany({
        where: { id: { in: notificationIds }, accountId: ctx.accountId },
        data: { readAt: new Date() },
      });
    } else {
      // Mark all as read
      await prisma.notification.updateMany({
        where: { accountId: ctx.accountId, readAt: null },
        data: { readAt: new Date() },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AccountContextError) {
      return NextResponse.json({ error: err.message, code: "AUTH_ERROR" }, { status: err.statusCode });
    }
    throw err;
  }
}
