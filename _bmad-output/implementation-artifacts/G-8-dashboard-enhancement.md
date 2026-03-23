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
5. Top performing campaigns section with mini conversion charts
6. Dashboard data loads from a single aggregated API endpoint
7. Empty state for new accounts (onboarding checklist: add site, create campaign, install widget)

## Tasks / Subtasks

- [ ] Create `GET /api/dashboard` aggregation endpoint (AC: 6)
  - [ ] Total active campaigns count
  - [ ] Total submissions (current period + previous period for comparison)
  - [ ] Overall conversion rate
  - [ ] Active sites count
  - [ ] Recent activity log (last 10 events)
  - [ ] Top 5 campaigns by conversion rate
- [ ] Redesign `src/app/app/page.tsx` dashboard page (AC: 1)
  - [ ] Stat cards row with values + trend indicators (AC: 1, 2)
  - [ ] Recent activity feed component (AC: 3)
  - [ ] Quick action buttons section (AC: 4)
  - [ ] Top campaigns mini-table/chart (AC: 5)
- [ ] Create empty state / onboarding checklist component (AC: 7)
  - [ ] Check: has sites? has campaigns? has submissions?
  - [ ] Show progress checklist with links to each step
- [ ] Add period selector (7d / 30d / 90d) for stats comparison (AC: 2)

## Dev Notes

- Reference Figma: `pages/dashboard.tsx`
- Current dashboard is a simple welcome page — this is a full redesign
- Use the existing analytics patterns from `/api/analytics/overview` as a reference
- Keep the API call count low — one aggregated endpoint is better than 5 separate calls
- Activity feed: query recent submissions + recent campaign status changes
- For new accounts, the onboarding checklist drives first-time activation

### Project Structure Notes

- Touches: `src/app/app/page.tsx` (full rewrite)
- New file: `src/app/api/dashboard/route.ts`

### References

- [Source: Figma Make — pages/dashboard.tsx]
- [Source: src/app/api/analytics/overview/route.ts — existing analytics pattern]
- [Source: src/app/app/page.tsx — current simple dashboard]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
