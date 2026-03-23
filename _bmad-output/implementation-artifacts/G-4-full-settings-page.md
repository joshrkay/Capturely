# G-4: Full Settings Page — Tabbed Layout with Account, Team, Notifications, API Keys, Danger Zone

## Story

**As an** account owner or admin,
**I want** a unified settings page with tabbed navigation,
**so that** I can manage account details, team membership, notification preferences, API keys, and destructive account actions from a single, organized interface.

The existing team page at `src/app/app/settings/team/page.tsx` must be preserved and integrated as the Team tab content. The nav link in `src/app/app/layout.tsx` (line 13) must change from `{ href: "/app/settings/team", label: "Team" }` to `{ href: "/app/settings", label: "Settings" }`.

**Priority:** Medium
**Gate:** G (Dashboard Enhancement)
**Estimate:** 5 points
**BLOCKED BY:** Nothing (Gate A foundation complete)
**BLOCKS:** Nothing

---

## Dependencies

| Dependency | Status | Notes |
|---|---|---|
| Clerk Auth (G-1) | Done | `withAccountContext()` available in `src/lib/account.ts` |
| Prisma + Account model (G-2/3) | Done | `prisma/schema.prisma` lines 16-40 |
| RBAC helpers (G-6) | Done | `src/lib/rbac.ts` — `canManageTeam`, `canManageBilling`, `canView` |
| Sites CRUD + Keys (G-12/13/14) | Done | `src/app/api/sites/` routes, `rotate-keys` endpoint exists |
| Team page (G-7) | Done | `src/app/app/settings/team/page.tsx` — reuse as tab content |

---

## Existing Code Inventory

| File | Relevance |
|---|---|
| `prisma/schema.prisma` (lines 16-40) | Account model — needs `timezone`, `language`, `notificationPreferences` fields |
| `src/lib/account.ts` | `withAccountContext()` returns `{ accountId, userId, role: MemberRole }` |
| `src/lib/rbac.ts` | `canManageTeam()` (owner/admin), `canManageBilling()` (owner), `canView()` (all) |
| `src/app/app/settings/team/page.tsx` | 87-line server component with team members table — extract into reusable component |
| `src/app/app/layout.tsx` (line 13) | Nav link `{ href: "/app/settings/team", label: "Team" }` must update |
| `src/app/api/sites/[id]/rotate-keys/route.ts` | Existing key rotation endpoint — calls `generatePublicKey()`, `generateSecretKey()` |
| `src/lib/db.ts` | Prisma client singleton |
| `src/lib/keys.ts` | `generatePublicKey()`, `generateSecretKey()` utilities |

---

## Acceptance Criteria

1. **AC-1:** Settings page renders at `/app/settings` with five tabs: Account, Team, Notifications, API Keys, Danger Zone.
2. **AC-2:** Tab state is managed via URL search parameter `?tab=account|team|notifications|api-keys|danger-zone`, defaulting to `account`.
3. **AC-3:** Existing team page content (`src/app/app/settings/team/page.tsx`) renders identically within the Team tab with no visual regression.
4. **AC-4:** Account tab displays editable account name, timezone select, and language select. Saving calls `PATCH /api/settings`.
5. **AC-5:** Notifications tab displays four toggles (newSubmission, usageWarning, teamInvite, campaignPublish) persisted via `PATCH /api/settings`.
6. **AC-6:** API Keys tab lists all sites with their public keys (visible) and secret keys (masked as `sk_••••••••` with copy-to-clipboard and reveal toggle).
7. **AC-7:** API Keys tab provides a "Regenerate Keys" button per site that triggers a confirmation dialog before calling `POST /api/sites/:id/rotate-keys`.
8. **AC-8:** Danger Zone tab is visible only to `owner` role (guarded by `canManageBilling`). Non-owners see no Danger Zone tab at all.
9. **AC-9:** Danger Zone requires typing "DELETE" into a confirmation input before the delete button becomes enabled.
10. **AC-10:** `DELETE /api/settings/account` cascades deletion of the account and all related data. Returns 403 for non-owners.
11. **AC-11:** All API routes validate input with Zod and check RBAC before performing mutations.
12. **AC-12:** Nav link in `src/app/app/layout.tsx` updates from `{ href: "/app/settings/team", label: "Team" }` to `{ href: "/app/settings", label: "Settings" }`.
13. **AC-13:** Members with `canView` only role see Account (read-only), Team (read-only), and Notifications tabs. Account and Notifications inputs are disabled with `opacity-60` for members.
14. **AC-14:** Prisma migration `add-account-settings` adds `timezone`, `language`, and `notificationPreferences` fields to Account model without breaking existing data.

