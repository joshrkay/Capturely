# Story G.6: Statistical Significance Calculator

Status: ready-for-dev

## Story

As a merchant,
I want to see statistical significance indicators on my A/B test results,
so that I can confidently decide which form variant is the winner.

## Acceptance Criteria

1. Statistical significance component is displayed on campaign analytics when A/B testing is active
2. Shows confidence level (%) for each variant comparison
3. Shows required sample size to reach significance
4. Shows current sample size per variant
5. Declares a "winner" when confidence exceeds 95%
6. Shows "Not enough data" state when sample size is insufficient
7. Uses standard two-proportion z-test for conversion rate comparison
8. Updates in real-time with analytics data refresh

## Tasks / Subtasks

- [ ] Create `src/app/app/campaigns/[id]/analytics/statistical-significance.tsx` client component (AC: 1)
  - [ ] Variant comparison table (control vs challenger) (AC: 2)
  - [ ] Confidence level bar/indicator per comparison (AC: 2)
  - [ ] Required vs current sample size display (AC: 3, 4)
  - [ ] Winner badge when confidence ≥ 95% (AC: 5)
  - [ ] "Insufficient data" state (AC: 6)
- [ ] Implement z-test calculation utility in `src/lib/statistics.ts` (AC: 7)
  - [ ] `calculateSignificance(controlConversions, controlSamples, variantConversions, variantSamples)`
  - [ ] `requiredSampleSize(baselineRate, minimumDetectableEffect, power, significance)`
  - [ ] Return: confidence %, p-value, isSignificant boolean
- [ ] Integrate into campaign analytics page (AC: 1, 8)
- [ ] Add unit tests for statistical calculations (AC: 7)

## Dev Notes

- Reference Figma: `components/statistical-significance.tsx`
- Two-proportion z-test formula is standard — implement from scratch (no heavy stats library needed)
- Minimum detectable effect: default to 5% relative improvement
- Power: default to 80%
- Significance level: default to 95% (α = 0.05)
- This pairs with the Variant Manager (F.3) and Campaign Analytics

### Project Structure Notes

- New files: `src/app/app/campaigns/[id]/analytics/statistical-significance.tsx`, `src/lib/statistics.ts`
- Touches: `src/app/app/campaigns/[id]/analytics/page.tsx`

### References

- [Source: Figma Make — components/statistical-significance.tsx]
- [Source: src/app/app/campaigns/[id]/analytics/page.tsx — existing analytics]
- [Source: docs/BUILT-FEATURES.md#Statistical Significance]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
