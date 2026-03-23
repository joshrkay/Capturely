# Story F.1: Builder Style Editor

Status: ready-for-dev

---

## Story

**As a** merchant using the campaign builder,
**I want** a visual style editor panel with controls for colors, fonts, spacing, borders, shadows, and button appearance,
**so that** I can fully customize how my forms look on my site without writing any CSS.

**Size:** M (extract + extend existing component, shared type changes, widget updates)

---

## Dependencies

| Direction | Story | Reason |
|-----------|-------|--------|
| BLOCKS | F.4 (Live Preview) | Preview component consumes the extracted `StyleEditor` and its `FormStyle` output |
| BLOCKED BY | — | No blockers; builder page and shared types already exist |

---

## Existing Code Inventory

| File | Lines | What's There |
|------|-------|--------------|
| `src/app/app/campaigns/[id]/builder/page.tsx` | 290-367 | `StylePanel` function — 4 color pickers, borderRadius text input, fontFamily 4-option select, submitLabel text input |
| `packages/shared/forms/src/types.ts` | — | `FormStyle` interface with `backgroundColor`, `textColor`, `buttonColor`, `buttonTextColor`, `borderRadius`, `fontFamily` |
| `packages/widget/popup.ts` | — | Reads `FormStyle` to apply inline styles to popup container |
| `packages/widget/form-renderer.ts` | — | Reads `FormStyle` to apply inline styles to form elements and buttons |
| `src/app/api/campaigns/[id]/variants/route.ts` | 13-18 | Zod schema: `{ name?: string, schemaJson?: string, trafficPercentage?: number, isControl?: boolean }` |

**Key insight:** Styles live inside the variant's `schemaJson` blob — there is no separate `styleJson` column. The builder page already serializes the full schema (including `style`) into `schemaJson` when saving.

---

## Acceptance Criteria

1. **Extract:** The existing `StylePanel` function (lines 290-367 of builder page) is extracted into `src/app/app/campaigns/[id]/builder/components/style-editor.tsx` as a standalone `"use client"` component with no behavioral regression.
2. **Color pickers:** Merchant can set `backgroundColor`, `textColor`, `buttonColor`, `buttonTextColor`, and the new `buttonHoverColor` via native `<input type="color">` elements — no third-party color picker library.
3. **Font family:** Merchant can select from the existing four options: Inter, System UI, Georgia, Monospace.
4. **Border radius (form):** Existing `borderRadius` text input remains functional with px unit.
5. **Border radius (button):** New `buttonBorderRadius` text input controls button-specific rounding independently from the form border radius.
6. **Padding:** New `padding` control lets the merchant set form padding in px (single value or top/right/bottom/left shorthand).
7. **Box shadow:** New `boxShadow` input lets the merchant choose from a preset list (none, sm, md, lg, xl) that map to Tailwind-equivalent CSS shadow values.
8. **Button hover color:** New `buttonHoverColor` picker lets the merchant set the button's hover background color.
9. **Submit label:** Existing submit-label text input is preserved in the extracted component.
10. **Real-time callback:** Every control change fires `onChange(updatedStyle)` immediately so the parent builder can re-render the preview.
11. **Persistence:** Styles round-trip through `PATCH /api/campaigns/[id]/variants` via the existing `schemaJson` field — no new API endpoint is created.
12. **Shared types:** `FormStyle` in `packages/shared/forms/src/types.ts` gains optional fields `padding`, `buttonBorderRadius`, `buttonHoverColor`, `boxShadow` — all optional to maintain backward compatibility.
13. **Widget parity:** `packages/widget/popup.ts` and `packages/widget/form-renderer.ts` apply the new style fields when present, falling back to sensible defaults when absent.
14. **Accessibility:** Every input has an associated `<label>`, color pickers have visible hex values, and the panel is keyboard-navigable.

---

## API Contracts

### PATCH `/api/campaigns/[id]/variants`

