# G-6: Statistical Significance Engine & UI Component

**Status:** ready-for-dev

---

## Story

**As a** merchant running A/B tests on campaigns,
**I want** to see statistically rigorous significance results for each variant comparison,
**so that** I can confidently decide which form variant is the winner and stop losing conversions on underperforming variants.

**Priority:** Medium | **Points:** 5 | **Gate:** B (Analytics) | **Tier:** 0

This story delivers a pure math utility (`src/lib/statistics.ts`) implementing a two-proportion z-test with an Abramowitz & Stegun normal CDF approximation, and a UI component that renders variant comparison tables with confidence indicators. No external statistics libraries — all math is self-contained.

---

## Dependencies

| Direction | Item | Status |
|-----------|------|--------|
| BLOCKED BY | Nothing | Tier 0 — fully independent |
| BLOCKS | Nothing | Consumed optionally by analytics dashboards |
| DATA | `ExperimentEvent` model (prisma/schema.prisma) | Provides per-variant `impression` and `conversion` counts |
| USES | Tailwind CSS, React, Next.js App Router | Existing stack |

---

## Existing Code Inventory

This is **all new code** — no extraction or refactoring required.

| Path | Exists? | Action |
|------|---------|--------|
| `src/lib/statistics.ts` | No | **CREATE** — pure math utility, zero dependencies |
| `src/app/app/campaigns/[id]/analytics/statistical-significance.tsx` | No | **CREATE** — client component |
| `src/lib/__tests__/statistics.test.ts` | No | **CREATE** — unit tests |
| `src/app/app/campaigns/[id]/analytics/page.tsx` | Yes | **MODIFY** — import and render new component |
| `prisma/schema.prisma` | Yes | **READ ONLY** — reference ExperimentEvent model |

---

## Acceptance Criteria

1. `normalCDF(x)` returns values accurate to 4 decimal places against known references (e.g., `normalCDF(1.96)` returns `0.9750 +/- 0.0001`).
2. `normalCDF(0)` returns exactly `0.5`; symmetry property holds: `normalCDF(x) + normalCDF(-x) === 1.0`.
3. `calculateSignificance()` returns correct `zScore`, `pValue`, `confidence`, `isSignificant`, and `winner` for known input pairs.
4. `calculateSignificance()` returns `winner: null` and `isSignificant: false` when confidence < 95%.
5. `calculateSignificance()` returns `winner: 'variant'` when variant rate > control rate AND confidence >= 95%.
6. `calculateSignificance()` returns `winner: 'control'` when control rate > variant rate AND confidence >= 95%.
7. Division-by-zero is guarded: zero impressions, `p_pool === 0`, or `p_pool === 1` all return safe neutral results.
8. `requiredSampleSize()` uses defaults MDE=5%, power=80%, significance=0.05 when optional params omitted.
9. `requiredSampleSize()` returns mathematically correct per-group sample size (ceiling integer).
10. UI renders "Insufficient data" state when either variant has < 100 impressions.
11. Confidence bar displays gray when confidence < 80%, yellow when 80%-94%, green when >= 95%.
12. Winner badge renders only when `isSignificant` is true and confidence >= 95%.
13. Required vs current sample size is displayed per variant row.
14. All pure functions are free of side effects and have zero external dependencies.
15. Component is accessible: `role="meter"` on confidence bar, text labels supplement color, proper table semantics.

---

## API Contracts

### `calculateSignificance()`

```typescript
interface SignificanceResult {
  zScore: number;
  pValue: number;
  confidence: number;       // 0-100, percentage
  isSignificant: boolean;   // confidence >= 95
  winner: 'control' | 'variant' | null;
}

function calculateSignificance(
  controlConversions: number,
  controlImpressions: number,
  variantConversions: number,
  variantImpressions: number,
): SignificanceResult;
```

**Formula:**
```
p1 = controlConversions / controlImpressions
p2 = variantConversions / variantImpressions
p_pool = (controlConversions + variantConversions) / (controlImpressions + variantImpressions)
z = (p1 - p2) / sqrt(p_pool * (1 - p_pool) * (1/n1 + 1/n2))
pValue = 2 * (1 - normalCDF(abs(z)))   // two-tailed
confidence = (1 - pValue) * 100
```

