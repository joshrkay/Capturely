# Story F.2: Builder Display Settings

Status: ready-for-dev
Points: 5
Gate: F (Campaign Builder)

---

## Story

**As a** merchant building a campaign,
**I want to** configure URL targeting rules, trigger behavior, frequency caps, device targeting, and scheduling in a dedicated Display Settings panel,
**so that** my campaigns show to the right visitors, on the right devices, at the right time.

---

## Dependencies

| Direction | Story | Detail |
|-----------|-------|--------|
| BLOCKS | F.3 (Variant Manager) | Variant Manager assumes settings are extracted into their own component |
| BLOCKED BY | None | All prerequisite models, API routes, and shared types already exist |
| USES | Shared types | `TargetingRule`, `TriggerConfig`, `FrequencyConfig` from `packages/shared/forms/src/types.ts` |
| USES | Campaign PATCH API | `src/app/api/campaigns/[id]/route.ts` already accepts `targetingJson`, `triggerJson`, `frequencyJson` |

---

## Existing Code Inventory

### Source to extract
- **File:** `src/app/app/campaigns/[id]/builder/page.tsx` lines 469-589
- **Function:** `CampaignSettingsPanel`
- **Current props:** `{ campaign: Campaign; onUpdate: (updates: Record<string, unknown>) => void }`
- **Bug at line 476:** `JSON.parse(campaign.triggerJson)` can throw on malformed JSON; needs safe parse helper

### Current panel capabilities (to preserve)
1. URL targeting select: `all | equals | contains | starts_with | does_not_contain` with conditional text input
2. Trigger select: `immediate | delay | scroll | exit_intent | click` with conditional inputs (`delayMs`, `scrollPercent`, `clickSelector`)
3. Frequency controls: `maxShows` (number), `everyDays` (number), `perSession` (checkbox)

### Shared types (already defined)
- `TargetingRule` — `{ type, value? }`
- `TriggerConfig` — `{ type, delayMs?, scrollPercent?, clickSelector? }`
- `FrequencyConfig` — `{ perSession?, everyDays?, maxShows? }`

### Widget runtime files (read-only reference)
- `packages/widget/targeting.ts` — evaluates `TargetingRule` against current URL
- `packages/widget/triggers.ts` — attaches DOM listeners per `TriggerConfig`
- `packages/widget/frequency.ts` — reads/writes localStorage per `FrequencyConfig`

### API contract (already deployed)
- `PATCH /api/campaigns/[id]` at `src/app/api/campaigns/[id]/route.ts`

---

## Acceptance Criteria

1. `CampaignSettingsPanel` is extracted from builder `page.tsx` into `src/app/app/campaigns/[id]/builder/components/display-settings.tsx` as a `"use client"` component
2. Builder `page.tsx` imports the new component; no functional regression after extraction
3. A `safeJsonParse<T>(json: string | null, fallback: T): T` helper is used for all JSON field parsing (no uncaught throws)
4. Merchant can add **multiple** URL targeting rules (add/remove rows); existing single-rule data migrates seamlessly
5. Each targeting rule row has type select + conditional value input (hidden when type is `all`)
6. Merchant can select trigger type with conditional parameter inputs (delay ms, scroll %, CSS selector)
7. Delay input validates `>= 0`; scroll input validates `0-100`; click selector is non-empty when selected
8. Merchant can set frequency caps: max shows, every N days, once per session
9. Merchant can select device targeting: `all | desktop | mobile | tablet` (new)
10. Merchant can set scheduling: optional start date and optional end date with date pickers (new)
11. End date must be after start date when both are provided
12. All settings auto-save via `onUpdate` callback (existing debounced PATCH pattern)
13. Panel renders correctly in dark mode
14. All interactive elements are keyboard-navigable and have accessible labels

---

## API Contracts

### PATCH `/api/campaigns/[id]`

**Existing Zod schema** (no changes required for MVP; `targetingJson` already accepts any valid JSON string):

```ts
const updateCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  status: z.enum(["draft", "published", "paused", "archived"]).optional(),
  targetingJson: z.string().optional(),
  triggerJson: z.string().optional(),
  frequencyJson: z.string().optional(),
  webhookUrl: z.string().url().optional().nullable(),
  autoOptimize: z.boolean().optional(),
});
```