**No changes to the route handler.** Styles are embedded in `schemaJson`.

Existing Zod schema (unchanged):

```ts
const UpdateVariantSchema = z.object({
  variantId: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  schemaJson: z.string().optional(),
  trafficPercentage: z.number().min(0).max(100).optional(),
  isControl: z.boolean().optional(),
});
```

The `schemaJson` string, when parsed, contains:

```ts
{
  fields: Field[];
  style: FormStyle;       // ← includes new optional fields
  submitLabel: string;
  // ...other schema props
}
```

### Extended `FormStyle` (shared type)

```ts
export interface FormStyle {
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  borderRadius: string;
  fontFamily: string;
  // ---- new optional fields ----
  padding?: string;              // e.g. "24px" or "16px 24px"
  buttonBorderRadius?: string;   // e.g. "8px", defaults to borderRadius if absent
  buttonHoverColor?: string;     // hex color, defaults to slightly darker buttonColor
  boxShadow?: string;            // "none" | "sm" | "md" | "lg" | "xl"
}
```

All new fields are **optional** so existing persisted schemas remain valid.

---

## Component Architecture

### File: `src/app/app/campaigns/[id]/builder/components/style-editor.tsx`

```ts
"use client";

export interface StyleEditorProps {
  style: FormStyle;
  submitLabel: string;
  onChange: (style: FormStyle) => void;
  onSubmitLabelChange: (label: string) => void;
}
```

**Internal state:** None — this is a controlled component. All state lives in the parent builder page.

**Hooks:** None required. Pure prop-driven UI.

**Sections (visual grouping with headings):**

1. **Colors** — backgroundColor, textColor
2. **Button** — buttonColor, buttonTextColor, buttonHoverColor, buttonBorderRadius
3. **Typography** — fontFamily
4. **Layout** — borderRadius, padding
5. **Effects** — boxShadow
6. **Submit Button Label** — submitLabel text input

Each color control renders a paired `<input type="color">` + hex display `<span>`.

### Parent integration (builder page)

After extraction, the builder page imports `StyleEditor` and passes the same props the inline `StylePanel` currently receives. The only change to the builder page is replacing the inline function with the import.

---

## UI States

| State | Behavior |
|-------|----------|
| **Default / loaded** | All controls populated from current `FormStyle` values; new fields use defaults if absent in persisted data |
| **Editing** | Each keystroke / picker change calls `onChange` with the full updated `FormStyle` object |
| **Empty/new campaign** | All fields populated with sensible defaults defined in a `DEFAULT_FORM_STYLE` constant |
| **Save in progress** | Handled by parent builder — StyleEditor has no loading state of its own |
| **Error** | Handled by parent builder — StyleEditor does not display errors |

### Default values for new fields

```ts
const STYLE_DEFAULTS = {
  padding: "24px",
  buttonBorderRadius: "6px",
  buttonHoverColor: "",       // empty = auto-darken buttonColor
  boxShadow: "none",
};
```

---

## Design System Compliance

All UI elements must follow the existing builder design system:

| Element | Classes |
|---------|---------|
| Panel background | `bg-zinc-50 dark:bg-black` |
| Section borders | `border-zinc-200 dark:border-zinc-800` |
| Text inputs | `rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100` |
| Labels | `text-xs font-medium text-zinc-600 dark:text-zinc-400` |
| Section headings | `text-sm font-semibold text-zinc-900 dark:text-zinc-100` |
| Select inputs | Same as text inputs, with `appearance-none` if custom chevron is needed |
| Color input wrapper | Small square `w-8 h-8 rounded border border-zinc-300 dark:border-zinc-700 overflow-hidden` containing the native input |

---

## Accessibility

