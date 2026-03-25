# Capturely Go-Live Plan

**Date:** 2026-03-25
**Target:** Full MVP — Forms + AI + Billing
**Timeline:** Next 2-3 days
**Owner:** Josh Kay (@joshrkay)

---

## Executive Summary

Capturely has **significant implementation depth** — far beyond Gate A. The codebase includes functional implementations across Gates A through H (auth, campaigns, widget runtime, AI copilot, billing, A/B testing, analytics). However, several critical gaps exist that would prevent a real user from completing the core loop: **sign up → build a form → embed it → collect submissions → pay for the service**.

### Current Build Health
| Check | Status |
|-------|--------|
| TypeScript (`tsc --noEmit`) | **PASS** — zero errors |
| Unit Tests (114 tests, 13 files) | **PASS** — all green |
| Production Build (`next build`) | **FAILS** — `settings-tabs.tsx` imports `node:module` in client component |
| Environment Variables | **MISSING** — no `.env.local` or `.env` file |
| Docker Postgres | **Not running** |
| Widget Bundle (`widget.js`) | **NOT BUILT** — no build pipeline, no dist/ output |
| Public Manifests | **NOT GENERATED** — no `/public/manifests/` directory |

---

## What's Built (Inventory)

### Fully Implemented & Functional

| Feature Area | Status | Key Files |
|-------------|--------|-----------|
| **Clerk Auth** | Done | `src/middleware.ts`, `src/app/(auth)/` |
| **Multi-tenancy** | Done | `src/lib/account.ts` — `withAccountContext()` |
| **RBAC** | Done | `src/lib/rbac.ts` — owner/admin/member |
| **Account Creation** | Done | `ensureAccountForUser()` idempotent |
| **Team Management** | Done | Settings team tab, member roster |
| **Invite System** | Done | Create/list/revoke invites, `/accept-invite` flow |
| **Sites CRUD** | Done | `src/app/app/sites/`, API routes, key generation |
| **Site Key Rotation** | Done | `POST /api/sites/[id]/rotate-keys` |
| **Campaign CRUD** | Done | Create, list, edit, publish, archive |
| **Campaign Builder UI** | Done | Drag-drop fields, preview, styles, display settings |
| **Variant Manager** | Done | Traffic splits, promote-to-control |
| **Template Library** | Done | Curated templates, category filter, preview |
| **AI Copilot** | Done | Form generation, copy, style, CTA, field suggestions |
| **AI Chat Panel** | Done | In-builder chat, generation history |
| **Runtime Token API** | Done | `POST /api/runtime/token` — 60s JWT |
| **Runtime Submit API** | Done | `POST /api/runtime/submit` — idempotent, spam check |
| **Impression Tracking** | Done | `POST /api/runtime/impression` |
| **Submissions UI** | Done | Search, filter, paginate |
| **Analytics Dashboard** | Done | Period selector, stats cards, top campaigns |
| **Campaign Analytics** | Done | Variant performance, significance table |
| **Billing Plans** | Done | Free/Starter/Growth/Enterprise tiers defined |
| **Stripe Integration** | Done | Checkout, portal, webhooks |
| **Usage Tracking** | Done | Atomic increment, soft/hard lock, grace window |
| **Billing UI** | Done | Plan display, usage bars, upgrade flow |
| **Notifications** | Done | Bell dropdown, unread count, preferences |
| **Webhooks** | Done | HMAC-signed delivery on submission |
| **Embed Code Page** | Done | Generic JS, Shopify, WordPress, GTM snippets |
| **Settings** | Done | Account, Team, Notifications, API Keys, Danger Zone tabs |
| **Spam Protection** | Done | Honeypot, IP-based, reCAPTCHA support |
| **A/B Testing** | Done | GrowthBook integration, experiment events, optimization runs |
| **CI Pipeline** | Done | GitHub Actions — lint, typecheck, tests, Postgres |
| **Prisma Schema** | Done | All models across Gates A-H |
| **Docker Compose** | Done | Local Postgres 16 with health checks |

### Partially Implemented / Stubbed

| Feature | Status | Gap |
|---------|--------|-----|
| **Integrations** | UI cards exist | Shopify OAuth routes present but untested end-to-end |
| **Email Templates** | Resend SDK installed | No actual email templates built (payment_failed, welcome, etc.) |
| **Auto-Optimization Cron** | Route exists | `/api/cron/optimize` orchestration not fully wired |
| **GrowthBook Setup** | Config present | Needs actual GrowthBook instance (Docker or Cloud) |
| **Manifest Publish** | `buildManifest()` exists | Never called automatically; no `/public/manifests/` dir |

