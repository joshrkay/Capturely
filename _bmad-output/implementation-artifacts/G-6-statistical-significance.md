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

## Dependencies

| Direction | Story | Description |
|-----------|-------|-------------|
| BLOCKED BY | Nothing | Tier 0 — no blockers |
| BLOCKS | Nothing | |

## Tasks / Subtasks

### Task 1: Implement `src/lib/statistics.ts` — pure math utility (AC: 7)

- [ ] Create `src/lib/statistics.ts` with zero external dependencies
- [ ] Implement `normalCDF(x: number): number` internal helper:
  - Taylor series approximation of the standard normal cumulative distribution function
  - Uses Abramowitz & Stegun approximation (error < 7.5e-8):
    ```ts
    // For x >= 0: 1 - pdf(x) * (a1*t + a2*t^2 + a3*t^3 + a4*t^4 + a5*t^5)
    // where t = 1 / (1 + 0.2316419 * x)
    // For x < 0: 1 - normalCDF(-x)
    ```
  - Not exported (internal helper only)
- [ ] Implement `calculateSignificance()`:
  ```ts
  interface SignificanceResult {
    zScore: number;
    pValue: number;         // two-tailed
    confidence: number;     // 1 - pValue, as percentage (0-100)
    isSignificant: boolean; // confidence >= 95 (i.e., pValue <= 0.05)
    winner: "control" | "variant" | null;
    controlRate: number;    // conversion rate as decimal
    variantRate: number;    // conversion rate as decimal
    relativeLift: number;   // (variantRate - controlRate) / controlRate, as percentage
  }

  function calculateSignificance(
    controlConversions: number,
    controlImpressions: number,
    variantConversions: number,
    variantImpressions: number,
  ): SignificanceResult
  ```
  - Two-proportion z-test formula:
    ```
    p1 = controlConversions / controlImpressions
    p2 = variantConversions / variantImpressions
    p_pool = (controlConversions + variantConversions) / (controlImpressions + variantImpressions)
    z = (p1 - p2) / sqrt(p_pool * (1 - p_pool) * (1/controlImpressions + 1/variantImpressions))
    pValue = 2 * (1 - normalCDF(abs(z)))   // two-tailed test
    ```
  - Guard against division by zero: if either impressions count is 0, return neutral result with `winner: null`, `confidence: 0`, `isSignificant: false`
  - Guard against `p_pool === 0` or `p_pool === 1` (no variance): return neutral result
  - `winner` is determined only when `isSignificant === true`: higher conversion rate wins
- [ ] Implement `requiredSampleSize()`:
  ```ts
  function requiredSampleSize(
    baselineRate: number,     // e.g., 0.05 for 5% conversion rate
    mde: number,              // minimum detectable effect, relative (default 0.05 = 5%)
    power: number = 0.80,     // statistical power
    significance: number = 0.05,  // alpha level
  ): number
  ```
  - Formula: `n = (z_alpha/2 + z_beta)^2 * (p1*(1-p1) + p2*(1-p2)) / (p1 - p2)^2`
    where `p1 = baselineRate`, `p2 = baselineRate * (1 + mde)`
  - Uses inverse normal CDF values: `z_alpha/2` from significance, `z_beta` from power
  - Hardcoded lookup for common values to avoid implementing inverse CDF:
    ```ts
    const Z_VALUES: Record<string, number> = {
      "0.01": 2.576,  // 99% confidence
      "0.05": 1.960,  // 95% confidence
      "0.10": 1.645,  // 90% confidence
    };
    const POWER_Z: Record<string, number> = {
      "0.80": 0.842,
      "0.90": 1.282,
      "0.95": 1.645,
    };
    ```
  - Returns `Math.ceil(n)` per group (total sample = 2 * n for two variants)
  - Guard: if `baselineRate <= 0` or `mde <= 0`, return `Infinity`
- [ ] Export only `calculateSignificance` and `requiredSampleSize` (not `normalCDF`)

### Task 2: Build UI component (AC: 1, 2, 3, 4, 5, 6)

- [ ] Create `src/app/app/campaigns/[id]/analytics/statistical-significance.tsx` as a `"use client"` component
- [ ] Define props interface:
  ```ts
  interface VariantData {
    id: string;
    name: string;          // e.g., "Control", "Variant A"
    impressions: number;
    conversions: number;
  }

  interface StatisticalSignificanceProps {
    control: VariantData;
    challengers: VariantData[];   // one or more challenger variants
  }
  ```
- [ ] Variant comparison table:
  - One row per challenger vs control comparison
  - Columns: Variant Name | Impressions | Conversions | Conv. Rate | Lift | Confidence | Status
  - Conv. Rate formatted as percentage with 2 decimal places (e.g., "4.52%")
  - Lift formatted as relative percentage with direction arrow (e.g., "+12.3%" or "-5.1%")
  - Lift color: green for positive, red for negative, zinc for zero