---

## Prisma Schema Changes

Add three fields to the `Account` model (after line 29 in `prisma/schema.prisma`, before the relation fields):

```prisma
  // Settings fields (Gate G)
  timezone                String?  @default("UTC") @map("timezone")
  language                String?  @default("en") @map("language")
  notificationPreferences String?  @map("notification_preferences") // JSON string
```

Run migration:

```bash
npx prisma migrate dev --name add-account-settings
```

### Notification Preferences JSON Shape

```typescript
interface NotificationPreferences {
  newSubmission: boolean;    // default true
  usageWarning: boolean;     // default true
  teamInvite: boolean;       // default true
  campaignPublish: boolean;  // default false
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  newSubmission: true,
  usageWarning: true,
  teamInvite: true,
  campaignPublish: false,
};
```

---

## API Contracts

### PATCH /api/settings

**File:** `src/app/api/settings/route.ts`
**Auth:** `withAccountContext()` — `canManageTeam(role)` required for name/timezone/language mutations; any authenticated role can update own notification preferences.

**Request body (Zod-validated):**

```typescript
const updateSettingsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  timezone: z.string().max(50).optional(),
  language: z.string().max(10).optional(),
  notificationPreferences: z.object({
    newSubmission: z.boolean(),
    usageWarning: z.boolean(),
    teamInvite: z.boolean(),
    campaignPublish: z.boolean(),
  }).optional(),
});
```

**Response 200:** `{ account: { id, name, timezone, language, notificationPreferences } }`
**Response 400:** `{ error: "Invalid input", code: "VALIDATION_ERROR" }`
**Response 403:** `{ error: "Forbidden", code: "FORBIDDEN" }`

### DELETE /api/settings/account

**File:** `src/app/api/settings/account/route.ts`
**Auth:** `withAccountContext()` — `canManageBilling(role)` (owner only).

**Request body (Zod-validated):**

```typescript
const deleteAccountSchema = z.object({
  confirmation: z.literal("DELETE"),
});
```

**Response 200:** `{ deleted: true }`
**Response 400:** `{ error: "Invalid confirmation", code: "INVALID_CONFIRMATION" }`
**Response 403:** `{ error: "Forbidden", code: "FORBIDDEN" }`

Cascade: Prisma `onDelete: Cascade` on all Account relations handles cleanup of members, invites, sites, submissions, campaigns, notifications, usage.

---

## Component Architecture

```
src/app/app/settings/
  layout.tsx                # NEW — settings page wrapper with heading
  page.tsx                  # NEW — server component, resolves context, fetches data, renders tabs
  components/
    settings-tabs.tsx       # "use client" — tab bar with role-based visibility, URL param sync
    account-tab.tsx         # "use client" — account name, timezone, language form
    team-tab.tsx            # Server component wrapper — reuses existing team member table + invite
    notifications-tab.tsx   # "use client" — four toggle switches for notification prefs
    api-keys-tab.tsx        # "use client" — site keys list, masked secrets, copy, regenerate
    danger-zone-tab.tsx     # "use client" — delete account with typed confirmation
  team/
    page.tsx                # KEEP UNCHANGED — redirect or standalone route for backward compat
```

### Data Flow

1. `page.tsx` (server) calls `withAccountContext()` to get `{ accountId, userId, role }`.
2. Fetches account record (name, timezone, language, notificationPreferences), sites list (id, name, publicKey, secretKey), and members list.
3. Passes serialized props to `settings-tabs.tsx` (client component).
4. Each tab component receives only the data slice it needs.
5. Mutations use `fetch()` to call API routes, then `router.refresh()` to re-fetch server data.

---

## UI States

