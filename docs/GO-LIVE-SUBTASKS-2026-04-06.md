# Capturely Go-Live Subtasks Tracker

**Created:** 2026-04-06  
**Goal:** Move from readiness assessment to execution with accountable subtasks.

## Status Legend
- [x] done
- [~] in progress / automated but blocked by missing credentials or infra
- [ ] pending

---

## P0 — Launch Blockers

### Provisioning & Secrets
- [x] Build required env manifest in `.env.example`.
- [x] Add executable env validator (`npm run readiness:env`).
- [~] Populate real production/staging secrets (`.env.local` in each environment).
- [ ] Add secret rotation schedule and owner assignment.

### Core Readiness Execution
- [x] Add executable runner (`npm run readiness:run`) for lint/typecheck/tests.
- [x] Add evidence capture for command outputs (`docs/evidence/logs/*`).
- [x] Add screenshot evidence for pass/fail command runs (`docs/evidence/screenshots/*`).
- [~] Run Docker-backed DB integration cycle in Docker-enabled environment.

### External Integrations
- [x] Add integration readiness script (`npm run readiness:integrations`).
- [~] Validate Stripe API key and webhook secret in staging.
- [~] Validate Resend API key + sender domain in staging.
- [~] Validate Anthropic API key with live model list request.
- [~] Validate GrowthBook API host/key against `/api/v1/features`.
- [~] Validate Shopify key/secret with OAuth callback flow.

### Launch Governance
- [x] Create go-live readiness audit doc.
- [x] Convert audit to executable entry points (`readiness:*` scripts).
- [ ] Define explicit go/no-go signoff template (Engineering, Product, Ops).

---

## P1 — Strongly Recommended Before Public Trial

### Database Safety
- [ ] Execute migration rehearsal on staging snapshot.
- [ ] Document rollback procedure with tested commands.
- [ ] Verify backup + restore drill completion.

### Test Depth
- [ ] Add route-level tests for runtime token/submit failure modes.
- [ ] Add tests for billing webhook idempotency edge cases.
- [ ] Add integration tests for integrations API routes.

### Observability
- [ ] Add synthetic health checks for `/api/health/db` and critical APIs.
- [ ] Add alerts for API failures and webhook delivery failures.
- [ ] Add release dashboard showing readiness script outcomes.

---

## P2 — Post-Launch Hardening

- [ ] Add disaster recovery game-day exercise.
- [ ] Add automated weekly readiness run in CI schedule.
- [ ] Add per-integration status page in dashboard.

---

## Execution Commands

```bash
npm run readiness:env
npm run readiness:run
npm run readiness:integrations
npm run readiness:full
```

## Current Blocking Conditions (as of 2026-04-06)

1. Required env vars are missing in this execution environment.
2. Docker is not installed in this execution environment.
3. External API keys were not available to complete live integration checks.
