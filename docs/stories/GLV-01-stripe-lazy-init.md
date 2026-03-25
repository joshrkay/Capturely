# Story: Fix Stripe Lazy Initialization

**ID:** GLV-01
**Gate:** Infrastructure
**Priority:** P0 — Build blocker
**Branch:** `fix/stripe-lazy-init`
**Effort:** 30 minutes

---

## Problem

`src/lib/stripe.ts` initializes the Stripe client at module scope. If `STRIPE_SECRET_KEY` is missing from the environment (common in CI, local dev without billing), the import crashes the entire application at build/startup time. Any route that transitively imports stripe.ts will fail.

## Acceptance Criteria

- [ ] Stripe client uses lazy initialization pattern (created on first use, not at import)
- [ ] Application builds and starts without `STRIPE_SECRET_KEY` set
- [ ] Stripe-dependent API routes return a clear error if the key is missing at runtime
- [ ] All existing billing tests still pass
- [ ] `npm run typecheck` passes

## Implementation

### File: `src/lib/stripe.ts`

Replace the top-level `const stripe = new Stripe(...)` with a `getStripeClient()` function:

```typescript
import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(key, { apiVersion: "2024-12-18.acacia" });
  }
  return _stripe;
}
```

### Files to update (replace `stripe` import with `getStripeClient()`):
- `src/app/api/billing/checkout/route.ts`
- `src/app/api/billing/portal/route.ts`
- `src/app/api/billing/status/route.ts`
- `src/app/api/stripe/webhook/route.ts`

Each file: change `import { stripe } from "@/lib/stripe"` to `import { getStripeClient } from "@/lib/stripe"`, then use `const stripe = getStripeClient()` inside the handler.

## Testing

```bash
# Without STRIPE_SECRET_KEY — app should still build
unset STRIPE_SECRET_KEY && npm run build

# With key — billing routes should work
npm run test
npm run typecheck
```

## Context Files
- `src/lib/stripe.ts` — Current implementation
- `src/app/api/billing/` — All billing routes
- `src/app/api/stripe/webhook/route.ts` — Webhook handler
