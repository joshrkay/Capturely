# G.3 — Site-Level Embed / Installation Page

**Gate:** G (Growth & Polish)
**Priority:** High
**Estimate:** 5 story points
**Status:** Draft

---

## Summary

Create a dedicated site-level embed/installation page at `/app/embed` that provides merchants with platform-specific installation instructions and code snippets for embedding the Capturely widget on their site. This is distinct from the campaign-level embed (F.6) — this page is site-level and campaign-agnostic, giving merchants a single place to install the base widget script. The embed code generation logic is shared with F.6 via a new `src/lib/embed-utils.ts` utility module.

---

## Dependencies

### Blocked By

| Story | Reason |
|-------|--------|
| **F.6 — Campaign Embed Snippets** | F.6 establishes the core embed snippet generation logic in `src/lib/embed-utils.ts`. G.3 imports and reuses that module. Must be merged first. |
| **A.12 — Sites CRUD UI + API** | `GET /api/sites` must be functional to populate the site selector. |
| **A.13 — Site Keys** | Each site must have a `publicKey` for the snippet `data-pk` attribute. |

### Blocks

| Story | Reason |
|-------|--------|
| **G.2 — Onboarding Wizard** | The onboarding wizard links to the embed page as the final installation step. |

### Related

| Story | Relationship |
|-------|-------------|
| **F.6 — Campaign Embed Snippets** | Shares `src/lib/embed-utils.ts`; campaign-level vs. site-level embed. |
| **E.1 — Widget Runtime** | The widget script URL and manifest structure used in snippets. |

---

## Existing Code Inventory

| File | Relevance |
|------|-----------|
| `src/app/app/layout.tsx` | Dashboard layout with `navLinks` array — add "Install" link. |
| `src/app/api/sites/route.ts` | `GET /api/sites` — returns sites for the current account. Used by site selector. |
| `src/lib/account.ts` | `withAccountContext()` — resolves `accountId`, `userId`, `role` from session. |
| `src/lib/rbac.ts` | `canView(role)` — all roles can access embed page. |
| `prisma/schema.prisma` | `Site` model with `publicKey`, `primaryDomain`, `status` fields. |
| `src/lib/embed-utils.ts` | **Created by F.6** — shared snippet generation functions. G.3 imports from here. |

---

## Acceptance Criteria

1. **AC-1:** A new nav item "Install" appears in the dashboard sidebar navigation, linking to `/app/embed`.
2. **AC-2:** The page renders a site selector dropdown populated from `GET /api/sites`, defaulting to the first active site.
3. **AC-3:** When no sites exist, the page displays an empty state with a CTA linking to `/app/sites` to create one.
4. **AC-4:** Four platform tabs are displayed: "Generic HTML", "Shopify", "WordPress", "Google Tag Manager".
5. **AC-5:** The "Generic HTML" tab shows a `<script>` tag snippet with the selected site's `publicKey` in the `data-pk` attribute.
6. **AC-6:** The "Shopify" tab shows Shopify-specific instructions (theme.liquid placement, App Embed block alternative) with the same snippet.
7. **AC-7:** The "WordPress" tab shows instructions for adding the snippet via a custom HTML widget, functions.php, or a plugin like Insert Headers and Footers.
8. **AC-8:** The "Google Tag Manager" tab shows a Custom HTML tag configuration with trigger instructions.
9. **AC-9:** Every code snippet block has a "Copy" button that copies the snippet to the clipboard and shows a brief "Copied!" confirmation.
10. **AC-10:** Snippet generation logic is imported from `src/lib/embed-utils.ts` (shared with F.6), not duplicated.
11. **AC-11:** An "Verify Installation" button pings the manifest endpoint (`/public/manifests/{publicKey}.json`) and displays a success/failure badge.
12. **AC-12:** The page is accessible to all roles (`canView`).
13. **AC-13:** The page is fully responsive — code blocks scroll horizontally on mobile rather than breaking layout.
14. **AC-14:** Dark mode is fully supported using the project design system tokens.

---

## Prisma Schema Changes

**None.** This story reads existing `Site` data only. No new models or fields required.

---

## API Contracts

### No New API Endpoints

This story does not introduce new API routes. It relies on:

#### `GET /api/sites` (existing)

**Response (200):**
```typescript
// Already exists — no changes needed
z.object({
  sites: z.array(z.object({
    id: z.string(),
    name: z.string(),
    primaryDomain: z.string(),
    publicKey: z.string(),
    status: z.enum(["active", "paused", "archived"]),
    createdAt: z.string().datetime(),
  })),
})
```

#### Manifest Verification (client-side fetch)