- Every `<input>` and `<select>` has an explicit `<label>` with matching `htmlFor`/`id`.
- Color pickers display the current hex value as visible text (not just the swatch) for users who cannot distinguish colors.
- All controls are reachable and operable via keyboard (Tab, Enter, Arrow keys for select).
- Box shadow preset selector uses a `<select>` element (not a custom dropdown) for native accessibility.
- Section headings use `<h3>` or `<h4>` elements for proper document outline within the panel.
- Sufficient color contrast on all label text (zinc-600 on zinc-50 meets WCAG AA).

---

## Testing Plan

### Unit Tests

| Test | File |
|------|------|
| StyleEditor renders all 6 sections | `style-editor.test.tsx` |
| Changing backgroundColor calls onChange with updated style | `style-editor.test.tsx` |
| Changing buttonHoverColor calls onChange with updated style | `style-editor.test.tsx` |
| Changing boxShadow preset calls onChange with correct value | `style-editor.test.tsx` |
| Changing padding calls onChange with correct value | `style-editor.test.tsx` |
| Changing submitLabel calls onSubmitLabelChange | `style-editor.test.tsx` |
| Missing optional fields render with defaults | `style-editor.test.tsx` |
| All inputs have associated labels (a11y) | `style-editor.test.tsx` |

### Integration Tests

| Test | Scope |
|------|-------|
| Builder page renders StyleEditor with correct props | Builder page test |
| Style changes propagate to schema and persist via API | Builder save flow |
| Widget renders new style fields (padding, boxShadow, buttonBorderRadius) | Widget renderer test |
| Widget ignores missing optional fields gracefully | Widget renderer test |

### Manual QA Checklist

- [ ] Open builder, switch to Styles tab — all controls visible
- [ ] Change each color — preview updates in real-time
- [ ] Change font family — preview updates
- [ ] Set padding to "16px 32px" — preview updates
- [ ] Set button border radius independently from form border radius
- [ ] Select each box shadow preset — preview updates
- [ ] Save campaign, reload page — all style values preserved
- [ ] Create brand-new campaign — defaults applied correctly
- [ ] Dark mode — all controls readable, correct contrast
- [ ] Keyboard-only navigation through all controls

---

## Anti-Patterns to Avoid

1. **DO NOT** add a color picker library (react-color, etc.) — use native `<input type="color">`.
2. **DO NOT** create a separate `/api/campaigns/[id]/style` endpoint — styles live inside `schemaJson`.
3. **DO NOT** store styles in a separate DB column — they are part of the variant schema blob.
4. **DO NOT** add local component state that duplicates the parent's state — keep `StyleEditor` fully controlled.
5. **DO NOT** use `any` types — all props and change handlers must be fully typed.
6. **DO NOT** break backward compatibility — all new `FormStyle` fields must be optional.
7. **DO NOT** use inline styles in the editor UI itself — use Tailwind classes matching the design system.
8. **DO NOT** import React state hooks in `StyleEditor` — it is a pure controlled component.

---

## Tasks

