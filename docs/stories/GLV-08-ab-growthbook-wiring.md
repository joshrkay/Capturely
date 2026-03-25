# Story: Wire A/B Testing to GrowthBook

**ID:** GLV-08
**Gate:** F (Campaign Builder) + D (Analytics)
**Priority:** P1 — Feature gap
**Branch:** `feat/ab-growthbook-wiring`
**Effort:** 3 hours

---

## Problem

The campaign builder has an A/B testing toggle that creates variant records in the DB and allocates traffic percentages. However, it doesn't actually create a GrowthBook experiment. The widget currently just selects the first variant (control) for everyone — there's no real traffic splitting.

For MVP, we need at minimum: when a campaign with multiple variants is published, create a simple server-side experiment assignment so different visitors see different variants.

## Acceptance Criteria

- [ ] When a campaign with 2+ variants is published, traffic is split based on `trafficPercentage`
- [ ] Different visitors see different variants (not always control)
- [ ] Variant assignment is sticky per visitor (same visitor sees same variant on return)
- [ ] Assignment is recorded for analytics (which variant was shown)
- [ ] Widget supports variant selection based on traffic weights
- [ ] If GrowthBook is not configured, fall back to simple hash-based splitting
- [ ] `npm run typecheck` passes

## Implementation

### Approach: Simple Hash-Based Splitting (No GrowthBook Dependency)

For go-live, implement a lightweight variant selector in the widget that doesn't require GrowthBook. This can be upgraded to full GrowthBook later.

### File: `packages/widget/src/widget.ts`

Replace the `selectVariant` function:

```typescript
function getVisitorId(): string {
  const STORAGE_KEY = "capturely_vid";
  let vid = localStorage.getItem(STORAGE_KEY);
  if (!vid) {
    vid = generateSubmissionId(); // reuse UUID generator
    localStorage.setItem(STORAGE_KEY, vid);
  }
  return vid;
}

function hashToPercent(visitorId: string, campaignId: string): number {
  // Simple string hash → 0-99
  let hash = 0;
  const str = `${visitorId}:${campaignId}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 100;
}

function selectVariant(
  campaign: ManifestCampaign
): { variantId: string; schema: FormSchema } | null {
  const variantIds = Object.keys(campaign.variants);
  if (variantIds.length === 0) return null;
  if (variantIds.length === 1) {
    return { variantId: variantIds[0], schema: campaign.variants[variantIds[0]] };
  }

  // Use traffic percentages from manifest if available
  const visitorId = getVisitorId();
  const bucket = hashToPercent(visitorId, campaign.campaignId);

  // Default: equal split if no traffic percentages
  const trafficWeights = campaign.trafficWeights ?? {};
  let cumulative = 0;

  for (const variantId of variantIds) {
    const weight = trafficWeights[variantId] ?? Math.floor(100 / variantIds.length);
    cumulative += weight;
    if (bucket < cumulative) {
      return { variantId, schema: campaign.variants[variantId] };
    }
  }

  // Fallback to last variant
  const lastId = variantIds[variantIds.length - 1];
  return { variantId: lastId, schema: campaign.variants[lastId] };
}
```

### File: `src/lib/manifest.ts`

Include traffic weights in the manifest:

```typescript
// In buildManifest(), add trafficWeights to each campaign
trafficWeights: Object.fromEntries(
  campaign.variants.map((v) => [v.id, v.trafficPercentage ?? 50])
),
```

### File: `packages/shared/forms/src/types.ts`

Add `trafficWeights` to `ManifestCampaign`:

```typescript
export interface ManifestCampaign {
  // ... existing fields
  trafficWeights?: Record<string, number>;
}
```

### File: `src/app/api/manifests/[publicKey]/route.ts`

No changes needed — already uses `buildManifest()`.

## Testing

```bash
npm run build:widget  # Rebuild widget with new selectVariant
npm run typecheck
npm run test
```

Manual testing:
1. Create a campaign with 2 variants (50/50 split)
2. Publish the campaign
3. Open the widget page in 2 different browsers (different localStorage)
4. Verify each browser sees a different variant (statistically, not guaranteed)

## Context Files
- `packages/widget/src/widget.ts` — Widget entry with `selectVariant()`
- `src/lib/manifest.ts` — `buildManifest()` function
- `packages/shared/forms/src/types.ts` — `ManifestCampaign` type
- `src/app/app/campaigns/[id]/builder/_components/VariantManagerPanel.tsx` — Traffic split UI
