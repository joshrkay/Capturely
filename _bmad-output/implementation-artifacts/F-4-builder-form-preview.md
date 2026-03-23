# F.4 — Builder Form Preview (Extract & Extend)

**Status:** Draft
**Story ID:** F-4
**Gate:** F (Campaign Builder)
**Epic:** Builder — Preview & Rendering
**Estimate:** 5 points
**Priority:** High — preview is central to the builder UX

---

## Summary

Extract the existing `FormPreview` function (currently inlined at lines 593–687 of the builder page) into a standalone, reusable component, then extend it with device viewport toggling (desktop/tablet/mobile), popup vs inline display mode, container-based responsive scaling via CSS `transform: scale()` (no iframes), and conditional field visibility via `evaluateVisibility()` from the shared forms package.

---

## Dependencies

### Blocked By

| Story | Title | Why |
|-------|-------|-----|
| F.1 | Builder Component Extraction | FormPreview lives inside the monolithic builder page; F.1 establishes the extraction pattern and layout shell |

### Blocks

| Story | Title | Why |
|-------|-------|-----|
| F.5 | Builder Live Preview Sync | Live preview syncs active variant schema to this component |
| G.1 | Templates Gallery | Gallery thumbnails render campaign previews using this component |
| G.5 | AI Form Generator UI | AI-generated forms are previewed through this component |

---

## Existing Code Inventory

### Code to extract

| File | Lines | What |
|------|-------|------|
| `src/app/app/campaigns/[id]/builder/page.tsx` | 593–687 | `FormPreview` function — renders all 9 field types with inline styles from `FormStyle` |

**Current FormPreview renders these field types:**
- Submit button (always present)
- `hidden` — returns `null` (not rendered)
- `textarea` — multi-line text area
- `checkbox` — checkbox with label
- `radio` — radio button group
- `dropdown` — select element with options
- `text`, `email`, `phone` — standard text inputs with appropriate `type` attribute

**Current inline style application uses `FormStyle`:**
```typescript
export interface FormStyle {
  backgroundColor?: string;
  textColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  borderRadius?: string;
  fontFamily?: string;
}
```

### Files to reference (read-only)

| File | Lines | Relevance |
|------|-------|-----------|
| `src/app/app/campaigns/[id]/builder/page.tsx` | 593–687 | Source code to extract |
| `src/app/app/campaigns/[id]/builder/page.tsx` | 695 | `activeVariantId` state — determines which variant schema to preview |
| `packages/shared/forms/` | full | `evaluateVisibility()`, `validateSubmission()`, `normalizeFields()` |
| `src/lib/plans.ts` | full | Plan info (for feature-gating if needed) |
| `prisma/schema.prisma` | 174–192 | Variant model — `schemaJson` field is the source of form schema |

### New files to create

| File | Purpose |
|------|---------|
| `src/app/app/campaigns/[id]/builder/_components/FormPreview.tsx` | Extracted + extended preview component (`"use client"`) |
| `src/app/app/campaigns/[id]/builder/_components/ViewportToggle.tsx` | Desktop/tablet/mobile toggle buttons |
| `src/app/app/campaigns/[id]/builder/_components/__tests__/FormPreview.test.tsx` | Unit + integration tests |

---

## Acceptance Criteria

1. The existing `FormPreview` function (lines 593–687) is extracted into `FormPreview.tsx` as a standalone `"use client"` component with no behavioral regression — all 9 field types render identically.
2. The builder page imports and renders the extracted `FormPreview` component in place of the inline function.
3. All inline styles from `FormStyle` (backgroundColor, textColor, buttonColor, buttonTextColor, borderRadius, fontFamily) continue to apply correctly.
4. A `ViewportToggle` component provides three viewport options: Desktop (1024px), Tablet (768px), Mobile (375px).
5. Viewport switching constrains the preview container's `max-width` to the selected viewport width and applies CSS `transform: scale()` to fit the container within the available builder panel space.
6. **No iframe is used.** The preview renders directly in the DOM inside a container `div` with width constraints and CSS scaling.
7. A `displayMode` prop switches between `"popup"` (centered overlay with backdrop) and `"inline"` (flush, no backdrop) rendering within the preview container.
8. In popup mode, the form renders centered with a semi-transparent backdrop behind it and rounded corners, simulating how it will appear on the merchant's site.
9. In inline mode, the form renders flush against the container edges with no backdrop.
10. Conditional field visibility is evaluated using `evaluateVisibility()` from `packages/shared/forms`. Fields whose visibility conditions are not met are hidden from the preview.
11. The component accepts a `schema` prop (parsed form schema) and re-renders reactively when the schema changes (e.g., when switching variants or editing fields).
12. The preview container maintains aspect ratio and does not overflow its parent — scaling is calculated as `Math.min(1, availableWidth / viewportWidth)`.
13. The component is purely presentational — no form submission logic, no API calls. It only renders.
14. Hidden fields (`type: "hidden"`) continue to return `null` (not rendered).