- [ ] **T1:** Read and understand the existing `StylePanel` function in `src/app/app/campaigns/[id]/builder/page.tsx` lines 290-367.
- [ ] **T2:** Extend `FormStyle` in `packages/shared/forms/src/types.ts` — add optional fields: `padding`, `buttonBorderRadius`, `buttonHoverColor`, `boxShadow`.
- [ ] **T3:** Define `STYLE_DEFAULTS` constant (either in shared types or in the new component) for fallback values of the new fields.
- [ ] **T4:** Create `src/app/app/campaigns/[id]/builder/components/style-editor.tsx` with the `StyleEditorProps` interface.
- [ ] **T5:** Move the existing 4 color picker controls into the new component's Colors section.
- [ ] **T6:** Move the existing fontFamily select into the Typography section.
- [ ] **T7:** Move the existing borderRadius input into the Layout section.
- [ ] **T8:** Move the existing submitLabel input into the Submit Button Label section.
- [ ] **T9:** Add `buttonHoverColor` color picker to the Button section.
- [ ] **T10:** Add `buttonBorderRadius` text input to the Button section.
- [ ] **T11:** Add `padding` text input to the Layout section with helper text showing format.
- [ ] **T12:** Add `boxShadow` preset `<select>` to the Effects section with options: none, sm, md, lg, xl.
- [ ] **T13:** Apply design system classes to all elements (labels, inputs, headings, backgrounds, borders).
- [ ] **T14:** Add `<label>` elements with `htmlFor` to every input for accessibility.
- [ ] **T15:** Update `src/app/app/campaigns/[id]/builder/page.tsx` — remove inline `StylePanel`, import `StyleEditor`, pass same props.
- [ ] **T16:** Update `packages/widget/popup.ts` to read and apply `padding`, `boxShadow`, `buttonBorderRadius`, `buttonHoverColor` from `FormStyle` with fallback defaults.
- [ ] **T17:** Update `packages/widget/form-renderer.ts` to read and apply `buttonBorderRadius` and `buttonHoverColor` on button elements with fallback defaults.
- [ ] **T18:** Verify the builder save flow — confirm `schemaJson` serialization includes the new fields and round-trips correctly via the existing PATCH endpoint.
- [ ] **T19:** Write unit tests for `StyleEditor` — rendering, onChange callbacks, default handling, label accessibility.
- [ ] **T20:** Manual QA — dark mode, keyboard nav, save/reload persistence, new campaign defaults.

---

## Dev Notes

- The `FormStyle` type is the **single source of truth** shared between the dashboard builder, the API (via `schemaJson`), and the widget runtime. Any field added there must be handled in all three layers.
- The widget files (`popup.ts`, `form-renderer.ts`) are vanilla JS/TS with no framework — apply styles via `element.style.*` property assignment.
- Box shadow presets should map to concrete CSS values in a lookup:
  ```ts
  const BOX_SHADOW_MAP: Record<string, string> = {
    none: "none",
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  };
  ```
- The `buttonHoverColor` in the widget must be applied via a mouseenter/mouseleave event pair on the submit button — CSS `:hover` is not available from inline styles.
- If `buttonBorderRadius` is absent, the widget should fall back to the form-level `borderRadius`.
- If `buttonHoverColor` is absent or empty, the widget should either skip hover styling or auto-darken `buttonColor` by ~10%.
- Keep the component file under 200 lines. If it grows beyond that, consider splitting section sub-components — but only if necessary.

---

## References

- `src/app/app/campaigns/[id]/builder/page.tsx` — existing builder page with inline `StylePanel`
- `packages/shared/forms/src/types.ts` — `FormStyle` interface (source of truth)
- `packages/widget/popup.ts` — widget popup rendering
- `packages/widget/form-renderer.ts` — widget form/button rendering
- `src/app/api/campaigns/[id]/variants/route.ts` — variant PATCH endpoint (lines 13-18 for Zod schema)
- `docs/PRD.md` — full product requirements
- `docs/BUILT-FEATURES.md` — existing feature documentation

---

## Dev Agent Record

### Agent Model Used

_(to be filled during implementation)_

### Debug Log References

_(to be filled during implementation)_

### Completion Notes List

_(to be filled during implementation)_

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-03-23 | Enhanced story: added dependencies, code inventory, extended AC, API contracts, component architecture, UI states, design system compliance, accessibility, testing plan, anti-patterns, expanded tasks | Claude |

### File List

| File | Action |
|------|--------|
| `packages/shared/forms/src/types.ts` | MODIFY — extend `FormStyle` |
| `src/app/app/campaigns/[id]/builder/components/style-editor.tsx` | CREATE — extracted + extended component |
| `src/app/app/campaigns/[id]/builder/page.tsx` | MODIFY — replace inline `StylePanel` with import |
| `packages/widget/popup.ts` | MODIFY — handle new style fields |
| `packages/widget/form-renderer.ts` | MODIFY — handle new style fields |
