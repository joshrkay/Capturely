# Story F.5: Builder Multi-Step Form Editor

Status: ready-for-dev

## Story

As a merchant,
I want to split my form into multiple steps,
so that I can reduce form abandonment by showing fields progressively.

## Acceptance Criteria

1. Multi-Step Editor is accessible as a builder mode/tab
2. Merchant can split form fields across numbered steps with drag-and-drop
3. Merchant can reorder steps via drag-and-drop
4. Merchant can assign/move fields between steps using `@dnd-kit`
5. Merchant can configure progress bar style (dots, bar, steps, none)
6. Step count is displayed and each step has an editable label
7. Preview shows step navigation (Next/Back buttons)
8. Multi-step config is persisted in the Variant's form schema JSON
9. Widget renders multi-step forms correctly at runtime
10. Backward compatibility: forms without `steps` render as single-step

## Tasks / Subtasks

- [ ] Extend `FormSchema` type in `packages/shared/forms/src/types.ts` (AC: 8, 10)
  - [ ] Add optional `steps?: Array<{ label: string; fieldIds: string[] }>` property
  - [ ] Add optional `progressBarStyle?: 'dots' | 'bar' | 'steps' | 'none'` property
  - [ ] Ensure `ManifestCampaign.variants` (type `Record<string, FormSchema>`) carries extended type
- [ ] Create `src/app/app/campaigns/[id]/builder/components/multi-step-editor.tsx` client component (AC: 1)
  - [ ] Step list sidebar with add/remove/reorder using `@dnd-kit/sortable` (AC: 2, 3)
  - [ ] Drag fields between steps using `@dnd-kit` `DndContext` with multiple droppable zones (AC: 4)
  - [ ] Progress bar style selector dropdown (AC: 5)
  - [ ] Inline step label editing with auto-focus on new steps (AC: 6)
  - [ ] "Add Step" button that creates an empty step with default label "Step N"
  - [ ] "Remove Step" button that moves orphaned fields back to previous step
  - [ ] Unassigned fields pool for fields not yet placed in any step
- [ ] Update form preview (`form-preview.tsx`) to render step navigation (AC: 7)
  - [ ] Next/Back buttons replace submit button on non-final steps
  - [ ] Progress bar component renders above form fields using selected style
  - [ ] Only fields belonging to current step are visible
- [ ] Update widget `packages/widget/src/form-renderer.ts` to handle multi-step forms (AC: 9)
  - [ ] Step state machine: `currentStep` index, `goNext()`, `goBack()` transitions
  - [ ] Render only fields for current step; hide others via `display: none`
  - [ ] Next/Back button injection replacing submit on non-final steps
  - [ ] Progress bar DOM injection based on `progressBarStyle`
  - [ ] Per-step validation: validate visible fields before advancing
- [ ] Wire save to existing PATCH `/api/campaigns/[id]/variants` with updated `schemaJson` (AC: 8)
- [ ] Backward compatibility: if `steps` is undefined, treat all fields as single step (AC: 10)

## Dev Notes

### Type Extension (packages/shared/forms/src/types.ts)

The `FormSchema` interface currently has `fields`, `style`, and `submitLabel`. Add two optional properties:

```typescript
export interface FormSchema {
  fields: FormField[];
  style?: FormStyle;
  submitLabel?: string;
  /** Multi-step configuration. Omit or set undefined for single-step forms. */
  steps?: Array<{ label: string; fieldIds: string[] }>;
  /** Progress indicator style. Only used when steps is defined. */
  progressBarStyle?: 'dots' | 'bar' | 'steps' | 'none';
}
```

No Prisma migration needed. The `schemaJson` column on Variant is already a `String` storing
arbitrary JSON, so the extended `FormSchema` is persisted as-is.

`ManifestCampaign.variants` is typed as `Record<string, FormSchema>` in the same file (line 103),
so the extended type flows through automatically to the widget manifest.

### Drag-and-Drop Implementation

`@dnd-kit` is already installed in the project. Use `DndContext` with multiple `useDroppable` zones
(one per step + one "unassigned" pool). Each field is a `useDraggable` item. On `onDragEnd`, move
the field's `fieldId` from the source step's `fieldIds` array to the destination step's array.

Step reordering uses `@dnd-kit/sortable` with `SortableContext` wrapping the step list sidebar.

### Widget Step State Machine

In `packages/widget/src/form-renderer.ts`, the `renderForm` function currently iterates all fields.
With multi-step support:

1. Check if `schema.steps` exists and has length > 1
2. If yes, initialize `currentStep = 0`
3. Group fields by step: each step's `fieldIds` maps to fields from `schema.fields`
4. Render all fields but set `display: none` on fields not in current step
5. Replace the submit button with "Next" on non-final steps; show "Back" + "Submit" on final step
6. `goNext()`: validate current step fields, increment `currentStep`, update visibility
7. `goBack()`: decrement `currentStep`, update visibility
8. Progress bar: create a `div` above the form with dots/bar/numbered-steps based on `progressBarStyle`

### Backward Compatibility

All existing forms have no `steps` property in their schema JSON. The editor, preview, and widget
must all check `if (!schema.steps || schema.steps.length === 0)` and fall through to the existing
single-step rendering path. Zero changes to existing campaign behavior.

### Builder Integration

The multi-step editor lives as a tab/panel alongside the existing field editor, style editor, and
variant manager. The parent builder page (`page.tsx`) passes the current variant's `FormSchema` and
receives updates via a callback like `onSchemaChange(updated: FormSchema)`.

### API Persistence

No new API endpoint needed. The existing PATCH `/api/campaigns/[id]/variants` endpoint accepts
`schemaJson` as a string. The builder serializes the full `FormSchema` (including `steps` and
`progressBarStyle`) to JSON before sending.

### Project Structure Notes

- New file: `src/app/app/campaigns/[id]/builder/components/multi-step-editor.tsx`
- Modified: `packages/shared/forms/src/types.ts` (add `steps`, `progressBarStyle` to `FormSchema`)
- Modified: `packages/widget/src/form-renderer.ts` (step state machine, progress bar rendering)
- Modified: `src/app/app/campaigns/[id]/builder/components/form-preview.tsx` (step navigation in preview)
- No new API routes; no Prisma migration

### Dependencies

- **BLOCKED BY:** F.3 (variant manager — needed to select which variant to edit steps for)
- **BLOCKED BY:** F.4 (preview must be updated to support step rendering)
- **BLOCKS:** Nothing

### References

- [Source: packages/shared/forms/src/types.ts#FormSchema — lines 62-66, extend here]
- [Source: packages/shared/forms/src/types.ts#ManifestCampaign — line 103, variants carry FormSchema]
- [Source: packages/widget/src/form-renderer.ts#renderForm — lines 13-150, add step logic]
- [Source: src/app/app/campaigns/[id]/builder/page.tsx — parent builder, wire tab]

### Testing Considerations

- Verify single-step forms continue to render identically (no regression)
- Verify dragging a field from Step 1 to Step 2 updates `fieldIds` correctly
- Verify removing a step redistributes its fields
- Verify widget Next/Back navigation cycles through steps
- Verify per-step validation prevents advancing with empty required fields
- Verify progress bar renders correctly for each of the four styles
- Verify schema round-trips through save/load without data loss

## Dev Agent Record

### Agent Model Used
### Change Log
### Debug Log References
### Completion Notes List
### Change Summary
### File List
