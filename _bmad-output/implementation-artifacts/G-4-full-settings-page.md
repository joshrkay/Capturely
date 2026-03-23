# Story G.4: Full Settings Page (Tabbed Layout)

Status: ready-for-dev

## Story

As a merchant,
I want a comprehensive settings page with tabs for Account, Team, Notifications, API Keys, and Danger Zone,
so that I can manage all aspects of my Capturely account in one organized place.

## Acceptance Criteria

1. Settings page at `/app/settings` renders a tabbed layout with five tabs: Account, Team, Notifications, API Keys, Danger Zone
2. Account tab: edit account name, timezone (dropdown), and language (dropdown) via `PATCH /api/settings`
3. Team tab: renders the existing team management UI from `src/app/app/settings/team/page.tsx` — preserves all current functionality
4. Notifications tab: toggle switches for notification preferences (newSubmission, usageWarning, teamInvite, campaignPublish)
5. API Keys tab: displays site-level public and secret keys (masked by default), with reveal toggle and regenerate button
6. Danger Zone tab: delete account with typed "DELETE" confirmation, owner only
7. All changes save via `PATCH /api/settings` with Zod-validated input
8. RBAC enforcement: Danger Zone = owner only (`canManageBilling`), Account/Notifications = owner/admin (`canManageTeam`), API Keys/Team = all can view (`canView`)
9. New Account model fields: `timezone`, `language`, `notificationPreferences` persisted via Prisma migration
10. `DELETE /api/settings/account` endpoint for account deletion, owner only, cascades all data

## Tasks / Subtasks

- [ ] Add new fields to Account model in `prisma/schema.prisma` (AC: 9)
  - [ ] `timezone String? @default("UTC") @map("timezone")`
  - [ ] `language String? @default("en") @map("language")`
  - [ ] `notificationPreferences String? @map("notification_preferences")` (stores JSON string)
  - [ ] Run `npx prisma migrate dev --name add-account-settings`
- [ ] Create `PATCH /api/settings/route.ts` endpoint (AC: 2, 4, 7)
  - [ ] Validate input with Zod schema:
    ```
    { name?: string, timezone?: string, language?: string, notificationPreferences?: object }
    ```
  - [ ] Auth: `withAccountContext()` + `canManageTeam(role)` check — 403 if member role
  - [ ] Scope update to `WHERE id = accountId`
  - [ ] Serialize `notificationPreferences` to JSON string before saving
  - [ ] Return updated account fields
- [ ] Create `DELETE /api/settings/account/route.ts` endpoint (AC: 6, 10)
  - [ ] Auth: `withAccountContext()` + `canManageBilling(role)` — 403 if not owner
  - [ ] Require `{ confirmation: "DELETE" }` in request body (Zod validated)
  - [ ] Delete account record — Prisma cascades via `onDelete: Cascade` on all relations
  - [ ] Sign user out of Clerk session after deletion
  - [ ] Return `{ success: true }`
- [ ] Create `src/app/app/settings/page.tsx` as server component — tabbed container (AC: 1)
  - [ ] Fetch account data server-side: `prisma.account.findUnique({ where: { id: accountId } })`
  - [ ] Fetch sites for API Keys tab: `prisma.site.findMany({ where: { accountId } })`
  - [ ] Call `withAccountContext()` for role
  - [ ] Parse `notificationPreferences` JSON string into typed object
  - [ ] Pass data to `<SettingsPageClient>` client component
- [ ] Create `src/app/app/settings/components/settings-page-client.tsx` as `"use client"` (AC: 1)
  - [ ] Tab state managed in component state, default to "Account"
  - [ ] Tab bar with five tab buttons
  - [ ] Conditionally render tab content based on active tab
  - [ ] Hide Danger Zone tab entirely for non-owner roles (AC: 8)
- [ ] Create `src/app/app/settings/components/account-tab.tsx` as `"use client"` (AC: 2)
  - [ ] Account name text input (pre-filled from current value)
  - [ ] Timezone dropdown — common timezones list (UTC, US/Eastern, US/Pacific, Europe/London, etc.)
  - [ ] Language dropdown — "English", "Spanish", "French", "German", "Portuguese"
  - [ ] "Save Changes" button — calls `PATCH /api/settings` with form data
  - [ ] Success/error toast feedback
  - [ ] Disabled state for member role (read-only view)
