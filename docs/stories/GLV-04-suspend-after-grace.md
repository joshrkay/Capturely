# Story: Suspend Accounts After Grace Expiry

**ID:** GLV-04
**Gate:** E (Billing)
**Priority:** P0 — Missing feature
**Branch:** `feat/suspend-after-grace`
**Effort:** 2 hours

---

## Problem

When a payment fails, the account is set to `past_due` with a 7-day grace period (`paymentGraceUntil`). But there's no cron job or scheduled task to check when the grace period expires and transition the account to `suspended`. Users with failed payments stay in `past_due` forever.

## Acceptance Criteria

- [ ] Cron endpoint `POST /api/cron/check-grace` finds all accounts where `paymentStatus = "past_due"` AND `paymentGraceUntil < now()`
- [ ] Updates matching accounts to `paymentStatus = "suspended"`
- [ ] Sends suspension notification (in-app + email) to the account owner
- [ ] Endpoint is idempotent (safe to call multiple times)
- [ ] Endpoint is protected (only callable from cron, not public users)
- [ ] Vercel Cron config added to `vercel.json`
- [ ] `npm run typecheck` passes

## Implementation

### New File: `src/app/api/cron/check-grace/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  // Verify cron secret (Vercel sets CRON_SECRET header)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Find accounts past grace period
  const expiredAccounts = await prisma.account.findMany({
    where: {
      paymentStatus: "past_due",
      paymentGraceUntil: { lt: now },
    },
    select: { id: true, name: true },
  });

  for (const account of expiredAccounts) {
    await prisma.$transaction([
      prisma.account.update({
        where: { id: account.id },
        data: { paymentStatus: "suspended" },
      }),
      prisma.notification.create({
        data: {
          accountId: account.id,
          type: "payment_suspended",
          title: "Account suspended",
          body: "Your account has been suspended due to unpaid invoices. Please update your payment method.",
          linkUrl: "/app/billing",
        },
      }),
    ]);

    // Send email (after GLV-03 is done, use dynamic email lookup)
  }

  return NextResponse.json({
    processed: expiredAccounts.length,
    suspendedIds: expiredAccounts.map((a) => a.id),
  });
}
```

### New/Modified File: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/check-grace",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### Add to `.env.example`:
```
CRON_SECRET=your-cron-secret-here
```

### Middleware: Already covered
The `/api/cron(.*)` pattern is already in the public routes list in `src/middleware.ts`.

## Testing

```bash
npm run typecheck
npm run test
# Manual: Set an account's paymentGraceUntil to the past, call the endpoint
curl -X POST http://localhost:3000/api/cron/check-grace \
  -H "Authorization: Bearer your-cron-secret"
```

## Context Files
- `src/app/api/stripe/webhook/route.ts` — Sets `past_due` + `paymentGraceUntil`
- `src/middleware.ts` — `/api/cron(.*)` already public
- `prisma/schema.prisma` — Account model with `paymentStatus`, `paymentGraceUntil`
