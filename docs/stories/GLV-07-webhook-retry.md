# Story: Add Webhook Retry Logic

**ID:** GLV-07
**Gate:** C (Submissions)
**Priority:** P1 — Reliability
**Branch:** `feat/webhook-retry`
**Effort:** 1 hour

---

## Problem

`src/lib/webhooks.ts` fires webhooks on form submission but has no retry logic. If the merchant's webhook endpoint is temporarily unavailable (network blip, deploy, rate limit), the webhook is silently lost. The PRD specifies 2-3x exponential backoff retries.

## Acceptance Criteria

- [ ] `fireWebhook()` retries up to 3 times on failure
- [ ] Retry uses exponential backoff (1s, 2s, 4s)
- [ ] Only retries on network errors and 5xx responses (not 4xx)
- [ ] Webhook delivery remains non-blocking (doesn't slow down submission response)
- [ ] Failed webhooks after all retries are logged but don't throw
- [ ] HMAC signature remains the same across retries (idempotent)
- [ ] `npm run typecheck` passes

## Implementation

### File: `src/lib/webhooks.ts`

Read the current file first, then add retry logic:

```typescript
async function attemptWebhook(
  url: string,
  payload: unknown,
  secret: string,
  attempt: number = 0,
  maxAttempts: number = 3
): Promise<boolean> {
  try {
    const body = JSON.stringify(payload);
    const signature = createHmacSignature(body, secret);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Capturely-Signature": signature,
      },
      body,
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (res.ok) return true;

    // Don't retry client errors (4xx)
    if (res.status >= 400 && res.status < 500) {
      console.error(`[webhook] Client error ${res.status} for ${url}, not retrying`);
      return false;
    }

    throw new Error(`Server error ${res.status}`);
  } catch (err) {
    if (attempt < maxAttempts - 1) {
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      await new Promise((resolve) => setTimeout(resolve, delay));
      return attemptWebhook(url, payload, secret, attempt + 1, maxAttempts);
    }

    console.error(`[webhook] Failed after ${maxAttempts} attempts for ${url}:`, err);
    return false;
  }
}
```

Update `fireWebhook()` to call `attemptWebhook()` instead of a single fetch.

## Testing

```bash
npm run typecheck
npm run test
```

Consider adding a unit test that mocks fetch to verify retry behavior:
- Mock fetch to fail twice, succeed on third → returns true
- Mock fetch to return 400 → no retry, returns false
- Mock fetch to fail 3 times → returns false after backoff

## Context Files
- `src/lib/webhooks.ts` — Current webhook implementation
- `src/app/api/runtime/submit/route.ts` — Calls `fireWebhook()` non-blocking