| State | Behavior |
|---|---|
| **Loading** | Skeleton placeholders in each tab content area while server data loads |
| **Save success** | Inline green toast: "Settings saved" — auto-dismiss after 3 seconds |
| **Save error** | Inline red alert below the form with error message from API |
| **Key regeneration pending** | Confirm dialog: "This will invalidate the current keys for {siteName}. Continue?" |
| **Key regenerated** | Flash new key row with green highlight for 5 seconds, then normal |
| **Key revealed** | Full key text shown; toggle button changes to "Hide" |
| **Delete confirmation** | Input field + disabled red button; button enables only when input value === "DELETE" |
| **Delete in progress** | Button shows spinner, input and button both disabled |
| **Role-restricted tab hidden** | Danger Zone tab not rendered in tab bar for non-owners |
| **Role-restricted fields** | Inputs rendered with `disabled` attribute and `opacity-60` class for member role |
| **Empty sites (API Keys)** | "No sites yet. Create a site to generate API keys." with link to `/app/sites` |
| **Notification toggle saving** | Brief spinner on the individual toggle during debounced auto-save |

---

## Design System Compliance

All components must use established Capturely design tokens observed in existing codebase:

- **Page background:** `bg-zinc-50 dark:bg-black`
- **Card/panel:** `bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg`
- **Tab bar container:** `border-b border-zinc-200 dark:border-zinc-800`
- **Active tab:** `border-b-2 border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-50 font-medium`
- **Inactive tab:** `text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300`
- **Inputs:** `rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100`
- **Primary button:** `rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200`
- **Destructive button:** `rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50`
- **Toggle switch:** Custom `<button role="switch">` — off: `bg-zinc-300 dark:bg-zinc-700`, on: `bg-zinc-900 dark:bg-zinc-100`
- **Section headings:** `text-lg font-semibold text-zinc-900 dark:text-zinc-50`
- **Help/description text:** `text-sm text-zinc-500 dark:text-zinc-400`
- **Danger Zone card:** `border-2 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20 rounded-lg p-6`
- **Badge (role):** `inline-flex rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200`

---

## Accessibility

- Tab bar uses `role="tablist"`; each tab button uses `role="tab"` with `aria-selected="true|false"` and `aria-controls="panel-{tabId}"`.
- Tab panels use `role="tabpanel"` with `aria-labelledby="tab-{tabId}"` and `tabindex="0"`.
- Arrow key navigation between tabs (Left/Right arrows cycle through visible tabs; Home/End jump to first/last).
- Toggle switches use `role="switch"` with `aria-checked="true|false"` and associated `<label>`.
- Delete confirmation input has `aria-describedby` pointing to helper text explaining the "DELETE" requirement.
- All form inputs have associated visible `<label>` elements (not just placeholder text).
- Focus management: when switching tabs via keyboard, focus moves to the active tab panel.
- Color contrast ratios meet WCAG 2.1 AA minimum (4.5:1 for normal text, 3:1 for large text and interactive elements).
- Destructive actions require explicit confirmation (not just a single click).

---

## Testing Plan

### Unit Tests

- `canManageTeam()` returns `true` for owner and admin, `false` for member.
- `canManageBilling()` returns `true` only for owner.
- `canView()` returns `true` for all three roles.
- Notification preferences JSON serialization/deserialization round-trips correctly with `DEFAULT_NOTIFICATION_PREFS`.
- Zod `updateSettingsSchema` rejects: empty name, timezone > 50 chars, language > 10 chars, missing boolean in notificationPreferences.
- Zod `deleteAccountSchema` rejects any confirmation value other than literal "DELETE".

### Integration Tests (API Routes)

- `PATCH /api/settings` with valid body updates account name/timezone/language and returns 200.
- `PATCH /api/settings` returns 403 for member role attempting to update name/timezone/language.
- `PATCH /api/settings` allows member role to update own notificationPreferences (returns 200).
- `PATCH /api/settings` with invalid Zod input returns 400 with `VALIDATION_ERROR` code.
- `PATCH /api/settings` scopes update to `WHERE id = accountId` (no cross-tenant mutation).
- `DELETE /api/settings/account` returns 200 for owner with `{ confirmation: "DELETE" }`.
- `DELETE /api/settings/account` returns 403 for admin role.
- `DELETE /api/settings/account` returns 403 for member role.
- `DELETE /api/settings/account` returns 400 when confirmation is not "DELETE".
- Account deletion cascades: verify members, sites, invites, submissions, notifications, usage records are gone.

### Component Tests

