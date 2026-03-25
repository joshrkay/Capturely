# Capturely — Built Features & Product Direction

> Last updated: 2026-03-22

**User stories (Epics 1–4 intent, cursorrule ACs):** [CAPTURELY-STORIES-E1-E4.md](./CAPTURELY-STORIES-E1-E4.md)

---

## Table of Contents

- [User stories (Epics 1–4 intent)](./CAPTURELY-STORIES-E1-E4.md)
- [Gate A: Foundation (COMPLETE)](#gate-a-foundation-complete)
- [Widget & Runtime Foundation (Pre-Gate B)](#widget--runtime-foundation-pre-gate-b)
- [API Reference](#api-reference)
- [Shared Libraries](#shared-libraries)
- [Infrastructure & CI/CD](#infrastructure--cicd)
- [Testing](#testing)
- [Competitive Intelligence](#competitive-intelligence)
- [Product Direction](#product-direction)
- [What's Next](#whats-next)

---

## Gate A: Foundation (COMPLETE)

All 16 Gate A stories are implemented and working.

### 1. Authentication (Stories 1)

| Component | Location | Details |
|-----------|----------|---------|
| Clerk integration | `src/middleware.ts` | Protects `/app/*` routes; allows `/api/runtime` and `/api/health` public access |
| Sign-in page | `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` | Clerk-provided component |
| Sign-up page | `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx` | Clerk-provided component |
| Auth helpers | `src/lib/auth.ts` | `getAuthUserId()`, `requireAuth()` |

### 2. Database & Schema (Stories 2, 15)

| Component | Location | Details |
|-----------|----------|---------|
| Prisma client | `src/lib/db.ts` | Singleton PrismaClient with PrismaPg adapter |
| Schema | `prisma/schema.prisma` | 6 models (see below) |
| Docker Postgres | `docker-compose.yml` | PostgreSQL 16, port 5432, health checks |
| Seed script | `prisma/seed.ts` | Database seeding |

**Models:**

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| `Account` | name, createdAt | Multi-tenant account container |
| `AccountMember` | accountId, userId, role | RBAC membership (unique on accountId+userId) |
| `Invite` | email, role, token, status, expiresAt | Team invitations (pending/accepted/revoked/expired) |
| `Site` | name, primaryDomain, platformType, publicKey, secretKey, status | Website container with API keys |
| `Submission` | siteId, submissionId, email, phone, name, fieldsJson, status | Form submissions (unique on siteId+submissionId for idempotency) |
| `AccountUsage` | submission_count, overage_count, usage_locked | Usage tracking and limit enforcement |

### 3. Multi-Tenancy (Stories 3, 4, 5)

| Component | Location | Details |
|-----------|----------|---------|
| Account context | `src/lib/account.ts` | `withAccountContext()` — resolves accountId + role from Clerk session on every API call. Returns 403 if no membership. |
| Auto-provisioning | `src/lib/account.ts` | `ensureAccountForUser(userId, email?)` — idempotent; creates Account + owner membership in a transaction for new users |
| Error handling | `src/lib/account.ts` | `AccountContextError` with statusCode for consistent error responses |

### 4. RBAC (Story 6)

Located: `src/lib/rbac.ts`

| Helper | Allowed Roles | Used For |
|--------|--------------|----------|
| `canManageTeam(role)` | owner, admin | Team member management, invites |
| `canManageSites(role)` | owner, admin | Site CRUD, key rotation, publishing |
| `canManageCampaigns(role)` | owner, admin | Campaign management (future) |
| `canManageBilling(role)` | owner | Billing and plan changes (future) |
| `canView(role)` | owner, admin, member | Read-only access |

### 5. Team Management (Stories 7, 8, 9, 10)

**Team Page** (`src/app/app/settings/team/page.tsx`):
- Server component listing all members (userId, role, joined date)
- "(you)" indicator for current user
- Managers see "Invite Member" button

**Invite System:**
- `POST /api/invites` — Create invite (email + role, 7-day expiration, dedup check)
- `GET /api/invites` — List invites with status
- `POST /api/invites/:id/revoke` — Revoke pending invite

**Invite Acceptance** (`src/app/accept-invite/page.tsx`):
- Public page at `/accept-invite?token=...`
- Validates token status, checks expiry, verifies user not already a member
- Creates membership in transaction, marks invite accepted, redirects to `/app`

### 6. Sites Management (Stories 11, 12, 13, 14)

**Sites Page** (`src/app/app/sites/page.tsx` + `sites-list.tsx`):
- Server component with client-side form for creating sites
- Table view: name, domain, platform, publicKey, status
- Archive action for active sites
- Client form: name, domain, platform type (shopify/wordpress/custom)

**API Endpoints:**
- `POST /api/sites` — Create site (normalizes domain, generates pk_/sk_ keys)
- `GET /api/sites` — List sites (secret key intentionally omitted)
- `GET /api/sites/:id` — Get site (owner/admin see secretKey; members don't)
- `PATCH /api/sites/:id` — Update site (name, domain, platform, status)
- `POST /api/sites/:id/rotate-keys` — Generate new publicKey + secretKey
- `POST /api/sites/:id/publish` — Build and write manifest to disk

**Key Generation** (`src/lib/keys.ts`):
- `generatePublicKey()` → `pk_<32 hex chars>`
- `generateSecretKey()` → `sk_<32 hex chars>`

### 7. Dashboard Layout

**App Layout** (`src/app/app/layout.tsx`):
- Clerk UserButton integration
- Navigation sidebar
- Dark mode support

**Submissions Page** (`src/app/app/submissions/page.tsx`):
- Paginated list (25/page) with search by email/name
- Filter by status (new/read/archived)
- Color-coded status badges

---

## Widget & Runtime Foundation (Pre-Gate B)

The widget system and runtime APIs are fully implemented, ready for campaigns.

### Widget Bundle (`packages/widget/`)

| Module | File | Functionality |
|--------|------|--------------|
| Loader | `widget.ts` | Reads `data-public-key` from script tag, fetches manifest, initializes campaigns. Exposes `window.__capturely_cleanup()` for SPAs. |
| Popup | `popup.ts` | Fixed overlay + dialog, custom colors/radius/font from FormStyle. Close via button/ESC/backdrop. Accessible (role=dialog, aria-modal, focus management). |
| Form Renderer | `form-renderer.ts` | Renders all 9 field types, implements visibility logic, extracts email/phone/name, submits with JWT token. |
| Targeting | `targeting.ts` | `matchesTargeting(rule, url)` — evaluates all/equals/contains/starts_with/does_not_contain rules. |
| Triggers | `triggers.ts` | `setupTrigger(config, callback)` — immediate, delay (ms), scroll (%), exit_intent (mouseout), click (selector). Fires once, returns cleanup function. |
| Frequency | `frequency.ts` | localStorage-based (`capturely_freq_` prefix). Checks maxShows, perSession, everyDays. Records show count and timing. |

### Shared Form Logic (`packages/shared/forms/`)

Used by both server and widget — zero validation drift.

| Module | File | Functionality |
|--------|------|--------------|
| Types | `types.ts` | FieldType (9 types), FormField, FormStyle, FormSchema, TargetingRule, TriggerConfig, FrequencyConfig, ManifestCampaign, SiteManifestV1 |
| Visibility | `visibility.ts` | `evaluateVisibility()`, `evaluateCondition()`, `getVisibleFields()` — conditional field show/hide |
| Validation | `validation.ts` | `validateSubmission()` — validates visible fields, required checks, email/phone regex, dropdown/radio option validation, unexpected field detection |

### Runtime APIs

| Endpoint | Auth | Details |
|----------|------|---------|
| `POST /api/runtime/token` | Public (CORS) | Issues 60-second HMAC-signed JWT. Validates publicKey exists. |
| `POST /api/runtime/submit` | Bearer token (CORS) | Validates JWT, publicKey match. Honeypot detection (`_hp` field). Idempotent upsert by (siteId, submissionId). Extracts email/phone/name, stores fieldsJson. Atomically increments AccountUsage.submission_count. |

**Token Implementation** (`src/lib/runtime-token.ts`):
- `signToken(publicKey)` → Base64URL payload + HMAC signature (60s TTL)
- `verifyToken(token)` → timing-safe comparison, returns publicKey or null

**Manifest System** (`src/lib/manifest.ts`):
- `buildManifest(site)` → SiteManifestV1 (empty campaigns array until Gate F)
- `writeManifestToDisk(publicKey, manifest)` → writes to `/public/manifests/{publicKey}.json`

---

## API Reference

### Protected Endpoints (require Clerk auth + account membership)

| Method | Path | RBAC | Description |
|--------|------|------|-------------|
| GET | `/api/team/members` | all roles | List team members |
| POST | `/api/invites` | owner, admin | Create invite |
| GET | `/api/invites` | owner, admin | List invites |
| POST | `/api/invites/:id/revoke` | owner, admin | Revoke invite |
| POST | `/api/sites` | owner, admin | Create site |
| GET | `/api/sites` | all roles | List sites |
| GET | `/api/sites/:id` | all roles | Get site (secretKey visible to owner/admin only) |
| PATCH | `/api/sites/:id` | owner, admin | Update site |
| POST | `/api/sites/:id/rotate-keys` | owner, admin | Rotate API keys |
| POST | `/api/sites/:id/publish` | owner, admin | Publish manifest |

### Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health/db` | Database connectivity check |
| POST | `/api/runtime/token` | Issue widget submission token |
| POST | `/api/runtime/submit` | Accept form submission |

**All endpoints:** Zod input validation, structured `{ error, code }` error responses, tenant-scoped DB queries.

---

## Shared Libraries

| File | Exports | Purpose |
|------|---------|---------|
| `src/lib/auth.ts` | `getAuthUserId()`, `requireAuth()` | Clerk server helpers |
| `src/lib/db.ts` | `prisma` | Singleton PrismaClient |
| `src/lib/account.ts` | `ensureAccountForUser()`, `withAccountContext()`, `AccountContextError` | Multi-tenant context resolution |
| `src/lib/rbac.ts` | `canManageTeam()`, `canManageSites()`, `canManageCampaigns()`, `canManageBilling()`, `canView()` | Role-based access control |
| `src/lib/keys.ts` | `generatePublicKey()`, `generateSecretKey()` | API key generation (pk_/sk_ prefixed) |
| `src/lib/runtime-token.ts` | `signToken()`, `verifyToken()` | HMAC-signed short-lived tokens |
| `src/lib/manifest.ts` | `buildManifest()`, `writeManifestToDisk()` | Widget manifest generation |

---

## Infrastructure & CI/CD

### Local Development

- **Docker Compose**: PostgreSQL 16, container `capturely-postgres`, port 5432
- **Scripts**: `npm run db:up`, `db:down`, `db:migrate`, `db:seed`, `db:studio`, `db:generate`
- **Integration test**: `npm run test:integration:local` (full docker up → migrate → test → down cycle)

### CI Pipeline (`.github/workflows/pr-integration.yml`)

Triggers on PR to main. Steps:
1. `npm ci` (Node 20 LTS)
2. Docker Compose Postgres + health check (30s timeout)
3. `prisma generate` + `prisma migrate dev`
4. Check no uncommitted Prisma changes
5. `npm run typecheck` (TypeScript strict)
6. `npm run test` (Vitest)
7. Teardown (always)

---

## Testing

| Test File | Framework | Coverage |
|-----------|-----------|----------|
| `src/__tests__/account.test.ts` | Vitest | `ensureAccountForUser()` — existing membership, new user provisioning, email fallback, idempotency |
| `src/__tests__/rbac.test.ts` | Vitest | All 5 RBAC helpers across owner/admin/member roles |

**Scripts**: `npm run test` (single pass), `npm run test:watch` (watch mode), `npm run typecheck` (strict TS)

---

## Competitive Intelligence

### Jotform Analysis (March 2026)

**What they do well:**
- 10,000–20,000+ templates (massive moat)
- 40+ payment gateway integrations
- Expanding AI suite: form generation, chatbots, AI agents, workflow automation, website builder
- HIPAA compliance on Gold plan ($99/mo)
- 35M+ users, strong brand

**Critical weaknesses Capturely can exploit:**
1. **Single-user below Enterprise** — ALL plans ($34–$99/mo) are single-user. Teams need Enterprise or share credentials.
2. **Hard submission caps** — Forms display "over quota" and stop accepting submissions entirely. No grace period.
3. **Embed-based integrations** — Shopify/WordPress integrations are iframe/embed code, not native. No deep platform data access.
4. **Dated design** — Forms look generic and similar; hard to achieve premium aesthetic.
5. **No self-optimization** — Zero autonomous A/B testing or form optimization.
6. **Slow support** — Week+ response times commonly reported.

**Jotform Pricing (2026):**

| Plan | Monthly | Submissions/mo | Users | Key Limit |
|------|---------|----------------|-------|-----------|
| Starter | Free | 100 | 1 | Jotform branding |
| Bronze | $34/mo | 1,000 | 1 | Single user |
| Silver | $39/mo | 2,500 | 1 | Single user |
| Gold | $99/mo | 10,000 | 1 | HIPAA |
| Enterprise | Custom | Unlimited | Multi | SSO, SOC2 |

### Broader Competitor Landscape

| Competitor | Strengths | Weaknesses | Relevance to Capturely |
|-----------|-----------|------------|----------------------|
| **Typeform** | Beautiful conversational UX, 300+ integrations | Expensive ($25+/mo), 10 responses on free | Design benchmark |
| **Tally** | Free unlimited forms, Notion-like editor | Limited integrations, basic design | Pricing pressure |
| **Klaviyo** | Deep e-commerce, auto-optimization of sign-up forms | Not a general form builder | Only competitor with any form optimization |
| **Wisepops** | Top Shopify popup app | Not a form builder, Shopify-only | Direct Shopify competitor |
| **Privy** | Email/SMS + popups, Shopify-focused | Limited form types | Direct Shopify competitor |
| **Shopify Forms** | Free, built-in | Very basic, no advanced logic | Free tier competitor |
| **Orbit AI** | AI-native lead qualification | New, unproven | Innovation benchmark |

### The Whitespace

**Self-optimizing forms do not exist as a product.** No form builder (Jotform, Typeform, Tally, or any other) offers autonomous form optimization — auto-generating variants, running multi-armed bandit tests, and converging on highest-converting forms without merchant intervention. Klaviyo has limited A/B testing on email sign-up forms. Runner AI optimizes e-commerce pages. But a form builder that self-optimizes is genuinely novel.

---

## Product Direction

### Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Builder UX** | AI-First + Manual Edit | Chat interface generates the form, then users can drag-and-drop edit fields, styling, and logic. Best of MakeForm's simplicity + Jotform's power. |
| **Platform Strategy** | Shopify + WordPress in parallel | Shopify for e-commerce differentiation, WordPress for market breadth. Both integrations developed simultaneously. |
| **MVP Scope** | Full MVP | Includes billing (Stripe), analytics, A/B testing, and platform integrations. Launch-ready product, not just a demo. |

### Key Differentiators

1. **Self-Optimizing Forms** — Autonomous A/B testing with multi-armed bandit allocation. Auto-generate variants (field order, copy, layout, timing), auto-promote winners, show merchants conversion lift metrics.
2. **Shopify-Native** — Deep integration with Shopify data model. Forms that know what's in the cart, customer purchase history. Triggers based on Shopify events. Auto-populate from customer profiles.
3. **WordPress-Native** — True plugin integration, not embed codes. Admin settings, auto-embed widget.
4. **AI-First Builder** — Natural language form generation optimized for conversion based on industry benchmarks. AI suggests field reductions and proven e-commerce patterns.
5. **Team Access at Every Tier** — Exploit Jotform's biggest weakness. Collaboration on all paid plans.
6. **Graceful Limit Handling** — Soft lock with 20% grace window, never break live forms. Jotform's hard cutoff is a known pain point.
7. **Commerce-Aware AI** — Forms that understand products, collections, carts, and purchase history.

### What NOT to Compete On

- Template quantity (Jotform has 10,000+; focus on quality e-commerce templates)
- Being a general-purpose form builder (stay e-commerce focused)
- AI agents/chatbots (Jotform is investing heavily; not Capturely's lane)

---

## What's Next

### Gate B: Campaigns & Form Builder

- Campaign data model (type, status, targeting, trigger, frequency)
- Variant model (A/B testing support from day one)
- AI chat form builder (natural language → FormSchema)
- Manual drag-and-drop editor for refinement
- Campaign CRUD API + dashboard UI
- Campaign publishing (manifest generation with campaigns)
- Template library (curated e-commerce templates)

### Gate C: Platform Integrations

- Shopify App Store listing with OAuth
- Shopify data access (products, collections, customers, carts)
- Shopify event triggers (add-to-cart, checkout, post-purchase)
- WordPress plugin with admin settings
- Auto-embed widget for both platforms

### Gate D: Analytics & Optimization

- Submission analytics (conversion funnels, not just counts)
- A/B testing infrastructure (GrowthBook or custom multi-armed bandit)
- Self-optimizing form engine (auto-variant generation, auto-promotion)
- Conversion lift dashboard

### Gate E: Billing & Plans

- Stripe integration (subscriptions, usage-based billing)
- Plan tiers with team access at every level
- Usage tracking with grace window enforcement
- Billing dashboard UI

### Gate F: Notifications & Webhooks

- Email notifications via Resend
- Webhook system (Zapier/Make integration)
- Submission event streaming

---

## File Index

Key source files for reference:

```
prisma/schema.prisma              # All data models
src/middleware.ts                  # Auth middleware
src/lib/auth.ts                   # Clerk helpers
src/lib/db.ts                     # Prisma client
src/lib/account.ts                # Multi-tenant context
src/lib/rbac.ts                   # Role-based access control
src/lib/keys.ts                   # API key generation
src/lib/runtime-token.ts          # Widget JWT tokens
src/lib/manifest.ts               # Manifest builder
src/app/app/layout.tsx            # Dashboard layout
src/app/app/settings/team/        # Team management UI
src/app/app/sites/                # Sites management UI
src/app/app/submissions/          # Submissions list UI
src/app/accept-invite/            # Public invite acceptance
src/app/api/team/                 # Team API
src/app/api/invites/              # Invites API
src/app/api/sites/                # Sites API
src/app/api/runtime/              # Widget runtime API
src/app/api/health/               # Health check
packages/shared/forms/            # Shared form types, visibility, validation
packages/widget/                  # Widget bundle (loader, popup, renderer, targeting, triggers, frequency)
.github/workflows/                # CI pipeline
docker-compose.yml                # Local Postgres
```
