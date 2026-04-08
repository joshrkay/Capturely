# Capturely Go-To-Market Readiness Audit (March 25, 2026)

## Objective

Establish a clear, evidence-based view of:
1. What is implemented and likely production-usable now.
2. What is partially implemented and needs hardening.
3. What is missing for a credible go-to-market launch in the next 7 days.

---

## Executive Summary

Capturely is beyond “prototype” stage and already has substantial launch-ready surface area:
- Multi-tenant auth, RBAC, settings, invites, site management, runtime token + secure submit, submissions table, billing APIs/UI, analytics routes, campaigns builder pages, templates, integrations, and AI endpoints are present.
- Core data models cover major domains through Gate H (including OptimizationRun, AiGenerationLog, Billing, ExperimentEvent).

The main risk for a next-week market launch is **operational reliability + polish**, not raw feature absence. Most urgent gaps are:
- test environment reproducibility (dependencies not installed in this container),
- integration hardening (Shopify/WordPress “native” depth and production credentials flow),
- optimization and GrowthBook edge-case handling,
- launch packaging (onboarding, docs, instrumentation, and incident-ready monitoring).

---

## Current State: Implemented & Working (Code-Confirmed)

## 1) Foundation, security, tenancy, and data layer

Implemented indicators:
- Clerk auth routes and middleware-protected app shell.
- Tenant/account context and RBAC helpers.
- Prisma schema includes accounts, members, invites, sites, submissions, usage, notifications, campaigns, variants, experiment events, billing fields, processed Stripe events, optimization runs, and AI generation logs.

Launch implication: ✅ strong foundational architecture for multi-tenant SaaS.

## 2) Runtime and submission pipeline

Implemented indicators:
- Runtime token endpoint + runtime submit endpoint are present.
- Shared forms package + widget package exist, indicating schema/validation parity path and embeddable widget runtime.
- Submissions UI and API routes exist.

Launch implication: ✅ core value path (“embed → collect lead → view submission”) is present.

## 3) Campaign creation and editing surface

Implemented indicators:
- Campaign APIs for CRUD/publish/variants/analytics/optimization routes.
- Builder UI exists with variant panel, traffic slider, display settings, style editor, spam settings, preview, multi-step editor.
- Template flow and dedicated templates page/components exist.

Launch implication: ✅ campaign authoring surface is substantial enough for MVP launch.

## 4) Billing and plan enforcement surface

Implemented indicators:
- Billing endpoints for checkout, portal, status.
- Stripe webhook route exists.
- Account and usage schema fields support plan/payment states and lock/grace mechanics.

Launch implication: ✅ monetization path exists, but needs final end-to-end verification in live Stripe modes.

## 5) Analytics / experimentation / optimization scaffolding

Implemented indicators:
- Analytics overview API and campaign analytics page routes exist.
- GrowthBook integration library and webhook route present.
- Cron optimization route implements challenger generation, circuit breaker checks, run limits, and manifest republish behavior.
- Optimization UI page exists with run timeline and lift summary.

Launch implication: ⚠️ feature-complete in structure, but requires production hardening and deterministic QA for trust.

## 6) Integrations surface

Implemented indicators:
- Integrations list + per-platform cards (Shopify, WordPress, Zapier, webhooks).
- Shopify OAuth auth/callback flow routes exist and include HMAC/state checks.
- Webhook management routes exist.

Launch implication: ⚠️ integration UX is present; production depth and support readiness still need validation.

---

## Gaps & Risks for Next-Week Go-To-Market

## A) High-priority (must close before launch)

1. **Quality gate reproducibility is currently blocked in this environment**
- `npm run test` and `npm run typecheck` fail here because `prisma` binary is missing (dependencies not installed).
- Risk: cannot claim release confidence without green CI/local verification baseline.

2. **Placeholder/temporary behavior still visible in production paths**
- GrowthBook webhook email path uses placeholder-style owner email derivation (`noreply+{userId}@capturely.io`) and comments indicate Clerk lookup still needed.
- Risk: incomplete notification integrity for optimization outcomes.

3. **Go-live operational checklist is not codified in repo**
- Existing docs are strong on product direction but do not provide a one-week cut plan with launch gates and owners.
- Risk: last-week thrash and missed blockers.

## B) Medium-priority (can launch with controlled scope)

