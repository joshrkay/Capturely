# Story: Fix Hardcoded Email Address

**ID:** GLV-03
**Gate:** E (Billing)
**Priority:** P0 — Bug fix
**Branch:** `fix/email-hardcoded-address`
**Effort:** 30 minutes

---

## Problem

`src/lib/email.ts` sends payment failure and other billing emails to the hardcoded address `"owner@example.com"` instead of looking up the actual account owner's email from Clerk.

## Acceptance Criteria

- [ ] Email functions accept a `toEmail` parameter or look up the owner's email dynamically
- [ ] No hardcoded email addresses remain in the codebase
- [ ] If email lookup fails, log an error but don't crash the webhook handler
- [ ] `npm run typecheck` passes

## Implementation

### File: `src/lib/email.ts`

Option A (preferred): Accept email as parameter — the calling code already has context.

```typescript
export async function sendPaymentFailedEmail(
  toEmail: string,  // was hardcoded
  accountName: string,
  graceUntil: Date
): Promise<void> {
  // Use toEmail instead of "owner@example.com"
}
```

Option B: Look up from Clerk inside the function.

```typescript
import { clerkClient } from "@clerk/nextjs/server";

async function getOwnerEmail(accountId: string): Promise<string | null> {
  const member = await prisma.accountMember.findFirst({
    where: { accountId, role: "owner" },
    select: { userId: true },
  });
  if (!member) return null;

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(member.userId);
  return user.emailAddresses[0]?.emailAddress ?? null;
}
```

### Files to update:
- `src/lib/email.ts` — Fix all email functions with hardcoded addresses
- `src/app/api/stripe/webhook/route.ts` — Pass the owner's email to email functions
- Any other callers of email functions (search for `sendPaymentFailedEmail`, `sendSuspendedEmail`, etc.)

## Testing

```bash
grep -r "owner@example.com" src/  # Should return 0 results after fix
npm run typecheck
npm run test
```

## Context Files
- `src/lib/email.ts` — Email sending functions
- `src/app/api/stripe/webhook/route.ts` — Primary caller
- `src/lib/auth.ts` — Clerk helpers for user lookup