```typescript
// Client-side HEAD or GET to check if manifest exists
// URL: ${NEXT_PUBLIC_CDN_URL}/manifests/{publicKey}.json
// 200 → installed / configured
// 404 → not yet configured or no campaigns published
```

---

## Component Architecture

```
src/app/app/embed/
  page.tsx                    # Server component — auth gate, fetch sites SSR
  _components/
    EmbedPageClient.tsx       # "use client" — site selector, tabs, clipboard, verification
    SiteSelector.tsx          # Dropdown to pick active site
    PlatformTabs.tsx          # Tab container for platform instructions
    GenericHtmlTab.tsx        # Generic HTML snippet + instructions
    ShopifyTab.tsx            # Shopify-specific instructions
    WordPressTab.tsx          # WordPress-specific instructions
    GtmTab.tsx               # Google Tag Manager instructions
    CodeSnippet.tsx           # Reusable code block with copy button
    VerifyInstallation.tsx    # Verify button + status badge

src/lib/embed-utils.ts        # (Created by F.6, extended here if needed)
  generateSiteSnippet(publicKey: string): string
  generateShopifySnippet(publicKey: string): string
  generateGtmSnippet(publicKey: string): string
  getCdnBaseUrl(): string
```

### Data Flow

```
page.tsx (Server)
  |-- withAccountContext() -> { accountId, role }
  |-- canView(role) guard
  |-- fetch sites from DB scoped to accountId
  +-- render <EmbedPageClient sites={sites} />
        |-- <SiteSelector /> -> selected site state
        |-- <PlatformTabs selectedSite={site}>
        |     |-- <GenericHtmlTab /> -> <CodeSnippet />
        |     |-- <ShopifyTab />    -> <CodeSnippet />
        |     |-- <WordPressTab />  -> <CodeSnippet />
        |     +-- <GtmTab />       -> <CodeSnippet />
        +-- <VerifyInstallation publicKey={site.publicKey} />
```

---

## UI States

| State | Behavior |
|-------|----------|
| **Loading** | Skeleton placeholders for site selector and tab content area. |
| **No sites** | Empty state illustration + "Create your first site" CTA button linking to `/app/sites`. |
| **Sites loaded** | Site selector populated, first active site auto-selected, Generic HTML tab shown by default. |
| **Site selected** | Snippet updates immediately with the selected site's `publicKey`. |
| **Copy idle** | "Copy" button with clipboard icon. |
| **Copy success** | Button text changes to "Copied!" with check icon for 2 seconds, then reverts. |
| **Verify — idle** | "Verify Installation" button, neutral state. |
| **Verify — loading** | Button shows spinner, disabled. |
| **Verify — success** | Green badge: "Widget detected — installation verified." |
| **Verify — failure** | Amber badge: "Widget not detected yet. It may take a few minutes after publishing a campaign." |
| **Verify — error** | Red badge: "Could not reach verification endpoint. Check your network." |

---

## Design System

### Tokens

| Element | Class |
|---------|-------|
| Page background | `bg-zinc-50 dark:bg-black` |
| Card / panel | `bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg` |
| Tab bar | `border-b border-zinc-200 dark:border-zinc-800` |
| Active tab | `text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400` |
| Inactive tab | `text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300` |
| Code block background | `bg-zinc-900 dark:bg-zinc-950 text-zinc-100 rounded-md font-mono text-sm` |
| Copy button | `bg-zinc-700 hover:bg-zinc-600 text-zinc-100 text-xs rounded px-2 py-1` |
| Site selector | `bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md` |
| Verify success badge | `bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-md px-3 py-2` |
| Verify failure badge | `bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2` |
| Verify error badge | `bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-md px-3 py-2` |

### Layout

- Max content width: `max-w-3xl mx-auto`
- Page padding: `p-6 md:p-8`
- Section spacing: `space-y-6`
- Code block padding: `p-4`
- Copy button positioned: `absolute top-3 right-3` within a `relative` code block wrapper

---

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| **Tab navigation** | Platform tabs use `role="tablist"`, `role="tab"`, `role="tabpanel"` with `aria-selected`, `aria-controls`, `aria-labelledby`. |
| **Keyboard support** | Arrow keys navigate between tabs. Enter/Space activate a tab. |
| **Code block labeling** | Each `<CodeSnippet>` has `aria-label` describing the platform (e.g., "Generic HTML embed code"). |
| **Copy button feedback** | `aria-live="polite"` region announces "Copied to clipboard" on success. |
| **Verify button feedback** | Verification result is in an `aria-live="polite"` region so screen readers announce the outcome. |
| **Site selector** | Uses native `<select>` or a custom combobox with full ARIA attrs. |
| **Color contrast** | All text meets WCAG 2.1 AA contrast ratios against their backgrounds in both light and dark mode. |
| **Focus indicators** | Visible focus rings (`focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`) on all interactive elements. |

