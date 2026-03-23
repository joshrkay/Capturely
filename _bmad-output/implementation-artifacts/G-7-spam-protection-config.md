# Story G.7: Spam Protection Configuration

Status: ready-for-dev

## Story

As a merchant,
I want configurable spam protection settings for my campaigns beyond the basic honeypot,
so that I can reduce spam submissions, block known bad actors, and review flagged entries
without losing legitimate leads.

Currently the only protection is a static honeypot field check (lines 69-72 in the runtime
submit handler). This story adds rate limiting by IP, email/IP blocklists, and optional
reCAPTCHA v3 verification — all merchant-configurable per campaign. Spam submissions are
preserved with a `spam` status so merchants can audit false positives.

## Dependencies

- **BLOCKED BY:** F.2 (Builder Display Settings) — campaign builder infrastructure must exist
  before the spam protection panel can be added to it.
- **BLOCKS:** Nothing.

## Existing Code Inventory

| File | Lines | Relevance |
|------|-------|-----------|
| `src/app/api/runtime/submit/route.ts` | 175 | Current honeypot check (L69-72), submission create (L93-118), usage increment (L121-130) |
| `prisma/schema.prisma` | ~240+ | `SubmissionStatus` enum (L196-200), `Campaign` model (L134-159) |
| `src/lib/db.ts` | — | Prisma client singleton |
| `src/lib/runtime-token.ts` | — | JWT verify for runtime endpoints |
| `src/lib/rbac.ts` | — | `canManageCampaigns()` helper for RBAC enforcement |
| `packages/shared/forms/` | — | Shared validation between widget and server |
| `src/app/app/campaigns/[id]/builder/` | — | Campaign builder UI (target location for config panel) |

## Acceptance Criteria

1. `SubmissionStatus` enum includes `spam` value mapped to `"spam"` in the database.
2. `Campaign` model has a `spamProtectionJson` nullable string column for persisting config.
3. Default `SpamProtectionConfig` is applied when `spamProtectionJson` is null: honeypot enabled, rate limit disabled, empty blocklists, reCAPTCHA disabled.
4. Honeypot check respects `config.honeypot.enabled` — when disabled, `_hp` field is ignored.
5. Rate limiting tracks submissions per IP using an in-memory map; submissions exceeding `maxPerHour` are marked as `spam` (not discarded).
6. Rate limit map entries auto-expire after the hour window resets; stale entries are cleaned on a periodic sweep.
7. IP blocklist check runs before submission insert; matched IPs result in `status: 'spam'`.
8. Email blocklist check runs before submission insert; matched emails result in `status: 'spam'`.
9. When reCAPTCHA v3 is enabled, widget sends a `recaptchaToken` field; server verifies against Google's API and marks submissions below the threshold as `spam`.
10. Spam-flagged submissions are stored in the database with `status: 'spam'` — never silently discarded — so merchants can review false positives.
11. Dashboard submissions list can filter by `spam` status; spam submissions display a visual indicator.
12. Campaign builder exposes a "Spam Protection" settings panel at `src/app/app/campaigns/[id]/builder/components/spam-protection.tsx`.
13. The spam protection panel validates input (e.g., `maxPerHour` >= 1, reCAPTCHA threshold 0.0-1.0, valid IP formats in blocklist).
14. API endpoint `PATCH /api/campaigns/[id]/spam-protection` persists config with Zod validation and RBAC (`canManageCampaigns`).
15. Runtime submit endpoint does not leak spam detection details to the client — always returns `{ ok: true }` for spam submissions.

## Prisma Schema Changes

### SubmissionStatus enum

```prisma
enum SubmissionStatus {
  new_submission @map("new")
  read
  archived
  spam           @map("spam")
}
```

### Campaign model — new field

Add after `webhookUrl` (line 149):

```prisma
spamProtectionJson String? @map("spam_protection_json")
```

### Migration

```bash
npx prisma migrate dev --name add-spam-protection
```

## API Contracts

### PATCH /api/campaigns/[id]/spam-protection

**Auth:** Clerk session, `canManageCampaigns(role)`

**Request body (Zod-validated):**

```typescript
interface SpamProtectionConfig {
  honeypot: { enabled: boolean };
  rateLimit: { enabled: boolean; maxPerHour: number };
  blocklist: { ips: string[]; emails: string[] };
  recaptcha: { enabled: boolean; siteKey: string; secretKey: string; threshold: number };
}
```

**Response 200:**
```json
{ "ok": true, "spamProtection": { ... } }
```

**Error responses:**
- `400` — `{ "error": "Invalid config", "code": "VALIDATION_ERROR", "details": [...] }`
- `403` — `{ "error": "Forbidden", "code": "FORBIDDEN" }`
- `404` — `{ "error": "Campaign not found", "code": "NOT_FOUND" }`

### POST /api/runtime/submit (modified)

No contract change. Widget may optionally include `recaptchaToken` in `fields`. Response
remains `{ ok: true, submissionId }` regardless of spam determination. The `_recaptchaToken`
and `_hp` fields are stripped from `fieldsJson` before persistence.

