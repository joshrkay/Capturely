# F.3 — Builder Variant Manager Panel

**Status:** Draft
**Story ID:** F-3
**Gate:** F (Campaign Builder)
**Epic:** Builder — A/B Testing & Variant Management
**Estimate:** 8 points
**Priority:** High — core builder functionality for A/B testing flow

---

## Summary

Build a new `VariantManagerPanel` component for the campaign builder that provides full CRUD operations on campaign variants: listing, creating (by duplicating an existing variant), renaming, deleting, and adjusting traffic allocation percentages. The panel enforces plan-based variant limits, requires the `abTesting` feature flag, protects the control variant from deletion, and ensures traffic percentages always sum to 100%.

---

## Dependencies

### Blocked By

| Story | Title | Why |
|-------|-------|-----|
| F.1 | Builder Component Extraction | VariantManagerPanel mounts inside the extracted builder layout shell |
| F.2 | Builder Style Editor Extraction | Variant duplication copies style + schema; needs the extracted style types |

### Blocks

| Story | Title | Why |
|-------|-------|-----|
| F.5 | Builder Live Preview Sync | Preview must respond to active variant switching from this panel |
| F.6 | A/B Traffic Allocation Analytics | Analytics page reads the traffic splits configured here |

---

## Existing Code Inventory

### Files to reference (read-only, do NOT extract or refactor)

| File | Lines | Relevance |
|------|-------|-----------|
| `src/app/app/campaigns/[id]/builder/page.tsx` | 695 | `activeVariantId` state — current variant selector |
| `src/app/app/campaigns/[id]/builder/page.tsx` | 869–879 | Basic `<select>` dropdown for variant switching (to be replaced by this panel) |
| `src/app/api/campaigns/[id]/variants/route.ts` | full | POST/PATCH handlers, Zod schemas, auto-balance logic (line 60) |
| `src/lib/plans.ts` | full | `resolvePlan()`, `PlanKey` enum, `limits.maxVariants`, `features.abTesting` |
| `src/lib/rbac.ts` | full | `canManageCampaigns()` |
| `src/lib/account.ts` | full | `withAccountContext()` |
| `prisma/schema.prisma` | 174–192 | `Variant` model definition |

### New files to create

| File | Purpose |
|------|---------|
| `src/app/app/campaigns/[id]/builder/_components/VariantManagerPanel.tsx` | Main panel component (`"use client"`) |
| `src/app/app/campaigns/[id]/builder/_components/VariantCard.tsx` | Individual variant row inside the panel |
| `src/app/app/campaigns/[id]/builder/_components/TrafficSlider.tsx` | Traffic percentage allocation control |
| `src/app/app/campaigns/[id]/builder/_components/__tests__/VariantManagerPanel.test.tsx` | Unit + integration tests |

---

## Acceptance Criteria

1. Panel renders a scrollable list of all variants belonging to the current campaign, showing name, traffic %, and control badge.
2. Clicking "Add Variant" duplicates the currently-selected variant's `schemaJson` into a new variant via `POST /api/campaigns/[id]/variants`.
3. After creating a variant, traffic percentages are auto-rebalanced so they sum to 100% (equal split, remainder assigned to control variant).
4. Users can rename any variant inline by clicking the variant name text, which converts to an editable input.
5. Users can delete any non-control variant. Deleting rebalances remaining variants to sum to 100%.
6. The control variant (`isControl: true`) shows a "Control" badge and its delete button is disabled with a tooltip: "Control variant cannot be deleted."
7. Users can manually adjust traffic percentages via slider or numeric input. The UI prevents saving when percentages do not sum to 100%.
8. Plan limit enforcement: the "Add Variant" button is disabled when `campaign.variants.length >= plan.limits.maxVariants`. A tooltip shows "Upgrade your plan to add more variants."
9. **FREE plan users (maxVariants=1) see the panel in a locked/disabled state** with an upgrade CTA. FREE plan users can only have the single control variant — they cannot add variants at all.
10. The `abTesting` feature flag must be enabled (STARTER plan or above) for the panel to be interactive. FREE plan users see a static message: "A/B testing is available on Starter and above."
11. Selecting a variant in the panel updates the `activeVariantId` state, which the builder form editor and preview consume.
12. All mutations (create, update, delete) show optimistic UI with rollback on error.
13. API errors surface as inline toast notifications, never `alert()` or `confirm()` dialogs.
14. The panel is collapsible — users can minimize it to save horizontal space in the builder.

---

## API Contracts

### POST `/api/campaigns/[id]/variants` — Create Variant

**Request Zod Schema:**

