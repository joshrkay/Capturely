# Story G.2: Integrations Management Page

Status: ready-for-dev

## Story

As a merchant,
I want an integrations page listing available platforms and services,
so that I can connect Capturely to my Shopify store, WordPress site, Zapier, and webhooks.

## Acceptance Criteria

1. Integrations page is accessible from navigation at `/app/integrations`
2. "Integrations" link is added to `navLinks` array in `src/app/app/layout.tsx`
3. Page displays integration cards for: Shopify, WordPress, Zapier, Custom Webhooks
4. Each card shows: platform name, logo/icon, description, connection status badge (connected/disconnected/error)
5. Shopify card shows a "Connect" button that links to the Shopify OAuth flow page (Story H.1) — does NOT implement OAuth itself
6. WordPress card shows plugin installation instructions in an expandable section (no live API connection)
7. Zapier card shows the account's webhook URL formatted for Zapier, with a copy-to-clipboard button
8. Webhooks card provides full CRUD for custom webhook endpoints: add, list, edit, delete, toggle active/inactive
9. Webhook management uses the EXISTING `Webhook` model (schema.prisma lines 246-259) — do NOT recreate it
10. A new `Integration` Prisma model tracks platform connection status per account
11. Connected integrations show "Manage" and "Disconnect" actions
12. All database queries are scoped to `ctx.accountId`
13. RBAC enforced: `canManageSites()` (owner/admin) required for all mutation actions
14. Page follows existing design system (bg-zinc-50 dark:bg-black, border-zinc-200 dark:border-zinc-800)

## Tasks / Subtasks

### Database & Schema

- [ ] Add `Integration` model to `prisma/schema.prisma` (AC: 10)
  ```prisma
  model Integration {
    id          String   @id @default(cuid())
    accountId   String   @map("account_id")
    platform    String   // "shopify", "wordpress", "zapier", "custom"
    status      String   @default("disconnected") // "connected", "disconnected", "error"
    credentials String?  // encrypted JSON blob for OAuth tokens etc.
    metadata    String?  // JSON blob for platform-specific config
    createdAt   DateTime @default(now()) @map("created_at")
    updatedAt   DateTime @updatedAt @map("updated_at")

    account Account @relation(fields: [accountId], references: [id], onDelete: Cascade)

    @@index([accountId])
    @@unique([accountId, platform])
    @@map("integrations")
  }
  ```
- [ ] Add `integrations Integration[]` relation to the `Account` model in schema.prisma (AC: 10)
- [ ] Run `npx prisma migrate dev --name add-integration-model` (AC: 10)
- [ ] Verify existing `Webhook` model is untouched (AC: 9)

### API Endpoints

- [ ] Create `src/app/api/integrations/route.ts` (AC: 10, 11, 12, 13)
  - [ ] GET: List all integrations for the account (`WHERE accountId = ctx.accountId`)
  - [ ] POST: Create/upsert an integration record (platform, status, metadata)
  - [ ] Auth: `withAccountContext()` + `canManageSites()` for POST
  - [ ] Zod validation for request body: `{ platform: z.enum(["shopify", "wordpress", "zapier", "custom"]), metadata?: z.string() }`
- [ ] Create `src/app/api/integrations/[id]/route.ts` (AC: 11, 12, 13)
  - [ ] PATCH: Update integration status, metadata
  - [ ] DELETE: Remove integration record (set status to "disconnected" or hard delete)
  - [ ] Auth: `withAccountContext()` + `canManageSites()` for both
  - [ ] Verify integration belongs to `ctx.accountId` before mutating
- [ ] Create `src/app/api/webhooks/route.ts` if it does not already exist (AC: 8, 9, 12, 13)
  - [ ] GET: List webhooks for a site (query param `?siteId=...`, verify site belongs to account)
  - [ ] POST: Create webhook `{ siteId, url, secret?, active? }`
  - [ ] Auth: `withAccountContext()` + `canManageSites()`
  - [ ] Zod validation for URL format, siteId existence
