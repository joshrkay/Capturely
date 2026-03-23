# G-8: Dashboard Enhancement — Full Redesign

## Story

**As a** Capturely merchant,
**I want** a rich, informative dashboard when I log in,
**so that** I can immediately see how my campaigns are performing, track key metrics over time, and know what actions to take next.

The current `src/app/app/page.tsx` is a 12-line stub that shows only "Dashboard / Welcome to Capturely." This story replaces it with a fully-featured landing page including stats cards with trend indicators, a period selector, quick action buttons, a top-campaigns mini-table, and an onboarding checklist for new accounts.

**Priority:** Medium
**Estimate:** 5 points
**Tier:** 1 (no blockers, blocks nothing)

---

## Dependencies

| Direction | Item | Status |
|-----------|------|--------|
| Depends on | Clerk Auth + `/app` routes (Gate A-1) | Done |
| Depends on | Account Context Resolver (Gate A-5) | Done |
| Depends on | RBAC Helpers (Gate A-6) | Done |
| Depends on | Sites CRUD (Gate A-12) | Done |
| Depends on | Campaigns CRUD (Gate F) | Done |
| Depends on | Submissions model (Gate C) | Done |
| Depends on | Analytics overview API pattern | Done |
| Blocks | Nothing | N/A |

No Prisma schema changes required. All needed models already exist: `Account`, `Site`, `Campaign`, `Submission`, `ExperimentEvent`.

---

## Existing Code Inventory

| File | Purpose | Action |
|------|---------|--------|
| `src/app/app/page.tsx` | 12-line stub dashboard | **Rewrite entirely** |
| `src/app/api/analytics/overview/route.ts` | Existing analytics endpoint; reference pattern for `withAccountContext()`, `canView()`, period filtering, aggregation | **Reference only** |
| `src/lib/account.ts` | `withAccountContext()`, `AccountContextError` | Use as-is |
| `src/lib/rbac.ts` | `canView()` | Use as-is |
| `src/lib/db.ts` | Prisma singleton | Use as-is |
| `src/app/app/analytics/page.tsx` | Client component pattern: `useState`/`useEffect` fetch, period selector, stats cards, dark mode classes | **Reference for UI patterns** |
| `src/app/app/layout.tsx` | App shell with nav, confirms design tokens | **Reference for design tokens** |
| `prisma/schema.prisma` | All models needed already exist | No changes |

---

## Acceptance Criteria

1. **AC-1:** `GET /api/dashboard?days=30` returns JSON with `totalActiveCampaigns`, `totalSubmissions`, `previousSubmissions`, `conversionRate`, `previousConversionRate`, `activeSitesCount`, `recentActivity`, `topCampaigns`, `onboardingState`, and `period`.
2. **AC-2:** The API enforces auth via `withAccountContext()` and RBAC via `canView(role)`; unauthenticated requests receive 401, unauthorized receive 403.
3. **AC-3:** The `days` query param accepts 7, 30, or 90; defaults to 30; invalid values fall back to 30.
4. **AC-4:** `totalSubmissions` and `previousSubmissions` cover current and previous periods respectively (e.g., days=30 returns current 30d count and prior 30d count for trend calculation).
5. **AC-5:** `conversionRate` is calculated as `(conversions / impressions) * 100`, rounded to two decimals; returns 0 when impressions is 0.
6. **AC-6:** `topCampaigns` returns the top 5 campaigns by submission count within the selected period, each with `id`, `name`, `submissionsCount`, and `conversionRate`.
7. **AC-7:** `recentActivity` returns the last 10 submissions with `id`, `campaignName`, `email` (masked), `createdAt`.
8. **AC-8:** `onboardingState` returns `{ hasSites, hasCampaigns, hasSubmissions, hasWidgetInstalled }` as booleans.
9. **AC-9:** The dashboard page displays four stats cards: Active Campaigns, Total Submissions, Conversion Rate, Active Sites — each with a trend indicator (e.g., "+12% vs last period") colored green for positive, red for negative.
10. **AC-10:** A period selector (7d / 30d / 90d) re-fetches data on click.
11. **AC-11:** Three quick-action buttons link to `/app/campaigns/new`, `/app/submissions`, `/app/analytics`.
12. **AC-12:** A "Top Campaigns" mini-table displays campaign name, submission count, and conversion rate for the top 5.
13. **AC-13:** When `onboardingState` indicates an incomplete setup, an onboarding checklist is prominently displayed with checkmarks for completed steps and action links for incomplete steps.
14. **AC-14:** For brand-new accounts (no sites, campaigns, or submissions), the onboarding checklist is the primary content; stats cards show zeroes gracefully.
15. **AC-15:** Loading and error states are handled with skeleton placeholders and a retry option respectively.