- [ ] Confidence level indicator per comparison:
  - Horizontal bar: `h-2 rounded-full bg-zinc-200 dark:bg-zinc-700` container
  - Fill bar width = confidence %, color transitions:
    - `< 80%`: `bg-zinc-400` (insufficient)
    - `80-89%`: `bg-yellow-500` (approaching)
    - `90-94%`: `bg-orange-500` (close)
    - `>= 95%`: `bg-green-500` (significant)
  - Numeric label to the right: "92.3% confidence"
- [ ] Sample size progress:
  - Compute `requiredSampleSize()` using control's current conversion rate as baseline
  - Show: "X / Y impressions needed" with progress indicator
  - If current >= required: "Sample size reached" with checkmark
  - Defaults: MDE = 5% relative, power = 80%, significance = 0.05
- [ ] Winner badge:
  - When `isSignificant === true`: green badge with checkmark icon and variant name
  - "Winner: Variant A (+12.3% lift)" styled as `inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300`
- [ ] "Insufficient data" state:
  - When total impressions across all variants < 100: show full-width message
  - "Not enough data yet. Continue running your experiment to reach statistical significance."
  - Styled as `rounded border border-zinc-200 bg-zinc-50 p-4 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400`
  - Include estimated time to significance if impression rate is available

### Task 3: Integrate into campaign analytics page (AC: 1, 8)

- [ ] Modify `src/app/app/campaigns/[id]/analytics/page.tsx`:
  - Import `StatisticalSignificance` component
  - Render below existing analytics charts when campaign has multiple variants
  - Only show when `campaign.variants.length > 1`
- [ ] Data sourcing from ExperimentEvent model:
  - Query per-variant impression + conversion counts from `GET /api/analytics/overview` or campaign-specific endpoint
  - ExperimentEvent schema: `{ visitorId, experimentKey, variationId, eventType (impression|conversion), campaignId, siteId, timestamp }`
  - Group by `variationId`, count `eventType === 'impression'` and `eventType === 'conversion'`
- [ ] Real-time updates: re-fetch analytics data on interval (match existing analytics refresh pattern) or use the parent page's data refresh mechanism

### Task 4: Unit tests for statistical calculations (AC: 7)

- [ ] Create `src/lib/__tests__/statistics.test.ts`
- [ ] Test `normalCDF`:
  - `normalCDF(0)` should be approximately `0.5`
  - `normalCDF(1.96)` should be approximately `0.975`
  - `normalCDF(-1.96)` should be approximately `0.025`
  - `normalCDF(3.0)` should be approximately `0.9987`
  - Symmetry: `normalCDF(x) + normalCDF(-x)` should be approximately `1.0`
  - NOTE: `normalCDF` is not exported; test indirectly through `calculateSignificance` or temporarily export for testing
- [ ] Test `calculateSignificance`:
  - **Equal rates**: `(50, 1000, 50, 1000)` should yield `zScore ≈ 0`, `pValue ≈ 1`, `confidence ≈ 0`, `isSignificant: false`, `winner: null`
  - **Clear winner**: `(50, 1000, 80, 1000)` should yield `isSignificant: true`, `winner: "variant"`, `confidence > 95`
  - **Clear winner (control)**: `(80, 1000, 50, 1000)` should yield `winner: "control"`
  - **Small sample**: `(1, 10, 2, 10)` should yield `isSignificant: false` (insufficient data)
  - **Large effect**: `(10, 1000, 50, 1000)` should yield `isSignificant: true`, high confidence
  - **Zero impressions control**: `(0, 0, 50, 1000)` should yield neutral result, no crash
  - **Zero impressions variant**: `(50, 1000, 0, 0)` should yield neutral result, no crash
  - **Zero conversions both**: `(0, 1000, 0, 1000)` should yield `pValue ≈ 1`, `winner: null`
  - **All convert**: `(1000, 1000, 1000, 1000)` should yield neutral result (no variance)
  - **Asymmetric sample sizes**: `(100, 5000, 50, 1000)` should compute correctly
  - **Relative lift calculation**: `(50, 1000, 60, 1000)` should yield `relativeLift ≈ 20` (20% relative improvement)