```typescript
import { z } from "zod";

export const CreateVariantSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  schemaJson: z.string().refine(
    (val) => {
      try {
        JSON.parse(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: "schemaJson must be valid JSON" }
  ),
});

export type CreateVariantInput = z.infer<typeof CreateVariantSchema>;
```

**Response (201):**

```typescript
{
  variant: {
    id: string;
    campaignId: string;
    name: string;
    isControl: boolean;
    trafficPercentage: number;
    schemaJson: string;
    schemaVersion: number;
    generatedBy: "manual" | "ai";
  };
  allVariants: Array<{
    id: string;
    name: string;
    trafficPercentage: number;
    isControl: boolean;
  }>;
}
```

**Error Responses:**

| Code | Body | Condition |
|------|------|-----------|
| 400 | `{ error: "Invalid input", code: "VALIDATION_ERROR" }` | Zod validation failure |
| 402 | `{ error: "Variant limit reached", code: "PLAN_LIMIT_REACHED", limit: number }` | `variants.length >= plan.limits.maxVariants` |
| 403 | `{ error: "Forbidden", code: "FORBIDDEN" }` | RBAC `canManageCampaigns()` fails |
| 404 | `{ error: "Campaign not found", code: "NOT_FOUND" }` | Campaign doesn't exist or wrong accountId |

### PATCH `/api/campaigns/[id]/variants` — Update Variant

**Request Zod Schema:**

```typescript
export const UpdateVariantSchema = z.object({
  variantId: z.string().cuid(),
  name: z.string().min(1).max(100).optional(),
  schemaJson: z
    .string()
    .refine(
      (val) => {
        try {
          JSON.parse(val);
          return true;
        } catch {
          return false;
        }
      },
      { message: "schemaJson must be valid JSON" }
    )
    .optional(),
  trafficPercentage: z.number().int().min(0).max(100).optional(),
  isControl: z.boolean().optional(),
});

export type UpdateVariantInput = z.infer<typeof UpdateVariantSchema>;
```

**Response (200):**

```typescript
{
  variant: {
    id: string;
    name: string;
    trafficPercentage: number;
    isControl: boolean;
    schemaJson: string;
  };
}
```

**Error Responses:**

| Code | Body | Condition |
|------|------|-----------|
| 400 | `{ error: "Invalid input", code: "VALIDATION_ERROR" }` | Zod validation failure |
| 400 | `{ error: "Traffic percentages must sum to 100", code: "TRAFFIC_SUM_INVALID" }` | Traffic does not balance |
| 403 | `{ error: "Forbidden", code: "FORBIDDEN" }` | RBAC check fails |
| 404 | `{ error: "Variant not found", code: "NOT_FOUND" }` | Variant doesn't exist or wrong accountId |

### DELETE `/api/campaigns/[id]/variants` — Delete Variant

**Request Zod Schema:**

```typescript
export const DeleteVariantSchema = z.object({
  variantId: z.string().cuid(),
});

export type DeleteVariantInput = z.infer<typeof DeleteVariantSchema>;
```

**Response (200):**

```typescript
{
  deleted: true;
  allVariants: Array<{
    id: string;
    name: string;
    trafficPercentage: number;
    isControl: boolean;
  }>;
}
```

**Error Responses:**

| Code | Body | Condition |
|------|------|-----------|
| 400 | `{ error: "Cannot delete control variant", code: "CONTROL_DELETE_FORBIDDEN" }` | `isControl === true` |
| 403 | `{ error: "Forbidden", code: "FORBIDDEN" }` | RBAC check fails |
| 404 | `{ error: "Variant not found", code: "NOT_FOUND" }` | Variant doesn't exist or wrong accountId |

---

## Component Architecture

```
VariantManagerPanel ("use client")
├── PanelHeader
│   ├── Title ("Variants")
│   ├── CollapseToggle (chevron icon, rotates on collapse)
│   └── AddVariantButton (disabled at plan limit or FREE plan)
├── VariantList (scrollable, max-h-64 overflow-y-auto)
│   └── VariantCard[] (one per variant)
│       ├── VariantNameInput (inline editable — click to edit, Enter to save, Escape to cancel)
│       ├── ControlBadge (rendered only when isControl === true)
│       ├── TrafficSlider (range input + numeric display)
│       ├── SelectButton (sets activeVariantId on click)
│       └── DeleteButton (disabled for control variant, inline confirm for others)
├── TrafficSummaryBar
│   ├── Stacked horizontal color bar showing proportional traffic split
│   └── Sum indicator (green checkmark when 100%, red warning otherwise)
└── PlanLimitBanner (conditionally rendered)
    ├── Message: "You've reached your variant limit (X/Y)" or "A/B testing requires Starter+"
    └── UpgradeLink -> /app/billing
```

