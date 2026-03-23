# Story F.5: Builder Multi-Step Form Editor

Status: ready-for-dev

## Story

As a merchant,
I want to split my form into multiple steps,
so that I can reduce form abandonment by showing fields progressively.

## Acceptance Criteria

1. Multi-Step Editor is accessible as a builder mode/tab
2. Merchant can split form fields across numbered steps
3. Merchant can reorder steps via drag-and-drop
4. Merchant can assign/move fields between steps
5. Merchant can configure progress bar style (dots, bar, steps, none)
6. Step count is displayed and each step has a label
7. Preview shows step navigation (Next/Back buttons)
8. Multi-step config is persisted in the Variant's form schema
9. Widget renders multi-step forms correctly at runtime

## Tasks / Subtasks

- [ ] Create `src/app/app/campaigns/[id]/builder/components/multi-step-editor.tsx` client component (AC: 1)
  - [ ] Step list sidebar with add/remove/reorder (AC: 2, 3)
  - [ ] Drag fields between steps (AC: 4)
  - [ ] Progress bar style selector (AC: 5)
  - [ ] Step label editing (AC: 6)
- [ ] Update form preview to render step navigation (AC: 7)
- [ ] Extend FormSchema type to include `steps` and `progressBarStyle` (AC: 8)
- [ ] Update widget form-renderer to handle multi-step forms (AC: 9)
- [ ] Add migration if schema changes are needed (AC: 8)

## Dev Notes

- Reference Figma: `components/builder/multi-step-editor.tsx`
- This extends the existing FormSchema type — needs careful backward compatibility
- Widget `form-renderer.ts` will need a step state machine (current step, next/back navigation)
- Consider a `MultiStepConfig` type: `{ steps: Array<{ label: string, fieldIds: string[] }>, progressBar: 'dots' | 'bar' | 'steps' | 'none' }`
- Single-step forms should work exactly as before (multi-step is opt-in)

### Project Structure Notes

- New file: `src/app/app/campaigns/[id]/builder/components/multi-step-editor.tsx`
- Touches: `packages/shared/forms/types.ts`, `packages/widget/form-renderer.ts`

### References

- [Source: packages/shared/forms/types.ts#FormSchema]
- [Source: packages/widget/form-renderer.ts]
- [Source: Figma Make — components/builder/multi-step-editor.tsx]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
