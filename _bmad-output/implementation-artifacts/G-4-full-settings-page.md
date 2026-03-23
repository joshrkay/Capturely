# Story G.4: Full Settings Page

Status: ready-for-dev

## Story

As a merchant,
I want a comprehensive settings page with account, notifications, API keys, and danger zone sections,
so that I can manage all aspects of my Capturely account in one place.

## Acceptance Criteria

1. Settings page at `/app/settings` has tabbed navigation: Account, Team, Notifications, API, Danger Zone
2. Account tab: edit account name, default timezone, default language
3. Team tab: existing team management (already built — integrate into tabbed layout)
4. Notifications tab: toggle email notifications per event type (new submission, usage warning, team invite)
5. API tab: display account-level API keys, regenerate button, usage stats
6. Danger Zone tab: delete account (with confirmation), export all data
7. All changes persist via PATCH `/api/settings` endpoint
8. Only owner can access Danger Zone; owner/admin can edit Account and Notifications

## Tasks / Subtasks

- [ ] Restructure `src/app/app/settings/` to have a tabbed layout component (AC: 1)
  - [ ] Create `src/app/app/settings/page.tsx` as tab container
  - [ ] Move existing team page into a Team tab component
- [ ] Create Account tab component (AC: 2)
  - [ ] Account name input
  - [ ] Timezone selector
  - [ ] Language selector
- [ ] Create Notifications tab component (AC: 4)
  - [ ] Toggle switches per notification event
  - [ ] Fetch/save notification preferences
- [ ] Create API tab component (AC: 5)
  - [ ] Display account API keys (masked)
  - [ ] Regenerate key with confirmation
  - [ ] Usage statistics display
- [ ] Create Danger Zone tab component (AC: 6)
  - [ ] Delete account with typed confirmation ("DELETE")
  - [ ] Export data button (generates CSV/JSON download)
- [ ] Create `PATCH /api/settings` endpoint (AC: 7)
- [ ] Add RBAC checks per tab (AC: 8)

## Dev Notes

- Reference Figma: `pages/settings.tsx`
- Team page already exists at `src/app/app/settings/team/page.tsx` — refactor into tab
- Account model may need new fields (timezone, language, notificationPrefs as JSON)
- Danger Zone: delete account = cascade delete all data. Use a transaction. Require typing "DELETE" to confirm.
- Data export: generate a ZIP with submissions CSV, campaigns JSON, settings JSON

### Project Structure Notes

- Restructure: `src/app/app/settings/` directory
- New files: `settings/page.tsx` (tabbed layout), `settings/account.tsx`, `settings/notifications.tsx`, `settings/api-keys.tsx`, `settings/danger-zone.tsx`
- Touches: `prisma/schema.prisma` (Account fields), `src/app/api/settings/route.ts`

### References

- [Source: Figma Make — pages/settings.tsx]
- [Source: src/app/app/settings/team/page.tsx — existing team tab]
- [Source: src/lib/rbac.ts — role checks]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