### Not Built At All

| Feature | Impact | Priority for Go-Live |
|---------|--------|---------------------|
| **Landing/Marketing Page** | Users see default Next.js template | **CRITICAL** |
| **Widget Bundle Build** | Forms cannot render on merchant sites | **CRITICAL** |
| **Widget CDN/Hosting** | Widget.js has no delivery mechanism | **CRITICAL** |
| **Environment Variables** | App cannot start without them | **CRITICAL** |
| **robots.txt / sitemap.xml** | SEO basics missing | Medium |
| **OpenGraph / Twitter Cards** | No social sharing previews | Medium |
| **Welcome Email** | No onboarding email on signup | Low for launch |
| **Payment Failed Email** | No dunning emails | Low for launch |
| **Admin Dashboard** | No system-wide admin view | Post-launch |
| **Storybook** | No component documentation | Post-launch |
| **Playwright E2E** | Smoke tests not wired | Post-launch |

---

## Critical Path to Go-Live

These are the items that **MUST** be completed before a user can go through the full loop. Ordered by dependency.

### P0 — Blockers (Cannot launch without these)

#### 1. Fix Production Build Error
**Effort:** 30 minutes
**What:** `src/app/app/settings/components/settings-tabs.tsx` is a `"use client"` component that transitively imports `node:module` (a Node.js built-in). This breaks the production build. The import chain needs to be traced and the server-only dependency moved behind a dynamic import or removed from the client bundle.
- [ ] Trace import chain in `settings-tabs.tsx` to find the `node:module` dependency
- [ ] Refactor to remove server-only imports from client component
- [ ] Verify `npm run build` passes

