# Story F.2: Builder Display Settings

Status: ready-for-dev

## Story

As a merchant,
I want to configure targeting rules, triggers, frequency caps, and device targeting in the builder,
so that my campaigns show to the right visitors at the right time.

## Acceptance Criteria

1. Display Settings panel is accessible as a tab in the campaign builder
2. Merchant can add URL targeting rules (all pages, equals, contains, starts_with, does_not_contain)
3. Merchant can select trigger type (immediate, delay, scroll %, exit intent, click selector)
4. Merchant can configure trigger parameters (delay ms, scroll %, CSS selector)
5. Merchant can set frequency caps (max shows, per session, every N days)
6. Merchant can target by device type (desktop, mobile, tablet, all)
7. Settings are persisted to the Campaign model fields (`targetingJson`, `triggerJson`, `frequencyJson`)
8. All inputs validate against shared types (`TargetingRule`, `TriggerConfig`, `FrequencyConfig`)

## Tasks / Subtasks

- [ ] Create `src/app/app/campaigns/[id]/builder/components/display-settings.tsx` client component (AC: 1)
  - [ ] URL targeting rules builder with add/remove rows (AC: 2)
  - [ ] Trigger type selector with conditional parameter inputs (AC: 3, 4)
  - [ ] Frequency capping controls (AC: 5)
  - [ ] Device targeting toggles (AC: 6)
- [ ] Wire state to campaign update API (AC: 7)
- [ ] Validate inputs against shared types from `packages/shared/forms/types.ts` (AC: 8)
- [ ] Add Zod schemas for targeting, trigger, and frequency on PATCH `/api/campaigns/[id]` (AC: 7)

## Dev Notes

- Reference Figma: `components/builder/display-settings.tsx`
- Shared types already defined: `TargetingRule`, `TriggerConfig`, `FrequencyConfig` in `packages/shared/forms/types.ts`
- Widget already implements targeting (`packages/widget/targeting.ts`), triggers (`triggers.ts`), and frequency (`frequency.ts`) — this UI configures those runtime behaviors
- Campaign model already has JSON fields for these configs

### Project Structure Notes

- New file: `src/app/app/campaigns/[id]/builder/components/display-settings.tsx`
- Touches: builder page layout to add Display tab

### References

- [Source: packages/shared/forms/types.ts#TargetingRule, TriggerConfig, FrequencyConfig]
- [Source: packages/widget/targeting.ts, triggers.ts, frequency.ts]
- [Source: Figma Make — components/builder/display-settings.tsx]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