## Component Architecture

```
src/app/app/campaigns/[id]/builder/components/
  spam-protection.tsx          # Main spam protection config panel ("use client")

src/lib/spam/
  config.ts                    # SpamProtectionConfig type, defaults, Zod schema, parse helper
  rate-limiter.ts              # In-memory rate limit map with cleanup
  blocklist.ts                 # IP and email matching logic
  recaptcha.ts                 # Google reCAPTCHA v3 server-side verification
  evaluate.ts                  # Orchestrator: runs all checks, returns SpamVerdict

src/app/api/campaigns/[id]/spam-protection/
  route.ts                     # PATCH handler for saving config
```

## UI States

| State | Behavior |
|-------|----------|
| Default (no config saved) | Honeypot toggle on; all others off; sensible defaults shown |
| Honeypot toggle | On/off switch; no additional fields |
| Rate limit toggle | Reveals `maxPerHour` number input (default: 10, min: 1, max: 1000) |
| Blocklist section | Two textarea fields for IPs and emails, one entry per line; inline validation |
| reCAPTCHA toggle | Reveals site key input, secret key input (masked), threshold slider (0.0-1.0, default 0.5) |
| Saving | Save button shows spinner; all inputs disabled |
| Save success | Toast notification "Spam protection updated" |
| Save error | Inline error banner with message details |
| Validation error | Red border + helper text on invalid fields (e.g., malformed IP address) |

## Design System

- Standard Capturely Tailwind utility classes; no custom design tokens required.
- Toggle switches: `<Switch>` component or `<button role="switch">` with `bg-blue-600`/`bg-gray-200`.
- Collapsible sections: existing accordion/disclosure pattern from the builder.
- Spacing: `space-y-4` between sections, `p-4` card padding.
- Colors: default Tailwind palette (`text-gray-900`, `bg-white`, `border-gray-200`, error `text-red-600`).
- Threshold slider: standard `<input type="range">` with numeric display.

## Accessibility

- All toggle switches have associated `<label>` elements with descriptive text.
- Blocklist textareas have `aria-label` and `aria-describedby` linking to validation messages.
- reCAPTCHA threshold slider uses `role="slider"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`.
- Error messages use `role="alert"` and `aria-live="polite"`.
- Keyboard navigation: all controls reachable via Tab; toggles operable with Space/Enter.
- Focus management: after save error, focus moves to the first invalid field.

## Testing Plan

### Unit Tests
- `spam/config.ts` — default config generation, JSON parse/serialize round-trip, malformed JSON fallback.
- `spam/rate-limiter.ts` — count tracking, window expiry, cleanup of stale entries, concurrent access.
- `spam/blocklist.ts` — exact IP match, case-insensitive email match, wildcard domain match, empty list passthrough.
- `spam/recaptcha.ts` — mock Google API: score above threshold passes, below threshold marks spam, network error degrades gracefully (allows submission).
- `spam/evaluate.ts` — orchestrator returns correct `SpamVerdict` for each check type; short-circuits on honeypot.

### Integration Tests
- Runtime submit with honeypot disabled in config: submission is stored (not discarded).
- Runtime submit exceeding rate limit: submission stored with `status: 'spam'`.
- Runtime submit from blocked IP: submission stored with `status: 'spam'`.
- Runtime submit with blocked email: submission stored with `status: 'spam'`.
- Runtime submit with low reCAPTCHA score: submission stored with `status: 'spam'`.
- Runtime submit with all checks passing: submission stored with `status: 'new_submission'`.
- PATCH spam protection config: valid config saved and returned; invalid config rejected with 400.
- PATCH without `canManageCampaigns` role: returns 403.

### E2E Tests
- Campaign builder: toggle each spam protection feature, save, reload page, verify config persistence.
- Submissions list: filter by `spam` status, verify spam badge renders on flagged rows.

## Anti-Patterns to Avoid

- **Do NOT discard spam submissions** — always persist with `status: 'spam'` so merchants can review.
- **Do NOT leak detection signals** — runtime endpoint must return `{ ok: true }` even for spam.
- **Do NOT use persistent storage for rate limiting** — in-memory map is intentional for Gate G; avoids DB write amplification on the hot path. Redis is a future enhancement.
- **Do NOT store reCAPTCHA secret key in client-accessible code** — it stays in `spamProtectionJson` on the server; only `siteKey` is exposed to the widget manifest.
- **Do NOT block the submission response on slow reCAPTCHA verification** — if Google API exceeds 2s timeout, degrade gracefully and allow the submission through.
- **Do NOT use `any` types** — all spam config and verdict types must be fully typed with TypeScript strict mode.
- **Do NOT increment usage counters for spam submissions** — spam should not count toward plan limits.

## Tasks