---

## API Contracts

This component is purely client-side and does not make API calls. No API contracts apply.

**Props Interface (serves as the component contract):**

```typescript
import type { FormSchema } from "@/packages/shared/forms/types";

export interface FormPreviewProps {
  /** Parsed form schema from the active variant's schemaJson */
  schema: FormSchema;

  /** Campaign display type — affects container rendering */
  campaignType: "popup" | "inline" | "slide-in" | "bar";

  /** Device viewport to simulate — controls max-width and scale */
  viewport?: "desktop" | "tablet" | "mobile";

  /** Display mode — popup renders with backdrop, inline renders flush */
  displayMode?: "popup" | "inline";

  /** Style overrides from the campaign's FormStyle */
  style?: FormStyle;

  /** Optional className for the outermost container */
  className?: string;
}
```

**Viewport Constants:**

```typescript
export const VIEWPORT_WIDTHS = {
  desktop: 1024,
  tablet: 768,
  mobile: 375,
} as const;

export type ViewportKey = keyof typeof VIEWPORT_WIDTHS;
```

**ViewportToggle Props:**

```typescript
export interface ViewportToggleProps {
  value: ViewportKey;
  onChange: (viewport: ViewportKey) => void;
}
```

---

## Component Architecture

```
FormPreview ("use client")
├── PreviewContainer (outer wrapper — handles scaling and overflow)
│   ├── ScaleWrapper (applies transform: scale() based on viewport vs available width)
│   │   ├── PopupBackdrop (rendered only in displayMode="popup")
│   │   │   └── FormCard (centered, rounded, elevated)
│   │   │       └── FieldList
│   │   └── InlineWrapper (rendered only in displayMode="inline")
│   │       └── FieldList
│   └── FieldList (shared between modes)
│       ├── TextField (text/email/phone inputs)
│       ├── TextareaField
│       ├── CheckboxField
│       ├── RadioField
│       ├── DropdownField
│       ├── HiddenField (returns null)
│       └── SubmitButton
└── (no state — all controlled via props)

ViewportToggle (sibling component, rendered in builder toolbar)
├── DesktopButton (monitor icon)
├── TabletButton (tablet icon)
└── MobileButton (phone icon)
```

### Scaling Logic

```typescript
function usePreviewScale(
  containerRef: React.RefObject<HTMLDivElement>,
  viewportWidth: number
): number {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const availableWidth = entry.contentRect.width;
      setScale(Math.min(1, availableWidth / viewportWidth));
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [viewportWidth]);

  return scale;
}
```

### Field Rendering (extracted from existing code)

Each field type maps to a render function. The existing logic at lines 593–687 already handles this — extract as-is, then wrap each in a visibility check:

```typescript
function renderField(field: FormField, style: FormStyle): React.ReactNode {
  // Visibility check using shared package
  if (!evaluateVisibility(field, currentValues)) {
    return null;
  }

  switch (field.type) {
    case "hidden": return null;
    case "textarea": return <TextareaField field={field} style={style} />;
    case "checkbox": return <CheckboxField field={field} style={style} />;
    case "radio": return <RadioField field={field} style={style} />;
    case "dropdown": return <DropdownField field={field} style={style} />;
    case "text":
    case "email":
    case "phone":
    default: return <TextField field={field} style={style} />;
  }
}
```

---

## UI States

### 1. Desktop Viewport (default)
- Preview container max-width: 1024px. Scale is 1.0 if builder panel is wide enough, otherwise scales down proportionally.

