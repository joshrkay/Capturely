# Story F.6: Builder Export/Publish Modal

Status: ready-for-dev

## Story

As a merchant,
I want an export modal that provides embed codes and platform-specific install instructions,
so that I can easily deploy my campaign to my website.

## Acceptance Criteria

1. Export modal opens from a "Publish" or "Get Code" button in the builder
2. Modal displays the generic JavaScript embed snippet with the site's public key
3. Modal displays Shopify-specific installation instructions (theme.liquid snippet)
4. Modal displays WordPress-specific installation instructions (functions.php approach)
5. Modal displays Google Tag Manager installation instructions (Custom HTML tag)
6. All embed code snippets have copy-to-clipboard functionality
7. Publishing triggers the existing publish flow (save + POST `/api/campaigns/${id}/publish`)
8. Campaign status updates to "published" and is displayed in the modal
9. Snippet generation logic is extracted to `src/lib/embed-utils.ts` for reuse

## Tasks / Subtasks

- [ ] Create `src/lib/embed-utils.ts` utility module (AC: 2, 3, 4, 5, 9)
  - [ ] `generateGenericSnippet(publicKey: string): string` — script tag embed
  - [ ] `generateShopifySnippet(publicKey: string): string` — theme.liquid instructions
  - [ ] `generateWordPressSnippet(publicKey: string): string` — functions.php / wp_head hook
  - [ ] `generateGTMSnippet(publicKey: string): string` — Custom HTML tag for GTM
  - [ ] Export all generators for reuse by G.3 (embed page)
- [ ] Create `src/app/app/campaigns/[id]/builder/components/export-modal.tsx` client component (AC: 1)
  - [ ] Modal overlay using existing Dialog/Sheet pattern from builder UI
  - [ ] Platform tabs: Generic HTML, Shopify, WordPress, GTM (AC: 2, 3, 4, 5)
  - [ ] Code block display with syntax highlighting or monospace styling
  - [ ] Copy-to-clipboard button per snippet with "Copied!" feedback (AC: 6)
  - [ ] "Publish" action button wired to existing publish flow (AC: 7)
  - [ ] Campaign status badge (draft / published / has unpublished changes) (AC: 8)
  - [ ] Preview link with `target="_blank"` for testing the live form
- [ ] Wire modal open trigger to builder page Publish button area (AC: 1)
  - [ ] Builder page lines 889-893 currently have a direct Publish button
  - [ ] Replace or augment with button that opens export modal instead
- [ ] Ensure modal receives campaign data including `site.publicKey` (AC: 2)

## Dev Notes

### Embed Snippet Formats

Extract to `src/lib/embed-utils.ts` so G.3 (embed page) can reuse the same logic:

**Generic HTML:**
```html
<script src="https://cdn.capturely.io/widget.js" data-pk="{publicKey}"></script>
```

**Shopify (theme.liquid):**
Add before `</head>` in `theme.liquid` via Online Store > Themes > Edit Code:
```html
<script src="https://cdn.capturely.io/widget.js" data-pk="{publicKey}"></script>
```

**WordPress (functions.php):**
Add to theme's `functions.php` or use Code Snippets plugin:
```php
add_action('wp_head', function() {
  echo '<script src="https://cdn.capturely.io/widget.js" data-pk="{publicKey}"></script>';
});
```

**Google Tag Manager (Custom HTML):**
Create a new Tag > Custom HTML in GTM with trigger "All Pages":
```html
<script src="https://cdn.capturely.io/widget.js" data-pk="{publicKey}"></script>
```

### Builder Page Integration

The builder page (`src/app/app/campaigns/[id]/builder/page.tsx`) already has a publish flow at
lines 820-835:

```typescript
const handlePublish = async () => {
  await handleSave();
  setPublishing(true);
  const res = await fetch(`/api/campaigns/${id}/publish`, { method: "POST" });
  // ... status update
};
```

The export modal should reuse this `handlePublish` function. The modal receives it as a prop
along with campaign data. The button at lines 889-893 should be changed to open the modal
instead of calling `handlePublish` directly. The modal's own "Publish" button then calls the
passed-in handler.

### Campaign Data Shape

The builder page fetches campaign data that includes the associated site:

```typescript
campaign: {
  id: string;
  name: string;
  status: 'draft' | 'published';
  hasUnpublishedChanges: boolean;
  site: { id: string; name: string; publicKey: string };
  // ...
}
```

The `publicKey` from `campaign.site.publicKey` is used to populate embed snippets.
No new API endpoint is needed.

### Copy-to-Clipboard

Use the Clipboard API (`navigator.clipboard.writeText(snippet)`) with a fallback to
`document.execCommand('copy')` for older browsers. Show a brief "Copied!" toast or inline
indicator that resets after 2 seconds.

### Modal Component Pattern

Follow the existing builder UI patterns. The project uses Tailwind CSS for styling. The modal
should be a `"use client"` component with:

- Fixed overlay backdrop (`bg-black/50`)
- Centered content panel with max-width ~640px
- Tab navigation for platforms (underline or pill tabs)
- Code blocks with `bg-zinc-900 text-zinc-100 font-mono text-sm` styling
- Close button (X) in top-right corner
- Publish action button at bottom with loading state

### Status Display

After publishing, the modal should show a success state:
- Green badge: "Published" with timestamp
- If `hasUnpublishedChanges` is true: amber badge "Unpublished Changes"
- If status is "draft": gray badge "Draft — not yet published"

### Reuse by G.3

Story G.3 (Embed Page) will import from `src/lib/embed-utils.ts` to render the same snippets
on a dedicated `/app/sites/[id]/embed` page. By extracting snippet generation now, G.3 avoids
duplicating the logic. The utility module should be pure functions with no React dependencies.

### Project Structure Notes

- New file: `src/app/app/campaigns/[id]/builder/components/export-modal.tsx`
- New file: `src/lib/embed-utils.ts`
- Modified: `src/app/app/campaigns/[id]/builder/page.tsx` (wire modal open, pass props)
- No new API routes; no Prisma migration

### Dependencies

- **BLOCKED BY:** F.3 (variant manager — publishing must be variant-aware)
- **BLOCKS:** G.3 (embed page shares snippet generation logic from `embed-utils.ts`)

### References

- [Source: src/app/app/campaigns/[id]/builder/page.tsx — lines 820-835, handlePublish flow]
- [Source: src/app/app/campaigns/[id]/builder/page.tsx — lines 889-893, Publish button]
- [Source: packages/shared/forms/src/types.ts#ManifestCampaign — campaign/site data shape]
- [Source: src/app/api/campaigns/[id]/publish/route.ts — publish endpoint]

### Testing Considerations

- Verify modal opens and closes without side effects
- Verify each platform tab renders the correct snippet with the real `publicKey`
- Verify copy-to-clipboard works and shows feedback
- Verify "Publish" button calls the existing publish flow and updates status badge
- Verify snippet generation functions are pure and return correct output for any key
- Verify modal gracefully handles missing `site.publicKey` (show error message)
- Verify the modal is accessible (focus trap, Escape to close, ARIA labels)

## Dev Agent Record

### Agent Model Used
### Change Log
### Debug Log References
### Completion Notes List
### Change Summary
### File List