---

## API Contract

### `GET /api/dashboard`

**Auth:** Clerk session required. `withAccountContext()` + `canView(role)`.

**Query params:**

| Param | Type | Default | Validation |
|-------|------|---------|------------|
| `days` | number | 30 | Must be 7, 30, or 90; invalid falls back to 30 |

**Success response (200):**

```json
{
  "period": { "days": 30, "since": "2026-02-21T00:00:00.000Z" },
  "metrics": {
    "totalActiveCampaigns": 8,
    "totalSubmissions": 342,
    "previousSubmissions": 305,
    "conversionRate": 4.52,
    "previousConversionRate": 3.87,
    "activeSitesCount": 3
  },
  "topCampaigns": [
    { "id": "clx...", "name": "Summer Sale Popup", "submissionsCount": 124, "conversionRate": 6.2 },
    { "id": "clx...", "name": "Newsletter Signup", "submissionsCount": 89, "conversionRate": 3.8 }
  ],
  "recentActivity": [
    { "id": "clx...", "campaignName": "Summer Sale Popup", "email": "j***@example.com", "createdAt": "2026-03-23T10:15:00.000Z" }
  ],
  "onboardingState": {
    "hasSites": true,
    "hasCampaigns": true,
    "hasSubmissions": true,
    "hasWidgetInstalled": true
  }
}
```

**Error responses:**

| Status | Body |
|--------|------|
| 401 | `{ "error": "Unauthorized", "code": "AUTH_ERROR" }` |
| 403 | `{ "error": "Forbidden", "code": "FORBIDDEN" }` |
| 500 | `{ "error": "Internal server error", "code": "INTERNAL_ERROR" }` |

**Trend calculation helper:**

```typescript
function trendPercentage(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}
```

Returns `null` when no previous data exists (UI shows "New" instead of a percentage).

---

## Component Architecture

```
src/app/app/page.tsx               (Server Component — metadata only, renders DashboardClient)
src/app/app/dashboard-client.tsx   ("use client" — data fetching, state management)
src/app/app/dashboard/
  stats-card.tsx                   (Reusable stats card with trend indicator)
  period-selector.tsx              (7d / 30d / 90d toggle buttons)
  quick-actions.tsx                (Three action buttons row)
  top-campaigns-table.tsx          (Mini-table, top 5 campaigns)
  onboarding-checklist.tsx         (Checklist with step completion indicators)
  recent-activity.tsx              (Last 10 submissions feed)
  dashboard-skeleton.tsx           (Loading skeleton for all sections)
  dashboard-error.tsx              (Error state with retry button)
src/app/api/dashboard/route.ts     (GET handler)
```

### Data Flow

1. `page.tsx` (Server Component) renders `<DashboardClient />`.
2. `DashboardClient` calls `GET /api/dashboard?days={days}` via `useEffect` on mount and period change.
3. API route resolves account context, runs parallel Prisma queries, computes trends, returns aggregated JSON.
4. Client distributes data to child components via props.

---

## UI States

| State | Behavior |
|-------|----------|
| **Loading** | Full-page skeleton: four pulsing card placeholders, table skeleton rows, checklist skeleton |
| **Error** | Centered error card with message and "Retry" button |
| **Empty (new account)** | Stats cards show 0, onboarding checklist is prominently displayed above fold, quick actions visible |
| **Partial setup** | Onboarding checklist shows with completed/incomplete steps, available data renders normally |
| **Active account** | Full dashboard: stats with trends, top campaigns table, recent activity, onboarding hidden |

---

## Design System

All components follow the existing Capturely design tokens observed in `layout.tsx` and `analytics/page.tsx`:

| Element | Classes |
|---------|---------|
| Page background | `bg-zinc-50 dark:bg-black` (inherited from layout) |
| Card | `rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950` |
| Card title | `text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400` |
| Card value | `text-2xl font-bold text-zinc-900 dark:text-zinc-100` |
| Trend positive | `text-sm font-medium text-emerald-600 dark:text-emerald-400` |
| Trend negative | `text-sm font-medium text-red-600 dark:text-red-400` |
| Trend neutral | `text-sm font-medium text-zinc-400 dark:text-zinc-500` |
| Period active button | `bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 rounded-lg px-3 py-1.5 text-sm` |
| Period inactive button | `text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 rounded-lg px-3 py-1.5 text-sm` |
| Quick action button | `rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800` |
| Page heading | `text-2xl font-bold text-zinc-900 dark:text-zinc-50` |
| Table header | `text-xs font-medium text-zinc-500 dark:text-zinc-400` |
| Table cell | `text-sm text-zinc-700 dark:text-zinc-300` |

---

## Accessibility

