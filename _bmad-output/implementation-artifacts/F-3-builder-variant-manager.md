# Story F.3: Builder Variant Manager

Status: ready-for-dev

## Story

As a merchant,
I want to create and manage A/B test variants in the campaign builder,
so that I can test different form designs and optimize for conversions.

## Acceptance Criteria

1. Variant Manager panel is accessible as a tab in the campaign builder
2. Merchant can view a list of all variants with name and traffic allocation %
3. Merchant can create a new variant (duplicated from an existing one)
4. Merchant can delete non-Control variants
5. Merchant can adjust traffic allocation via sliders (must sum to 100%)
6. Merchant can rename variants
7. Merchant can switch between variants to edit their fields/styles independently
8. Variant count is enforced by plan limits (free: 2, starter: 3, growth: 5, enterprise: unlimited)
9. Changes are persisted via `/api/campaigns/[id]/variants` endpoints

## Tasks / Subtasks

- [ ] Create `src/app/app/campaigns/[id]/builder/components/variant-manager.tsx` client component (AC: 1)
  - [ ] Variant list with name, traffic %, and status indicators (AC: 2)
  - [ ] "Add Variant" button that duplicates from selected variant (AC: 3)
  - [ ] Delete button (disabled for Control variant) (AC: 4)
  - [ ] Traffic allocation sliders with auto-balancing (AC: 5)
  - [ ] Inline rename input (AC: 6)
  - [ ] Variant selection to switch builder context (AC: 7)
- [ ] Fetch plan limits and enforce variant cap (AC: 8)
- [ ] Wire to existing variant CRUD APIs (AC: 9)
- [ ] Add traffic allocation validation (sum = 100%) on API (AC: 5)

## Dev Notes

- Reference Figma: `components/builder/variant-manager.tsx`
- Variant CRUD API already exists: `POST/GET /api/campaigns/[id]/variants`
- Plan limits defined in `src/lib/plans.ts` — use `resolvePlan()` to get variant cap
- Control variant is auto-created on campaign creation — never deletable
- Traffic weights stored on Variant model

### Project Structure Notes

- New file: `src/app/app/campaigns/[id]/builder/components/variant-manager.tsx`
- Touches: builder page layout to add Variants tab

### References

- [Source: src/app/api/campaigns/[id]/variants/route.ts]
- [Source: src/lib/plans.ts#resolvePlan]
- [Source: prisma/schema.prisma#Variant]
- [Source: Figma Make — components/builder/variant-manager.tsx]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
