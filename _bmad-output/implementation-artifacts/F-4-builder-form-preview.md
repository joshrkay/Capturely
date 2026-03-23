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
8. Conditional visibility rules are evaluated and reflected in the preview
9. Container scales responsively using CSS `transform: scale()` (no iframe)

## Dependencies

| Direction | Story | Description |
|-----------|-------|-------------|
| BLOCKED BY | F.1 | Extracted style rendering utilities must exist before preview can consume them |
| BLOCKS | F.5 | Live preview integration in the full builder flow |
| BLOCKS | G.1 | Widget rendering parity validation |
| BLOCKS | G.5 | A/B variant preview switching |

## Tasks / Subtasks

### Task 1: Extract existing FormPreview into standalone component (AC: 1, 2)

- [ ] Create `src/app/app/campaigns/[id]/builder/components/form-preview.tsx` as a `"use client"` component
- [ ] Move the existing `FormPreview` function (lines 593-687 of `src/app/app/campaigns/[id]/builder/page.tsx`) into the new file
- [ ] Update the builder page to import from the new component file
- [ ] Verify existing behavior is preserved after extraction (no visual regression)

### Task 2: Define enhanced component interface (AC: 4, 5, 9)

- [ ] Update props interface:
  ```ts
  interface FormPreviewProps {
    schema: FormSchema;
    campaignType: string;
    viewport?: 'desktop' | 'tablet' | 'mobile';
    displayMode?: 'popup' | 'inline';
  }
  ```
- [ ] Add internal state for viewport and displayMode when props are not controlled externally
- [ ] Default viewport to `'desktop'`, displayMode to the campaignType value

### Task 3: Viewport toggle toolbar (AC: 4)

- [ ] Add a toolbar row above the preview area with three toggle buttons: Desktop (1024px), Tablet (768px), Mobile (375px)
- [ ] Toggle button styles:
  - Base: `rounded px-2 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400`
  - Active: `bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300`
- [ ] Icons optional (Lucide `Monitor`, `Tablet`, `Smartphone`) but text labels required for accessibility
- [ ] Clicking a toggle updates the viewport state and re-renders the preview container at the target width

### Task 4: Display mode toggle (AC: 5)

- [ ] Add a second toggle group in the toolbar: Popup / Inline
- [ ] Popup mode: render the form card centered with `shadow-2xl`, simulated overlay backdrop (`bg-black/20` behind the card)
- [ ] Inline mode: render the form card left-aligned with `shadow-md`, no backdrop
- [ ] Use same toggle button design system as viewport toggles

### Task 5: Scaled container rendering — no iframe (AC: 9)

- [ ] Wrap the form card in a container div with a fixed pixel width matching the selected viewport (1024 / 768 / 375)
- [ ] Apply CSS `transform: scale()` to fit the container within the available preview panel width
- [ ] Calculate scale factor: `scale = Math.min(1, availableWidth / viewportWidth)`
- [ ] Use a `ResizeObserver` (or `useRef` + `useEffect`) to track the available panel width
- [ ] Set `transform-origin: top center` so scaling anchors from the top
- [ ] Set explicit `height` on the outer wrapper to `containerHeight * scale` to prevent layout collapse
- [ ] Preview background: `bg-zinc-100 dark:bg-zinc-950` on the outermost wrapper

### Task 6: Conditional field visibility (AC: 8)

- [ ] Import `evaluateVisibility()` from `packages/shared/forms/`
- [ ] Before rendering each field, call `evaluateVisibility(field, currentValues)` where `currentValues` is an empty object (preview mode has no user input)
- [ ] Fields that fail visibility evaluation are hidden (`display: none` or excluded from render)
- [ ] This ensures preview parity with widget runtime behavior

### Task 7: Shared field rendering (AC: 6)

- [ ] Import field type definitions and any rendering helpers from `packages/shared/forms/`
- [ ] Ensure all 9 field types render identically to the existing implementation:
  - `submit` — button with `style.buttonColor`, `style.buttonTextColor`, `style.borderRadius`
  - `hidden` — not rendered (return null)
  - `textarea` — label + textarea with `style.borderRadius`, 3 rows
  - `checkbox` — checkbox input + label, horizontal layout
  - `radio` — label + vertical list of radio options
  - `dropdown` — label + select element with options, placeholder as first option
  - `text` / `email` / `phone` — label + input with appropriate `type` attr, `style.borderRadius`
