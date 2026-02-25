# Capturely PRD

**Linear:** https://linear.app/jkay/project/capturely-6f3b3d1debcf/overview

## Stack
- Next.js 15 App Router
- TypeScript
- Prisma + PostgreSQL (Neon in prod)
- Clerk (auth)
- Tailwind CSS
- Deployed on Vercel

## Architecture Overview

- Merchants embed `<script src="/widget.js" data-public-key="pk_xxx">` on their site
- Server generates a versioned manifest JSON per site (published campaigns only)
- Widget fetches manifest from CDN/local using public_key
- Runtime evaluates targeting rules, triggers popup/inline
- Widget requests a 60s signed token before submit (RUNTIME_SIGNING_SECRET)
- Submit endpoint validates strictly using shared library (runtime+server parity)
- Webhooks forward to Zapier/etc with strict payload + retry logic

---

## Gate A — Foundation (Auth, DB, Accounts, RBAC, Sites, CI)

| Story | Summary |
|-------|---------|
| Clerk Auth + Protected /app routes | Next.js middleware, /sign-in, /sign-up, 401 on unauthed APIs |
| Prisma Init + Base Schema | Postgres datasource, db:migrate/generate/seed scripts, /api/health/db |
| Account + Membership Models | Account, AccountMember (owner/admin/member), unique per user MVP |
| Ensure Account on First Login | ensureAccountForUser() idempotent, creates Account+owner membership |
| Account Context Resolver | withAccountContext() helper - resolves accountId+role, 403 on no membership |
| RBAC Helpers | canManageTeam/Sites/Campaigns/Billing/View() - centralized, unit tested |
| Team Page - List Members | /app/settings/team, GET /api/team/members, all roles can view |
| Invites Data Model | Invite model: account_id, email, role, token (crypto), status, expires_at |
| Invite API - Create/List/Revoke | POST/GET /api/invites, /revoke, RBAC owner/admin only |
| Invite Acceptance Flow | /accept-invite?token=..., validate + create membership, idempotent |
| Sites Model | Site: account_id, name, primary_domain (normalized), platform_type, status |
| Sites CRUD UI + API | /app/sites, GET/POST/PATCH/archive APIs, RBAC enforced |
| Site Keys (public_key + secret_key) | pk_... and sk_... generated on create, owner/admin only visibility |
| Site Key Rotation | POST /api/sites/:id/rotate-keys, confirm dialog UI |
| Local Docker Postgres + Scripts | docker-compose, npm run db:up/down/migrate/seed, README setup |
| CI Pipeline | GitHub Actions: lint+typecheck+unit+integration, Postgres service container |

---

## Gate B — Manifest + Runtime + Forms

| Story | Summary |
|-------|---------|
| Manifest JSON Schema | SiteManifestV1 type: campaigns, targeting, triggers, frequency, experiments, variants, fields with stable field_id and options.value |
| Publish Pipeline | Builds manifest from active/published campaigns only; excludes paused/archived |
| Dev "CDN" Storage | Write manifest to /public/manifests/{publicKey}.json on publish (dev) |
| widget.js Loader | Reads data-public-key, fetches manifest, stores in memory, idempotent init |
| URL Targeting Engine | Evaluate all/equals/contains/starts_with/does_not_contain rules |
| Trigger Engine | delay, scroll%, exit_intent (desktop), click-to-open; fires once, cleanup listeners |
| Popup Shell | title, description, close btn, ESC, backdrop click, role=dialog, focus mgmt, responsive |
| Core Form Field Rendering | text/email/phone/textarea/dropdown/radio/checkbox/hidden/submit; state by field_id; submission_id UUID per attempt; strict payload |
| Shared Visibility + Validation Library | packages/shared/forms/: evaluateVisibility(), validateSubmission(), normalizeFields(); shared by runtime + server |
| Conditional Logic Runtime | Wire runtime to shared evaluateVisibility(); omit non-visible from payload |

---

## Gate C — Secure Submit + Submissions + Webhooks