1. **Schema: add spam status** — Add `spam @map("spam")` to `SubmissionStatus` enum in `prisma/schema.prisma` (after line 199).
2. **Schema: add spamProtectionJson** — Add `spamProtectionJson String? @map("spam_protection_json")` to `Campaign` model (after `webhookUrl` line 149).
3. **Run migration** — `npx prisma migrate dev --name add-spam-protection` and verify generated SQL.
4. **Type definitions** — Create `src/lib/spam/config.ts` with `SpamProtectionConfig` interface, `SpamVerdict` type, `DEFAULT_SPAM_CONFIG` constant, Zod schema, and `parseSpamConfig(json: string | null)` helper.
5. **Rate limiter module** — Create `src/lib/spam/rate-limiter.ts` with in-memory `Map<string, { count: number; resetAt: number }>`, `checkRateLimit(key, maxPerHour): boolean`, and periodic stale-entry cleanup via `setInterval`.
6. **Blocklist module** — Create `src/lib/spam/blocklist.ts` with `isBlockedIp(ip, list): boolean` and `isBlockedEmail(email, list): boolean` (case-insensitive, wildcard domain support).
7. **reCAPTCHA verifier** — Create `src/lib/spam/recaptcha.ts` with `verifyRecaptcha(token, secretKey, threshold): Promise<boolean>` calling Google's `siteverify` API with a 2s `AbortSignal.timeout`.
8. **Spam evaluator** — Create `src/lib/spam/evaluate.ts` orchestrator that runs honeypot, rate limit, blocklist, and reCAPTCHA checks in order; returns `{ isSpam: boolean; reason: string | null }`. Short-circuits on first match.
9. **Refactor runtime submit: load config** — After site lookup, fetch campaign's `spamProtectionJson` if `campaignId` is provided. Parse with `parseSpamConfig()`.
10. **Refactor runtime submit: integrate evaluator** — Replace hardcoded honeypot check (lines 69-72) with call to `evaluate()`. Strip `_hp` and `_recaptchaToken` from fields before persistence.
11. **Refactor runtime submit: spam status** — Pass computed `status` (`'spam'` or `'new_submission'`) to `prisma.submission.create`. Skip `AccountUsage` increment when status is `'spam'`.
12. **Update submit Zod schema** — Add optional `recaptchaToken` string field to `submitSchema`.
13. **PATCH API route** — Create `src/app/api/campaigns/[id]/spam-protection/route.ts` with Zod validation, Clerk auth, `canManageCampaigns` RBAC, and `prisma.campaign.update`.
14. **Spam protection UI panel** — Build `src/app/app/campaigns/[id]/builder/components/spam-protection.tsx` as a `"use client"` component with toggle sections for honeypot, rate limit, blocklist, and reCAPTCHA.
15. **Wire UI to API** — Add `fetch` call from panel to PATCH endpoint on save; handle loading, success toast, and error banner states.
16. **Submissions list: spam filter** — Add `spam` option to status filter dropdown; render a spam badge on flagged rows; hide spam by default.
17. **Widget reCAPTCHA support** — Update `widget.js` to load reCAPTCHA v3 script when `siteKey` is present in manifest; include `recaptchaToken` in submit payload.
18. **Unit tests** — Write tests for `config.ts`, `rate-limiter.ts`, `blocklist.ts`, `recaptcha.ts`, and `evaluate.ts`.
19. **Integration tests** — Test runtime submit with each spam check path (honeypot, rate limit, blocklist, reCAPTCHA, clean) and PATCH endpoint (valid, invalid, forbidden).

## Dev Notes

- The in-memory rate limit map resets on every Vercel serverless cold start. This is acceptable for Gate G — persistent rate limiting (e.g., Redis/Upstash) is deferred to production hardening.
- reCAPTCHA v3 is invisible to users; no checkbox or challenge is shown. The widget loads the script and executes `grecaptcha.execute()` on form submit.
- The `spamProtectionJson` column stores the full config as a JSON string, parsed on each submission. This avoids schema migrations when new spam features are added later.
- Blocklist email matching is case-insensitive. IP matching is exact string comparison (CIDR support is a stretch goal).
- The spam evaluator short-circuits: if honeypot triggers, skip remaining checks.
- The `_hp` and `_recaptchaToken` fields must be stripped from `fieldsJson` before storage regardless of config state.
- Spam submissions are never counted toward `AccountUsage.submissionCount` to avoid penalizing merchants.
- reCAPTCHA secret key is stored in `spamProtectionJson` — consider encrypting at rest in a future iteration.
- Rate limit map key format: `${siteId}:${clientIp}` using IP from `x-forwarded-for` header.

## References

- Runtime submit handler: `src/app/api/runtime/submit/route.ts` (175 lines, honeypot at L69-72)
- Prisma schema: `prisma/schema.prisma` (SubmissionStatus L196-200, Campaign L134-159)
- RBAC helpers: `src/lib/rbac.ts`
- Widget source: `packages/widget/`
- PRD: `docs/PRD.md`

## Dev Agent Record

| Date | Agent | Action | Notes |
|------|-------|--------|-------|
| 2026-03-23 | BMAD | Story authored | Comprehensive G.7 story with schema, API, UI, testing, and 19 tasks |
