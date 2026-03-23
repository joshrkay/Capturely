# Story F.3: Builder Variant Manager

Status: ready-for-dev

## Story

As a merchant,
I want to create and manage A/B test variants in the campaign builder,
so that I can test different form designs and optimize for conversions.

## Acceptance Criteria

1. Variant Manager panel is accessible as a tab/section in the campaign builder
2. Merchant can view a list of all variants with name, traffic allocation %, and control badge
3. Merchant can create a new variant (duplicate from an existing variant's schemaJson)
4. Merchant can delete non-control variants (control variant delete is blocked)
5. Merchant can adjust traffic allocation — percentages must sum to 100%
6. Merchant can rename variants inline
7. Merchant can switch between variants to edit their fields/styles independently
8. Variant count is enforced by plan limits (FREE=1, STARTER=2, GROWTH=5, ENTERPRISE=unlimited)
9. A/B testing feature requires STARTER+ plan (FREE plan: abTesting=false)
10. Changes are persisted via `/api/campaigns/[id]/variants` endpoints
11. Traffic percentages auto-rebalance when a variant is added or deleted

## Dependencies

| Direction | Story | Description |
|-----------|-------|-------------|
| BLOCKED BY | F.1 | Builder Style Editor extraction must complete first |
| BLOCKED BY | F.2 | Builder Display Settings extraction must complete first |
| BLOCKS | F.5 | Multi-step editor depends on variant switching context |
| BLOCKS | F.6 | Export modal needs variant selection |

## Tasks / Subtasks

### T1: Create Variant Manager Component
- [ ] Create `src/app/app/campaigns/[id]/builder/components/variant-manager.tsx` as `"use client"` component (AC: 1)
- [ ] Variant list displaying name, traffic %, isControl badge for each variant (AC: 2)
- [ ] Active variant highlight / selection state for switching builder context (AC: 7)
- [ ] Inline rename input field with blur/enter to save via PATCH (AC: 6)

### T2: Add Variant (Duplicate)
- [ ] "Add Variant" button that duplicates the currently selected variant's schemaJson (AC: 3)
- [ ] POST to `/api/campaigns/[id]/variants` with `{ name, schemaJson }` from source variant (AC: 10)
- [ ] Disable button and show upgrade prompt when variant count >= plan limit (AC: 8)
- [ ] Disable entire A/B section for FREE plan (abTesting=false) with upgrade CTA (AC: 9)
- [ ] After add, refresh variant list and select the new variant (AC: 7)

### T3: Delete Variant
- [ ] Delete button on each non-control variant row (AC: 4)
- [ ] Confirmation dialog before delete (destructive action)
- [ ] **NEW**: Create `DELETE /api/campaigns/[id]/variants/[variantId]` endpoint (AC: 10)
- [ ] Block deletion of control variant (isControl=true) — hide or disable button (AC: 4)
- [ ] After delete, auto-rebalance remaining traffic and select control variant (AC: 11)

### T4: Traffic Allocation
- [ ] Traffic percentage inputs (sliders or number inputs) per variant (AC: 5)
- [ ] Client-side validation: all percentages must sum to 100% (AC: 5)
- [ ] Auto-rebalance helper: `Math.floor(100 / variantCount)` with remainder to control (AC: 11)
- [ ] "Rebalance Evenly" button for quick equal distribution (AC: 11)
- [ ] Persist via PATCH to `/api/campaigns/[id]/variants` with `{ variantId, trafficPercentage }` (AC: 10)

### T5: Wire to Builder Page
- [ ] Replace existing basic variant selector (builder page lines 869-879) with VariantManager component
- [ ] Pass `campaign.variants`, `selectedVariantId`, `onVariantChange` props
- [ ] Integrate with builder state so switching variants loads different schemaJson

### T6: Create DELETE Variant API Endpoint
- [ ] New file: `src/app/api/campaigns/[id]/variants/[variantId]/route.ts`
- [ ] `withAccountContext()` + `canManageCampaigns()` RBAC check
- [ ] Validate variantId belongs to the campaign and campaign belongs to account
- [ ] Block deletion if variant.isControl === true → 403
- [ ] Block deletion if campaign has only 1 variant → 400
- [ ] Delete variant, then auto-rebalance remaining variants' traffic percentages
- [ ] Return 200 with updated variants list

## API Contract

### Existing: POST `/api/campaigns/[id]/variants`
```
Request:  { name: string (1-100 chars), schemaJson: string (min 2 chars) }
Response: 201 { variant }
Errors:   403 PLAN_LIMIT (variant count >= plan.limits.maxVariants)
          403 FORBIDDEN (no canManageCampaigns)
Auto:     Rebalances traffic — Math.floor(100 / variantCount)
```

### Existing: PATCH `/api/campaigns/[id]/variants`
```
Request:  { variantId: string, name?: string, schemaJson?: string,
            trafficPercentage?: number, isControl?: boolean }
Response: 200 { variant }
Errors:   403 FORBIDDEN
```

### NEW: DELETE `/api/campaigns/[id]/variants/[variantId]`
```
Request:  (variantId in URL path)
Response: 200 { variants: Variant[] } (remaining variants with rebalanced traffic)
Errors:   403 FORBIDDEN (no RBAC or isControl=true)
          400 CANNOT_DELETE_LAST (only 1 variant remains)
          404 NOT_FOUND (variant not in campaign)
```

## Data Model Reference

```prisma
// prisma/schema.prisma lines 174-192
model Variant {
  id                String   @id @default(cuid())
  campaignId        String
  name              String
  isControl         Boolean  @default(false)
  trafficPercentage Int      @default(100)
  schemaJson        String
  schemaVersion     Int      @default(1)
  generatedBy       String?
  campaign          Campaign @relation(fields: [campaignId], references: [id])
}
```

## Plan Limits Reference

| Plan       | maxVariants | abTesting |
|------------|-------------|-----------|
| FREE       | 1           | false     |
| STARTER    | 2           | true      |
| GROWTH     | 5           | true      |
| ENTERPRISE | Infinity    | true      |

**Important:** FREE plan allows only 1 variant (the control). A/B testing is gated behind `abTesting` feature flag — FREE users should see an upgrade prompt, not the variant manager controls.

## Component Interface

```typescript
interface VariantManagerProps {
  campaignId: string;
  variants: Variant[];
  selectedVariantId: string;
  planKey: PlanKey;
  onVariantChange: (variantId: string) => void;
  onVariantsUpdate: (variants: Variant[]) => void;
}
```

## Dev Notes

- **NEW component** — no existing code to extract; this is built from scratch
- Builder page currently has a basic `<select>` variant selector at lines 869-879 that renders `campaign.variants.map(v => <option>{v.name} ({v.trafficPercentage}%)</option>)` — replace this entirely
- Variant CRUD API exists at `src/app/api/campaigns/[id]/variants/route.ts` (POST + PATCH)
- DELETE endpoint does NOT exist yet — must be created as part of this story (Task T6)
- "Duplicate variant" means calling POST with the `schemaJson` copied from the source variant
- Plan limits in `src/lib/plans.ts` — use `resolvePlan()` to get `maxVariants` and `abTesting` feature flag
- Control variant (isControl=true) is auto-created on campaign creation — never deletable
- Traffic rebalance on add already exists server-side (line 60): `Math.floor(100 / variantCount)` — client should mirror this logic optimistically
- Remainder from floor division should go to the control variant (e.g., 3 variants = 34/33/33)
- Use `"use client"` directive — this component needs interactive inputs and local state

### Existing Code to Replace

Builder page lines 869-879 — the basic `<select>` dropdown:
```tsx
<select>
  {campaign.variants.map(v => (
    <option>{v.name} ({v.trafficPercentage}%)</option>
  ))}
</select>
```

This is replaced by the full `<VariantManager />` component.

### Project Structure Notes

- **New file:** `src/app/app/campaigns/[id]/builder/components/variant-manager.tsx`
- **New file:** `src/app/api/campaigns/[id]/variants/[variantId]/route.ts` (DELETE endpoint)
- **Touches:** `src/app/app/campaigns/[id]/builder/page.tsx` (replace select with VariantManager)

### Error Handling

- POST 403 PLAN_LIMIT → show "Upgrade to add more variants" toast with link to `/app/billing`
- DELETE 403 on control → should never happen (button hidden), but handle gracefully
- Network errors → show retry toast, do not remove variant from local state until confirmed
- Optimistic updates for rename and traffic adjustment; rollback on error

### Testing Considerations

- Verify control variant cannot be deleted (UI hides button + API blocks)
- Verify plan limits: FREE user cannot add variants (capped at 1)
- Verify traffic always sums to 100% after add, delete, and manual adjustment
- Verify duplicate copies schemaJson correctly from source variant
- Verify auto-rebalance distributes evenly with remainder to control
- Verify FREE plan shows upgrade CTA instead of variant controls

### References

- [Source: src/app/api/campaigns/[id]/variants/route.ts — POST/PATCH endpoints]
- [Source: src/lib/plans.ts — resolvePlan(), PlanKey, maxVariants, abTesting]
- [Source: prisma/schema.prisma lines 174-192 — Variant model]
- [Source: src/app/app/campaigns/[id]/builder/page.tsx lines 869-879 — existing select]
- [Source: src/lib/account.ts — withAccountContext()]
- [Source: src/lib/rbac.ts — canManageCampaigns()]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