### `requiredSampleSize()`

```typescript
function requiredSampleSize(
  baselineRate: number,        // e.g. 0.05 for 5%
  mde?: number,                // minimum detectable effect, default 0.05
  power?: number,              // default 0.80
  significance?: number,       // alpha, default 0.05
): number;
```

**Formula:** `n = (z_alpha/2 + z_beta)^2 * (p1*(1-p1) + p2*(1-p2)) / (p1 - p2)^2` where `p2 = p1 + mde`. Returns `Math.ceil(n)` per group. Guards: returns `Infinity` when `baselineRate <= 0` or `mde <= 0`.

### `normalCDF(x)` — internal, not exported

Abramowitz & Stegun approximation (formula 26.2.17). Constants: `p=0.3275911`, `a1=0.254829592`, `a2=-0.284496736`, `a3=1.421413741`, `a4=-1.453152027`, `a5=1.061405429`. Maximum error < 1.5e-7.

---

## Component Architecture

```
statistical-significance.tsx ("use client")
├── Props: { control: VariantData; variants: VariantData[] }
├── InsufficientDataNotice (when any sample < 100)
├── VariantComparisonTable
│   ├── <thead> — Variant | Impressions | Conversions | Rate | Confidence | Status
│   └── <tbody> — one row per variant vs control
│       ├── ConfidenceBar (role="meter", width = confidence %)
│       ├── WinnerBadge (conditional, green pill)
│       └── SampleSizeIndicator (required vs current)
└── EmptyState (when no variants provided)
```

### Props Interface

```typescript
interface VariantData {
  id: string;
  name: string;
  impressions: number;
  conversions: number;
}

interface StatisticalSignificanceProps {
  control: VariantData;
  variants: VariantData[];
}
```

---

## UI States

| State | Condition | Rendering |
|-------|-----------|-----------|
| **Insufficient data** | Any variant impressions < 100 | Info card: "Collect at least 100 impressions per variant" |
| **Not significant** | Confidence < 80% | Gray confidence bar, "No winner yet" |
| **Trending** | Confidence 80%-94% | Yellow confidence bar, "Trending" label |
| **Significant** | Confidence >= 95% | Green confidence bar, winner badge with variant name |
| **Empty** | No variants provided | "No variants configured" placeholder |

---

## Design System

| Element | Light | Dark |
|---------|-------|------|
| Card background | `bg-zinc-50` | `dark:bg-black` |
| Card border | `border-zinc-200` | `dark:border-zinc-800` |
| Table header text | `text-zinc-500` | `dark:text-zinc-400` |
| Body text | `text-zinc-900` | `dark:text-white` |
| Muted text | `text-zinc-500` | `dark:text-zinc-400` |
| Gray bar (< 80%) | `bg-zinc-300` | `dark:bg-zinc-700` |
| Yellow bar (80-94%) | `bg-yellow-400` | `dark:bg-yellow-500` |
| Green bar (>= 95%) | `bg-green-500` | `dark:bg-green-400` |
| Winner badge | `bg-green-100 text-green-800` | `dark:bg-green-900 dark:text-green-200` |
| Insufficient data | `text-zinc-400` | `dark:text-zinc-500` |

Typography: `text-sm` for table cells, `text-xs` for labels, `font-semibold` for winner badge.

---

## Accessibility

- Confidence bar uses `role="meter"` with `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`, and `aria-label="Confidence level"`.
- Winner status communicated via text label, not color alone. Screen readers see "Winner: Variant B (97% confidence)".
- Insufficient data notice uses `role="status"` for live region announcement.
- Table uses `<thead>`, `<tbody>`, `<th scope="col">` semantics.
- Color contrast ratios meet WCAG AA on both light and dark backgrounds.
- Lift direction uses text arrows ("+12.3%", "-5.1%"), not color-only indicators.

---

## Testing Plan

### Unit Tests — `src/lib/__tests__/statistics.test.ts`