- All stats cards use semantic `<section>` elements with `aria-label` describing the metric.
- Trend indicators include `aria-label` with full context (e.g., "12 percent increase compared to previous period").
- Period selector buttons use `aria-pressed` to indicate the active selection.
- Quick-action buttons are `<Link>` components for keyboard navigation with visible focus rings.
- Onboarding checklist uses `role="list"` with `role="listitem"` children; completed steps use `aria-checked="true"`.
- Loading skeletons use `aria-busy="true"` and `aria-label="Loading dashboard"`.
- Color contrast: all text/background combinations meet WCAG 2.1 AA (the existing zinc palette already satisfies this).
- Focus rings: use Tailwind `focus-visible:ring-2 focus-visible:ring-indigo-500` on interactive elements.

---

## Testing Plan

### Unit Tests

- `route.ts`: Mock Prisma, verify correct aggregation logic for each metric.
- `route.ts`: Verify `days` param validation (7/30/90/invalid/missing).
- `route.ts`: Verify auth enforcement (no session -> 401, no membership -> 403).
- `route.ts`: Verify trend calculation (current vs previous period, zero-division handling).
- `route.ts`: Verify `onboardingState` computation from actual DB counts.
- `route.ts`: Verify email masking in `recentActivity` (standard email, short username, null email).
- `stats-card.tsx`: Render with positive, negative, zero, and null trends; verify correct color class and aria-label.
- `onboarding-checklist.tsx`: Render with all states (all complete, none complete, partial).
- `period-selector.tsx`: Verify `aria-pressed` toggles and callback fires with correct value.

### Integration Tests

- Full API call with seeded data verifying response shape matches contract.
- API call with empty account verifying zeroes and `onboardingState` all false.
- Verify `accountId` scoping: seeded data for two accounts, each sees only their own.

### E2E Tests (Playwright)

- Load dashboard, verify four stats cards rendered with numeric values.
- Click period selector buttons, verify data refetch (intercept network).
- New account flow: verify onboarding checklist visibility and action links.
- Click quick-action buttons, verify navigation to correct routes.
- Verify loading skeleton appears before data loads.

---

## Anti-Patterns to Avoid

1. **No raw SQL** — use Prisma aggregations and `count()` even for trend calculations.
2. **No missing `accountId` scoping** — every Prisma query in the dashboard API must include `accountId` in the `where` clause.
3. **No `any` types** — define explicit TypeScript interfaces for API response, component props.
4. **No client-side data fetching in Server Components** — `page.tsx` is a Server Component; all fetching happens in the `"use client"` child.
5. **No secrets in client** — the API route runs server-side only; the client component only calls the API URL.
6. **No N+1 queries** — use `Promise.all()` for parallel queries; batch campaign stats in a single query.
7. **No hardcoded period values in the API** — accept and validate the `days` param dynamically.
8. **No unmasked PII** — `recentActivity` emails must be masked before returning (e.g., `j***@example.com`).

---

## Tasks

1. **Create `src/app/api/dashboard/route.ts`** — scaffold GET handler with `withAccountContext()`, `canView()`, `AccountContextError` catch block, and `days` query param validation (7/30/90 with fallback to 30).
2. **Implement current-period metrics query** — count active campaigns (`status: 'published'`), total submissions (`createdAt >= since`), active sites (`status: 'active'`), impressions + conversions for conversion rate.
3. **Implement previous-period metrics query** — same aggregations for the prior equivalent period (`previousSince` to `since`) to power trend indicators.
4. **Implement trend computation** — calculate percentage change `((current - previous) / previous) * 100`, handle zero-division by returning `null`.
5. **Implement top campaigns query** — top 5 campaigns by submission count within the period, include per-campaign conversion rate from ExperimentEvent counts.
6. **Implement recent activity query** — last 10 submissions with campaign name via Prisma relation include, masked email, `createdAt`.
7. **Implement email masking utility** — `maskEmail("josh@example.com")` returns `j***@example.com`; handle edge cases (single-char usernames, null email returns "Anonymous").
8. **Implement onboarding state query** — check existence of at least one site, one campaign, one submission, and one site with a published campaign (proxy for widget installed).
9. **Create `src/app/app/dashboard/stats-card.tsx`** — reusable card component accepting `label`, `value`, `trend` (percentage or null), `trendLabel`; renders trend arrow + color per design system.
10. **Create `src/app/app/dashboard/period-selector.tsx`** — 7d/30d/90d toggle with `aria-pressed`, calls `onPeriodChange` callback.
11. **Create `src/app/app/dashboard/quick-actions.tsx`** — three `Link` buttons: Create Campaign (`/app/campaigns/new`), View Submissions (`/app/submissions`), Check Analytics (`/app/analytics`).
12. **Create `src/app/app/dashboard/top-campaigns-table.tsx`** — mini-table with name, submissions count, conversion rate columns; empty state "No campaigns yet."
13. **Create `src/app/app/dashboard/onboarding-checklist.tsx`** — step list with check icons and progress indicator, action links for incomplete steps, auto-hides when all four steps complete.
14. **Create `src/app/app/dashboard/recent-activity.tsx`** — feed of last 10 submissions showing campaign name, masked email, relative timestamp; empty state "No recent activity."
15. **Create `src/app/app/dashboard/dashboard-skeleton.tsx`** — pulsing skeleton matching the full dashboard layout (four card placeholders, table rows, activity list).
16. **Create `src/app/app/dashboard/dashboard-error.tsx`** — error card with message display and retry button that re-triggers the fetch.
17. **Create `src/app/app/dashboard-client.tsx`** — `"use client"` component orchestrating `useEffect` data fetch, period state, loading/error/data branching, rendering all child components with correct props.
18. **Rewrite `src/app/app/page.tsx`** — Server Component that imports and renders `<DashboardClient />`.
19. **Write unit tests** for `route.ts` — auth enforcement, RBAC gating, param validation, metric aggregation, trend math, email masking, onboarding state.
20. **Write component tests** for `stats-card.tsx` and `onboarding-checklist.tsx` — verify rendering across all states, accessibility attributes (`aria-label`, `aria-pressed`, `aria-checked`).

