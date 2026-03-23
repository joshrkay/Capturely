# Story G.3: Embed/Installation Page

Status: ready-for-dev

## Story

As a merchant,
I want a dedicated embed page with installation instructions for each platform,
so that I can easily add the Capturely widget to my website.

## Acceptance Criteria

1. Embed page is accessible at `/app/embed` (or `/app/sites/[id]/embed`)
2. Page shows the JavaScript embed snippet with the site's public key
3. Platform-specific tabs: Generic HTML, Shopify, WordPress, Google Tag Manager
4. Each tab has step-by-step installation instructions
5. All code snippets have a copy-to-clipboard button
6. Page shows a live preview/test section to verify installation
7. Merchant can select which site to show embed code for (if multiple sites)

## Tasks / Subtasks

- [ ] Create `src/app/app/embed/page.tsx` page component (AC: 1)
  - [ ] Site selector dropdown (AC: 7)
  - [ ] Platform tabs (Generic, Shopify, WordPress, GTM) (AC: 3)
  - [ ] Code snippet display with syntax highlighting (AC: 2)
  - [ ] Copy-to-clipboard functionality (AC: 5)
  - [ ] Step-by-step instructions per platform (AC: 4)
  - [ ] Installation verification section (AC: 6)
- [ ] Generate embed snippets dynamically from site's publicKey (AC: 2)
- [ ] Add "Install Widget" link to dashboard navigation or sites page (AC: 1)

## Dev Notes

- Reference Figma: `pages/embed.tsx`
- The embed snippet is: `<script src="https://cdn.capturely.io/widget.js" data-public-key="pk_xxx"></script>`
- For local dev, point to local widget bundle path
- Shopify instructions: Add to `theme.liquid` before `</body>`
- WordPress instructions: Use a plugin or add to `functions.php`
- GTM: Custom HTML tag with the script snippet
- Verification can ping the manifest endpoint to check if the site is properly configured

### Project Structure Notes

- New file: `src/app/app/embed/page.tsx`
- Touches: `src/app/app/layout.tsx` (optional nav link)

### References

- [Source: Figma Make — pages/embed.tsx]
- [Source: packages/widget/widget.ts — widget loader]
- [Source: docs/BUILT-FEATURES.md#Embed Page]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
