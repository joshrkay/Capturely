# Story G.3: Embed / Installation Page

Status: ready-for-dev

## Story

As a merchant,
I want a dedicated embed page with a site selector and platform-specific installation instructions,
so that I can quickly install the Capturely widget on any of my websites without guessing at the code.

## Acceptance Criteria

1. Page is accessible at `/app/embed` and is listed in the main nav as "Install"
2. "Install" link is added to `navLinks` in `src/app/app/layout.tsx` after "Billing"
3. Site selector dropdown fetches sites from `GET /api/sites` and displays site name + domain
4. Selecting a site populates all embed snippets with that site's `publicKey`
5. Platform tabs: Generic HTML, Shopify, WordPress, Google Tag Manager
6. Each tab shows a ready-to-copy embed snippet and step-by-step installation instructions
7. All code snippets have a one-click copy-to-clipboard button with visual feedback ("Copied!")
8. Embed snippet format: `<script src="https://cdn.capturely.io/widget.js" data-pk="{publicKey}"></script>`
9. Installation verification section checks if manifest exists at `/public/manifests/{publicKey}.json`
10. Verification shows a green check (installed) or warning (not found) status indicator
11. Embed snippet generation logic is imported from shared `src/lib/embed-utils.ts` (created in F.6)
12. Page is read-only — any authenticated role can view (`canView(role)`)

## Tasks / Subtasks

- [ ] Add "Install" to `navLinks` in `src/app/app/layout.tsx` (AC: 1, 2)
  - Insert `{ href: "/app/embed", label: "Install" }` after the "Billing" entry
- [ ] Create shared embed utility at `src/lib/embed-utils.ts` if not already created by F.6 (AC: 8, 11)
  - [ ] `generateEmbedSnippet(publicKey: string): string` — returns the `<script>` tag
  - [ ] `generateShopifySnippet(publicKey: string): string` — returns Liquid-compatible snippet
  - [ ] `generateWordPressSnippet(publicKey: string): string` — returns WP functions.php code
  - [ ] `generateGTMSnippet(publicKey: string): string` — returns GTM Custom HTML tag
  - [ ] Export all generators; both G.3 (this page) and F.6 (export modal) import from here
- [ ] Create `src/app/app/embed/page.tsx` as a server component (AC: 1)
  - [ ] Fetch sites via `prisma.site.findMany({ where: { accountId, status: "active" } })` server-side
  - [ ] Pass sites list to client component as props
  - [ ] Render page header: title "Install Widget", description text
  - [ ] Render `<EmbedPageClient sites={sites} />` client component
- [ ] Create `src/app/app/embed/components/embed-page-client.tsx` as `"use client"` (AC: 3, 4, 5, 6)
  - [ ] Site selector dropdown using `<select>` or custom dropdown (AC: 3)
    - Default to first site in list
    - Show site name and domain: `"{name} ({primaryDomain})"`
    - Show empty state if no sites: "No sites found. Create a site first." with link to `/app/sites`
  - [ ] Platform tabs component (AC: 5)
    - Four tabs: "Generic HTML", "Shopify", "WordPress", "GTM"
    - Active tab state tracked in component state
    - Active tab styling: solid bg, inactive: outline/ghost
  - [ ] Code snippet display area per tab (AC: 6, 8)
    - Use `<pre><code>` blocks with monospace font and dark background
    - Import snippet generators from `src/lib/embed-utils.ts`
    - Dynamically render snippet using selected site's `publicKey`
- [ ] Create `src/app/app/embed/components/code-snippet.tsx` as `"use client"` (AC: 7)
  - [ ] Props: `code: string`, `language?: string`
  - [ ] Copy-to-clipboard button using `navigator.clipboard.writeText()`
  - [ ] Visual feedback: button text changes to "Copied!" for 2 seconds, then reverts
  - [ ] Styling: `bg-zinc-900 dark:bg-zinc-950 text-zinc-100 rounded-lg p-4 text-sm font-mono`
- [ ] Create platform instruction content per tab (AC: 6)
  - [ ] Generic HTML: "Paste before `</body>` in your HTML"
  - [ ] Shopify: "Go to Online Store > Themes > Edit Code > theme.liquid > paste before `</body>`"
  - [ ] WordPress: "Add to functions.php via Appearance > Theme Editor, or use a header/footer plugin"
  - [ ] GTM: "Create a new Custom HTML tag, paste the snippet, set trigger to All Pages"
- [ ] Create `src/app/app/embed/components/install-verifier.tsx` as `"use client"` (AC: 9, 10)
  - [ ] "Verify Installation" button fetches `/public/manifests/{publicKey}.json`
  - [ ] On 200 response: green check icon + "Widget installed successfully"
  - [ ] On 404 response: yellow warning icon + "Manifest not found — publish a campaign first"
  - [ ] Loading state while checking

## Dev Notes

### Shared Embed Utilities (F.6 Dependency)