- [ ] All fields are `readOnly` / disabled (no form submission in preview)
- [ ] Labels show ` *` suffix when `field.required` is true
- [ ] Form card container applies: `style.backgroundColor`, `style.textColor`, `style.borderRadius`, `style.fontFamily`, `padding: 24px`

### Task 8: Real-time update subscription (AC: 3)

- [ ] Component receives `schema` as a prop — re-renders automatically when parent state changes
- [ ] No internal caching or memoization that would stale the preview
- [ ] Consider `React.memo` with a shallow compare on `schema` reference for performance if needed later

### Task 9: Disable form actions (AC: 7)

- [ ] Submit button has `type="button"` and `onClick` is a no-op or absent
- [ ] All inputs are `readOnly`
- [ ] `<form>` tag (if used) has `onSubmit={(e) => e.preventDefault()}`

## Current Implementation Reference

The existing `FormPreview` function lives at lines 593-687 of `src/app/app/campaigns/[id]/builder/page.tsx`. Its current signature:

```ts
function FormPreview({ schema, campaignType }: { schema: FormSchema; campaignType: string })
```

It renders all fields inside a container with these applied styles:
- Container: `backgroundColor`, `textColor`, `borderRadius`, `fontFamily`, padding 24px
- Popup campaign type gets `shadow-2xl`; inline gets `shadow-md`
- Fields rendered in a `space-y-3` vertical stack

This implementation must be **extracted verbatim first**, then enhanced with viewport/display toggles and scaling.

## Design System

### Preview Panel
- Background: `bg-zinc-100 dark:bg-zinc-950`
- Min height: `min-h-[400px]`
- Overflow: `overflow-auto`

### Toggle Buttons
- Base: `rounded px-2 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400`
- Active: `bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300`
- Hover (inactive): `hover:text-zinc-700 dark:hover:text-zinc-300`
- Toolbar row: `flex items-center gap-1 p-2 border-b border-zinc-200 dark:border-zinc-800`

### Popup Overlay Simulation
- Backdrop: `bg-black/20 rounded-lg` filling the viewport container
- Card: centered vertically and horizontally within the backdrop

### Viewport Widths
| Viewport | Width |
|----------|-------|
| Desktop  | 1024px |
| Tablet   | 768px  |
| Mobile   | 375px  |

## Dev Notes

- **No iframe** — use CSS `transform: scale()` with width constraints in a container div. Iframes add complexity (cross-origin style injection, resize handling) with no benefit for a same-origin preview.
- The `evaluateVisibility()` import from `packages/shared/forms/` ensures the preview honors the same conditional logic the widget runtime uses. Pass an empty `{}` as current values since preview has no user input.
- Reuse field type definitions from `packages/shared/forms/` to maintain type parity with the widget bundle.
- The component must be `"use client"` because it uses `useState` for viewport/displayMode toggles and `useRef`/`useEffect` for `ResizeObserver`.
- Scale factor recalculation should debounce or use `requestAnimationFrame` to avoid layout thrashing during panel resize.
- The builder page import changes from an inline function to: `import { FormPreview } from './components/form-preview'`

### Project Structure Notes

- **New file:** `src/app/app/campaigns/[id]/builder/components/form-preview.tsx`
- **Modified file:** `src/app/app/campaigns/[id]/builder/page.tsx` (remove inline FormPreview, add import)
- **Imports from:** `packages/shared/forms/` (evaluateVisibility, field types)

### Testing Guidance

- Verify all 9 field types render correctly in each viewport size
- Verify popup mode shows backdrop + centered card with `shadow-2xl`
- Verify inline mode shows left-aligned card with `shadow-md`, no backdrop
- Verify toggling viewport recalculates scale factor and container width
- Verify hidden fields return null, conditional visibility hides fields when rules fail
- Verify all inputs are read-only and submit button does not trigger navigation
- Verify real-time updates: changing schema prop (field add/remove, style change) reflects immediately

### References

- [Source: src/app/app/campaigns/[id]/builder/page.tsx#L593-L687 — current FormPreview]
- [Source: packages/shared/forms/types.ts — FormSchema, FormStyle, FormField]
- [Source: packages/shared/forms/visibility.ts — evaluateVisibility()]
- [Source: packages/shared/forms/fields.ts — field type definitions]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### Change Log
### File List
