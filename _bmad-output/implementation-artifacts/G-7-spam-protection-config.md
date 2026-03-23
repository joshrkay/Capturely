# Story G.7: Spam Protection Configuration

Status: ready-for-dev

## Story

As a merchant,
I want configurable spam protection settings for my forms,
so that I can reduce spam submissions beyond the basic honeypot.

## Acceptance Criteria

1. Spam Protection settings are accessible in campaign settings or site settings
2. Honeypot toggle (enabled by default) — already implemented in runtime
3. Rate limiting toggle with configurable threshold (N submissions per IP per hour)
4. IP/email blocklist with add/remove entries
5. Optional reCAPTCHA v3 integration with site key configuration
6. Spam score threshold (0-100) for auto-flagging suspicious submissions
7. Settings are persisted per campaign or per site
8. Runtime submit endpoint respects all configured protections
9. Submissions flagged as spam are marked with `status: 'spam'` instead of `'new'`

## Tasks / Subtasks

- [ ] Create `src/app/app/campaigns/[id]/builder/components/spam-protection.tsx` client component (AC: 1)
  - [ ] Honeypot toggle (AC: 2)
  - [ ] Rate limiting toggle + threshold input (AC: 3)
  - [ ] Blocklist management (add/remove IPs and emails) (AC: 4)
  - [ ] reCAPTCHA toggle + site key input (AC: 5)
  - [ ] Spam score threshold slider (AC: 6)
- [ ] Add spam protection fields to Campaign or Site model (AC: 7)
- [ ] Update runtime submit endpoint to check rate limits (AC: 8)
- [ ] Update runtime submit endpoint to check blocklist (AC: 8)
- [ ] Update runtime submit endpoint to verify reCAPTCHA token (AC: 8)
- [ ] Add `spam` status to Submission model if not present (AC: 9)
- [ ] Run Prisma migration for schema changes (AC: 7)

## Dev Notes

- Reference Figma: `components/spam-protection-settings.tsx`
- Honeypot already implemented in `POST /api/runtime/submit` (checks `_hp` field)
- Rate limiting: consider Redis for production, but in-memory Map works for initial implementation
- reCAPTCHA v3: widget sends token, server verifies with Google API
- Blocklist: stored as JSON array on Campaign/Site model
- Keep spam protection logic server-side — don't expose thresholds to client

### Project Structure Notes

- New file: `src/app/app/campaigns/[id]/builder/components/spam-protection.tsx`
- Touches: `prisma/schema.prisma`, `src/app/api/runtime/submit/route.ts`

### References

- [Source: src/app/api/runtime/submit/route.ts — existing honeypot]
- [Source: Figma Make — components/spam-protection-settings.tsx]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