4. **Platform integrations are unevenly deep**
- Shopify has OAuth + script tag workflow.
- WordPress integration currently presents install instructions (plugin lifecycle not represented in this repo).
- Risk: “native integrations” positioning may exceed current delivered depth.

5. **Optimization automation requires bounded launch posture**
- Auto-optimization flow exists, but should launch with guardrails (feature flag, limited cohort, rollback controls, explicit SLA language).
- Risk: unexpected variant regressions despite circuit breaker.

6. **E2E coverage appears smoke-level, not exhaustive**
- Smoke suite covers route availability and basic authenticated surfaces.
- Risk: hidden regressions in deeper builder, billing, and optimization interactions.

---

## Recommended GTM Scope (Next 7 Days)

## Launch Promise (what to sell next week)

Position Capturely as:
- “AI-assisted popup/form builder with built-in experimentation foundations,”
- with Shopify connection + webhooks + team collaboration + billing,
- and “auto-optimization beta” (opt-in), not yet a guaranteed autonomous engine for all accounts.

This keeps claims aligned with the current implementation confidence envelope.

---

## 7-Day Execution Plan

## Day 1 — Release candidate baseline
- Install dependencies and produce a clean local verification run:
  - typecheck
  - unit tests
  - smoke e2e (authenticated path)
- Freeze a release branch and open a launch war-room issue tracker.
- Output: pass/fail matrix and blocker list with owners.

## Day 2 — Integration hardening
- Shopify: validate OAuth, token exchange, script injection, reconnect/disconnect flow on staging store.
- WordPress: either (a) ship/installable plugin + docs, or (b) downgrade launch messaging to “embed + key setup workflow.”
- Output: one “golden path” test script per integration.

## Day 3 — Billing and entitlement validation
- End-to-end Stripe test clock scenario coverage:
  - trial/upgrade,
  - payment failure → grace,
  - grace expiry behavior,
  - payment recovery.
- Verify plan-based feature gating in UI/API matches product copy.
- Output: signed billing QA checklist.

## Day 4 — Optimization + analytics safety pass
- Put auto-optimization behind default-off launch flag.
- Validate GrowthBook webhook winner path + notification writes + manifest republish in staging.
- Add explicit rollback runbook for bad variant outcomes.
- Output: “Optimization Beta Playbook.”

## Day 5 — Onboarding and docs polish
- Build first-session onboarding checklist:
  1) create site,
  2) connect integration,
  3) create campaign from template,
  4) publish,
  5) confirm first submission,
  6) view analytics.
- Add in-app and external docs for setup + troubleshooting.
- Output: launch docs + support macros.

## Day 6 — Instrumentation and incident readiness
- Ensure error tracking, API health checks, and key business metrics dashboards are live.
- Define launch-day alert thresholds and escalation contacts.
- Output: on-call sheet + incident comms template.

## Day 7 — Launch rehearsal + cut
- Conduct full dress rehearsal with a fresh account.
- Run scripted end-to-end demo and confirm no critical issues.
- Freeze non-essential merges; deploy launch candidate.
- Output: go/no-go decision using objective gates.

---

## Go/No-Go Checklist (Objective)

A “Go” requires all of:
- Typecheck and automated tests passing in CI.
- At least one successful end-to-end lead capture flow per integration being marketed.
- Billing lifecycle scenarios verified in Stripe test mode.
- At least one successful optimization run in staging (if beta is advertised).
- Support docs and escalation contacts published.

If any one of these fails, launch should narrow scope (or slip) instead of overpromising.

---

## Verification Command Notes

- Use `npm run test` for unit/integration checks in this repository (Vitest does not support Jest's `--runInBand` flag).
- Use `npm run typecheck` for TypeScript validation.
- If dependency setup is missing in a fresh environment, run `npm ci` first.

---

## Suggested Owner Model

- Engineering Lead: release quality gate and incident readiness.
- Product Lead: launch scope decisions and promise discipline.
- Growth/Marketing: positioning language aligned with real integration depth.
- Support/CS: onboarding scripts + canned responses + escalation triage.

---

## Notes on Confidence Level

This audit is based on repository code presence and route-level inspection, not a fully executed end-to-end staging verification in this environment. Therefore:
- “Implemented” means code is present and appears wired.
- “Launch-ready” should be confirmed only after Day 1–4 execution above.
