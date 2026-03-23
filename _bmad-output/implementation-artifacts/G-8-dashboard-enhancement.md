# Story G.8: Dashboard Enhancement

Status: ready-for-dev

## Story

As a merchant,
I want a rich dashboard with campaign stats, recent activity, and quick actions,
so that I can see an overview of my account health at a glance.

## Acceptance Criteria

1. Dashboard at `/app` shows summary stat cards (total campaigns, total submissions, conversion rate, active sites)
2. Stats cards show comparison to previous period (e.g., "+12% vs last week")
3. Recent activity feed shows last 10 events (new submissions, campaign publishes, team joins)
4. Quick action buttons: "Create Campaign", "View Submissions", "Check Analytics"
5. Top performing campaigns section with mini-table (name + submission count)
6. Dashboard data loads from a single aggregated `GET /api/dashboard` endpoint
7. Empty state for new accounts shows onboarding checklist prominently
8. Period selector: 7d / 30d / 90d for stats comparison

## Codebase Analysis

### Current Dashboard

**File:** `src/app/app/page.tsx` (12 lines)

```typescript
export default function DashboardPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Dashboard
      </h2>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Welcome to Capturely.
      </p>
    </div>
  );
}
```

This is a static stub with no data fetching — full redesign required.

### Existing Analytics Pattern

**File:** `src/app/api/analytics/overview/route.ts` (96 lines)

Key patterns to replicate in `/api/dashboard`:
- Uses `withAccountContext()` for auth + tenant scoping (line 9)
- Uses `canView(ctx.role)` for RBAC check — all roles can view (line 10)
- Period filter via `?days=30` query param (line 15)
- Calculates `since` date: `new Date(Date.now() - days * 24 * 60 * 60 * 1000)` (line 16)
- Aggregates with `Promise.all()` for parallel DB queries (line 26)
- Returns structured JSON with `period`, `metrics`, `topCampaigns`, `dailySubmissions`

### Campaign Model

**File:** `prisma/schema.prisma` (lines 134-164)

Campaign statuses: `draft`, `active`, `paused`, `archived`, `experimenting`, `promoting`. Count of `active` + `experimenting` + `promoting` = "active campaigns" for the dashboard.

## API Design: `GET /api/dashboard`

### Route: `src/app/api/dashboard/route.ts`

**Query params:**
- `days` — period length (7, 30, or 90; default: 30)

**Auth:** `withAccountContext()` + `canView(role)`

**Response shape:**

```typescript
interface DashboardResponse {
  period: {
    days: number;
    since: string; // ISO date
  };
  stats: {
    activeCampaigns: number;
    totalSubmissions: number;
    previousSubmissions: number; // for comparison
    conversionRate: number;     // percentage, 2 decimal places
    previousConversionRate: number;
    activeSites: number;
  };
  recentActivity: Array<{
    id: string;
    type: "submission" | "campaign_published" | "campaign_created";
    label: string;       // e.g., "New submission on Summer Popup"
    campaignName?: string;
    createdAt: string;
  }>;
  topCampaigns: Array<{
    id: string;
    name: string;
    submissions: number;
    conversionRate: number;
  }>;
  onboarding: {
    hasSites: boolean;
    hasCampaigns: boolean;
    hasSubmissions: boolean;
    hasWidgetInstalled: boolean; // manifest file exists check
  };
}
```

### Implementation Details

Parallel queries via `Promise.all()`:

1. **Active campaigns count:** `prisma.campaign.count({ where: { accountId, status: { in: ["active", "experimenting", "promoting"] } } })`
2. **Active sites count:** `prisma.site.count({ where: { accountId, status: "active" } })`
3. **Current period submissions:** `prisma.submission.count({ where: { accountId, createdAt: { gte: since } } })`
4. **Previous period submissions:** `prisma.submission.count({ where: { accountId, createdAt: { gte: previousSince, lt: since } } })` — where `previousSince = since - days`
5. **Conversion metrics (current):** count impressions + conversions from `ExperimentEvent` for the current period
6. **Conversion metrics (previous):** same for previous period
7. **Recent activity:** union query — last 10 submissions + recently published campaigns, sorted by date descending, take 10
8. **Top 5 campaigns:** campaigns ordered by submission count desc, include `_count.submissions`
9. **Onboarding checks:** sites count > 0, campaigns count > 0, submissions count > 0

**Widget installed check:** Query for any site with a `publicKey` that has a corresponding manifest. Simplification: check `Site.status = "active"` as proxy (widget installation sets site to active).

### Trend Calculation

```typescript
function trendPercentage(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}
```

Returns `null` when no previous data exists (UI shows "N/A" instead of a trend).

## Frontend Design: `src/app/app/page.tsx`

Full rewrite from 12-line stub to a client component with data fetching.

### Component Structure

```
DashboardPage (server component wrapper)
  DashboardContent ("use client")
    PeriodSelector (7d / 30d / 90d toggle)
    StatsCardsRow
      StatCard x4 (campaigns, submissions, conversion, sites)
    QuickActionsBar
      ActionButton x3 (Create Campaign, View Submissions, Check Analytics)
    ContentGrid (two-column on desktop)
      RecentActivityFeed (left)
      TopCampaignsTable (right)
    OnboardingChecklist (shown when any onboarding item is false)
```