| Story | Summary |
|-------|---------|
| Runtime Token Endpoint | POST /api/runtime/token; origin validation; 60s signed JWT; rate limit by (site_public_key, ip_hash); full CORS preflight |
| Secure Submit Endpoint | POST /api/runtime/submit; token+origin+rate limit+honeypot+strict validation+idempotency by submission_id |
| Submissions Data Model | Submission: account_id, site_id, campaign_id, submission_id (UUID), email/phone/name, fields_json, status, unique (site_id, submission_id) |
| account_usage Counters | AccountUsage: submission_count, overage_count, usage_locked; 20% grace threshold; atomic increment |
| Webhook Delivery | Strict payload with submission_id for dedup; retry 2-3x exponential backoff; gated by usage_locked/payment_suspended |
| Dashboard Lock Redirect | usage_locked OR payment_suspended → redirect /app/* to /app/billing; blocked APIs return 402 |
| Submissions Table UI | /app/submissions: paged list, filter by campaign, search by email, status filter; mark read/archive |

---

## Gate D — Analytics + Notifications

| Story | Summary |
|-------|---------|
| Daily Metrics Model | DailyMetric: impressions/submissions/participants per (campaign, variant, date); atomic upsert increments |
| Impression Endpoint | POST /api/runtime/impression; CORS+origin validation; increments impressions_count on render |
| Submission Increments Metrics | Submit handler increments submissions_count; skips on idempotent duplicate |
| Participant Tracking | ExperimentParticipant model; POST /api/runtime/participant; deduped by (experiment_id, visitor_id) |
| Analytics Overview API | GET /api/analytics/overview; totals + daily series + top campaigns; tenant scoped |
| Analytics Overview UI | /app/analytics; metric cards, 3 line charts, top campaigns table, 7d/30d/90d range |
| Campaign Analytics API | GET /api/analytics/campaign/:id; per-campaign + per-variant daily series |
| Campaign Analytics UI | /app/campaigns/:id/analytics; metric cards + Control vs Variant comparison charts |
| Significance Feature Flag | selectWinner() utility; EXPERIMENT_SIGNIFICANCE_ENABLED flag; deterministic tie-breaker → Control |
| In-App Notifications Model | Notification: type/title/body/link_url/read_at; GET /api/notifications; POST /:id/read |
| Notification Bell UI | Bell icon + unread badge + dropdown; mark read + deep-link navigation |

---

## Gate E — Billing (Stripe + Plan Enforcement)

| Story | Summary |
|-------|---------|
| Plan Model + Resolver | PlanKey: free/starter; plan config in code; resolvePlan() returns flags + grace_limit; server-side only |
| Account Billing Fields | Extend Account: plan_key, stripe_customer_id, stripe_subscription_id, payment_status, payment_grace_until, billing_cycle_start/end |
| Stripe Checkout Session | POST /api/billing/checkout; creates Stripe Checkout for Starter; returns { url } |
| Stripe Billing Portal | POST /api/billing/portal; returns portal { url } for Starter users |
| Stripe Webhook Intake | POST /api/stripe/webhook; raw body + signature verification; dispatches by event type |
| Stripe Webhook Idempotency | ProcessedStripeEvent table; dedupes by event_id; prevents double processing |
| Subscription Lifecycle | Handles checkout.session.completed, subscription.updated/deleted → updates plan_key, billing cycle, payment_status |
| Payment Failed → Past Due | invoice.payment_failed → payment_status=past_due, grace_until=now+7d, in-app + Resend email |
| Suspend After Grace Expiry | past_due + now > grace_until → suspended; dashboard locks to billing; webhooks pause; runtime continues |
| Payment Succeeded → Resume | invoice.payment_succeeded → clears grace/suspended; dashboard unlocks; webhooks resume |
| Usage Overage Notifications | First crossing of plan_limit → notification + email; first crossing of grace_limit → notification + email; once-per-cycle |
| Billing Page UI | /app/billing; plan + usage + payment status; upgrade/portal CTAs; banners for past_due/suspended/locked |
| Resend Email Templates | payment_failed/suspended/resumed, usage_overage/locked, experiment_completed; html + text |
| Reset Usage on Cycle Renewal | Subscription period update → reset AccountUsage counters + clear lock; idempotent |

---

## Gate G — Campaign Builder UI (The Core Product)

| Story | Summary |
|-------|---------|
| Campaign Model | Campaign: id, account_id, site_id, name, type (popup/inline), status (draft/published/paused/archived), has_unpublished_changes |
| Variant Model | Variant: campaign_id, name, is_control, traffic_percentage, schema_json, schema_version; auto-creates Control on campaign creation |
| Create Campaign UI | /app/campaigns/new; select site + name + type; creates campaign + control variant; redirects to builder |
| Builder Three-Panel Layout | /app/campaigns/:id/builder; left palette, center canvas, right settings tabs; header with Save/Publish/status badge |
| Field Palette | text/email/phone/textarea/dropdown/radio/checkbox/hidden/submit; generates stable field_id; submit always last |
| Drag-and-Drop Reordering | Drag handles on fields; reorder updates schema_json; submit cannot be moved above others |
| Field Settings Panel | Label, required toggle, placeholder, options editor (dropdown/radio with stable value+label); live preview update |
| Conditional Logic UI | Single condition: depends_on field + operator (equals/not_equals) + value; only prior fields as dependencies |
| Style Panel | Background/text/button colors, border radius, font preset; CSS variables for live preview; stored in schema_json.style |
| Campaign Settings Tab | Targeting, triggers (delay/scroll/exit/click), frequency (session/x_days/max), webhook override URL |
| Save Draft | Persists campaign config + schema_json to DB; does NOT publish; sets has_unpublished_changes=true |
| Publish Campaign | Validates schema, compiles manifest, updates status=published, clears has_unpublished_changes |
| Template Library | 10 template JSON definitions; gallery UI with search + cards; "Use template" creates campaign with template schema |
| Enable A/B Toggle (Starter) | Creates clone of Control as Variant; sets 50/50 split; Free plan sees disabled toggle + upgrade prompt |
| Traffic Split Control | Slider/inputs; min 10% each; sum must = 100; persists to variants.traffic_percentage |
| Variant Limit Enforcement | Server-side: Starter max 2 experiences; 403 with code=plan_limit; UI disables add when at limit |

---

## Gate F — Developer Experience + Quality

| Story | Summary |
|-------|---------|
| Storybook Setup | Storybook for Next.js App Router; npm run storybook/build-storybook; 6 baseline stories (builder, billing, analytics, submissions) |
| Storybook Mock Data Layer | /storybook/fixtures/ with JSON fixtures for all entity types; makeCampaign() etc. helpers |
| Chromatic Visual Regression | Chromatic connected to repo; GitHub Actions uploads Storybook on PR; CHROMATIC_PROJECT_TOKEN in CI secrets |
| Visual Reference Mapping | /docs/visual-references.md mapping BUILDER-01..09, ANALYTICS-01..03, BILLING-01..03, SUBMISSIONS-01, NOTIF-01, RUNTIME-01 to components |
| PR Template + QA Checklist | .github/pull_request_template.md with checklist; docs/review-checklist.md with AI PR review rules (tenant scoping, authz, idempotency, CORS, rate limiting, billing locks) |
| Playwright Smoke Tests | 3 smoke tests: /app/sites, /app/billing, /app/analytics; CI job; mock auth strategy |

---

## Key Design Decisions

- **field_id stability**: Options have stable `value` (used server-side) vs `label` (display only)
- **Shared validation library**: Runtime and server share exact same visibility + validation logic
- **submission_id**: Client-generated UUID, reused on retry, deduplicated at DB level
- **Token flow**: Widget → POST /token (60s JWT) → POST /submit (uses token)
- **Usage locking**: plan_limit + 20% grace window before hard lock
- **No secrets in manifest**: Only public_key; secret_key never leaves server