- [ ] Integrate existing Team tab (AC: 3)
  - [ ] PRESERVE `src/app/app/settings/team/page.tsx` — it continues to work as a standalone route
  - [ ] Create `src/app/app/settings/components/team-tab.tsx` that renders the same team member table and invite button
  - [ ] Reuse the Prisma query pattern from the existing team page
  - [ ] Pass `members` and `isManager` as props from the server component
- [ ] Create `src/app/app/settings/components/notifications-tab.tsx` as `"use client"` (AC: 4)
  - [ ] Toggle switches for each notification type:
    - `newSubmission` — "New form submission received"
    - `usageWarning` — "Approaching usage limit"
    - `teamInvite` — "Team invite accepted"
    - `campaignPublish` — "Campaign published"
  - [ ] Pre-fill from parsed `notificationPreferences` object (default all to `true` if null)
  - [ ] Auto-save on toggle change via `PATCH /api/settings` with debounce
  - [ ] Disabled state for member role
- [ ] Create `src/app/app/settings/components/api-keys-tab.tsx` as `"use client"` (AC: 5)
  - [ ] List each site with its public key and secret key
  - [ ] Keys masked by default: `pk_abc...xyz` / `sk_•••••••••••`
  - [ ] "Reveal" toggle button per key to show full value
  - [ ] Copy-to-clipboard button per key
  - [ ] "Regenerate" button per site — calls `POST /api/sites/[id]/rotate-keys`
  - [ ] Regenerate requires typed confirmation (site name)
  - [ ] Show site name and domain as row header
- [ ] Create `src/app/app/settings/components/danger-zone-tab.tsx` as `"use client"` (AC: 6)
  - [ ] Red-bordered warning card with destructive styling
  - [ ] "Delete Account" section with explanation text
  - [ ] Text input: "Type DELETE to confirm"
  - [ ] Delete button disabled until input matches "DELETE" exactly
  - [ ] On confirm: calls `DELETE /api/settings/account` with `{ confirmation: "DELETE" }`
  - [ ] On success: redirect to `/sign-in` (session terminated)
  - [ ] Loading state on button during deletion

## Dev Notes

### Schema Migration

Three new nullable fields on the Account model. The migration is additive and non-breaking:

```prisma
model Account {
  // ... existing fields ...

  // Settings fields (Gate G)
  timezone                String?  @default("UTC") @map("timezone")
  language                String?  @default("en") @map("language")
  notificationPreferences String?  @map("notification_preferences") // JSON string
}
```

The `notificationPreferences` field stores a JSON string. Parse it on read, serialize on write:

```typescript
interface NotificationPreferences {
  newSubmission: boolean;
  usageWarning: boolean;
  teamInvite: boolean;
  campaignPublish: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  newSubmission: true,
  usageWarning: true,
  teamInvite: true,
  campaignPublish: true,
};
```

### Preserving the Existing Team Page

The existing `src/app/app/settings/team/page.tsx` MUST continue to work as a standalone route. The "Team" nav link currently points to `/app/settings/team`. After this story:
- `/app/settings` renders the tabbed layout with Team as one tab
- `/app/settings/team` still works (Next.js nested route)
- Update the "Team" entry in `navLinks` to point to `/app/settings` instead of `/app/settings/team`

### RBAC Per Tab

| Tab | Required Role | RBAC Helper |
|-----|--------------|-------------|
| Account | owner, admin | `canManageTeam(role)` |
| Team | all (view), owner/admin (manage) | `canView(role)` / `canManageTeam(role)` |
| Notifications | owner, admin | `canManageTeam(role)` |
| API Keys | all (view), owner/admin (regenerate) | `canView(role)` / `canManageSites(role)` |
| Danger Zone | owner only | `canManageBilling(role)` |

Members see Account and Notifications tabs as read-only (inputs disabled). Danger Zone tab is hidden entirely for non-owners.

### Account Deletion Cascade

Prisma's `onDelete: Cascade` on all Account relations handles cleanup:
- `AccountMember` records (cascade)
- `Invite` records (cascade)
- `Site` records (cascade) → which cascades `Submission`, `Campaign`, `Webhook`
- `Notification` records (cascade)
- `AccountUsage` record (cascade)