**Payload shapes inside the JSON strings:**

```ts
// targetingJson — now supports array for multi-rule
{
  rules: TargetingRule[];        // [{type:"contains", value:"/products"}]
  device?: DeviceTarget;         // "all" | "desktop" | "mobile" | "tablet"
  schedule?: {
    startDate?: string;          // ISO 8601 date
    endDate?: string;            // ISO 8601 date
  };
}

// Backward compat: if targetingJson parses to a plain TargetingRule (no `rules` key),
// normalize it to { rules: [parsedRule] }

// triggerJson — unchanged
TriggerConfig

// frequencyJson — unchanged
FrequencyConfig
```

---

## Component Architecture

```
display-settings.tsx ("use client")
  props: { campaign: Campaign; onUpdate: (updates: Record<string, unknown>) => void }
  internal state: derived from safeJsonParse of campaign JSON fields
  sections:
    TargetingRulesSection  (local sub-component)
      TargetingRuleRow x N
      [+ Add Rule] button
    DeviceTargetingSection (local sub-component)
    TriggerSection         (local sub-component)
    FrequencySection       (local sub-component)
    SchedulingSection      (local sub-component)
```

**Helper (co-located or in `lib/`):**
```ts
function safeJsonParse<T>(json: string | null | undefined, fallback: T): T
```

---

## UI States

| State | Behavior |
|-------|----------|
| Empty / new campaign | All fields show defaults: targeting `all`, trigger `immediate`, no frequency caps, device `all`, no schedule |
| Malformed JSON in DB | `safeJsonParse` returns fallback; panel renders defaults; first edit overwrites with valid JSON |
| Single legacy targeting rule | Normalized to `{ rules: [rule] }` on parse; saved back in new format on any edit |
| Multiple targeting rules | Each row independently editable; remove button on rows when count > 1 |
| Schedule with only start | End date empty, no validation error |
| Schedule with end before start | Inline validation error, `onUpdate` not called |

---

## Design System

**Inputs:**
```
className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
```

**Labels:**
```
className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
```

**Section headings:**
```
className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
```

**Add/Remove row buttons:** ghost style, `text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400`

**Inline validation error:** `text-xs text-red-500 mt-0.5`

---

## Accessibility

- All `<select>` and `<input>` elements must have associated `<label>` elements (via `htmlFor`/`id`)
- Targeting rule rows use `aria-label="Targeting rule {n}"` on the container
- Remove-rule button: `aria-label="Remove targeting rule {n}"`
- Add-rule button: clear text label "Add targeting rule"
- Date inputs use `type="date"` for native browser date picker support
- Focus order follows visual order: targeting -> device -> trigger -> frequency -> scheduling

---

## Testing Plan

| Type | Scope | Detail |
|------|-------|--------|
| Unit | `safeJsonParse` | Valid JSON, malformed JSON, null, undefined, empty string |
| Unit | Legacy targeting normalization | Single `TargetingRule` object normalizes to `{ rules: [rule] }` |
| Component | Render with defaults | New campaign renders all defaults correctly |
| Component | Targeting multi-rule | Add rule, edit rule, remove rule; verify `onUpdate` payload |
| Component | Trigger conditional inputs | Switching trigger type shows/hides correct parameter input |
| Component | Frequency controls | Toggle perSession, set maxShows, set everyDays |
| Component | Device targeting | Select each option, verify payload |
| Component | Scheduling validation | End before start shows error; valid range calls onUpdate |
| Integration | Extraction regression | Builder page still works after extraction; tab renders panel |
| E2E | Full round-trip | Configure all settings, save, reload, verify persistence |

---

## Anti-Patterns to Avoid

- **Do NOT** use `JSON.parse()` without try/catch — always use `safeJsonParse`
- **Do NOT** store derived state in `useState` when it can be computed from props (use `useMemo`)
- **Do NOT** send full campaign object on update — only send changed JSON fields
- **Do NOT** break the existing single-rule data shape — normalize on read, save in new format on write
- **Do NOT** add new DB columns for device/schedule — store inside `targetingJson`
- **Do NOT** import widget runtime code into the dashboard — types only via `packages/shared/forms`

---

## Tasks

