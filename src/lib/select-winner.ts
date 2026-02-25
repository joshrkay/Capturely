export interface VariantStats {
  variantId: string;
  impressions: number;
  submissions: number;
  isControl: boolean;
}

export interface WinnerResult {
  winner_variant_id: string;
  reason: 'best_conversion' | 'significant' | 'tie_control';
  is_significant: boolean;
}

function conversionRate(stats: VariantStats): number {
  if (stats.impressions === 0) return 0;
  return stats.submissions / stats.impressions;
}

function calculateZScore(control: VariantStats, variant: VariantStats): number {
  const p1 = conversionRate(control);
  const p2 = conversionRate(variant);

  const totalConversions = control.submissions + variant.submissions;
  const totalViews = control.impressions + variant.impressions;

  if (totalViews === 0) return 0;

  const pooledP = totalConversions / totalViews;
  const se = Math.sqrt(
    pooledP * (1 - pooledP) * (1 / control.impressions + 1 / variant.impressions)
  );

  if (se === 0) return 0;

  return (p2 - p1) / se;
}

export function selectWinner(
  control: VariantStats,
  variant: VariantStats,
  significanceEnabled: boolean = false
): WinnerResult {
  const controlCR = conversionRate(control);
  const variantCR = conversionRate(variant);

  // Tie-breaker: control always wins ties
  if (controlCR === variantCR) {
    return {
      winner_variant_id: control.variantId,
      reason: 'tie_control',
      is_significant: false,
    };
  }

  if (significanceEnabled) {
    const zScore = calculateZScore(control, variant);
    const isSignificant = Math.abs(zScore) >= 1.96; // 95% confidence

    if (isSignificant) {
      const winnerId = zScore > 0 ? variant.variantId : control.variantId;
      return {
        winner_variant_id: winnerId,
        reason: 'significant',
        is_significant: true,
      };
    }

    // Not significant — still pick highest but flag as not significant
    const winnerId = variantCR > controlCR ? variant.variantId : control.variantId;
    return {
      winner_variant_id: winnerId,
      reason: 'best_conversion',
      is_significant: false,
    };
  }

  // Flag OFF: pick highest conversion rate
  const winnerId = variantCR > controlCR ? variant.variantId : control.variantId;
  return {
    winner_variant_id: winnerId,
    reason: 'best_conversion',
    is_significant: false,
  };
}
