# Story F.1: Builder Style Editor

Status: ready-for-dev

## Story

As a merchant,
I want a visual style editor in the campaign builder,
so that I can customize colors, fonts, borders, spacing, and button styles for my forms without writing CSS.

## Acceptance Criteria

1. Style Editor panel is accessible as a tab in the campaign builder
2. Merchant can set form background color, text color, and button color via color pickers
3. Merchant can select font family from a curated list
4. Merchant can adjust border radius (px slider)
5. Merchant can adjust form padding/spacing
6. Merchant can customize button text, background, hover color, and border radius
7. All style changes are reflected in real-time on the form canvas/preview
8. Styles are persisted to the Variant's `styleJson` field on save
9. Style values map to the shared `FormStyle` type in `packages/shared/forms/types.ts`

## Tasks / Subtasks

- [ ] Create `src/app/app/campaigns/[id]/builder/components/style-editor.tsx` client component (AC: 1)
  - [ ] Color picker inputs for background, text, button, accent colors (AC: 2)
  - [ ] Font family dropdown with curated options (AC: 3)
  - [ ] Border radius slider input (AC: 4)
  - [ ] Spacing/padding controls (AC: 5)
  - [ ] Button style sub-section (text, bg, hover, radius) (AC: 6)
- [ ] Wire style state to builder context/parent state (AC: 7)
- [ ] Persist style changes via PATCH `/api/campaigns/[id]/variants/[variantId]` (AC: 8)
- [ ] Ensure `FormStyle` type compatibility with widget rendering (AC: 9)
- [ ] Add Zod schema for style validation on the API route (AC: 8)

## Dev Notes

- Reference Figma: `components/builder/style-editor.tsx`
- The `FormStyle` type already exists in `packages/shared/forms/types.ts` — use it as the source of truth
- Widget popup already renders from FormStyle (see `packages/widget/popup.ts`) — ensure parity
- Use `"use client"` directive — this component needs interactive inputs
- Follow existing builder pattern in `src/app/app/campaigns/[id]/builder/page.tsx`

### Project Structure Notes

- New file: `src/app/app/campaigns/[id]/builder/components/style-editor.tsx`
- Touches: builder page layout to add Style tab

### References

- [Source: packages/shared/forms/types.ts#FormStyle]
- [Source: packages/widget/popup.ts — style rendering]
- [Source: Figma Make — components/builder/style-editor.tsx]
- [Source: docs/BUILT-FEATURES.md#Builder Components]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
