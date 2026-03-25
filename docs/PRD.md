# Capturely PRD

**Linear:** https://linear.app/jkay/project/capturely-6f3b3d1debcf/overview

## Vision

Capturely is an **AI-powered, self-optimizing form builder** for e-commerce and content sites. Merchants embed a lightweight widget on their Shopify, WordPress, or any website. The AI copilot helps build high-converting forms, and the automatic optimization engine continuously tests and improves them — no manual A/B testing required.

**Differentiators:**
- AI copilot generates forms, copy, and styling from natural language descriptions
- Automatic multivariate testing (A/B/C/D/E+) via GrowthBook
- Self-optimizing loop: AI generates challengers → experiments run → winners auto-promote → repeat
- Embeddable anywhere via a single script tag

## Stack

- Next.js 15 App Router, TypeScript
- Prisma + PostgreSQL (Neon in prod)
- Clerk (auth)
- Tailwind CSS
- Deployed on Vercel
- GrowthBook (experimentation platform — self-hosted Docker dev, Cloud prod)
- Claude API via @anthropic-ai/sdk (AI copilot + variant generation)
- Stripe (billing)
- Resend (email)

## Architecture Overview

### Widget Flow
- Merchants embed `<script src="/widget.js" data-public-key="pk_xxx">` on their site
- Widget fetches versioned manifest JSON per site (all variant schemas keyed by variant ID)
- Widget initializes GrowthBook JS SDK (~2KB gzip) to determine which variant to render
- Runtime evaluates targeting rules, triggers popup/inline, renders the assigned variant
- Widget requests a 60s signed token before submit (RUNTIME_SIGNING_SECRET)
- Submit endpoint validates strictly using shared library (runtime+server parity)
- Submission includes variant_id + experiment_id for attribution
- Webhooks forward to Zapier/etc with strict payload + retry logic

### Experimentation Flow
- GrowthBook handles all traffic splitting, statistical analysis, and winner determination
- Capturely's ExperimentEvent table serves as GrowthBook's data source (impressions + conversions)
- GrowthBook webhooks notify Capturely when experiments reach significance

### Optimization Loop
```
[Enable] → [AI generates challengers (Claude)] → [Validate & publish]
    → [Run experiment (GrowthBook)] → [Wait for significance]
    → [Promote winner as new control] → [AI generates new challengers] → [repeat]
```

---

## Gate A — Foundation (Auth, DB, Accounts, RBAC, Sites, CI)

| Story | Summary |
|-------|---------|
| Clerk Auth + Protected /app routes | Next.js middleware, /sign-in, /sign-up, 401 on unauthed APIs |
| Prisma Init + Base Schema | Postgres datasource, db:migrate/generate/seed scripts, /api/health/db |
| Account + Membership Models | Account, AccountMember (owner/admin/member), unique per user MVP |
| Ensure Account on First Login | ensureAccountForUser() idempotent, creates Account+owner membership |
| Account Context Resolver | withAccountContext() helper — resolves accountId+role, 403 on no membership |
| RBAC Helpers | canManageTeam/Sites/Campaigns/Billing/View() — centralized, unit tested |
| Settings Team Tab — List Members | /app/settings?tab=team, GET /api/team/members, all roles can view |
| Invites Data Model | Invite model: account_id, email, role, token (crypto), status, expires_at |
| Invite API — Create/List/Revoke | POST/GET /api/invites, /revoke, RBAC owner/admin only |
| Invite Acceptance Flow | /accept-invite?token=..., validate + create membership, idempotent |
| Sites Model | Site: account_id, name, primary_domain (normalized), platform_type, status |
| Sites CRUD UI + API | /app/sites, GET/POST/PATCH/archive APIs, RBAC enforced |
| Site Keys (public_key + secret_key) | pk_... and sk_... generated on create, owner/admin only visibility |
| Site Key Rotation | POST /api/sites/:id/rotate-keys, confirm dialog UI |
| Local Docker Postgres + Scripts | docker-compose, npm run db:up/down/migrate/seed, README setup |
| CI Pipeline | GitHub Actions: lint+typecheck+unit+integration, Postgres service container |

**Status:** Stories 1–6, 15–16 are built. Stories 7–14 remain.

---

## Gate B — Manifest + Runtime + Forms

