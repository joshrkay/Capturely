# Story F.4: Builder Form Preview

Status: ready-for-dev

## Story

As a merchant,
I want a live preview of my form in the builder,
so that I can see exactly how it will appear to visitors before publishing.

## Acceptance Criteria

1. Form Preview panel is accessible in the campaign builder (side panel or tab)
2. Preview renders the form using the current fields, styles, and layout
3. Preview updates in real-time as fields and styles are modified
4. Merchant can toggle preview between desktop, tablet, and mobile viewports
5. Preview shows both popup and inline display modes
6. Preview uses the same rendering logic as the widget (shared FormStyle/FormSchema)
7. Preview is read-only (no form submission)

## Tasks / Subtasks

- [ ] Create `src/app/app/campaigns/[id]/builder/components/form-preview.tsx` client component (AC: 1)
  - [ ] Render form fields from current variant's FormSchema (AC: 2)
  - [ ] Apply FormStyle as inline styles / CSS variables (AC: 2)
  - [ ] Subscribe to builder state changes for real-time updates (AC: 3)
  - [ ] Device toggle buttons (desktop 1024px, tablet 768px, mobile 375px) (AC: 4)
  - [ ] Display mode toggle (popup overlay vs inline embed) (AC: 5)
- [ ] Reuse field rendering logic from `packages/shared/forms/` (AC: 6)
- [ ] Disable form submission in preview mode (AC: 7)

## Dev Notes

- Reference Figma: `components/builder/form-preview.tsx`
- Reuse `packages/shared/forms/` for field types and visibility evaluation
- Widget popup shell (`packages/widget/popup.ts`) is the source of truth for popup appearance
- Consider using an iframe for viewport simulation or CSS `transform: scale()` approach
- Preview should handle conditional visibility (show/hide fields based on rules)

### Project Structure Notes

- New file: `src/app/app/campaigns/[id]/builder/components/form-preview.tsx`
- Touches: builder page layout

### References

- [Source: packages/shared/forms/types.ts#FormSchema, FormStyle]
- [Source: packages/widget/popup.ts — popup rendering]
- [Source: packages/widget/form-renderer.ts — field rendering]
- [Source: Figma Make — components/builder/form-preview.tsx]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