### State Management

```typescript
// Local state within VariantManagerPanel
const [variants, setVariants] = useState<Variant[]>(initialVariants);
const [activeVariantId, setActiveVariantId] = useState<string>(controlVariant.id);
const [isCollapsed, setIsCollapsed] = useState(false);
const [pendingTraffic, setPendingTraffic] = useState<Record<string, number>>({});
const [isSaving, setIsSaving] = useState(false);
const [editingNameId, setEditingNameId] = useState<string | null>(null);
const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
```

### Props Interface

```typescript
interface VariantManagerPanelProps {
  campaignId: string;
  variants: Variant[];
  activeVariantId: string;
  onActiveVariantChange: (variantId: string) => void;
  onVariantsChange: (variants: Variant[]) => void;
  plan: ResolvedPlan;
  canEdit: boolean; // derived from canManageCampaigns() in the parent
}
```

---

## UI States

### 1. Default (STARTER+ with room below maxVariants)
- Full interactive panel: variant list, add button enabled, traffic sliders active.

### 2. At Plan Limit
- "Add Variant" button disabled with tooltip: "Upgrade your plan to add more variants."
- `PlanLimitBanner` at bottom: "You've used 2/2 variants. Upgrade to Growth for up to 5."

### 3. FREE Plan / abTesting Feature Disabled
- Panel body replaced with a locked-state placeholder.
- Static message: "A/B testing is available on Starter and above."
- CTA button: "Upgrade Plan" linking to `/app/billing`.

### 4. Single Variant (control only, on STARTER+)
- One VariantCard shown. Delete button hidden (cannot delete the only variant). Traffic shows 100%. "Add Variant" button enabled.

### 5. Saving / Optimistic Update
- Card being mutated shows a subtle pulse animation on the traffic percentage.
- On error: card flashes a red border briefly, previous state restored, toast shown.

### 6. Collapsed
- Panel collapses to a header bar showing "Variants (N)" with an expand chevron. No cards visible.

### 7. Delete Confirmation
- Inline confirmation replaces the delete button row: "Delete this variant? Yes / No" — no modal.

---

## Design System Compliance

### Colors & Borders
- Panel background: `bg-zinc-50 dark:bg-black`
- Panel border: `border border-zinc-200 dark:border-zinc-800`
- Card background: `bg-white dark:bg-zinc-900`
- Card border: `border border-zinc-200 dark:border-zinc-800`
- Selected/active card: `ring-2 ring-blue-500 dark:ring-blue-400`
- Control badge: `bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs font-medium px-1.5 py-0.5 rounded`

### Typography
- Panel title: `text-sm font-semibold text-zinc-900 dark:text-zinc-100`
- Variant name (display): `text-sm text-zinc-800 dark:text-zinc-200`
- Variant name (editing): inherits input styles below
- Traffic percentage: `text-xs font-mono text-zinc-600 dark:text-zinc-400`
- Plan limit / info text: `text-xs text-zinc-500 dark:text-zinc-400`

### Inputs
- Name input (editing mode): `rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500`
- Traffic slider track: `accent-blue-500`
- Numeric traffic input: `w-14 rounded border border-zinc-300 px-1 py-0.5 text-xs text-center font-mono dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100`

### Buttons
- Add Variant: `rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed`
- Delete (icon or text): `text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed`
- Upgrade CTA: `rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700`

### Spacing & Layout
- Panel outer padding: `p-4`
- Card inner padding: `px-3 py-2`
- Gap between cards: `gap-2` (flex column)
- Panel fixed width: `w-72` (sidebar in builder layout)
- Variant list max height: `max-h-64 overflow-y-auto`

---

## Accessibility