### 2. Tablet Viewport
- Preview container max-width: 768px. Content scales to fit.

### 3. Mobile Viewport
- Preview container max-width: 375px. Content renders narrow, centered in the available space.

### 4. Popup Display Mode
- Semi-transparent backdrop: `bg-black/40` fills the preview container.
- Form card centered both horizontally and vertically within the container using `flex items-center justify-center`.
- Card has rounded corners, shadow, and the campaign's `backgroundColor`.

### 5. Inline Display Mode
- No backdrop, no centering. Form renders flush at the top of the container.
- Full width within the viewport constraint.

### 6. Empty Schema
- If `schema.fields` is empty or undefined, show a placeholder: "Add fields to see a preview" in muted text, centered.

### 7. All Fields Hidden by Visibility
- If all fields evaluate to hidden via `evaluateVisibility()`, show: "No visible fields with current conditions" in muted text.

---

## Design System Compliance

### Preview Container
- Outer container: `bg-zinc-100 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden`
- Container padding: `p-4` (space between container edge and the scaled content)

### Viewport Toggle
- Button group: `inline-flex rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden`
- Inactive button: `px-3 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800`
- Active button: `px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 font-medium`
- Dividers between buttons: `border-r border-zinc-200 dark:border-zinc-800` (except last)

### Popup Mode Backdrop
- Backdrop: `bg-black/40 rounded-lg`
- Form card: `bg-white dark:bg-zinc-900 rounded-lg shadow-xl p-6 max-w-md mx-auto`

### Inline Mode
- Form wrapper: `bg-white dark:bg-zinc-900 p-4`

### Field Inputs (within preview — mirrors campaign style)
- Default input (when no FormStyle override): `rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100`
- When FormStyle is applied, inline `style` attributes override the Tailwind defaults for: `backgroundColor`, `color` (textColor), `borderRadius`, `fontFamily`
- Submit button default: `rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white`
- Submit button with FormStyle: inline `style` with `backgroundColor: style.buttonColor`, `color: style.buttonTextColor`, `borderRadius: style.borderRadius`

### Placeholder / Empty State
- Text: `text-sm text-zinc-400 dark:text-zinc-500 text-center py-12`

---

## Accessibility

- ViewportToggle uses `role="radiogroup"` with `aria-label="Preview viewport size"`.
- Each viewport button uses `role="radio"` with `aria-checked="true|false"`.
- Preview container has `aria-label="Form preview"` and `role="presentation"` (it is a visual preview, not an interactive form).
- All form inputs within the preview are rendered with `tabindex="-1"` and `aria-hidden="true"` so they are excluded from the tab order — they are for visual preview only, not interactive.
- The submit button within the preview is also `tabindex="-1"` and `aria-hidden="true"`.
- Field labels are rendered visually for preview accuracy but are not interactive.
- Viewport toggle buttons have visible focus rings: `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset`.
- Color contrast in the preview depends on the merchant's `FormStyle` choices — this is by design (preview reflects actual appearance). The builder UI surrounding the preview maintains WCAG AA compliance.

---

## Testing Plan

### Unit Tests