- [ ] Create `src/app/api/webhooks/[id]/route.ts` if it does not already exist (AC: 8, 9, 12, 13)
  - [ ] PATCH: Update webhook URL, secret, active status
  - [ ] DELETE: Remove webhook
  - [ ] Auth: `withAccountContext()` + `canManageSites()`
  - [ ] Verify webhook's site belongs to `ctx.accountId` before mutating

### Page & Components

- [ ] Add "Integrations" to `navLinks` in `src/app/app/layout.tsx` (AC: 1, 2)
  - Insert `{ href: "/app/integrations", label: "Integrations" }` after "Billing" entry
- [ ] Create `src/app/app/integrations/page.tsx` as a server component (AC: 1, 3)
  - [ ] Fetch integrations via GET `/api/integrations` or direct Prisma query with account context
  - [ ] Render page title and description header
  - [ ] Render integration card grid (responsive: 1 col mobile, 2 col md, 2 col lg)
  - [ ] Pass integration status data to each card component
- [ ] Create `src/app/app/integrations/components/integration-card.tsx` (AC: 3, 4)
  - [ ] Platform icon/logo (SVG or emoji placeholder)
  - [ ] Platform name and description text
  - [ ] Status badge: green "Connected", gray "Not Connected", red "Error"
  - [ ] Action button area (varies per platform)
- [ ] Create `src/app/app/integrations/components/shopify-card.tsx` as a client component (AC: 5)
  - [ ] "Connect Shopify" button links to `/app/integrations/shopify/connect` (H.1 route)
  - [ ] If connected: show shop domain from integration metadata, "Manage" and "Disconnect" buttons
  - [ ] Disconnect calls DELETE `/api/integrations/[id]`
- [ ] Create `src/app/app/integrations/components/wordpress-card.tsx` (AC: 6)
  - [ ] Static card with "Installation Instructions" expandable section
  - [ ] Instructions: install plugin, paste site public key, save
  - [ ] No API connection — informational only
- [ ] Create `src/app/app/integrations/components/zapier-card.tsx` as a client component (AC: 7)
  - [ ] Display webhook URL formatted for Zapier: `{BASE_URL}/api/runtime/submit`
  - [ ] Copy-to-clipboard button with "Copied!" feedback
  - [ ] Brief setup instructions for Zapier webhook trigger
- [ ] Create `src/app/app/integrations/components/webhooks-card.tsx` as a client component (AC: 8, 9)
  - [ ] Site selector dropdown (merchant may have multiple sites)
  - [ ] List existing webhooks for the selected site with active/inactive toggle
  - [ ] "Add Webhook" form: URL input, optional secret input, submit button
  - [ ] Edit inline: click webhook row to edit URL/secret
  - [ ] Delete button with confirmation
  - [ ] "Test" button: sends a sample POST to the webhook URL (client-side or via API)
  - [ ] All mutations call `/api/webhooks` endpoints

## Dev Notes

### CRITICAL: Webhook Model Already Exists

The `Webhook` model is already defined in `prisma/schema.prisma` (lines 246-259). Do NOT recreate, rename, or modify it. The webhook CRUD endpoints and UI should work with the existing model as-is:

```prisma
model Webhook {
  id        String   @id @default(cuid())
  siteId    String   @map("site_id")
  url       String
  secret    String?
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  site Site @relation(...)
  @@index([siteId])
}
```

Webhooks are scoped to a **Site**, not directly to an Account. To enforce tenant scoping, join through Site to verify `site.accountId = ctx.accountId`.

### New Integration Model

The `Integration` model is NEW and must be added. It tracks which platforms an account has connected. The `@@unique([accountId, platform])` constraint ensures one integration record per platform per account. Use upsert when connecting/disconnecting.

The `credentials` field will store encrypted OAuth tokens (for Shopify in H.1). For now, it can remain null. The `metadata` field stores platform-specific JSON (e.g., Shopify shop domain, Zapier config).

### Auth & RBAC Pattern