- Settings tabs render correct set of tabs based on user role (owner sees 5, admin sees 4, member sees 4).
- Danger Zone tab hidden for admin and member roles.
- Account tab form fields are disabled when `role === "member"`.
- Delete button stays disabled until input value is exactly "DELETE".
- API Keys tab masks secret keys by default; reveal toggle shows full value.
- Copy-to-clipboard button copies correct key value.
- Notification toggles reflect saved state on initial load (parsed from JSON).
- Tab switching updates URL search parameter without full page reload.

### E2E Tests

- Owner navigates to `/app/settings`, updates account name, saves, and sees change persisted on reload.
- Owner navigates to Danger Zone, types "DELETE", confirms, account is deleted, user is redirected to sign-in.
- Admin can update notification preferences but cannot see Danger Zone tab.
- Member can view all visible tabs but cannot edit Account name/timezone/language fields.
- Navigating to `/app/settings?tab=team` shows Team tab pre-selected.
- Navigating to `/app/settings/team` (old URL) still works (backward compatibility).

---

## Anti-Patterns to Avoid

1. **No `any` types** — all API request/response payloads and component props must be fully typed with TypeScript interfaces.
2. **No client-side RBAC as sole guard** — always enforce RBAC server-side in API routes; client hides UI but server rejects unauthorized requests.
3. **No unscoped queries** — every Prisma query must include `accountId` in the WHERE clause to enforce tenant isolation.
4. **No raw SQL** — use Prisma client methods exclusively for all database operations.
5. **No secrets in client bundle** — secret keys must be fetched via API call from client components, never embedded in server component props serialized to the client.
6. **No optimistic deletion** — account deletion must complete server-side before any client-side redirect occurs.
7. **No localStorage for tab state** — use URL search params (`?tab=`) for tab state so links are shareable and back-button works.
8. **No inline fetch URLs** — define API endpoint paths as constants or use a helper to construct them.

---

## Tasks

1. **T-1:** Add `timezone`, `language`, `notificationPreferences` fields to Account model in `prisma/schema.prisma` (after line 29, before relation fields).
2. **T-2:** Run `npx prisma migrate dev --name add-account-settings` and verify migration applies cleanly. Regenerate Prisma client.
3. **T-3:** Define `NotificationPreferences` TypeScript interface and `DEFAULT_NOTIFICATION_PREFS` constant in `src/lib/settings.ts`.
4. **T-4:** Create Zod schemas (`updateSettingsSchema`, `deleteAccountSchema`) in `src/app/api/settings/schemas.ts`.
5. **T-5:** Create `src/app/api/settings/route.ts` — `PATCH` handler with Zod validation, RBAC checks (`canManageTeam` for account fields, `canView` for notification prefs), scoped account update.
6. **T-6:** Create `src/app/api/settings/account/route.ts` — `DELETE` handler with `canManageBilling` check, confirmation validation, cascade delete via `prisma.account.delete()`.
7. **T-7:** Create `src/app/app/settings/layout.tsx` — settings page wrapper with "Settings" heading and consistent padding.
8. **T-8:** Create `src/app/app/settings/page.tsx` — server component that calls `withAccountContext()`, fetches account + sites + members, passes data to client tabs component.
9. **T-9:** Create `src/app/app/settings/components/settings-tabs.tsx` — client component with `role="tablist"`, URL search param sync via `useSearchParams()`, arrow key navigation, role-based tab filtering.
10. **T-10:** Create `src/app/app/settings/components/account-tab.tsx` — form with name input, timezone select (populated via `Intl.supportedValuesOf("timeZone")`), language select, "Save Changes" button.
11. **T-11:** Extract team members table from `src/app/app/settings/team/page.tsx` into `src/app/app/settings/components/team-tab.tsx` as a reusable component accepting `members` and `isManager` props.
12. **T-12:** Update `src/app/app/settings/team/page.tsx` to either redirect to `/app/settings?tab=team` or import and render the extracted team-tab component for backward compatibility.
13. **T-13:** Create `src/app/app/settings/components/notifications-tab.tsx` — four toggle switches with labels, auto-save on toggle with 500ms debounce, calls `PATCH /api/settings`.
14. **T-14:** Create `src/app/app/settings/components/api-keys-tab.tsx` — lists sites with masked keys, reveal toggle, copy-to-clipboard, regenerate button with confirmation dialog calling `POST /api/sites/:id/rotate-keys`.
15. **T-15:** Create `src/app/app/settings/components/danger-zone-tab.tsx` — red-bordered warning card, typed "DELETE" confirmation input, disabled button until match, calls `DELETE /api/settings/account`, redirects to `/sign-in` on success.
16. **T-16:** Update `src/app/app/layout.tsx` line 13 — change nav link from `{ href: "/app/settings/team", label: "Team" }` to `{ href: "/app/settings", label: "Settings" }`.
17. **T-17:** Implement role-based tab visibility: hide Danger Zone for non-owners via `canManageBilling`, disable mutation inputs for members, enforce in both UI and API.
18. **T-18:** Add loading skeleton states for each tab content area using Tailwind `animate-pulse` placeholder blocks.
19. **T-19:** Write unit tests for Zod schemas, RBAC guard logic, and notification preferences serialization.
20. **T-20:** Write integration tests for `PATCH /api/settings` and `DELETE /api/settings/account` covering all role permutations and validation edge cases.