---

## Testing Plan

### Unit Tests

| Test | File |
|------|------|
| `generateSiteSnippet` returns correct HTML with publicKey | `src/lib/__tests__/embed-utils.test.ts` |
| `generateShopifySnippet` includes Shopify-specific attributes | `src/lib/__tests__/embed-utils.test.ts` |
| `generateGtmSnippet` wraps in GTM custom HTML format | `src/lib/__tests__/embed-utils.test.ts` |

### Component Tests

| Test | File |
|------|------|
| `SiteSelector` renders sites and calls onChange | `src/app/app/embed/_components/__tests__/SiteSelector.test.tsx` |
| `CodeSnippet` renders code and copy button | `src/app/app/embed/_components/__tests__/CodeSnippet.test.tsx` |
| `PlatformTabs` switches between tab panels on click | `src/app/app/embed/_components/__tests__/PlatformTabs.test.tsx` |
| `VerifyInstallation` shows success on 200 response | `src/app/app/embed/_components/__tests__/VerifyInstallation.test.tsx` |
| `VerifyInstallation` shows failure on 404 response | `src/app/app/embed/_components/__tests__/VerifyInstallation.test.tsx` |
| Empty state renders when no sites provided | `src/app/app/embed/_components/__tests__/EmbedPageClient.test.tsx` |

### Integration Tests

| Test | File |
|------|------|
| Embed page loads with sites and displays snippet | `src/app/app/embed/__tests__/page.integration.test.ts` |
| Clipboard API called with correct snippet on copy | `src/app/app/embed/__tests__/page.integration.test.ts` |

### E2E Tests

| Test | File |
|------|------|
| Navigate to Install page, select site, copy snippet, verify installation | `e2e/embed-page.spec.ts` |
| Empty state shown when account has no sites | `e2e/embed-page.spec.ts` |

---

## Anti-Patterns to Avoid

| Anti-Pattern | Correct Approach |
|--------------|-----------------|
| Duplicating snippet generation logic from F.6 | Import from `src/lib/embed-utils.ts`. |
| Hardcoding the CDN URL in components | Use `getCdnBaseUrl()` from embed-utils or env var `NEXT_PUBLIC_CDN_URL`. |
| Fetching sites client-side on mount | Fetch sites server-side in `page.tsx` and pass as props. |
| Using `dangerouslySetInnerHTML` for code display | Render code as text content inside `<code><pre>` blocks. |
| Rolling custom clipboard logic | Use the `navigator.clipboard.writeText()` API with a fallback. |
| Inline styles for code blocks | Use Tailwind utility classes consistent with the design system. |
| Exposing `secretKey` in the UI | Only display `publicKey` in snippets. Never send `secretKey` to the client. |
| Making verification a server API call | Do a client-side `fetch` to the public manifest URL — no auth needed. |

---

## Tasks

### Phase 1: Shared Utilities (if not already done by F.6)

- [ ] **T1:** Verify `src/lib/embed-utils.ts` exists from F.6. If not, create it with `generateSiteSnippet(publicKey)`, `generateShopifySnippet(publicKey)`, `generateGtmSnippet(publicKey)`, and `getCdnBaseUrl()`. Use `NEXT_PUBLIC_CDN_URL` env var with fallback to `https://cdn.capturely.io`.
- [ ] **T2:** Write unit tests for all snippet generation functions in `src/lib/__tests__/embed-utils.test.ts`.

### Phase 2: Navigation

- [ ] **T3:** Add "Install" nav link to `navLinks` array in `src/app/app/layout.tsx`. Use a download/plug icon. Position after "Sites" in the nav order.
- [ ] **T4:** Verify nav renders correctly in both collapsed and expanded sidebar states.

### Phase 3: Page Shell

- [ ] **T5:** Create `src/app/app/embed/page.tsx` as a Server Component. Call `withAccountContext()`, guard with `canView(role)`, fetch sites from DB scoped to `accountId`.
- [ ] **T6:** Create `src/app/app/embed/_components/EmbedPageClient.tsx` as the `"use client"` wrapper. Accept `sites` as props, manage selected site state and active tab state.
- [ ] **T7:** Implement page header: "Install Capturely" title with a brief description paragraph.

### Phase 4: Site Selector

- [ ] **T8:** Create `SiteSelector.tsx` — renders a `<select>` dropdown with site names. Filters to active sites only. Emits `onSiteChange(siteId)`.
- [ ] **T9:** Handle empty state — if `sites.length === 0`, render empty state card with illustration and "Create a Site" button linking to `/app/sites`.
- [ ] **T10:** Write component tests for `SiteSelector` — renders options, calls handler on change, filters inactive sites.