This story shares embed snippet generation logic with F.6 (Builder Export Modal) via `src/lib/embed-utils.ts`. If F.6 has already been implemented, import the existing utilities. If not, create the file here — F.6 will import from it when implemented. The key contract:

```typescript
// src/lib/embed-utils.ts
export function generateEmbedSnippet(publicKey: string): string {
  return `<script src="https://cdn.capturely.io/widget.js" data-pk="${publicKey}"></script>`;
}

export function generateShopifySnippet(publicKey: string): string {
  return `{% comment %} Capturely Widget {% endcomment %}
<script src="https://cdn.capturely.io/widget.js" data-pk="${publicKey}"></script>`;
}

export function generateWordPressSnippet(publicKey: string): string {
  return `// Add to functions.php
function capturely_widget_script() {
  echo '<script src="https://cdn.capturely.io/widget.js" data-pk="${publicKey}"></script>';
}
add_action('wp_footer', 'capturely_widget_script');`;
}

export function generateGTMSnippet(publicKey: string): string {
  return `<!-- Capturely Widget (GTM Custom HTML Tag) -->
<script src="https://cdn.capturely.io/widget.js" data-pk="${publicKey}"></script>`;
}
```

### No New API Endpoints

This page uses the existing `GET /api/sites` endpoint which already enforces `withAccountContext()` and scopes by `accountId`. The server component can also query Prisma directly since it runs on the server.

### Auth & RBAC

The page is accessible to all authenticated roles. The server component calls `withAccountContext()` to resolve `accountId` for the sites query. No write operations occur, so `canView(role)` is sufficient. The Clerk middleware on `/app/*` handles unauthenticated users.

### Installation Verification

The verification check fetches the manifest file at `/public/manifests/{publicKey}.json`. This file is generated when a campaign is published via `POST /api/sites/[id]/publish`. If no campaign has been published yet, the manifest will not exist — the UI should communicate this clearly rather than showing an error.

### Design System

Follow established Capturely patterns:
- Page background: `bg-zinc-50 dark:bg-black`
- Card/section borders: `border border-zinc-200 dark:border-zinc-800`
- Card backgrounds: `bg-white dark:bg-zinc-900`
- Code blocks: `bg-zinc-900 dark:bg-zinc-950 text-zinc-100 font-mono text-sm`
- Tab active state: `bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900`
- Tab inactive state: `text-zinc-600 hover:text-zinc-900 dark:text-zinc-400`
- Copy button: `text-xs` inside code block, top-right position

### Empty States

- No sites: "You haven't created any sites yet." with CTA link to `/app/sites`
- No public key (should not happen): defensive check, show error message

### Project Structure Notes

- New files:
  - `src/app/app/embed/page.tsx`
  - `src/app/app/embed/components/embed-page-client.tsx`
  - `src/app/app/embed/components/code-snippet.tsx`
  - `src/app/app/embed/components/install-verifier.tsx`
  - `src/lib/embed-utils.ts` (shared with F.6 — create if not exists)
- Modified files:
  - `src/app/app/layout.tsx` (add "Install" to navLinks)
- Existing files used (NOT modified):
  - `src/lib/account.ts` (`withAccountContext()`)
  - `src/lib/rbac.ts` (`canView()`)
  - `src/app/api/sites/route.ts` (GET endpoint)

### Dependencies

- **BLOCKED BY:** Story F.6 (Builder Export Modal) — shares embed snippet generation via `src/lib/embed-utils.ts`. If F.6 is not done, create the shared utility here and F.6 will import from it.
- **BLOCKS:** Story G.2 (Integrations Page) — G.2 links to the embed page for widget installation context

### References

- [Source: src/app/app/layout.tsx — navLinks array, line 6-14]
- [Source: prisma/schema.prisma — Site model, lines 91-111 (id, name, primaryDomain, publicKey, secretKey, status)]
- [Source: src/lib/account.ts — withAccountContext() returns { accountId, userId, role }]
- [Source: src/lib/rbac.ts — canView(role) for read access]
- [Source: src/app/api/sites/route.ts — GET sites endpoint]
- [Source: docs/PRD.md#Gate G — Embed/Installation Page]

## Testing Notes

- Verify page loads at `/app/embed` and "Install" appears in main navigation
- Verify site selector shows all active sites for the current account
- Verify selecting a different site updates all embed snippets with correct publicKey
- Verify all four platform tabs render with correct snippet and instructions
- Verify copy-to-clipboard works for all code snippets (manual browser test)
- Verify "Copied!" feedback appears and reverts after 2 seconds
- Verify installation verification returns green check when manifest exists
- Verify installation verification returns warning when manifest does not exist
- Verify empty state renders correctly when account has no sites
- Verify page works in both light and dark mode
- Verify unauthenticated users are redirected to sign-in (Clerk middleware)
- Verify snippet format matches: `<script src="https://cdn.capturely.io/widget.js" data-pk="{publicKey}"></script>`

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