### StatCard Component

Each card shows:
- Icon (from lucide-react or heroicons)
- Label (e.g., "Total Submissions")
- Value (e.g., "1,234")
- Trend badge: green up arrow with "+12%" or red down arrow with "-5%"
- Muted subtext: "vs previous 30 days"

### Period Selector

Three-button toggle group: `7d | 30d | 90d`. Updates query param and refetches data. Default: `30d`.

### Quick Actions Bar

Three CTA buttons linking to:
- `/app/campaigns/new` — "Create Campaign" (primary style)
- `/app/submissions` — "View Submissions" (secondary)
- `/app/analytics` — "Check Analytics" (secondary)

### Recent Activity Feed

- List of 10 items with icon, description, and relative timestamp
- Submission events: "New submission from user@example.com on {campaign}"
- Campaign events: "{campaign} was published"
- Empty state: "No recent activity. Create your first campaign to get started."

### Top Campaigns Mini-Table

| Campaign | Submissions | Conversion |
|----------|-------------|------------|
| Summer Popup | 342 | 4.2% |
| Exit Intent | 218 | 3.8% |

- Links campaign name to `/app/campaigns/{id}`
- Shows up to 5 rows
- Empty state: "No campaigns yet."

### Onboarding Checklist

Shown prominently when the account is new (any onboarding check is `false`):

- [ ] Add your first site — link to `/app/sites`
- [ ] Create a campaign — link to `/app/campaigns/new`
- [ ] Get your first submission — shows after campaign created
- [ ] Install the widget — link to docs/embed page

Progress bar at top: "2 of 4 complete". Each completed item has a green checkmark. Checklist collapses into a dismissible banner once all items are complete.

### Empty State

When `stats.activeCampaigns === 0 && stats.activeSites === 0`:
- Full-width onboarding checklist takes center stage
- Quick actions bar is still shown
- Stats cards show zeros with no trend indicators

### Data Fetching

```typescript
"use client";

import useSWR from "swr"; // or useEffect + fetch

const fetcher = (url: string) => fetch(url).then(r => r.json());

function DashboardContent() {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useSWR(`/api/dashboard?days=${days}`, fetcher);
  // ...
}
```

Use SWR if already in deps, otherwise plain `useEffect` + `useState` with loading skeleton.

## Tasks / Subtasks

- [ ] Create `src/app/api/dashboard/route.ts`
  - [ ] `withAccountContext()` + `canView()` auth check
  - [ ] `days` query param parsing (7/30/90, default 30)
  - [ ] Parallel queries for all stats via `Promise.all()`
  - [ ] Current + previous period submission counts for trend calculation
  - [ ] Conversion rate from ExperimentEvent impressions/conversions
  - [ ] Recent activity: last 10 submissions + campaign status changes
  - [ ] Top 5 campaigns by submission count with conversion rate
  - [ ] Onboarding state checks (has sites, campaigns, submissions)
  - [ ] Structured JSON response matching `DashboardResponse` interface
- [ ] Rewrite `src/app/app/page.tsx`
  - [ ] Server component wrapper with client content component
  - [ ] Period selector (7d / 30d / 90d)
  - [ ] Stats cards row with trend indicators
  - [ ] Quick actions bar (Create Campaign, View Submissions, Check Analytics)
  - [ ] Recent activity feed (last 10 items)
  - [ ] Top campaigns mini-table (top 5)
  - [ ] Loading skeleton states
- [ ] Create onboarding checklist component
  - [ ] Progress bar (X of 4 complete)
  - [ ] Checklist items with links to relevant pages
  - [ ] Prominent display for new accounts, collapsed for established accounts
- [ ] Add empty state handling when no data exists

## Dependencies

- **BLOCKED BY:** Nothing — standalone, Tier 1 story
- **BLOCKS:** Nothing

## Dev Notes

- Current dashboard at `src/app/app/page.tsx` is a 12-line static stub — this is a full rewrite
- Reference `src/app/api/analytics/overview/route.ts` (96 lines) for the auth + query pattern
- Single aggregated API call is critical — avoid multiple round trips from the client
- The `previousSince` date for trend comparison: `new Date(since.getTime() - days * 24 * 60 * 60 * 1000)`
- Activity feed combines Submission + Campaign records — query both and merge/sort in application code
- Onboarding checklist state is derived from counts, no separate storage needed
- Use Tailwind dark mode classes (`dark:`) consistent with existing stub styling

### Project Structure Notes

- New file: `src/app/api/dashboard/route.ts`
- Full rewrite: `src/app/app/page.tsx` (12 lines to full dashboard)
- No schema changes required

### References

- [Source: src/app/app/page.tsx — current 12-line stub]
- [Source: src/app/api/analytics/overview/route.ts — 96 lines, auth + query pattern]
- [Source: prisma/schema.prisma — Campaign statuses at lines 125-132, Submission model]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