| Story | Summary |
|-------|---------|
| Manifest JSON Schema | SiteManifestV1: campaigns with all variant schemas keyed by variant ID; targeting, triggers, frequency, fields with stable field_id and options.value. GrowthBook SDK handles variant assignment — no experiment logic in manifest |
| Publish Pipeline | Builds manifest from active/published campaigns; includes all variant schemas; excludes paused/archived |
| Dev "CDN" Storage | Write manifest to /public/manifests/{publicKey}.json on publish (dev) |
| widget.js Loader | Reads data-public-key, fetches manifest, initializes GrowthBook JS SDK with visitor_id (first-party cookie), gets variant assignment, renders corresponding schema |
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
| Secure Submit Endpoint | POST /api/runtime/submit; token+origin+rate limit+honeypot+strict validation+idempotency by submission_id; includes variant_id + experiment_id in payload |
| Submissions Data Model | Submission: account_id, site_id, campaign_id, variant_id, experiment_id, submission_id (UUID), email/phone/name, fields_json, status, unique (site_id, submission_id) |
| AccountUsage Counters | AccountUsage: submission_count, overage_count, usage_locked; 20% grace threshold; atomic increment |
| Webhook Delivery | Strict payload with submission_id for dedup; retry 2–3x exponential backoff; gated by usage_locked/payment_suspended |
| Dashboard Lock Redirect | usage_locked OR payment_suspended → redirect /app/* to /app/billing; blocked APIs return 402 |
| Submissions Table UI | /app/submissions: paged list, filter by campaign, search by email, status filter; mark read/archive |

---

## Gate D — Analytics + GrowthBook Integration

| Story | Summary |
|-------|---------|
| GrowthBook Instance Setup | Self-hosted GrowthBook via Docker (dev) or GrowthBook Cloud (prod); MongoDB container for GrowthBook state; env vars: GROWTHBOOK_API_HOST, GROWTHBOOK_CLIENT_KEY, GROWTHBOOK_SECRET_KEY |
| GrowthBook SDK Integration (Server) | @growthbook/growthbook Node SDK; server-side feature evaluation for API routes; singleton in src/lib/growthbook.ts |
| GrowthBook SDK Integration (Widget) | @growthbook/growthbook JS SDK bundled into widget.js; evaluates features client-side using visitor_id; ~2KB gzip; caches last-known assignment; falls back to control if unavailable |
| GrowthBook Data Source | Configure Capturely's Postgres as GrowthBook data source; ExperimentEvent table/view for metric computation |
| ExperimentEvent Model | ExperimentEvent: visitor_id, experiment_key, variation_id, event_type (impression/conversion), timestamp, campaign_id, site_id — raw data GrowthBook reads |
| Impression Tracking | POST /api/runtime/impression; writes ExperimentEvent with type=impression; CORS+origin validation |
| Conversion Tracking | Submit handler writes ExperimentEvent with type=conversion; skips on idempotent duplicate |
| GrowthBook Experiment CRUD API | POST/GET/PATCH /api/experiments; wraps GrowthBook API to create/update experiments; maps Capturely campaigns to GrowthBook experiments |
| GrowthBook Webhook Receiver | POST /api/growthbook/webhook; receives experiment status updates (completed, winner found); triggers winner promotion |
| Analytics Overview API | GET /api/analytics/overview; reads ExperimentEvent for dashboard metrics (impressions, submissions, conversion rates); tenant scoped |
| Analytics Overview UI | /app/analytics; metric cards, charts, top campaigns; links to GrowthBook for detailed experiment results; 7d/30d/90d range |
| Campaign Analytics UI | /app/campaigns/:id/analytics; per-variant performance; embeds or links to GrowthBook experiment results for statistical analysis |
| Notifications Model + UI | Notification: type/title/body/link_url/read_at; bell icon + unread badge + dropdown; experiment completion notifications via GrowthBook webhook |

---

## Gate E — Billing (Stripe + Plan Enforcement)

### Plan Tiers

| | Free | Starter | Growth | Enterprise |
|---|------|---------|--------|------------|
| Sites | 1 | 3 | 10 | Unlimited |
| Submissions/mo | 100 | 1,000 | 10,000 | Custom |
| A/B Testing | No | Manual, 2 variants | Multivariate, 5 variants | Unlimited variants |
| AI Copilot | No | No | Yes (500 AI gens/mo) | Yes (unlimited) |
| Auto-Optimization | No | No | Yes | Yes |
| Support | Community | Email | Priority | Dedicated |

### Stories

| Story | Summary |
|-------|---------|
| Plan Model + Resolver | PlanKey: free/starter/growth/enterprise; plan config in code; resolvePlan() returns flags + limits + grace_limit; server-side only |
| Account Billing Fields | Extend Account: plan_key, stripe_customer_id, stripe_subscription_id, payment_status, payment_grace_until, billing_cycle_start/end |
| Stripe Checkout Session | POST /api/billing/checkout; creates Stripe Checkout for selected plan; returns { url } |
| Stripe Billing Portal | POST /api/billing/portal; returns portal { url } for paid users |
| Stripe Webhook Intake | POST /api/stripe/webhook; raw body + signature verification; dispatches by event type |
| Stripe Webhook Idempotency | ProcessedStripeEvent table; dedupes by event_id; prevents double processing |
| Subscription Lifecycle | Handles checkout.session.completed, subscription.updated/deleted → updates plan_key, billing cycle, payment_status |
| Payment Failed → Past Due | invoice.payment_failed → payment_status=past_due, grace_until=now+7d, in-app + Resend email |
| Suspend After Grace Expiry | past_due + now > grace_until → suspended; dashboard locks to billing; webhooks pause; runtime continues |
| Payment Succeeded → Resume | invoice.payment_succeeded → clears grace/suspended; dashboard unlocks; webhooks resume |
| Usage Overage Notifications | First crossing of plan_limit → notification + email; first crossing of grace_limit → notification + email; once-per-cycle |
| AI Usage Tracking | Track AI generation calls per account; ai_generations_count on AccountUsage; enforce plan limit; return 402 when exceeded |
| Billing Page UI | /app/billing; plan + usage + payment status; Free/Starter/Growth/Enterprise tier cards; upgrade/portal CTAs; banners for past_due/suspended/locked |
| Resend Email Templates | payment_failed/suspended/resumed, usage_overage/locked, experiment_completed; html + text |
| Reset Usage on Cycle Renewal | Subscription period update → reset AccountUsage counters (submissions + AI generations) + clear lock; idempotent |

---

## Gate F — Campaign Builder UI (Base)

| Story | Summary |
|-------|---------|
| Campaign Model | Campaign: id, account_id, site_id, name, type (popup/inline), status (draft/published/paused/archived), has_unpublished_changes, auto_optimize (boolean), optimization_status |
| Variant Model | Variant: campaign_id, name, is_control, traffic_percentage, schema_json, schema_version, growthbook_feature_key, generated_by (manual/ai/auto_optimization); auto-creates Control on campaign creation |
| Create Campaign UI | /app/campaigns/new; select site + name + type; creates campaign + control variant; redirects to builder |
| Builder Three-Panel Layout | /app/campaigns/:id/builder; left palette, center canvas, right settings tabs; header with Save/Publish/status badge |
| Field Palette | text/email/phone/textarea/dropdown/radio/checkbox/hidden/submit; generates stable field_id; submit always last |
| Drag-and-Drop Reordering | Drag handles on fields; reorder updates schema_json; submit cannot be moved above others |
| Field Settings Panel | Label, required toggle, placeholder, options editor (dropdown/radio with stable value+label); live preview update |
| Conditional Logic UI | Single condition: depends_on field + operator (equals/not_equals) + value; only prior fields as dependencies |
| Style Panel | Background/text/button colors, border radius, font preset; CSS variables for live preview; stored in schema_json.style |
| Campaign Settings Tab | Targeting, triggers (delay/scroll/exit/click), frequency (session/x_days/max), webhook override URL |
| Save Draft | Persists campaign config + schema_json to DB; does NOT publish; sets has_unpublished_changes=true |
| Publish Campaign | Validates schema, compiles manifest with all variant schemas, syncs experiment to GrowthBook if variants > 1, updates status=published, clears has_unpublished_changes |
| Template Library | 10 template JSON definitions; gallery UI with search + cards; "Use template" creates campaign with template schema |
| Enable A/B Toggle | Creates clone of Control as Variant; creates GrowthBook experiment via API; sets 50/50 split; Free plan sees disabled toggle + upgrade prompt |
| Traffic Split Control | Slider/inputs; min 10% each; sum must = 100; syncs to GrowthBook experiment traffic allocation |
| Variant Limit Enforcement | Server-side plan check: starter=2, growth=5, enterprise=unlimited; 403 with code=plan_limit; UI disables add when at limit |

---

## Gate G — AI Copilot Builder

| Story | Summary |
|-------|---------|
| Claude API Integration | Server-side Claude client (@anthropic-ai/sdk); centralized in src/lib/ai/claude.ts; streaming support; growth+ plan only |
| AI Generation API | POST /api/ai/generate; accepts prompt + context (campaign type, industry, site URL); returns structured form schema_json; RBAC + plan check |
| AI Usage Metering | Increment ai_generations_count per call; enforce plan limit; return 402 when exceeded |
| AI Copilot Panel | New panel/tab in builder UI; chat-like interface; "Describe your form" text input; streaming response display |
| Form Generation from Description | User types "lead capture form for a fitness studio" → Claude generates complete schema_json with fields, labels, placeholders, styling |
| Field Suggestion Engine | Given current fields + campaign type, suggest next fields; POST /api/ai/suggest-fields; returns ranked field suggestions with rationale |
| Copy Generation | Select a field → "Generate copy" button → Claude generates label, placeholder, helper text options; user picks or edits |
| Style Suggestion | POST /api/ai/suggest-style; accepts site URL; extracts dominant colors/fonts server-side; Claude suggests matching color palette, font, border radius |
| CTA Optimization | Given form context, generate 5 CTA button text options ranked by conversion likelihood |
| AI Generation History | Store generation requests/responses for the session; allow "undo" to previous AI suggestion |
| Prompt Engineering | System prompts in src/lib/ai/prompts/; form-generation.ts, field-suggestion.ts, copy-generation.ts, style-suggestion.ts; version controlled |

### AI Architecture Decisions
- All AI calls go through Capturely's server (never client-direct) — protects API key, enables metering
- Claude generates JSON matching the existing schema_json format via structured output / tool_use
- Streaming UX: copilot panel streams token-by-token; final JSON parsed and applied to canvas when complete
- Style extraction: server fetches merchant's site URL, extracts brand colors/fonts, includes as context in Claude prompt
- Prompts are TypeScript files with version constants — can be A/B tested via GrowthBook feature flags

---

## Gate H — Automatic Optimization Engine

| Story | Summary |
|-------|---------|
| OptimizationRun Model | OptimizationRun: campaign_id, status (pending/generating/experimenting/promoting/completed), current_control_variant_id, challenger_variant_ids, growthbook_experiment_id, started_at, completed_at |
| OptimizationRunVariant Model | OptimizationRunVariant: run_id, variant_id, conversion_rate, is_winner |
| Enable Auto-Optimization Toggle | Campaign setting; growth+ plan only; creates initial OptimizationRun |
| Variant Generation Job | Background job (cron/queue): given current control schema_json + historical conversion data, call Claude to generate N challenger variants (different copy, colors, field order, layout); default 3 challengers |
| Variant Diff + Safety Check | Before publishing AI-generated variants: validate schema, ensure all required fields present, check field_id stability, prevent removal of critical fields (email); human-readable diff stored |
| Auto-Publish Challengers | After generation + validation: create Variant records with generated_by=auto_optimization, create GrowthBook experiment with control + challengers, publish updated manifest |
| GrowthBook Winner Webhook Handler | When GrowthBook reports significance: read winner from GrowthBook API; update OptimizationRun status; trigger promotion |
| Winner Promotion | Winning variant becomes new control (is_control=true); losing variants archived; old control archived; manifest republished |
| New Challenger Generation | After promotion: automatically start a new OptimizationRun against the new control; the loop continues indefinitely |
| Optimization History UI | /app/campaigns/:id/optimization; timeline of runs; control vs challenger performance; winner history; cumulative lift |
| Optimization Dashboard | /app/analytics with optimization metrics: cumulative lift, optimization cycles completed, current experiment status per campaign |
| Pause/Resume Optimization | Manual controls to pause the loop; resume creates a new run |
| Guardrails + Circuit Breakers | Max variants per experiment (configurable, default 4); minimum sample size before declaring winner; max optimization runs per month per campaign; rollback if conversion rate drops below threshold |
| Optimization Notifications | Email + in-app: "New challengers generated for {campaign}", "Winner found: +12% conversion", "Optimization paused: circuit breaker triggered" |

### Optimization Architecture Decisions
- **Background execution**: Cron job (Vercel Cron or Inngest) runs every 15 minutes checking: (a) campaigns needing challenger generation, (b) experiments that reached significance, (c) winners to promote
- **Claude variant generation prompt includes**: current control schema_json, historical conversion rate, past winners/losers (to avoid repeating failed approaches), constraints (same fields, can change: copy, colors, layout, field order, CTA text)
- **Safety**: AI-generated variants go through automated validation before publishing; circuit breaker stops optimization if new control performs worse than baseline threshold
- **Data feedback loop**: Each run stores control/challenger schemas and final conversion rates; this history is included in future Claude prompts so the AI learns what works for each specific campaign/audience
- **Cost control**: Use Claude Haiku for simpler tasks (copy variations), Sonnet/Opus for full schema generation; rate-limit per campaign (max 1 run per 24h)

---

## Gate I — Developer Experience + Quality

| Story | Summary |
|-------|---------|
| Storybook Setup | Storybook for Next.js App Router; npm run storybook/build-storybook; baseline stories for builder, billing, analytics, submissions |
| Storybook Mock Data Layer | /storybook/fixtures/ with JSON fixtures for all entity types; makeCampaign() etc. helpers |
| Chromatic Visual Regression | Chromatic connected to repo; GitHub Actions uploads Storybook on PR; CHROMATIC_PROJECT_TOKEN in CI secrets |
| PR Template + QA Checklist | .github/pull_request_template.md with checklist; docs/review-checklist.md with AI PR review rules |
| Playwright Smoke Tests | Smoke tests: /app/sites, /app/billing, /app/analytics, /app/campaigns/:id/builder; CI job; mock auth strategy |
| AI Prompt Test Suite | Unit tests for all AI prompts; mock Claude responses; validate output schema conformance |
| Optimization Loop Integration Tests | End-to-end tests for the optimization cycle with mocked GrowthBook + Claude |

---

## Gate Dependency Graph

```
Gate A (Foundation)
  │
  ▼
Gate B (Manifest + Runtime)
  │
  ▼
Gate C (Submit + Submissions)
  │
  ├──► Gate D (Analytics + GrowthBook)
  │      │
  │      ▼
  └──► Gate E (Billing)
         │
         ▼
       Gate F (Campaign Builder — Base)
         │
         ├──► Gate G (AI Copilot) ──┐
         │                          │
         └──► Gate H (Auto-Optimization) ◄── requires G + D
         │
         ▼
       Gate I (DX + Quality)
```

---

## New Prisma Models (Summary)

Beyond existing Account + AccountMember:

- **Invite** (Gate A) — account_id, email, role, token, status, expires_at
- **Site** (Gate A) — account_id, name, primary_domain, platform_type, public_key, secret_key, status
- **Campaign** (Gate F) — account_id, site_id, name, type, status, has_unpublished_changes, auto_optimize, optimization_status
- **Variant** (Gate F) — campaign_id, name, is_control, traffic_percentage, schema_json, schema_version, growthbook_feature_key, generated_by
- **Submission** (Gate C) — account_id, site_id, campaign_id, variant_id, experiment_id, submission_id, email/phone/name, fields_json, status
- **AccountUsage** (Gate C/E) — account_id, submission_count, overage_count, ai_generations_count, usage_locked
- **ExperimentEvent** (Gate D) — visitor_id, experiment_key, variation_id, event_type, timestamp, campaign_id, site_id
- **Notification** (Gate D) — account_id, type, title, body, link_url, read_at
- **ProcessedStripeEvent** (Gate E) — event_id, processed_at
- **OptimizationRun** (Gate H) — campaign_id, status, current_control_variant_id, challenger_variant_ids, growthbook_experiment_id
- **OptimizationRunVariant** (Gate H) — run_id, variant_id, conversion_rate, is_winner
- **AiGenerationLog** (Gate G) — account_id, type, prompt_hash, input_context, output_schema, tokens_used

---

## Environment Variables

```
# Existing
DATABASE_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
RUNTIME_SIGNING_SECRET=...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...

# New — GrowthBook
GROWTHBOOK_API_HOST=http://localhost:3100
GROWTHBOOK_CLIENT_KEY=sdk-...
GROWTHBOOK_SECRET_KEY=secret_...

# New — Claude API
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Key Design Decisions

- **field_id stability**: Options have stable `value` (used server-side) vs `label` (display only)
- **Shared validation library**: Runtime and server share exact same visibility + validation logic
- **submission_id**: Client-generated UUID, reused on retry, deduplicated at DB level
- **Token flow**: Widget → POST /token (60s JWT) → POST /submit (uses token)
- **Usage locking**: plan_limit + 20% grace window before hard lock
- **No secrets in manifest**: Only public_key; secret_key never leaves server
- **GrowthBook as experimentation backbone**: All traffic splitting, statistical analysis, and winner determination handled by GrowthBook — Capturely never implements its own stats engine
- **AI calls server-side only**: Claude API key never exposed to client; all AI calls metered per account
- **Optimization safety**: AI-generated variants validated before publishing; circuit breakers prevent degradation; rollback capability at every step
