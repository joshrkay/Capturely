# Capturely Go-Live Readiness Audit

**Date:** 2026-04-06  
**Auditor:** Codex agent  
**Scope:** Module-by-module and feature-by-feature launch assessment, with emphasis on database correctness, provisioning, and trial readiness.

---

## 0) Execute This Audit (Automation)

Use these commands to execute the readiness checks instead of reviewing the markdown manually:

```bash
npm run readiness:env
npm run readiness:run
```

- `readiness:env` validates required/recommended launch environment variables.
- `readiness:run` validates env then runs lint, typecheck, tests, and the Docker-backed DB cycle when Docker is available.
- `readiness:integrations` performs live external integration preflight checks (Stripe, Resend, Anthropic, GrowthBook, Shopify config).
- Subtask tracker: `docs/GO-LIVE-SUBTASKS-2026-04-06.md`

---

## 1) Executive Summary

Capturely is **functionally close** to a trial launch for core workflows (auth, account scaffolding, sites, campaigns, runtime submit, billing UI, analytics views), but it is **not yet go-live green** for a production trial without additional hardening.

Current status should be treated as:

- **🟡 Technical core mostly present** (good)
- **🟠 Operational readiness incomplete** (risk)
- **🔴 Provisioning/runbook/secrets readiness incomplete** (blocker)

Most immediate blockers are not “missing product screens” but launch-critical operational items:

1. environment + secret provisioning is under-documented,
2. full database integration verification cannot be guaranteed without Docker/Postgres in CI-like execution,
3. route-level automated coverage is partial,
4. Stripe/GrowthBook/Shopify/Resend integration paths need preflight validation in staging,
5. explicit launch checklists and rollback procedures need to be codified.

---

## 2) What Was Verified In This Audit

### Quality gates run locally

- `npm run lint` ✅ (warnings only; no errors)
- `npm run typecheck` ✅
- `npm test` ✅ (16 files, 128 tests passing)
- `npm run test:integration:local` ⚠️ blocked because Docker is unavailable in this execution environment (`docker: not found`)

### Architecture and code review focus areas

- DB connectivity and Prisma setup
- Multi-tenant account provisioning flow
- Runtime token + submit security path
- Billing/plan enforcement pathways
- Integrations + webhook footprint
- Environment variable and deployment prerequisites
- Test coverage vs API surface

---

## 3) Module-by-Module Readiness

## A. Identity, Auth, and Tenant Context

**Status:** 🟡 Mostly ready

- Clerk-based auth middleware and server-side account resolution patterns exist.
- `ensureAccountForUser()` is idempotent and creates account + owner membership when needed.
- `withAccountContext()` enforces membership and role resolution.

**Risks / gaps**

- Need explicit smoke test proving first-login auto-provision flow in an integration environment with Clerk test sessions.
- Need an operator runbook for handling users with unexpected missing membership in production.

---

## B. Database and Migrations

**Status:** 🟠 Incomplete verification

- Prisma schema is substantial and includes core gate entities (accounts, members, sites, campaigns, variants, submissions, usage, billing-related records).
- Prisma generate/typecheck/tests pass.

**Risks / gaps**

- Full DB integration cycle (`docker compose up`, `prisma migrate dev`, tests, teardown) could not run in this environment due to missing Docker.
- No explicit migration rollback/runbook is documented for production incidents.
- Need staging rehearsal for migration ordering and backup/restore verification.

---

## C. Runtime (Widget Token + Submit + Health)

**Status:** 🟡 Mostly ready

- Public health route exists for DB (`/api/health/db`).
- Runtime token/submit endpoints exist and are covered by architectural docs.
- Submission idempotency strategy exists via `(siteId, submissionId)` unique key.

**Risks / gaps**

- Need live staging test of CORS + token issuance + submission under real browser embedding conditions.
- Need explicit rate-limiting/load-test acceptance criteria prior to live traffic.

---

## D. Billing, Trial, and Plan Enforcement

**Status:** 🟠 Partially ready