| # | Test | Description |
|---|------|-------------|
| 1 | Renders text input | Pass schema with text field, assert `<input type="text">` renders |
| 2 | Renders email input | Pass schema with email field, assert `<input type="email">` renders |
| 3 | Renders phone input | Pass schema with phone field, assert `<input type="tel">` renders |
| 4 | Renders textarea | Pass schema with textarea field, assert `<textarea>` renders |
| 5 | Renders checkbox | Pass schema with checkbox field, assert checkbox input + label render |
| 6 | Renders radio group | Pass schema with radio field and 3 options, assert 3 radio inputs render |
| 7 | Renders dropdown | Pass schema with dropdown field and 4 options, assert `<select>` with 4 `<option>` elements |
| 8 | Hidden field returns null | Pass schema with hidden field, assert nothing renders for that field |
| 9 | Submit button renders | Assert submit button always present with correct text |
| 10 | FormStyle applies inline styles | Pass style with `buttonColor: "#ff0000"`, assert submit button has `backgroundColor: "#ff0000"` |
| 11 | FormStyle fontFamily applies | Pass style with `fontFamily: "Georgia"`, assert form container has `fontFamily: "Georgia"` |
| 12 | Desktop viewport width | Set viewport="desktop", assert container max-width is 1024px |
| 13 | Tablet viewport width | Set viewport="tablet", assert container max-width is 768px |
| 14 | Mobile viewport width | Set viewport="mobile", assert container max-width is 375px |
| 15 | Popup mode shows backdrop | Set displayMode="popup", assert backdrop element with `bg-black/40` exists |
| 16 | Inline mode no backdrop | Set displayMode="inline", assert no backdrop element rendered |
| 17 | Scale calculation | Container 512px wide + viewport=1024 => scale should be 0.5 |
| 18 | Scale capped at 1 | Container 1200px wide + viewport=1024 => scale should be 1.0 (not 1.17) |
| 19 | Empty schema placeholder | Pass empty fields array, assert "Add fields to see a preview" text |
| 20 | Visibility hidden field | Pass field with visibility condition that evaluates false, assert field not rendered |
| 21 | Preview inputs not tabbable | Assert all input elements within preview have `tabindex="-1"` |

### Integration Tests

| # | Test | Description |
|---|------|-------------|
| 1 | Viewport toggle integration | Click each viewport button, verify preview container resizes accordingly |
| 2 | Schema change re-render | Update schema prop, verify new fields appear and removed fields disappear |
| 3 | Style change re-render | Update style prop, verify inline styles update on all affected elements |

### ViewportToggle Unit Tests

| # | Test | Description |
|---|------|-------------|
| 1 | Renders three buttons | Assert desktop, tablet, mobile buttons all render |
| 2 | Active state | Pass value="tablet", assert tablet button has active styling |
| 3 | Click fires onChange | Click mobile button, assert `onChange("mobile")` called |
| 4 | Keyboard accessible | Assert buttons have correct ARIA roles and states |

---

## Anti-Patterns to Avoid

1. **Do NOT use an iframe for the preview.** Use a container `div` with CSS `transform: scale()` and `max-width` constraints. Iframes create cross-origin issues, increase memory usage, and complicate style injection.
2. **Do NOT make the preview interactive (submittable).** All inputs must have `tabindex="-1"`. The preview is visual only.
3. **Do NOT duplicate the field rendering logic.** Extract once, use everywhere. The field type switch statement should exist in exactly one place.
4. **Do NOT use JavaScript-based resizing or `window.resize` listeners for scaling.** Use `ResizeObserver` on the container element for accurate, performant scaling.
5. **Do NOT hardcode viewport widths as magic numbers.** Use the `VIEWPORT_WIDTHS` constant object.
6. **Do NOT apply Tailwind classes for styles that come from FormStyle.** FormStyle values are dynamic merchant choices — they must be applied via inline `style` attributes, not Tailwind classes.
7. **Do NOT import or depend on any API client code.** FormPreview is purely presentational — props in, JSX out.
8. **Do NOT skip the `evaluateVisibility()` call.** Every field must pass through visibility evaluation even if it currently has no conditions — this ensures the preview stays accurate as conditions are added.
9. **Do NOT break the existing builder behavior during extraction.** The refactor must be a strict no-regression extraction before any enhancements are added.
10. **Do NOT use `useEffect` to sync schema to local state.** Render directly from props. The component should be stateless aside from the scale calculation.

---

## Implementation Tasks

