# Capturely — CLAUDE.md

## What Is This?

Capturely is a **multi-tenant form builder SaaS** with Shopify-native as the key differentiator.
Merchants embed a lightweight `widget.js` on their site; the dashboard lets them build campaigns (popups/inline forms), run A/B tests, track submissions, and fire webhooks to Zapier/etc.

**Owner:** Josh Kay (@joshrkay)
**Linear:** https://linear.app/jkay/project/capturely-6f3b3d1debcf/overview
**Figma prototype:** `figma-prototype` branch (reference only, do not copy its code)

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15, App Router, TypeScript |
| Auth | Clerk |
| ORM | Prisma |
| DB (local) | PostgreSQL via Docker |
| DB (prod) | Neon Postgres |
| Styling | Tailwind CSS |
| Deploy | Vercel |
| Email | Resend |
| Payments | Stripe |
| Package manager | npm |

---

## Project Structure (target)

```
src/
  app/
    (auth)/           # Clerk sign-in/sign-up pages
    app/              # Protected dashboard routes
      settings/team/
      sites/
      campaigns/
      submissions/
      analytics/
      billing/
    api/              # Route handlers
      team/
      invites/
      sites/
      campaigns/
      runtime/        # widget token + submit endpoints (public CORS)
      analytics/
      billing/
      stripe/
      notifications/
      health/
    accept-invite/    # Public invite acceptance page
  lib/
    auth.ts           # Clerk server helpers
    db.ts             # Prisma client singleton
    account.ts        # ensureAccountForUser(), withAccountContext()
    rbac.ts           # canManageTeam(), canManageSites(), etc.
    plans.ts          # resolvePlan(), PlanKey enum
  middleware.ts       # Clerk auth middleware
packages/
  shared/
    forms/            # evaluateVisibility(), validateSubmission(), normalizeFields()
prisma/
  schema.prisma
  migrations/
  seed.ts
docs/
  PRD.md              # Full product requirements — READ THIS FIRST
_bmad/                # BMAD agent framework — use /bmad-help for guidance
```

---

## Key Architectural Patterns

### Multi-tenancy
Every DB record scopes to an `Account`. The `withAccountContext()` helper resolves `accountId` + `role` from the Clerk session on every API route. If no membership exists → 403.

### RBAC
Three roles: `owner`, `admin`, `member`. Helpers in `src/lib/rbac.ts`:
- `canManageTeam()` → owner/admin
- `canManageSites()` → owner/admin
- `canManageCampaigns()` → owner/admin
- `canManageBilling()` → owner only
- `canView()` → all roles

### Widget Runtime
The widget is a separate `widget.js` bundle (vanilla JS, no framework deps). Flow:
1. Widget fetches manifest from `/public/manifests/{pk}.json`
2. Evaluates targeting/trigger rules
3. POSTs to `/api/runtime/token` for a 60s JWT
4. POSTs to `/api/runtime/submit` with the JWT

The `packages/shared/forms/` library is shared between the widget bundle and the server — same validation, same visibility logic, zero drift.

### Submission Idempotency
Client generates a `submission_id` UUID per attempt. Server deduplicates at the DB level (`UNIQUE(site_id, submission_id)`). Client reuses the same UUID on retry.

### Usage Locking
- `AccountUsage.submission_count` increments atomically on each submission
- At `plan_limit` → soft lock with 20% grace window
- At `grace_limit` → hard lock, dashboard redirects to `/app/billing`, APIs return 402
- Runtime submit endpoint continues even when locked (don't break live forms)

---

## Development Setup

```bash
# Install deps
npm install

# Start local Postgres
docker-compose up -d

# DB setup
npm run db:migrate
npm run db:seed

# Dev server
npm run dev
```

Required env vars (`.env.local`):
```
DATABASE_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
RUNTIME_SIGNING_SECRET=...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
```

---

## Build Gates

We build in gates. **Current target: Gate A (Foundation).**

See `docs/PRD.md` for full story list per gate.

**Gate A stories:**
1. Clerk Auth + Protected `/app` routes
2. Prisma Init + Base Schema
3. Account + Membership Models
4. Ensure Account on First Login
5. Account Context Resolver
6. RBAC Helpers
7. Team Page — List Members
8. Invites Data Model
9. Invite API — Create/List/Revoke
10. Invite Acceptance Flow
11. Sites Model
12. Sites CRUD UI + API
13. Site Keys (public_key + secret_key)
14. Site Key Rotation
15. Local Docker Postgres + Scripts
16. CI Pipeline (GitHub Actions)

---

## Coding Standards

- **TypeScript strict mode** — no `any`, no implicit returns
- **Server Components by default** — use `"use client"` only when needed
- **API routes** — always validate input with Zod, always check auth + RBAC
- **Prisma** — never raw SQL unless unavoidable; use transactions for multi-step writes
- **Error handling** — return structured `{ error: string, code: string }` JSON on errors
- **Tenant scoping** — every DB query MUST include `accountId` in the WHERE clause
- **No secrets in client** — `RUNTIME_SIGNING_SECRET`, `CLERK_SECRET_KEY`, etc. are server-only
- **Idempotent operations** — design DB writes to be safely retried

---

## BMAD Agents

Use `/bmad-help` in any Claude Code session to get guidance on next steps.

Available agents (via slash commands):
- `/bmad-agent-bmm-dev` — implementation work
- `/bmad-agent-bmm-architect` — architecture decisions
- `/bmad-agent-bmm-pm` — product/story refinement
- `/bmad-agent-bmm-qa` — test generation
- `/bmad-agent-bmm-sm` — sprint planning

Start here: `/bmad-agent-bmm-dev` then reference `docs/PRD.md` Gate A stories.