---

## Dev Notes

- The existing `POST /api/sites/:id/rotate-keys` endpoint (in `src/app/api/sites/[id]/rotate-keys/route.ts`) already handles key regeneration with RBAC via `canManageSites`. The API Keys tab should call this endpoint directly — no new key rotation endpoint needed.
- `notificationPreferences` is stored as a JSON string in a single nullable column. Parse with `JSON.parse()` on read (falling back to `DEFAULT_NOTIFICATION_PREFS` when null), serialize with `JSON.stringify()` on write.
- For the timezone select, use `Intl.supportedValuesOf("timeZone")` to populate options client-side. No external timezone library needed.
- For the language select, start with a hardcoded list: `[{ value: "en", label: "English" }]`. Full i18n is not in scope for Gate G — this is future-proofing the data model.
- After account deletion in the Danger Zone, call Clerk's `signOut()` client-side (from `@clerk/nextjs`) and redirect to `/sign-up`.
- The `onDelete: Cascade` directives already defined on Account relations in `prisma/schema.prisma` handle all cascading deletes: `AccountMember`, `Invite`, `Site` (which cascades to `Submission`, `Campaign`, `Webhook`), `Notification`, `AccountUsage`.
- Secret keys must never appear in server component props that get serialized to the client. The `api-keys-tab.tsx` client component should fetch keys via a separate API call or receive them through a secure data-passing pattern.
- The `src/app/app/settings/team/page.tsx` file must continue to work as a standalone Next.js route at `/app/settings/team` for backward compatibility and deep-linking.

---

## References

- `prisma/schema.prisma` — Account model (lines 16-40), Site model (lines 91-111), cascade relations
- `src/lib/account.ts` — `withAccountContext()`, `AccountContextError`, `ensureAccountForUser()`
- `src/lib/rbac.ts` — `canManageTeam()`, `canManageBilling()`, `canManageSites()`, `canView()`
- `src/app/app/settings/team/page.tsx` — existing 87-line team page to integrate as tab
- `src/app/app/layout.tsx` — nav links array (lines 6-14), "Team" link on line 13
- `src/app/api/sites/[id]/rotate-keys/route.ts` — existing key rotation endpoint with `canManageSites` guard
- `src/lib/keys.ts` — `generatePublicKey()`, `generateSecretKey()`
- `docs/PRD.md` — full product requirements, Gate G stories

---

## Dev Agent Record

| Field | Value |
|---|---|
| Story ID | G-4 |
| Title | Full Settings Page — Tabbed Layout |
| Gate | G — Dashboard Enhancement |
| Status | Ready for Development |
| Created | 2026-03-23 |
| Author | BMAD Dev Agent |
| Estimate | 5 points |
| Blocked by | None |
| Blocks | None |
| Migration required | `add-account-settings` (additive, non-breaking) |
| New API routes | `PATCH /api/settings`, `DELETE /api/settings/account` |
| New components | 8 (layout, page, settings-tabs, account-tab, team-tab, notifications-tab, api-keys-tab, danger-zone-tab) |
| Modified files | `prisma/schema.prisma`, `src/app/app/layout.tsx`, `src/app/app/settings/team/page.tsx` |
| Agent model | claude-opus-4-6 |
| Debug log | N/A |
| Completion notes | Story fully specified with 14 ACs, 20 tasks, API contracts, component architecture, and testing plan |
| File list | See Component Architecture and Tasks sections for complete file manifest |