- Panel container uses `role="region"` with `aria-label="Variant manager"`.
- Collapse toggle button has `aria-expanded="true|false"` and `aria-controls` pointing to the panel body element id.
- VariantList uses `role="listbox"`, each VariantCard uses `role="option"`.
- Active variant card has `aria-selected="true"`.
- Delete button on control variant has `aria-disabled="true"` and `title="Control variant cannot be deleted"`.
- Inline name editing: on Enter commits the rename, on Escape cancels. Focus is managed — when entering edit mode, focus moves to the input; on commit/cancel, focus returns to the card.
- Traffic slider has `aria-label="Traffic percentage for {variant name}"`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-valuenow="{current value}"`.
- All color contrast ratios meet WCAG 2.1 AA on both light and dark backgrounds.
- PlanLimitBanner uses `role="alert"` so screen readers announce it on appearance.
- All interactive elements are keyboard navigable with visible focus rings: `focus-visible:ring-2 focus-visible:ring-blue-500`.
- Arrow keys navigate between variant cards within the listbox.

---

## Testing Plan

### Unit Tests

| # | Test | Description |
|---|------|-------------|
| 1 | Renders all variants | Mount with 3 variants, assert 3 VariantCards render with correct names |
| 2 | Control badge shown | Assert control variant displays "Control" badge |
| 3 | Non-control lacks badge | Assert non-control variants do not show "Control" badge |
| 4 | Delete disabled for control | Assert delete button on control variant has `aria-disabled="true"` |
| 5 | Delete enabled for non-control | Assert delete button on non-control variant is clickable |
| 6 | Add variant calls POST | Click "Add Variant", assert `fetch` called with `POST /api/campaigns/[id]/variants` |
| 7 | Add sends correct payload | Assert POST body contains `name` and `schemaJson` from active variant |
| 8 | Add disabled at plan limit | Mount with `variants.length === plan.limits.maxVariants`, assert button disabled |
| 9 | FREE plan locked state | Mount with FREE plan, assert locked message renders, no add button visible |
| 10 | abTesting disabled shows CTA | Mount with `features.abTesting === false`, assert "Upgrade" CTA shown |
| 11 | Traffic sum warning | Set traffic values summing to 90, assert red warning indicator on TrafficSummaryBar |
| 12 | Auto-rebalance on add | Simulate add response with 3 variants, assert each gets ~33% with control getting remainder |
| 13 | Auto-rebalance on delete | Simulate delete of 1 of 3 variants, assert remaining 2 rebalance to 50/50 |
| 14 | Inline rename saves | Click name, type "New Name", press Enter, assert PATCH called with `{ name: "New Name" }` |
| 15 | Rename cancel on Escape | Click name, type, press Escape, assert original name still displayed |
| 16 | Optimistic delete with rollback | Mock API 500 on delete, assert variant reappears and toast shown |
| 17 | Collapse hides body | Click collapse toggle, assert variant list not visible |
| 18 | Expand shows body | Click collapse toggle twice, assert variant list visible again |
| 19 | Active variant selection | Click a non-active card, assert `onActiveVariantChange` called with that variant id |

### Integration Tests

| # | Test | Description |
|---|------|-------------|
| 1 | Full CRUD flow | Create variant, rename it, adjust traffic, delete it — verify all API calls and final state |
| 2 | Plan upgrade transition | Start at limit on STARTER, change plan prop to GROWTH, verify add button becomes enabled |
| 3 | Slider-numeric sync | Drag slider to 60, verify numeric input shows 60; type 40 in numeric, verify slider at 40 |

---

## Anti-Patterns to Avoid

1. **Do NOT use `alert()` or `confirm()` dialogs.** Use inline confirmation and toast notifications only.
2. **Do NOT allow saving traffic percentages that do not sum to 100.** Validate client-side before calling PATCH.
3. **Do NOT hardcode plan limits in the component.** Always read from the `plan` prop resolved via `resolvePlan()`.
4. **Do NOT allow deleting the control variant.** The API blocks it, but the UI must also prevent the action visually.
5. **Do NOT use `any` types.** All variant data must be typed against the Prisma `Variant` model.
6. **Do NOT fetch variant data inside this component.** Variants are passed as props from the parent builder page.
7. **Do NOT use modals for rename or delete confirmation.** Keep all interactions inline within the card.
8. **Do NOT store traffic percentages in local state without persisting.** PATCH on blur/commit so data is never silently lost.
9. **Do NOT assume FREE plan allows 2 variants.** The correct limit is `FREE: maxVariants=1`. Only the single auto-created control variant exists on FREE.
10. **Do NOT skip the `abTesting` feature flag check.** Even if `maxVariants > 1`, the panel must independently verify `plan.features.abTesting === true`.

---

## Implementation Tasks

| # | Task | Type | Est |
|---|------|------|-----|
| 1 | Create `VariantManagerPanel.tsx` shell with props interface, `"use client"` directive, and empty render | component | S |
| 2 | Implement `VariantCard.tsx` — name display, control badge, traffic display, select highlight, delete button | component | M |
| 3 | Implement inline name editing in VariantCard: click-to-edit, Enter to save, Escape to cancel, focus management | component | S |
| 4 | Implement `TrafficSlider.tsx` — range input synced bidirectionally with numeric input, debounced onChange | component | M |
| 5 | Wire variant list rendering: map `variants` prop to `VariantCard[]` inside a scrollable flex column | wiring | S |
| 6 | Implement "Add Variant" button: POST to `/api/campaigns/[id]/variants`, loading spinner while pending | feature | M |
| 7 | Implement duplication logic: copy `schemaJson` from the currently active variant, generate name via `"Variant " + letter` | feature | S |
| 8 | Implement `rebalanceTraffic(variants: Variant[]): Variant[]` — equal split with `Math.floor(100/n)`, remainder to control | logic | S |
| 9 | Call `rebalanceTraffic` after add/delete, then PATCH all affected variants via `Promise.all` | wiring | M |
| 10 | Implement manual traffic adjustment: on slider/numeric change, update `pendingTraffic` state, validate sum | feature | M |
| 11 | Implement delete with inline confirmation: replace delete button with "Delete? Yes / No" text buttons | feature | S |
| 12 | Add plan limit check: disable "Add Variant" when `variants.length >= plan.limits.maxVariants`, show tooltip | feature | S |
| 13 | Add FREE plan / abTesting-disabled locked state with static message and "Upgrade Plan" CTA link | feature | S |
| 14 | Implement `PlanLimitBanner` — conditionally rendered at panel bottom when at variant cap | component | S |
| 15 | Implement `TrafficSummaryBar` — stacked horizontal color segments, green/red sum indicator | component | M |
| 16 | Implement optimistic UI for all mutations: immediate local state update, rollback on API error | feature | M |
| 17 | Wire toast notifications for API errors using existing project toast system | wiring | S |
| 18 | Implement collapse/expand toggle: `isCollapsed` state, chevron rotation animation, body visibility | feature | S |
| 19 | Wire `activeVariantId`: clicking a card calls `onActiveVariantChange(variantId)` prop callback | wiring | S |
| 20 | Add ARIA attributes: `role="region"`, `role="listbox"`, `role="option"`, `aria-selected`, `aria-expanded`, `aria-disabled` | a11y | S |
| 21 | Add keyboard navigation: arrow keys between cards in listbox, Enter to select, Tab to interactive elements | a11y | M |
| 22 | Write unit tests for VariantManagerPanel (19 tests per testing plan) | test | L |
| 23 | Write unit tests for TrafficSlider and TrafficSummaryBar components | test | M |
| 24 | Write integration test: full CRUD flow (create, rename, adjust traffic, delete) | test | M |
| 25 | Dark mode verification pass: confirm all states render correctly in both themes | polish | S |

**Total estimate:** ~8 story points

---

## Dev Notes

- The auto-rebalance logic on the existing API (variants route.ts line 60) uses `Math.floor(100 / variantCount)`. The remainder (`100 - Math.floor(100/n) * n`) must be assigned to the control variant. Mirror this logic client-side for optimistic updates so the UI matches what the server returns.
- When duplicating a variant, generate a default name like "Variant B", "Variant C", etc. Pattern: `"Variant " + String.fromCharCode(65 + variants.length)` where A represents the control.
- The `generatedBy` field should always be `"manual"` for variants created through this panel.
- Traffic percentage PATCH calls should be batched: when rebalancing affects N variants, fire N PATCH requests via `Promise.all`. If this becomes a performance bottleneck, consider adding a bulk-update endpoint later.
- The panel is positioned as a right sidebar (`w-72`) in the builder layout. Coordinate with the F.1 builder extraction layout to ensure it does not overlap the form editor or preview.
- `schemaVersion` should be copied as-is from the source variant when duplicating. Do not increment it — version bumps happen only when the schema format itself changes.
- The existing basic `<select>` dropdown at builder page.tsx lines 869-879 should be replaced by mounting `VariantManagerPanel` in the builder layout once F.1 extraction is complete (task 25 is just the mount-point wiring).

---

## References

| Resource | Location |
|----------|----------|
| Variant API handlers | `src/app/api/campaigns/[id]/variants/route.ts` |
| Plan definitions & limits | `src/lib/plans.ts` |
| RBAC helpers | `src/lib/rbac.ts` |
| Account context resolver | `src/lib/account.ts` |
| Variant Prisma model | `prisma/schema.prisma` lines 174–192 |
| Current builder page | `src/app/app/campaigns/[id]/builder/page.tsx` |
| Shared form logic | `packages/shared/forms/` |
| PRD (Gate F stories) | `docs/PRD.md` |

---

## Dev Agent Record

| Field | Value |
|-------|-------|
| Story | F-3: Builder Variant Manager Panel |
| Agent | — |
| Started | — |
| Completed | — |
| Blocked | Awaiting F.1 and F.2 completion |
| Commits | — |
| Test Results | — |
| Notes | — |
