# Story: Reset Usage Counters on Billing Cycle Renewal

**ID:** GLV-05
**Gate:** E (Billing)
**Priority:** P0 — Missing feature
**Branch:** `feat/reset-usage-cycle`
**Effort:** 2 hours

---

## Problem

`AccountUsage` tracks `submissionCount` and `aiGenerationsCount` per billing cycle. But there's no mechanism to reset these counters when a new billing cycle starts. Without this, users hit their plan limits permanently and never recover, even on the next month.

## Acceptance Criteria

- [ ] Cron endpoint `POST /api/cron/reset-usage` resets counters for accounts whose billing cycle has renewed
- [ ] Only resets if current date is past `billingCycleEnd`
- [ ] Updates `billingCycleStart` and `billingCycleEnd` to the new period
- [ ] Clears `usageLocked` flag and `overageCount`
- [ ] Idempotent — safe to call multiple times (uses billingCycleEnd as guard)
- [ ] Sends "usage reset" notification to previously locked accounts
- [ ] Vercel Cron config added
- [ ] `npm run typecheck` passes

## Implementation

### New File: `src/app/api/cron/reset-usage/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Find accounts whose billing cycle has ended
  const accounts = await prisma.account.findMany({
    where: {
      billingCycleEnd: { lt: now },
      paymentStatus: "active", // Only reset active accounts
    },
    select: { id: true, billingCycleEnd: true },
  });

  let resetCount = 0;
  for (const account of accounts) {
    // Calculate new cycle (1 month from old end)
    const oldEnd = account.billingCycleEnd!;
    const newStart = new Date(oldEnd);
    const newEnd = new Date(oldEnd);
    newEnd.setMonth(newEnd.getMonth() + 1);

    await prisma.$transaction([
      // Reset usage counters
      prisma.accountUsage.updateMany({
        where: { accountId: account.id },
        data: {
          submissionCount: 0,
          overageCount: 0,
          aiGenerationsCount: 0,
          usageLocked: false,
        },
      }),
      // Update billing cycle dates
      prisma.account.update({
        where: { id: account.id },
        data: {
          billingCycleStart: newStart,
          billingCycleEnd: newEnd,
        },
      }),
    ]);

    resetCount++;
  }

  return NextResponse.json({ processed: accounts.length, reset: resetCount });
}
```

### Modify: `vercel.json`

Add to the crons array:
```json
{
  "path": "/api/cron/reset-usage",
  "schedule": "0 0 * * *"
}
```

Runs daily at midnight UTC. The `billingCycleEnd < now` guard ensures it only processes accounts that are actually due for reset.

## Edge Cases

- **Free plan accounts**: Free plans have no billing cycle. Set `billingCycleEnd` to null for free accounts, and this query naturally skips them.
- **Suspended accounts**: Not reset (query filters `paymentStatus: "active"`).
- **Double reset**: The `billingCycleEnd < now` check + updating `billingCycleEnd` forward makes this idempotent.

## Testing

```bash
npm run typecheck
npm run test
# Manual: Set an account's billingCycleEnd to yesterday, call the endpoint
```

## Context Files
- `prisma/schema.prisma` — `Account.billingCycleStart`, `Account.billingCycleEnd`, `AccountUsage` model
- `src/app/api/runtime/submit/route.ts` — Where `submissionCount` is incremented
- `src/lib/plans.ts` — Plan limits that are checked against usage