After deletion, the Clerk session should be invalidated. Redirect to `/sign-in`.

### API Keys Display

This tab shows site-level keys, not account-level keys. Each site has a `publicKey` and `secretKey`. The regenerate action calls the existing `POST /api/sites/[id]/rotate-keys` endpoint (from Gate A Story 14). No new key endpoints are needed.

### Design System

Follow established Capturely patterns:
- Page background: `bg-zinc-50 dark:bg-black`
- Tab bar: `border-b border-zinc-200 dark:border-zinc-800`
- Active tab: `border-b-2 border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100`
- Inactive tab: `text-zinc-500 hover:text-zinc-700 dark:text-zinc-400`
- Form inputs: `rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100`
- Danger Zone card: `border-2 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20`
- Toggle switches: custom or CSS-only toggle component

### Zod Validation for PATCH /api/settings

```typescript
import { z } from "zod";

const notificationPreferencesSchema = z.object({
  newSubmission: z.boolean().optional(),
  usageWarning: z.boolean().optional(),
  teamInvite: z.boolean().optional(),
  campaignPublish: z.boolean().optional(),
});

const updateSettingsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  timezone: z.string().max(50).optional(),
  language: z.string().max(10).optional(),
  notificationPreferences: notificationPreferencesSchema.optional(),
});
```

### Project Structure Notes

- New files:
  - `src/app/app/settings/page.tsx` (tabbed container)
  - `src/app/app/settings/components/settings-page-client.tsx`
  - `src/app/app/settings/components/account-tab.tsx`
  - `src/app/app/settings/components/team-tab.tsx`
  - `src/app/app/settings/components/notifications-tab.tsx`
  - `src/app/app/settings/components/api-keys-tab.tsx`
  - `src/app/app/settings/components/danger-zone-tab.tsx`
  - `src/app/api/settings/route.ts` (PATCH)
  - `src/app/api/settings/account/route.ts` (DELETE)
- Modified files:
  - `prisma/schema.prisma` (add timezone, language, notificationPreferences to Account)
  - `src/app/app/layout.tsx` (update "Team" navLink to point to `/app/settings`)
- Existing files preserved (NOT modified):
  - `src/app/app/settings/team/page.tsx` (standalone route still works)
  - `src/lib/rbac.ts` (existing helpers used as-is)
  - `src/lib/account.ts` (`withAccountContext()`)

### Dependencies

- **BLOCKED BY:** Nothing — all prerequisites (Account model, Team page, RBAC, Sites CRUD) are complete
- **BLOCKS:** Nothing

### References

- [Source: prisma/schema.prisma — Account model, lines 16-40]
- [Source: src/app/app/settings/team/page.tsx — existing team management page]
- [Source: src/app/app/layout.tsx — navLinks array, line 6-14]
- [Source: src/lib/account.ts — withAccountContext() returns { accountId, userId, role }]
- [Source: src/lib/rbac.ts — canManageTeam(), canManageBilling(), canView()]
- [Source: src/app/api/sites/[id]/rotate-keys — existing key rotation endpoint]
- [Source: docs/PRD.md#Gate G — Full Settings Page]

## Testing Notes

- Verify tabbed layout renders with all five tabs at `/app/settings`
- Verify Account tab pre-fills current account name, timezone, language
- Verify saving account changes via "Save Changes" persists to database
- Verify Team tab renders existing member table with invite functionality
- Verify `/app/settings/team` standalone route still works
- Verify Notifications tab toggles persist via PATCH endpoint
- Verify default notification preferences are all `true` when no preferences saved
- Verify API Keys tab lists all sites with masked keys
- Verify key reveal toggle shows full key value
- Verify copy-to-clipboard works for keys
- Verify Danger Zone is hidden for admin and member roles
- Verify Danger Zone is visible for owner role
- Verify delete button is disabled until "DELETE" is typed exactly
- Verify account deletion cascades all related data
- Verify user is redirected to sign-in after account deletion
- Verify member role sees Account and Notifications tabs as read-only
- Verify PATCH /api/settings returns 403 for member role
- Verify DELETE /api/settings/account returns 403 for non-owner
- Verify page renders correctly in light and dark mode
- Verify Zod validation rejects invalid input on both endpoints

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
