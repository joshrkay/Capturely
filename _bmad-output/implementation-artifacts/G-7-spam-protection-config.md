# Story G.7: Spam Protection Configuration

Status: ready-for-dev

## Story

As a merchant,
I want configurable spam protection settings for my forms,
so that I can reduce spam submissions beyond the basic honeypot.

## Acceptance Criteria

1. Spam Protection settings are accessible in campaign builder as a dedicated panel
2. Honeypot toggle (enabled by default) — already implemented in runtime submit
3. Rate limiting toggle with configurable threshold (N submissions per IP per hour)
4. IP/email blocklist with add/remove entries
5. Optional reCAPTCHA v3 integration with site key and secret key configuration
6. Spam score threshold (0-100) for auto-flagging suspicious submissions
7. Settings are persisted per campaign via `spamProtectionJson` column
8. Runtime submit endpoint respects all configured protections
9. Submissions flagged as spam are marked with `status: 'spam'` instead of `'new_submission'`

## Codebase Analysis

### Runtime Submit Endpoint

**File:** `src/app/api/runtime/submit/route.ts` (175 lines)

Current flow:
1. JWT token verification via `verifyToken()` (lines 31-47)
2. Zod schema validation of payload (lines 50-57)
3. Token public key match against payload `publicKey` (lines 62-67)
4. **Honeypot check (lines 69-72):** If `fields._hp` is non-empty, silently returns `{ ok: true }` without persisting — this is the only spam protection today
5. Site lookup by `publicKey` (lines 75-85)
6. Common field extraction: email, phone, name (lines 88-90)
7. Idempotent `prisma.submission.create()` — catches Prisma error `P2002` for duplicate `submissionId` (lines 93-118)
8. Atomic `AccountUsage.submissionCount` increment via upsert (lines 121-130)
9. Non-blocking experiment event write (lines 133-146)
10. Non-blocking webhook fire (lines 148-162)

### Current SubmissionStatus Enum

**File:** `prisma/schema.prisma` (lines 196-200)

```prisma
enum SubmissionStatus {
  new_submission @map("new")
  read
  archived
}
```

### Campaign Model

**File:** `prisma/schema.prisma` (lines 134-164)

Currently stores `targetingJson`, `triggerJson`, `frequencyJson`, `webhookUrl` as nullable JSON string columns. The `spamProtectionJson` column follows this same pattern.

## Schema Changes

### 1. Add `spam` to SubmissionStatus enum

```prisma
enum SubmissionStatus {
  new_submission @map("new")
  read
  archived
  spam @map("spam")
}
```

### 2. Add `spamProtectionJson` to Campaign model

Add after `webhookUrl` (line 149):

```prisma
spamProtectionJson String? @map("spam_protection_json")
```

### 3. Migration

```bash
npx prisma migrate dev --name add-spam-protection
```

## SpamProtectionConfig TypeScript Interface

```typescript
interface SpamProtectionConfig {
  honeypot: { enabled: boolean };
  rateLimit: {
    enabled: boolean;
    maxPerHour: number; // default: 10
  };
  blocklist: {
    ips: string[];    // e.g., ["192.168.1.1", "10.0.0.0/24"]
    emails: string[]; // e.g., ["spam@example.com", "*@throwaway.com"]
  };
  recaptcha: {
    enabled: boolean;
    siteKey: string;
    secretKey: string;
    threshold: number; // 0.0-1.0, default: 0.5
  };
}
```

Default config when no `spamProtectionJson` is set:

```typescript
const DEFAULT_SPAM_CONFIG: SpamProtectionConfig = {
  honeypot: { enabled: true },
  rateLimit: { enabled: false, maxPerHour: 10 },
  blocklist: { ips: [], emails: [] },
  recaptcha: { enabled: false, siteKey: "", secretKey: "", threshold: 0.5 },
};
```

## Implementation Details

### Rate Limiting (In-Memory)

In `src/app/api/runtime/submit/route.ts`, add at module scope:

```typescript
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
```