| # | Test Case | Input | Expected |
|---|-----------|-------|----------|
| 1 | `normalCDF(0)` | `0` | `0.5` exactly |
| 2 | `normalCDF(1.96)` | `1.96` | `0.9750 +/- 0.0001` |
| 3 | `normalCDF(-1.96)` | `-1.96` | `0.0250 +/- 0.0001` |
| 4 | `normalCDF(3.0)` | `3.0` | `0.9987 +/- 0.0001` |
| 5 | Symmetry | any `x` | `normalCDF(x) + normalCDF(-x) === 1.0` |
| 6 | Equal rates | `(50, 1000, 50, 1000)` | `zScore: 0, confidence: 0, winner: null` |
| 7 | Significant variant wins | `(50, 1000, 80, 1000)` | `isSignificant: true, winner: 'variant'` |
| 8 | Significant control wins | `(80, 1000, 50, 1000)` | `winner: 'control'` |
| 9 | Not significant | `(500, 10000, 505, 10000)` | `isSignificant: false, winner: null` |
| 10 | Zero impressions control | `(0, 0, 50, 1000)` | Neutral result, no crash |
| 11 | Zero impressions variant | `(50, 1000, 0, 0)` | Neutral result, no crash |
| 12 | Zero conversions both | `(0, 1000, 0, 1000)` | `winner: null` (no variance) |
| 13 | All convert | `(1000, 1000, 1000, 1000)` | Neutral result (no variance) |
| 14 | `requiredSampleSize(0.05, 0.05)` | defaults | Reasonable integer ~30k-40k |
| 15 | `requiredSampleSize(0, 0.05)` | zero baseline | `Infinity` |
| 16 | `requiredSampleSize(0.05, 0)` | zero MDE | `Infinity` |
| 17 | Higher power needs more samples | `(0.05, 0.05, 0.90)` vs `(0.05, 0.05, 0.80)` | 0.90 > 0.80 result |

Note: `normalCDF` is not exported. Test indirectly via `calculateSignificance` known-value cases, or use a test-only export pattern.

### Component Tests — `src/app/app/campaigns/[id]/analytics/__tests__/statistical-significance.test.tsx`

- Renders insufficient data notice when impressions < 100.
- Renders gray bar when confidence < 80%.
- Renders yellow bar when confidence 80%-94%.
- Renders green bar and winner badge when confidence >= 95%.
- Renders correct sample size comparison text.
- Renders empty state when no variants provided.
- ARIA attributes present on confidence bar (`role="meter"`, `aria-valuenow`).
- Table has proper `<th scope="col">` elements.

---

## Anti-Patterns to Avoid

1. **Do NOT use external stats libraries** (jStat, simple-statistics, mathjs) — zero dependencies.
2. **Do NOT use `Math.erf`** — not available in all JS runtimes. Use Abramowitz & Stegun.
3. **Do NOT cache or memoize** inside pure functions — let caller handle caching.
4. **Do NOT divide by zero** — guard impressions=0, p_pool=0, p_pool=1.
5. **Do NOT use `"use server"`** on the statistics module — it is a pure library.
6. **Do NOT rely on color alone** for significance state — always include text labels.
7. **Do NOT hardcode the 95% threshold** — derive from the `significance` parameter default.
8. **Do NOT mutate props** in the component — treat all inputs as immutable.

---

## Tasks

