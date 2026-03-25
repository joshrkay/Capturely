# Story: Build Resend Email Templates

**ID:** GLV-06
**Gate:** E (Billing)
**Priority:** P0 — Missing feature
**Branch:** `feat/email-templates`
**Effort:** 3 hours

---

## Problem

The Resend SDK is installed and `src/lib/email.ts` has function stubs, but no actual HTML/text email templates exist. Users receive no email notifications for critical events like payment failures, account suspensions, usage warnings, or experiment completions.

## Acceptance Criteria

- [ ] HTML + text email templates for all critical events
- [ ] `sendPaymentFailedEmail()` — Tells user their payment failed, includes link to update payment
- [ ] `sendAccountSuspendedEmail()` — Tells user their account is suspended
- [ ] `sendAccountResumedEmail()` — Confirms payment received, account active again
- [ ] `sendUsageWarningEmail()` — At 80% of plan limit
- [ ] `sendUsageLockedEmail()` — At 100%+ of plan limit (grace exceeded)
- [ ] All emails use a consistent branded template with Capturely logo
- [ ] Emails include a clear CTA button linking to `/app/billing`
- [ ] `from` address is configurable via env var (e.g., `RESEND_FROM_EMAIL`)
- [ ] Graceful failure — email send errors are logged but don't crash callers
- [ ] `npm run typecheck` passes

## Implementation

### File: `src/lib/email.ts`

Read the current file first to understand the existing structure. Then:

1. Create a base HTML template function:
```typescript
function baseTemplate(content: string, ctaText: string, ctaUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 20px; font-weight: 600; color: #4f46e5;">Capturely</span>
      </div>
      ${content}
      <div style="text-align: center; margin-top: 24px;">
        <a href="${ctaUrl}" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
          ${ctaText}
        </a>
      </div>
      <p style="margin-top: 32px; font-size: 12px; color: #71717a; text-align: center;">
        You're receiving this because you have an account on Capturely.
      </p>
    </body>
    </html>
  `;
}
```

2. Implement each email function using Resend:
```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "Capturely <noreply@capturely.io>";

export async function sendPaymentFailedEmail(
  toEmail: string,
  accountName: string,
  graceUntil: Date
): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM,
      to: toEmail,
      subject: `Action required: Payment failed for ${accountName}`,
      html: baseTemplate(
        `<h2>Payment Failed</h2>
         <p>We were unable to process payment for your ${accountName} account.</p>
         <p>Please update your payment method by <strong>${graceUntil.toLocaleDateString()}</strong> to avoid service interruption.</p>`,
        "Update Payment Method",
        `${process.env.NEXT_PUBLIC_APP_URL}/app/billing`
      ),
    });
  } catch (err) {
    console.error("[email] Failed to send payment failed email:", err);
  }
}
```

3. Follow the same pattern for each email type.

### Add to `.env.example`:
```
RESEND_FROM_EMAIL=Capturely <noreply@capturely.io>
```

### Templates needed:

| Function | Subject | CTA |
|---|---|---|
| `sendPaymentFailedEmail` | "Action required: Payment failed" | "Update Payment Method" → /app/billing |
| `sendAccountSuspendedEmail` | "Account suspended" | "Reactivate Account" → /app/billing |
| `sendAccountResumedEmail` | "Payment confirmed — you're all set" | "Go to Dashboard" → /app |
| `sendUsageWarningEmail` | "You've used 80% of your plan" | "View Usage" → /app/billing |
| `sendUsageLockedEmail` | "Submission limit reached" | "Upgrade Plan" → /app/billing |

## Testing

```bash
npm run typecheck
npm run test

# Manual: Test with Resend test mode (RESEND_API_KEY=re_test_...)
# Verify emails render correctly in inbox
```

## Context Files
- `src/lib/email.ts` — Current implementation with stubs
- `src/app/api/stripe/webhook/route.ts` — Calls email functions on payment events
- `src/app/api/runtime/submit/route.ts` — Could call usage warning emails
- `.env.example` — Add RESEND_FROM_EMAIL