- [ ] Test `requiredSampleSize`:
  - `(0.05, 0.05)` with defaults (power=0.80, sig=0.05): should return a number around 30,000-40,000 per group
  - `(0.10, 0.10)` with defaults: should return a smaller number than 5% baseline with 5% MDE
  - `(0.50, 0.05)`: high baseline rate should require fewer samples
  - `(0.01, 0.05)`: very low baseline should require more samples
  - `(0, 0.05)`: zero baseline returns `Infinity`
  - `(0.05, 0)`: zero MDE returns `Infinity`
  - `(0.05, 0.05, 0.90)`: higher power should require more samples than default 0.80
  - `(0.05, 0.05, 0.80, 0.01)`: stricter significance should require more samples than default 0.05
- [ ] All tests should use `toBeCloseTo` with appropriate precision (2-3 decimal places for rates, 0-1 for integers)

## Dev Notes

### Pure Math — No External Dependencies

`src/lib/statistics.ts` must have ZERO imports. No `mathjs`, no `simple-statistics`, no `jstat`. The two-proportion z-test and normal CDF approximation are straightforward to implement from scratch. This keeps the bundle small and avoids supply chain risk.

### Abramowitz & Stegun Approximation

The recommended normalCDF implementation uses the Abramowitz & Stegun polynomial approximation (Handbook of Mathematical Functions, formula 26.2.17):

```ts
function normalCDF(x: number): number {
  if (x < 0) return 1 - normalCDF(-x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * x);
  const pdf = Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  return 1 - pdf * t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))));
}
```

This has maximum error < 1.5e-7, which is more than sufficient for A/B test significance.

### Data Source: ExperimentEvent Model

The `ExperimentEvent` table (from `prisma/schema.prisma` lines 268-285) provides raw data:

```prisma
model ExperimentEvent {
  id            String              @id @default(cuid())
  visitorId     String              @map("visitor_id")
  experimentKey String              @map("experiment_key")
  variationId   String              @map("variation_id")
  eventType     ExperimentEventType @map("event_type")  // impression | conversion
  campaignId    String?             @map("campaign_id")
  siteId        String?             @map("site_id")
  timestamp     DateTime            @default(now())
}
```

Per-variant counts are computed by grouping `ExperimentEvent` records by `variationId` and counting by `eventType`. This aggregation should happen server-side (in the analytics API) and be passed as props to the UI component.

### Default Parameters

| Parameter | Default | Rationale |
|-----------|---------|-----------|
| MDE (minimum detectable effect) | 5% relative | Industry standard for web optimization |
| Power | 80% (0.80) | Standard power level |
| Significance (alpha) | 0.05 | 95% confidence threshold |

These defaults are used in `requiredSampleSize()` and in the UI's sample size progress indicator.

### Design System

Follow the established Capturely design system:
- Section container: `rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900`
- Table: `w-full text-left text-sm` with `border-b border-zinc-100 dark:border-zinc-800` row separators
- Table header: `text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400`
- Winner badge: `inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300`
- Confidence bar: `h-2 rounded-full` with color transitions as specified in Task 2
- Insufficient data: `text-center text-sm text-zinc-500 dark:text-zinc-400`

### Project Structure Notes

- New files:
  - `src/lib/statistics.ts` (pure math utility)
  - `src/app/app/campaigns/[id]/analytics/statistical-significance.tsx` (UI component)
  - `src/lib/__tests__/statistics.test.ts` (unit tests)
- Modified files:
  - `src/app/app/campaigns/[id]/analytics/page.tsx` (integrate component)
- Existing files used (NOT modified):
  - `prisma/schema.prisma` (ExperimentEvent model reference)
  - Analytics API endpoints (data source)

### References

- [Source: prisma/schema.prisma — ExperimentEvent model, lines 268-285]
- [Source: prisma/schema.prisma — ExperimentEventType enum (impression, conversion)]
- [Source: docs/PRD.md — ExperimentEvent Model, Analytics Overview API]
- [Source: src/app/api/runtime/submit/route.ts — ExperimentEvent conversion write]
- [Source: Abramowitz & Stegun, Handbook of Mathematical Functions, formula 26.2.17]

## Testing Notes

- Run unit tests: `npx jest src/lib/__tests__/statistics.test.ts`
- Verify `normalCDF` accuracy against known values (0, 1.96, -1.96, 3.0)
- Verify `calculateSignificance` returns correct results for all edge cases listed in Task 4
- Verify `requiredSampleSize` returns reasonable values for common baseline rates
- Verify UI renders comparison table with correct columns and formatting
- Verify confidence bar colors match thresholds (<80% grey, 80-89% yellow, 90-94% orange, >=95% green)
- Verify winner badge appears only when confidence >= 95%
- Verify "Insufficient data" state appears when total impressions < 100
- Verify component only renders when campaign has 2+ variants
- Verify responsive layout: table scrolls horizontally on small screens
- Verify dark mode: all elements render correctly
- Verify real-time updates: component re-renders when analytics data refreshes

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