#### 2. Environment Variables & Production Config
**Effort:** 1-2 hours
**What:** Set up `.env.local` for development and Vercel environment variables for production.
- [ ] `DATABASE_URL` — Neon Postgres connection string
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY`
- [ ] `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- [ ] `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- [ ] `RUNTIME_SIGNING_SECRET` — generate with `openssl rand -hex 32`
- [ ] `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`
- [ ] `RESEND_API_KEY`
- [ ] `ANTHROPIC_API_KEY` — for AI copilot features
- [ ] Verify production build succeeds with all env vars set
- [ ] Configure Vercel project with all env vars

#### 2. Widget.js Build Pipeline
**Effort:** 3-4 hours
**What:** The widget source exists (`packages/widget/src/`) but has **no bundler configured**. There is no `tsconfig.json`, no build script, no rollup/esbuild/webpack config. The widget cannot be served to merchant sites.
- [ ] Add build tooling (esbuild recommended — fast, zero-config)
- [ ] Create `packages/widget/tsconfig.json`
- [ ] Create build script that outputs `widget.min.js` (single IIFE bundle, <20KB gzip target)
- [ ] Include `packages/shared/forms/` in the bundle (shared validation/visibility)
- [ ] Output to `public/widget.js` or a CDN-served location
- [ ] Add `npm run widget:build` script to root `package.json`
- [ ] Verify widget loads via `<script src="...">` and reads `data-public-key`
- [ ] Test: widget fetches manifest, renders form, submits successfully

#### 3. Manifest Generation Pipeline
**Effort:** 2-3 hours
**What:** `buildManifest()` and `writeManifestToDisk()` exist in `src/lib/manifest.ts` but are never called automatically. When a campaign is published, no manifest is generated.
- [ ] Wire `buildManifest()` into the publish campaign API (`POST /api/campaigns/[id]/publish`)
- [ ] Create `/public/manifests/` directory
- [ ] Ensure manifest is written on campaign publish
- [ ] Ensure manifest is regenerated when campaign is updated/unpublished
- [ ] For production: decide on manifest storage (Vercel Blob, S3, or `/public/` with ISR)
- [ ] Verify widget can fetch manifest at expected URL

#### 4. Landing Page / Marketing Homepage
**Effort:** 4-6 hours
**What:** `src/app/page.tsx` is the default Next.js boilerplate. Users visiting capturely.com see "To get started, edit the page.tsx file."
- [ ] Hero section with value proposition: "AI-powered forms that optimize themselves"
- [ ] Feature highlights (AI form builder, A/B testing, self-optimization)
- [ ] Pricing section (Free / Starter $19 / Growth $49 / Enterprise)
- [ ] Call-to-action: "Get Started Free" → `/sign-up`
- [ ] Navigation header (Logo, Features, Pricing, Sign In, Get Started)
- [ ] Footer (Links, legal, social)
- [ ] Mobile responsive
- [ ] Capturely branding (replace Next.js/Vercel logos)

#### 5. End-to-End Smoke Test of Core Loop
**Effort:** 2-3 hours
**What:** Manually verify the full user journey works end-to-end.
- [ ] Sign up with Clerk → account created automatically
- [ ] Create a site → keys generated
- [ ] Create a campaign (manual + AI generation)
- [ ] Publish campaign → manifest generated
- [ ] Embed widget on test page → form renders
- [ ] Submit form → submission appears in dashboard
- [ ] View analytics → stats update
- [ ] Upgrade plan via Stripe → billing status changes
- [ ] Usage limits enforce correctly

#### 6. Vercel Deployment & Domain
**Effort:** 1-2 hours
- [ ] Connect GitHub repo to Vercel
- [ ] Configure production environment variables
- [ ] Set up custom domain (capturely.com or similar)
- [ ] Configure Clerk production instance (not test keys)
- [ ] Configure Stripe production instance (not test keys)
- [ ] Set up Stripe webhook endpoint pointing to production URL
- [ ] Verify deployment succeeds and app loads

---

### P1 — Important for Launch Quality (should do before launch)

#### 7. SEO & Social Sharing Basics
**Effort:** 1-2 hours
- [ ] Add OpenGraph meta tags to root layout
- [ ] Add Twitter Card meta tags
- [ ] Create `robots.txt` (allow all)
- [ ] Create basic `sitemap.xml`
- [ ] Add proper favicon (replace generic one)
- [ ] Create OG image for social sharing

#### 8. Stripe Webhook Production Setup
**Effort:** 1-2 hours
- [ ] Register production webhook endpoint in Stripe dashboard
- [ ] Verify `checkout.session.completed` → plan upgrade works
- [ ] Verify `customer.subscription.updated` → plan changes work
- [ ] Verify `invoice.payment_failed` → payment_status updates
- [ ] Test upgrade flow end-to-end with Stripe test mode

#### 9. Widget Hosting Strategy
**Effort:** 1-2 hours
- [ ] Decide: serve from Vercel (`/widget.js` static asset) vs. CDN (CloudFront/Fastly)
- [ ] Set proper CORS headers on widget.js
- [ ] Set cache headers (versioned URL or cache-busting)
- [ ] Update embed code snippets in `/app/embed` to point to production URL
- [ ] Verify cross-origin loading works

#### 10. Error Handling & Edge Cases
**Effort:** 2-3 hours
- [ ] Add proper error boundaries to app layout
- [ ] Add `loading.tsx` skeletons to key routes (dashboard, campaigns, submissions)
- [ ] Add `not-found.tsx` for 404 pages
- [ ] Verify rate limiting on runtime APIs (token, submit)
- [ ] Verify CORS headers on runtime APIs allow merchant domains
- [ ] Test widget behavior when site is archived or campaign is paused

---

### P2 — Nice to Have (can launch without, do within first week)

#### 11. Email Notifications
- [ ] Welcome email on signup (via Resend)
- [ ] Invite email with accept link
- [ ] Payment failed dunning email
- [ ] Usage warning email (80% of limit)
- [ ] Usage locked email (100% of limit)

#### 12. Monitoring & Observability
- [ ] Error tracking (Sentry or similar)
- [ ] Uptime monitoring on `/api/health/db`
- [ ] Widget load success tracking
- [ ] Submission success/failure metrics

#### 13. GrowthBook Production Setup
- [ ] Set up GrowthBook Cloud account (or self-hosted)
- [ ] Configure as data source
- [ ] Wire experiment creation on A/B test enable
- [ ] Verify winner detection webhook

#### 14. Documentation
- [ ] Embed instructions page polish
- [ ] API documentation for webhook consumers
- [ ] Widget integration guide

---

## Figma Design Comparison

**Status:** Unable to access published Figma Site (`glide-jelly-27264451.figma.site` returns 403 to programmatic access).

**To complete this comparison, provide the Figma design file URL** (format: `figma.com/design/:fileKey/:fileName?node-id=...`) so the Figma MCP tools can pull screenshots and design context for each screen.

### Screens to Compare (once Figma access is available):
| Screen | Code Location | Status |
|--------|--------------|--------|
| Landing/Home Page | `src/app/page.tsx` | NOT BUILT (default template) |
| Sign In / Sign Up | `src/app/(auth)/` | Clerk-provided (matches Clerk theme) |
| Dashboard | `src/app/app/page.tsx` | Built — needs design comparison |
| Campaigns List | `src/app/app/campaigns/page.tsx` | Built — needs design comparison |
| Campaign Builder | `src/app/app/campaigns/[id]/builder/page.tsx` | Built — needs design comparison |
| New Campaign | `src/app/app/campaigns/new/page.tsx` | Built — needs design comparison |
| Sites | `src/app/app/sites/page.tsx` | Built — needs design comparison |
| Submissions | `src/app/app/submissions/page.tsx` | Built — needs design comparison |
| Analytics | `src/app/app/analytics/page.tsx` | Built — needs design comparison |
| Billing | `src/app/app/billing/page.tsx` | Built — needs design comparison |
| Settings | `src/app/app/settings/page.tsx` | Built — needs design comparison |
| Templates | `src/app/app/templates/page.tsx` | Built — needs design comparison |
| Embed Code | `src/app/app/embed/page.tsx` | Built — needs design comparison |
| Integrations | `src/app/app/integrations/page.tsx` | Built — needs design comparison |
| Accept Invite | `src/app/accept-invite/page.tsx` | Built — needs design comparison |

---

## Effort Estimate Summary

| Priority | Category | Estimated Effort |
|----------|----------|-----------------|
| **P0** | Environment & Config | 1-2 hours |
| **P0** | Widget Build Pipeline | 3-4 hours |
| **P0** | Manifest Generation | 2-3 hours |
| **P0** | Landing Page | 4-6 hours |
| **P0** | E2E Smoke Test | 2-3 hours |
| **P0** | Vercel Deployment | 1-2 hours |
| **P1** | SEO & Social | 1-2 hours |
| **P1** | Stripe Production | 1-2 hours |
| **P1** | Widget Hosting | 1-2 hours |
| **P1** | Error Handling | 2-3 hours |
| | | |
| | **P0 Total** | **~14-20 hours** |
| | **P0 + P1 Total** | **~19-27 hours** |

**Bottom line:** With focused execution, P0 items can be completed in **1.5-2 days**. P1 items add another half day. This aligns with the "live in a couple days" target.

---

## Recommended Execution Order

### Day 1 (Today)
1. Set up environment variables (local + Vercel)
2. Widget build pipeline (esbuild + bundle)
3. Manifest generation wiring
4. Verify production build works

### Day 2
5. Landing page implementation
6. Vercel deployment + domain setup
7. Stripe webhook production setup
8. Widget hosting + CORS

### Day 3 (Launch Day)
9. End-to-end smoke test of full user loop
10. SEO basics (robots.txt, OG tags, favicon)
11. Error boundaries and loading states
12. Final deploy and go live

---

## Architecture Notes for Go-Live

### Widget Delivery Decision
**Recommended:** Serve `widget.js` as a static asset from Vercel's edge network (`https://capturely.com/widget.js`). This is the simplest path — no separate CDN setup needed. Vercel automatically handles edge caching, gzip, and global distribution.

### Manifest Storage Decision
**For launch:** Write manifests to Vercel Blob Storage or serve via API route with caching. Writing to `/public/manifests/` works locally but won't persist across Vercel serverless function invocations.

**Recommended approach:** Create an API route `GET /api/runtime/manifest/[publicKey]` that reads from the database and returns the manifest JSON with aggressive caching headers (`Cache-Control: public, max-age=60`). This eliminates the need for file storage entirely.

### Database Decision
**Recommended:** Neon Postgres (already specified in stack). Create production database, run `prisma migrate deploy`, and set the connection string in Vercel env vars.

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Widget doesn't render on merchant sites due to CSP/CORS | Medium | High | Test on multiple domains; document CSP requirements |
| Stripe webhook misses events | Low | High | Idempotency already built; add webhook retry monitoring |
| AI copilot costs spike | Medium | Medium | Usage metering already built; set Claude API spending limits |
| Database connection pooling at scale | Low | Medium | Neon handles pooling; monitor connection count |
| Widget.js bundle too large | Low | Medium | Target <20KB gzip; tree-shake shared forms |

---

*This document should be updated as items are completed. Check items off as they're done and note any blockers discovered during implementation.*
