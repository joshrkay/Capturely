# Story F.6: Builder Export/Publish Modal

Status: ready-for-dev

## Story

As a merchant,
I want an export modal that provides embed codes and platform-specific install instructions,
so that I can easily deploy my campaign to my website.

## Acceptance Criteria

1. Export modal opens from a "Publish" or "Get Code" button in the builder
2. Modal displays the generic JavaScript embed snippet with the site's public key
3. Modal displays Shopify-specific installation instructions (theme snippet)
4. Modal displays WordPress-specific installation instructions (shortcode or plugin)
5. Embed code includes a copy-to-clipboard button
6. Modal shows a direct preview link for testing
7. Publishing the campaign triggers manifest regeneration via existing `/api/sites/[id]/publish`
8. Campaign status updates to "published" on publish action

## Tasks / Subtasks

- [ ] Create `src/app/app/campaigns/[id]/builder/components/export-modal.tsx` client component (AC: 1)
  - [ ] Generic embed code tab with `<script>` snippet (AC: 2)
  - [ ] Shopify install tab with theme editor instructions (AC: 3)
  - [ ] WordPress install tab with plugin/shortcode instructions (AC: 4)
  - [ ] Copy-to-clipboard buttons for all code snippets (AC: 5)
  - [ ] Preview link with `target="_blank"` (AC: 6)
- [ ] Wire "Publish" action to campaign publish API + manifest regeneration (AC: 7)
- [ ] Update campaign status on successful publish (AC: 8)

## Dev Notes

- Reference Figma: `components/builder/export-modal.tsx`
- Manifest publish endpoint already exists: `POST /api/sites/[id]/publish`
- Campaign publish endpoint already exists: `POST /api/campaigns/[id]/publish`
- Public key is on the Site model — fetch it for the embed snippet
- Use Dialog/Modal from existing UI patterns (or add a shadcn dialog if not present)

### Project Structure Notes

- New file: `src/app/app/campaigns/[id]/builder/components/export-modal.tsx`
- Touches: builder page layout (add Publish button)

### References

- [Source: src/app/api/sites/[id]/publish/route.ts]
- [Source: src/app/api/campaigns/[id]/publish/route.ts]
- [Source: src/lib/manifest.ts#writeManifestToDisk]
- [Source: Figma Make — components/builder/export-modal.tsx]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