1. Create `src/lib/statistics.ts` — module scaffold with TypeScript interfaces and exports.
2. Implement `normalCDF(x)` — Abramowitz & Stegun formula 26.2.17 with constants `p=0.3275911`, `a1..a5`.
3. Implement `calculateSignificance()` — two-proportion z-test with pooled proportion, two-tailed p-value.
4. Add division-by-zero guards — return safe neutral `SignificanceResult` when impressions are zero or p_pool has no variance.
5. Implement `requiredSampleSize()` — solve for n using z-value lookups for power and alpha.
6. Add default parameter values — MDE=0.05, power=0.80, significance=0.05; guard `baselineRate <= 0` and `mde <= 0` returning `Infinity`.
7. Write unit tests for `normalCDF` — validate `normalCDF(0)=0.5`, `normalCDF(1.96)=0.975`, symmetry property.
8. Write unit tests for `calculateSignificance` — equal rates, clear winner variant, clear winner control, zero inputs, no-variance cases.
9. Write unit tests for `requiredSampleSize` — known baselines, zero guards, power/significance impact on sample size.
10. Create `statistical-significance.tsx` — `"use client"` component scaffold with `StatisticalSignificanceProps` interface.
11. Build variant comparison table — `<table>` with thead/tbody, one row per variant vs control, columns: name, impressions, conversions, rate, confidence, status.
12. Implement ConfidenceBar — inline sub-component, `role="meter"`, gray/yellow/green color transitions at 80% and 95%.
13. Implement WinnerBadge — green pill with variant name, conditional render when `isSignificant === true`.
14. Implement insufficient data state — check any sample < 100, render info notice with `role="status"`.
15. Implement sample size indicator — call `requiredSampleSize()` with control's current rate, show "X / Y impressions needed".
16. Apply design system tokens — `bg-zinc-50 dark:bg-black`, `border-zinc-200 dark:border-zinc-800`, all typography per spec.
17. Add ARIA attributes — `role="meter"` with `aria-valuenow/min/max`, `role="status"`, `<th scope="col">`.
18. Write component render tests — all five UI states, ARIA presence, conditional elements.
19. Integrate into analytics page — import component into `page.tsx`, render when `variants.length > 1`, pass ExperimentEvent aggregated data.
20. Manual QA — verify dark mode, edge cases (1 variant, 5 variants, 0 impressions), responsive table scroll.

---

## Dev Notes

- The Abramowitz & Stegun approximation (formula 26.2.17) constants: `p=0.3275911`, `a1=0.254829592`, `a2=-0.284496736`, `a3=1.421413741`, `a4=-1.453152027`, `a5=1.061405429`. Accuracy < 1.5e-7.
- For `requiredSampleSize`, use hardcoded z-value lookups rather than implementing inverse CDF:
  ```
  Z_ALPHA: { "0.01": 2.576, "0.05": 1.960, "0.10": 1.645 }
  Z_POWER: { "0.80": 0.842, "0.90": 1.282, "0.95": 1.645 }
  ```
- The component must be `"use client"` since it computes derived state from props.
- `ExperimentEvent` model provides `variant_id` and `event_type` (`impression` | `conversion`). The parent page aggregates counts server-side before passing as props.
- Two-tailed test is used because we want to detect if either variant is better, not just one direction.
- Confidence is displayed as a percentage (0-100) for user comprehension.
- The `normalCDF` function handles negative `x` via the identity `normalCDF(-x) = 1 - normalCDF(x)`.

---

## References

- [Abramowitz & Stegun, Handbook of Mathematical Functions, formula 26.2.17](https://en.wikipedia.org/wiki/Abramowitz_and_Stegun)
- [Two-proportion z-test](https://en.wikipedia.org/wiki/Statistical_hypothesis_testing)
- [Sample size determination for two proportions](https://en.wikipedia.org/wiki/Sample_size_determination)
- `prisma/schema.prisma` — ExperimentEvent model (lines 268-285), ExperimentEventType enum
- `docs/PRD.md` — A/B testing feature requirements, ExperimentEvent Model, Analytics Overview API
- `src/app/api/runtime/submit/route.ts` — ExperimentEvent conversion write reference

---

## Dev Agent Record

| Field | Value |
|-------|-------|
| Story ID | G-6 |
| Created | 2026-03-23 |
| Status | Draft |
| Assigned | -- |
| Agent Model | -- |
| Branch | `feat/g6-statistical-significance` |
| Files Created | `src/lib/statistics.ts`, `src/app/app/campaigns/[id]/analytics/statistical-significance.tsx`, `src/lib/__tests__/statistics.test.ts` |
| Files Modified | `src/app/app/campaigns/[id]/analytics/page.tsx` |
| Debug Log | -- |
| Completion Notes | -- |
| Blocking Issues | None |
| Review Notes | Pure math functions must be validated against reference tables before UI work begins. |