- Plan definitions are implemented (`free`, `starter`, `growth`, `enterprise`) with limits/features.
- Billing status and checkout/portal endpoints exist.

**Risks / gaps**

- “Trial” semantics are not first-class in plan enums (no dedicated trial lifecycle state), so trial behavior currently appears to rely on Free/paid flows.
- Must validate Stripe webhook behavior end-to-end in staging before trial launch.
- Need support playbook for payment failure/grace/suspension and customer messaging.

---

## E. Integrations (Shopify, Webhooks, GrowthBook, Email)

**Status:** 🟠 Needs staging certification

- Integration routes and helper libraries exist.
- GrowthBook webhook and integration endpoints are present.
- Resend email helper exists.

**Risks / gaps**

- Preflight credential validation and readiness checks for each external dependency are not centralized.
- Need a staged “known-good” matrix (credentials configured, callback URLs set, webhook signatures validated, test event observed).

---

## F. Test Coverage and Release Confidence

**Status:** 🟡 Moderate confidence, not exhaustive

- Unit/integration-style Vitest suite is healthy.
- One Playwright smoke suite exists.

**Risks / gaps**

- Current tests do not fully cover every API route and cross-system integration path.
- E2E auth flows depend on bypass/session setup and are not guaranteed in all CI contexts.
- No coverage report gating by threshold is defined for release.

---

## 4) Provisioning & Trial Readiness Assessment

## Can you run a trial today?

**Answer:** **Yes, for an internal/controlled trial** with manual setup and close monitoring.  
**Not yet a confident open external trial** without the checklist items below completed.

## Provisioning concerns discovered

1. `.env.example` previously documented only `CRON_SECRET`, which is insufficient for any real deployment.
2. Multiple integrations require secrets and callback URLs that must be correctly configured before trial traffic.
3. Database bootstrap is dependent on Docker/Postgres locally; production equivalents need explicit runbooks.

---

## 5) What’s Missing (Go-Live Checklist)

## P0 — Must complete before external trial

1. **Provisioning completeness**
   - Ensure all required env vars are documented and validated at deploy time.
   - Add startup validation / preflight checks for required secrets in production.
2. **DB launch certification**
   - Run full integration flow in Docker-enabled CI/staging.
   - Perform migration rehearsal on staging snapshot.
3. **External dependency certification**
   - Stripe webhook signing verified with test events.
   - GrowthBook API and webhook callbacks verified.
   - Shopify OAuth callback flow verified.
   - Resend sender domain and deliverability smoke tested.
4. **Operational runbooks**
   - Incident response for DB outage, webhook backlog, Stripe mismatch.
   - Rollback plan for migrations and application deploy.

## P1 — Strongly recommended before broader rollout

1. Expand route-level tests for high-risk endpoints (runtime, billing, integrations, campaign publish).
2. Add synthetic health checks and alerting for DB + critical APIs.
3. Add trial funnel analytics dashboards (activation → first site → first publish → first submission).
4. Add rate limiting / abuse monitoring verification under load.

## P2 — Nice-to-have

1. Formal QA signoff template by module.
2. Release readiness scorecard in repo and CI artifacts.
3. Disaster recovery game-day exercises.

---

## 6) Recommended Launch Decision Framework

Use this strict gate:

- **Go / No-go = NO-GO** until all P0 items are complete and signed off.
- Move to **limited pilot GO** only after:
  - staging DB migration rehearsal passes,
  - external integrations are certified,
  - required env + secrets are verified,
  - and a rollback plan is documented.

Once that is done, begin with a **small closed trial cohort** (5–20 customers), observe for 1–2 weeks, then expand.

---

## 7) Immediate Next Actions (Suggested 7-Day Plan)

1. Day 1–2: finalize env/secret manifest + deploy-time validation.
2. Day 2–3: run DB migration rehearsal + backup/restore drill.
3. Day 3–4: integration certification (Stripe/GrowthBook/Shopify/Resend).
4. Day 4–5: fill route-level test gaps for critical APIs.
5. Day 5–7: pilot readiness review + runbook signoff + launch review.