- [ ] 1. Create `safeJsonParse<T>` helper function in `src/lib/utils.ts` (or co-locate in display-settings) (AC: 3)
- [ ] 2. Create `DeviceTarget` type alias (`"all" | "desktop" | "mobile" | "tablet"`) in `packages/shared/forms/src/types.ts` (AC: 9)
- [ ] 3. Create `TargetingConfig` interface with `{ rules: TargetingRule[]; device?: DeviceTarget; schedule?: { startDate?: string; endDate?: string } }` in shared types (AC: 4, 9, 10)
- [ ] 4. Create `normalizeTargetingJson` helper that converts legacy single-rule format to `TargetingConfig` (AC: 4)
- [ ] 5. Create `src/app/app/campaigns/[id]/builder/components/display-settings.tsx` with component skeleton and props interface (AC: 1)
- [ ] 6. Implement `TargetingRulesSection` — multi-rule list with add/remove (AC: 4, 5)
- [ ] 7. Implement `DeviceTargetingSection` — radio or select for device type (AC: 9)
- [ ] 8. Implement `TriggerSection` — type select with conditional inputs for delay, scroll, click (AC: 6, 7)
- [ ] 9. Implement `FrequencySection` — maxShows, everyDays, perSession controls (AC: 8)
- [ ] 10. Implement `SchedulingSection` — start/end date inputs with validation (AC: 10, 11)
- [ ] 11. Wire all sections to `onUpdate` callback with correct JSON serialization (AC: 12)
- [ ] 12. Replace `CampaignSettingsPanel` in `page.tsx` with import of new component (AC: 2)
- [ ] 13. Remove old `CampaignSettingsPanel` function from `page.tsx` (AC: 2)
- [ ] 14. Apply design system classes to all inputs, labels, sections (AC: 13)
- [ ] 15. Add accessible labels, `htmlFor`/`id` pairs, and `aria-label` attributes (AC: 14)
- [ ] 16. Write unit tests for `safeJsonParse` and `normalizeTargetingJson`
- [ ] 17. Write component tests for each section (targeting, device, trigger, frequency, scheduling)
- [ ] 18. Manual smoke test: create campaign, configure all settings, reload, verify persistence
- [ ] 19. Manual dark mode test across all sections

---

## Dev Notes

- The `ManifestCampaign` type in shared types currently has `targeting: TargetingRule` (singular). The manifest builder will need to handle the new multi-rule format, but that is outside this story's scope. The widget targeting logic can iterate rules in a follow-up.
- The `campaign` prop type comes from Prisma's generated `Campaign` model. The `triggerJson`, `targetingJson`, and `frequencyJson` fields are `string | null`.
- Date inputs should use `type="date"` which gives ISO format (`YYYY-MM-DD`) natively. Store as ISO strings in the JSON.
- The existing builder page already has a tab/panel pattern. This component replaces one tab's content.
- Keep the component file under ~300 lines. If it grows larger, split sections into separate files under the same `components/` directory.

---

## References

- [Source: `src/app/app/campaigns/[id]/builder/page.tsx` lines 469-589 — current implementation to extract]
- [Source: `packages/shared/forms/src/types.ts` — `TargetingRule`, `TriggerConfig`, `FrequencyConfig`]
- [Source: `src/app/api/campaigns/[id]/route.ts` — PATCH route with Zod schema]
- [Source: `packages/widget/targeting.ts`, `triggers.ts`, `frequency.ts` — runtime consumers]
- [Figma: components/builder/display-settings.tsx]

---

## Dev Agent Record

### Agent Model Used
(to be filled during implementation)

### Debug Log References
(to be filled during implementation)

### Completion Notes List
(to be filled during implementation)

### Change Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-23 | Enhanced story from skeleton to full BMAD spec | Added multi-rule targeting, device targeting, scheduling, extraction plan, safe parse, accessibility, testing, full task list |

### File List
| File | Action |
|------|--------|
| `src/app/app/campaigns/[id]/builder/components/display-settings.tsx` | CREATE |
| `src/app/app/campaigns/[id]/builder/page.tsx` | MODIFY (remove lines 469-589, add import) |
| `packages/shared/forms/src/types.ts` | MODIFY (add `DeviceTarget`, `TargetingConfig`) |
| `src/lib/utils.ts` | MODIFY or CREATE (add `safeJsonParse`) |
