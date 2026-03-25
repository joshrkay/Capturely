# Story: Fix Payment Succeeded Race Condition

**ID:** GLV-02
**Gate:** E (Billing)
**Priority:** P0 — Bug fix
**Branch:** `fix/payment-succeeded-race`
**Effort:** 30 minutes

---

## Problem

In `src/app/api/stripe/webhook/route.ts`, the `invoice.payment_succeeded` handler updates `paymentStatus` to `"active"` first, then checks if the old status was `past_due` or `suspended` to send a "resumed" notification. Since the status was already overwritten by the update, the conditional is dead code — users never get notified their account was resumed.

## Acceptance Criteria

- [ ] Read the existing `paymentStatus` BEFORE updating it
- [ ] Send "resumed" notification/email when transitioning from `past_due` or `suspended` to `active`
- [ ] Clear `paymentGraceUntil` on successful payment
- [ ] Existing webhook idempotency still works (ProcessedStripeEvent dedup)
- [ ] `npm run typecheck` passes

## Implementation

### File: `src/app/api/stripe/webhook/route.ts`

In the `invoice.payment_succeeded` handler:

```typescript
// 1. Read current status BEFORE updating
const account = await prisma.account.findFirst({
  where: { stripeCustomerId: customerId },
  select: { id: true, paymentStatus: true },
});

if (!account) return;

const wasSuspendedOrPastDue =
  account.paymentStatus === "past_due" ||
  account.paymentStatus === "suspended";

// 2. Update to active
await prisma.account.update({
  where: { id: account.id },
  data: {
    paymentStatus: "active",
    paymentGraceUntil: null,
  },
});

// 3. Send resumed notification if was degraded
if (wasSuspendedOrPastDue) {
  // Create notification + send email
}
```

## Testing

- Manually trace the webhook handler logic to verify ordering
- `npm run test` — all tests pass
- `npm run typecheck` — clean

## Context Files
- `src/app/api/stripe/webhook/route.ts` — The webhook handler with the bug
- `src/lib/email.ts` — Email sending (has its own bug, see GLV-03)