### Phase 5: Platform Tabs

- [ ] **T11:** Create `PlatformTabs.tsx` — tab bar with "Generic HTML", "Shopify", "WordPress", "Google Tag Manager" tabs. Uses ARIA tab pattern. Manages active tab state.
- [ ] **T12:** Create `CodeSnippet.tsx` — reusable component: renders `<pre><code>` block with syntax-highlighted-style text, positioned copy button, `aria-label`, and `aria-live` region for copy feedback.
- [ ] **T13:** Implement `GenericHtmlTab.tsx` — description paragraph, single `<CodeSnippet>` with output from `generateSiteSnippet(publicKey)`, placement instructions (before `</head>` or `</body>`).
- [ ] **T14:** Implement `ShopifyTab.tsx` — step-by-step instructions for theme.liquid and App Embed, `<CodeSnippet>` with the same base snippet, note about Shopify-native integration coming soon.
- [ ] **T15:** Implement `WordPressTab.tsx` — three methods: custom HTML widget, functions.php snippet with `wp_enqueue_script`, and plugin recommendation. Each with its own `<CodeSnippet>`.
- [ ] **T16:** Implement `GtmTab.tsx` — instructions for creating a Custom HTML tag, `<CodeSnippet>` with GTM-formatted snippet from `generateGtmSnippet(publicKey)`, trigger configuration guidance.
- [ ] **T17:** Write component tests for `PlatformTabs` — tab switching, correct panel display, keyboard navigation.

### Phase 6: Clipboard

- [ ] **T18:** Implement copy-to-clipboard in `CodeSnippet.tsx` using `navigator.clipboard.writeText()`. On success, swap button text to "Copied!" with a check icon for 2 seconds. On failure, show "Failed to copy" briefly.
- [ ] **T19:** Write tests for clipboard interaction — mock `navigator.clipboard`, verify button state transitions.

### Phase 7: Verification

- [ ] **T20:** Create `VerifyInstallation.tsx` — "Verify Installation" button. On click, `fetch` the manifest URL for the selected site's `publicKey`. Display success/failure/error badge in `aria-live` region.
- [ ] **T21:** Write tests for verification — mock fetch responses (200, 404, network error), verify correct badge rendering.

### Phase 8: Responsive & Dark Mode

- [ ] **T22:** Ensure code blocks have `overflow-x-auto` for horizontal scroll on narrow viewports. Test at 320px, 768px, 1024px widths.
- [ ] **T23:** Verify all components render correctly in dark mode. Check contrast ratios on code blocks, badges, and tab text.

### Phase 9: Integration & E2E

- [ ] **T24:** Write integration test: full page render with mocked sites, tab switching, snippet content verification.
- [ ] **T25:** Write E2E test: navigate to Install, select a site, switch tabs, copy snippet, trigger verification.

---

## Dev Notes

- The CDN URL (`https://cdn.capturely.io`) is a placeholder. Use `NEXT_PUBLIC_CDN_URL` env var so it can be configured per environment. In local dev, this may point to `http://localhost:3000`.
- The manifest verification is a best-effort check. The manifest only exists after at least one campaign is published for that site, so a "not detected" result does not necessarily mean installation failed. Make the failure message reflect this nuance.
- `secretKey` is stored on the `Site` model but must NEVER appear on this page. Only `publicKey` is used in snippets.
- The WordPress `functions.php` snippet should use `wp_enqueue_script` with the CDN URL, not an inline script tag, as that is the WordPress-recommended approach.
- Tab state can be managed with URL search params (`?platform=shopify`) for shareability, but this is optional/nice-to-have.
- The `CodeSnippet` component built here should be generic enough to reuse on the campaign embed page (F.6) and API Keys settings tab (G.4).

---

## References

- `docs/PRD.md` — Section G.3, Widget installation page requirements
- `src/app/app/layout.tsx` — Dashboard navigation structure
- `src/app/api/sites/route.ts` — Sites API endpoint
- `src/lib/embed-utils.ts` — Shared embed snippet utilities (created by F.6)
- `prisma/schema.prisma` — Site model definition
- [MDN: Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText)
- [WAI-ARIA: Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)

---

## Dev Agent Record

| Field | Value |
|-------|-------|
| **Story ID** | G.3 |
| **Created** | 2026-03-23 |
| **Last Updated** | 2026-03-23 |
| **Status** | Draft |
| **Assigned To** | — |
| **Branch** | `feat/g3-embed-page` |
| **PR** | — |
| **Blocked** | Yes — awaiting F.6 merge |
| **Review Notes** | — |