---

## Dev Notes

- **Reference pattern:** The existing `GET /api/analytics/overview` route (`src/app/api/analytics/overview/route.ts`) demonstrates the exact auth/RBAC/period-filter/aggregation pattern. The dashboard API mirrors its structure but returns a broader dataset with trend data and onboarding state.
- **Email masking:** Mask all characters after the first character of the local part: `josh@example.com` becomes `j***@example.com`. If email is `null`, display "Anonymous".
- **Widget installed heuristic:** A site counts as "widget installed" if it has at least one published campaign associated with it. This is an approximation; true widget ping-back verification is out of scope.
- **Performance:** Use `Promise.all()` to run all Prisma queries in parallel. The dashboard endpoint runs 8-9 queries; parallelization keeps response time under 200ms on typical datasets.
- **Trend edge cases:** When previous period has 0 submissions, display "New" instead of "Infinity%". When both current and previous are 0, display no trend indicator.
- **Campaign status mapping:** The schema defines `CampaignStatus` as `draft | published | paused | archived`. For "active campaigns" count, filter on `status: 'published'` only.
- **Dark mode:** All components must support dark mode using the `dark:` Tailwind prefix, consistent with the existing design system in `layout.tsx` and `analytics/page.tsx`.
- **No SWR dependency assumed:** Use plain `useEffect` + `useState` pattern matching `analytics/page.tsx` unless SWR is already in `package.json`.

---

## References

- `src/app/api/analytics/overview/route.ts` — auth + aggregation pattern (96 lines)
- `src/app/app/analytics/page.tsx` — client component pattern, period selector, stats cards (115 lines)
- `src/app/app/layout.tsx` — design tokens, nav structure (50 lines)
- `src/lib/account.ts` — `withAccountContext()`, `AccountContextError` (94 lines)
- `src/lib/rbac.ts` — `canView()` (30 lines)
- `prisma/schema.prisma` — Campaign (lines 134-164), Submission (lines 202-227), ExperimentEvent (lines 268-285), Site (lines 91-111)
- `docs/PRD.md` — full product requirements

---

## Dev Agent Record

| Field | Value |
|-------|-------|
| Story ID | G-8 |
| Title | Dashboard Enhancement — Full Redesign |
| Created | 2026-03-23 |
| Status | Ready for Development |
| Agent | bmm-dev |
| Gate | G |
| Complexity | Medium (5 points) |
| Files to Create | `src/app/api/dashboard/route.ts`, `src/app/app/dashboard-client.tsx`, `src/app/app/dashboard/stats-card.tsx`, `src/app/app/dashboard/period-selector.tsx`, `src/app/app/dashboard/quick-actions.tsx`, `src/app/app/dashboard/top-campaigns-table.tsx`, `src/app/app/dashboard/onboarding-checklist.tsx`, `src/app/app/dashboard/recent-activity.tsx`, `src/app/app/dashboard/dashboard-skeleton.tsx`, `src/app/app/dashboard/dashboard-error.tsx` |
| Files to Modify | `src/app/app/page.tsx` (full rewrite from 12-line stub) |
| Schema Changes | None |
| Blocked By | Nothing (Tier 1) |
| Blocks | Nothing |
| Debug Log | N/A |
| Completion Notes | N/A |
