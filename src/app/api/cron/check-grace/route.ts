import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAccountOwnerEmail } from "@/lib/account-owner-email";
import { sendAccountSuspendedEmail } from "@/lib/email";

/**
 * POST /api/cron/check-grace — Suspend accounts whose payment grace period has expired.
 * Called by Vercel Cron (CRON_SECRET).
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET ?? ""}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const expiredAccounts = await prisma.account.findMany({
    where: {
      paymentStatus: "past_due",
      paymentGraceUntil: { lt: now },
    },
    select: { id: true, name: true },
  });

  const suspendedIds: string[] = [];

  for (const account of expiredAccounts) {
    const didSuspend = await prisma.$transaction(async (tx) => {
      const updated = await tx.account.updateMany({
        where: {
          id: account.id,
          paymentStatus: "past_due",
          paymentGraceUntil: { lt: now },
        },
        data: { paymentStatus: "suspended" },
      });
      if (updated.count === 0) {
        return false;
      }

      await tx.notification.create({
        data: {
          accountId: account.id,
          type: "payment_suspended",
          title: "Account suspended",
          body: "Your account has been suspended due to unpaid invoices. Please update your payment method.",
          linkUrl: "/app/billing",
        },
      });
      return true;
    });

    if (!didSuspend) {
      continue;
    }

    suspendedIds.push(account.id);

    try {
      const email = await getAccountOwnerEmail(account.id);
      if (email) {
        await sendAccountSuspendedEmail(email, account.name);
      }
    } catch {
      // Email is best-effort
    }
  }

  return NextResponse.json({
    processed: expiredAccounts.length,
    suspended: suspendedIds.length,
    suspendedIds,
  });
}