- Key: `${siteId}:${clientIp}` (IP from `req.headers.get("x-forwarded-for")` or `req.ip`)
- On each submission: check `count >= maxPerHour` and `Date.now() < resetAt`
- If over limit: mark as spam, do NOT reject (per usage-locking pattern: don't break live forms)
- Resets on server restart — acceptable for Gate G; Redis upgrade deferred to production hardening
- Cleanup: prune expired entries periodically or on access

### reCAPTCHA v3 Verification

Widget-side: include reCAPTCHA script, send token in `fields._recaptchaToken`.

Server-side verification in submit route:

```typescript
async function verifyRecaptcha(token: string, secretKey: string, threshold: number): Promise<boolean> {
  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `secret=${secretKey}&response=${token}`,
  });
  const data = await res.json();
  return data.success && data.score >= threshold;
}
```

If verification fails: mark submission `status: 'spam'` (not rejected).

### Blocklist Matching

- IP matching: exact string match against `blocklist.ips` array
- Email matching: exact match OR wildcard domain match (`*@domain.com`)
- If matched: mark `status: 'spam'`

### Modified Submit Flow

Insert spam checks between honeypot (line 72) and site lookup (line 75):

1. Honeypot check (existing, lines 69-72) — silently discard, no DB write
2. Look up site (existing)
3. **NEW:** Look up campaign's `spamProtectionJson` if `campaignId` provided
4. **NEW:** Parse config, apply defaults for missing fields
5. **NEW:** Rate limit check by IP
6. **NEW:** Blocklist check (IP + email from fields)
7. **NEW:** reCAPTCHA verification if enabled and `fields._recaptchaToken` present
8. **NEW:** Set `status` variable: `'spam'` if any check failed, `'new_submission'` otherwise
9. Create submission with computed `status` (modify existing create call at line 94)
10. Only increment `AccountUsage.submissionCount` if status is NOT `'spam'`

Key principle: spam submissions are still persisted (merchant can review them) but do NOT count toward usage limits.

### Spam Submissions in Dashboard

- Submissions page should filter by status — `spam` submissions hidden by default
- Add "Spam" filter tab alongside existing status filters
- Merchant can manually mark submissions as spam or not-spam

## Tasks / Subtasks

- [ ] Add `spam` to `SubmissionStatus` enum in `prisma/schema.prisma` (line 199)
- [ ] Add `spamProtectionJson` to `Campaign` model in `prisma/schema.prisma` (after line 149)
- [ ] Run migration: `npx prisma migrate dev --name add-spam-protection`
- [ ] Create `src/lib/spam-protection.ts` — config parsing, rate limit, blocklist, reCAPTCHA helpers
- [ ] Update `src/app/api/runtime/submit/route.ts`:
  - [ ] Load campaign's spam config after site lookup
  - [ ] Apply rate limit check
  - [ ] Apply blocklist check
  - [ ] Apply reCAPTCHA verification
  - [ ] Pass computed `status` to submission create
  - [ ] Skip usage increment for spam submissions
- [ ] Create `src/app/app/campaigns/[id]/builder/components/spam-protection.tsx` — client component
  - [ ] Honeypot toggle (on/off)
  - [ ] Rate limiting section: toggle + `maxPerHour` number input
  - [ ] Blocklist section: IP list and email list with add/remove
  - [ ] reCAPTCHA section: toggle + site key input + secret key input + threshold slider
- [ ] Update campaign PATCH API to accept and validate `spamProtectionJson`
- [ ] Add Zod validation schema for `SpamProtectionConfig`

## UI Component: `spam-protection.tsx`

- `"use client"` directive required (interactive form controls)
- Receives `campaignId` and current `spamProtectionJson` as props
- Sections in collapsible panels:
  1. **Honeypot** — single toggle, label: "Enable honeypot field (recommended)"
  2. **Rate Limiting** — toggle + number input for max submissions per IP per hour
  3. **Blocklist** — two text areas or tag-input lists (IPs, emails) with add/remove
  4. **reCAPTCHA v3** — toggle + text inputs for site key / secret key + slider for threshold (0.0-1.0)
- Save button PATCHes campaign with serialized JSON
- Validation: threshold must be 0.0-1.0, maxPerHour must be positive integer, IPs must be valid format

## Dependencies

- **BLOCKED BY:** F.2 (extraction pattern — campaign builder must support config panels)
- **BLOCKS:** Nothing

## Dev Notes

- Honeypot already implemented in runtime submit (lines 69-72) — silently discards, returns `{ ok: true }`
- Keep all spam protection logic server-side — never expose thresholds or secret keys to client bundle
- reCAPTCHA secret key stored in `spamProtectionJson` — consider encrypting at rest in a future iteration
- Rate limit map is per-process; in a multi-instance deployment, each instance has its own map
- The `_recaptchaToken` field should be stripped from `fields` before persisting to `fieldsJson`

### Project Structure Notes

- New file: `src/lib/spam-protection.ts`
- New file: `src/app/app/campaigns/[id]/builder/components/spam-protection.tsx`
- Touches: `prisma/schema.prisma`, `src/app/api/runtime/submit/route.ts`
- Touches: campaign PATCH API for saving config

### References

- [Source: src/app/api/runtime/submit/route.ts — 175 lines, honeypot at lines 69-72]
- [Source: prisma/schema.prisma — SubmissionStatus enum at lines 196-200, Campaign model at lines 134-164]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