Follow the established account context pattern for all API routes:

```typescript
const ctx = await withAccountContext();
if (!canManageSites(ctx.role)) {
  return NextResponse.json(
    { error: "Forbidden", code: "FORBIDDEN" },
    { status: 403 }
  );
}
// All queries: WHERE accountId = ctx.accountId
```

Use `canManageSites()` (owner/admin) for all integration mutations. The page view itself only requires authentication (any role via `canView()`).

### Shopify Card Behavior

The Shopify card on this page is a **link/entry point** only. It does NOT implement the OAuth flow. When clicked, it navigates to the Shopify OAuth route that will be built in Story H.1. If H.1 is not yet built, the button can be disabled with a "Coming Soon" label or link to a placeholder page.

### Design System

Follow the established Capturely design system:
- Page background: `bg-zinc-50 dark:bg-black`
- Card borders: `border border-zinc-200 dark:border-zinc-800`
- Card background: `bg-white dark:bg-zinc-900`
- Inputs: `rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100`
- Status badges: green (`bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`), gray, red variants
- Primary action buttons: consistent with existing site/campaign creation buttons

### Project Structure Notes

- New files:
  - `src/app/app/integrations/page.tsx`
  - `src/app/app/integrations/components/integration-card.tsx`
  - `src/app/app/integrations/components/shopify-card.tsx`
  - `src/app/app/integrations/components/wordpress-card.tsx`
  - `src/app/app/integrations/components/zapier-card.tsx`
  - `src/app/app/integrations/components/webhooks-card.tsx`
  - `src/app/api/integrations/route.ts`
  - `src/app/api/integrations/[id]/route.ts`
  - `src/app/api/webhooks/route.ts` (if not already present)
  - `src/app/api/webhooks/[id]/route.ts` (if not already present)
- Modified files:
  - `prisma/schema.prisma` (add Integration model + Account relation)
  - `src/app/app/layout.tsx` (add "Integrations" to navLinks)
- Existing files used (NOT modified):
  - `prisma/schema.prisma` Webhook model (used as-is)

### Dependencies

- **BLOCKED BY:** Story G.3 (Embed/Install Page) — embed page has overlapping navigation and site-key display concerns that should be resolved first
- **BLOCKS:** Story H.1 (Shopify OAuth Flow) — H.1 needs the Integration model to persist Shopify OAuth tokens and connection status

### References

- [Source: prisma/schema.prisma#Webhook (lines 246-259) — existing Webhook model]
- [Source: src/app/app/layout.tsx — navLinks array]
- [Source: src/lib/account.ts — withAccountContext()]
- [Source: src/lib/rbac.ts — canManageSites()]
- [Source: src/app/api/campaigns/route.ts — reference for API route auth pattern]
- [Source: docs/PRD.md#Gate G — Integrations Page]

## Testing Notes

- Verify Integration model migration runs cleanly without affecting existing Webhook model
- Verify `@@unique([accountId, platform])` constraint: creating duplicate platform integration returns error
- Verify GET `/api/integrations` returns only integrations for the authenticated account
- Verify POST `/api/integrations` creates a new integration record
- Verify PATCH `/api/integrations/[id]` updates status and metadata
- Verify DELETE `/api/integrations/[id]` removes the integration
- Verify all integration API routes return 403 for `member` role users
- Verify webhook CRUD: create, list, update URL/secret, toggle active, delete
- Verify webhook tenant scoping: cannot access webhooks for sites belonging to other accounts
- Verify Shopify card "Connect" button navigates to OAuth route (or shows "Coming Soon" if H.1 not built)
- Verify WordPress card shows installation instructions
- Verify Zapier card displays webhook URL and copy-to-clipboard works
- Verify Webhooks card: site selector, add/edit/delete webhooks, active toggle
- Verify page renders correctly in both light and dark mode
- Verify responsive layout at mobile, tablet, and desktop breakpoints
- Verify auth: unauthenticated users are redirected to sign-in (Clerk middleware)

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