| # | Task | Type | Est |
|---|------|------|-----|
| 1 | Create `FormPreview.tsx` shell with `FormPreviewProps` interface and `"use client"` directive | component | S |
| 2 | Extract field rendering logic from builder page.tsx lines 593–687 into `FormPreview.tsx` — copy all 9 field type cases exactly | refactor | M |
| 3 | Replace inline `FormPreview` function in builder page.tsx with import of extracted component | refactor | S |
| 4 | Verify no regression: all 9 field types render identically after extraction | verification | S |
| 5 | Define `VIEWPORT_WIDTHS` constant and `ViewportKey` type | types | S |
| 6 | Implement `usePreviewScale` hook with `ResizeObserver` for container-based scaling | hook | M |
| 7 | Implement `PreviewContainer` wrapper with `max-width` constraint and `transform: scale()` application | component | M |
| 8 | Create `ViewportToggle.tsx` with desktop/tablet/mobile buttons styled as radio group | component | S |
| 9 | Wire `ViewportToggle` into the builder toolbar area, connect to `viewport` state | wiring | S |
| 10 | Implement popup display mode: semi-transparent backdrop + centered form card | feature | M |
| 11 | Implement inline display mode: flush rendering, no backdrop | feature | S |
| 12 | Add `displayMode` toggle to builder toolbar (popup / inline buttons) | wiring | S |
| 13 | Integrate `evaluateVisibility()` from `packages/shared/forms` — wrap each field render in visibility check | feature | M |
| 14 | Handle empty schema state: render "Add fields to see a preview" placeholder | feature | S |
| 15 | Handle all-fields-hidden state: render "No visible fields with current conditions" message | feature | S |
| 16 | Apply `FormStyle` inline styles to all field elements and submit button | feature | S |
| 17 | Set `tabindex="-1"` and `aria-hidden="true"` on all preview form inputs and buttons | a11y | S |
| 18 | Add ARIA attributes to ViewportToggle: `role="radiogroup"`, `role="radio"`, `aria-checked` | a11y | S |
| 19 | Add `aria-label="Form preview"` and `role="presentation"` to preview container | a11y | S |
| 20 | Write unit tests for FormPreview — all 21 tests per testing plan | test | L |
| 21 | Write unit tests for ViewportToggle — 4 tests per testing plan | test | S |
| 22 | Write integration tests — viewport toggle, schema change, style change (3 tests) | test | M |
| 23 | Dark mode verification: confirm preview container, toggle, and all states render in dark mode | polish | S |
| 24 | Performance check: verify no unnecessary re-renders when parent state changes unrelated to preview | polish | S |

**Total estimate:** ~5 story points

---

## Dev Notes

- The extraction in tasks 2–4 must be done as a pure refactor before any enhancements. Make one commit that extracts with zero changes, then a second commit that adds viewport/display mode/visibility features. This keeps the diff reviewable and makes regressions easy to bisect.
- The `evaluateVisibility()` function from `packages/shared/forms` expects a `currentValues` argument representing current form field values. In the preview context, this should be an empty object `{}` since no values have been entered — this means fields with "show if field X has value Y" conditions will be hidden in preview by default. Consider adding a "Show all fields" toggle in a future story.
- The scaling approach uses `transform-origin: top left` with `transform: scale(S)` where `S = Math.min(1, containerWidth / viewportWidth)`. The container height must also be adjusted: set the wrapper height to `contentHeight * scale` to prevent layout overflow.
- `ResizeObserver` is well-supported (>96% browser coverage). No polyfill needed.
- The `FormStyle` interface uses optional fields. When a value is `undefined`, fall back to the Tailwind default classes rather than setting `style={{ backgroundColor: undefined }}`.
- For popup mode, the backdrop should fill the entire preview container, not the page. This is a preview of how the popup will look, not an actual modal.
- `campaignType` prop (popup/inline/slide-in/bar) is provided for future use. For this story, only `popup` and `inline` display modes need to be fully implemented. `slide-in` and `bar` can be handled in a follow-up story — for now, fall back to `inline` rendering for those types.

---

## References

| Resource | Location |
|----------|----------|
| Current FormPreview function | `src/app/app/campaigns/[id]/builder/page.tsx` lines 593–687 |
| FormStyle interface | `src/app/app/campaigns/[id]/builder/page.tsx` (or extracted type file) |
| Shared form utilities | `packages/shared/forms/` — `evaluateVisibility()`, `normalizeFields()` |
| Variant model (schemaJson source) | `prisma/schema.prisma` lines 174–192 |
| Builder page (full) | `src/app/app/campaigns/[id]/builder/page.tsx` |
| PRD (Gate F stories) | `docs/PRD.md` |

---

## Dev Agent Record

| Field | Value |
|-------|-------|
| Story | F-4: Builder Form Preview (Extract & Extend) |
| Agent | — |
| Started | — |
| Completed | — |
| Blocked | Awaiting F.1 completion |
| Commits | — |
| Test Results | — |
| Notes | Extraction must land as a separate no-regression commit before enhancements |
