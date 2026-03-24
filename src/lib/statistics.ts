export interface VariantStats {
  impressions: number;
  conversions: number;
}

export interface SignificanceResult {
  zScore: number;
  pValue: number;
  significant: boolean;
  confidenceLevel: number;
  relativeUplift: number;
  winner: "control" | "challenger" | "none";
}

/**
 * Normal CDF approximation using Abramowitz & Stegun formula 26.2.17.
 * Maximum error: 7.5e-8.
 */
export function normalCDF(x: number): number {
  if (x < -8) return 0;
  if (x > 8) return 1;

  const isNeg = x < 0;
  const absX = isNeg ? -x : x;

  const b1 = 0.31938153;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;

  const t = 1 / (1 + 0.2316419 * absX);
  const phi = Math.exp(-0.5 * absX * absX) / Math.sqrt(2 * Math.PI);
  const poly = t * (b1 + t * (b2 + t * (b3 + t * (b4 + t * b5))));
  const result = 1 - phi * poly;

  return isNeg ? 1 - result : result;
}

/**
 * Two-proportion z-test comparing a challenger variant against a control.
 * Uses a two-tailed test with significance threshold of p < 0.05.
 */
export function twoProportionZTest(
  control: VariantStats,
  challenger: VariantStats
): SignificanceResult {
  // Edge case: insufficient data
  if (control.impressions === 0 || challenger.impressions === 0) {
    return {
      zScore: 0,
      pValue: 1,
      significant: false,
      confidenceLevel: 0,
      relativeUplift: 0,
      winner: "none",
    };
  }

  const p1 = control.conversions / control.impressions;
  const p2 = challenger.conversions / challenger.impressions;

  const pooledP =
    (control.conversions + challenger.conversions) /
    (control.impressions + challenger.impressions);

  // If pooled proportion is 0 or 1, no variance to test
  if (pooledP === 0 || pooledP === 1) {
    return {
      zScore: 0,
      pValue: 1,
      significant: false,
      confidenceLevel: 0,
      relativeUplift: p1 > 0 ? ((p2 - p1) / p1) * 100 : 0,
      winner: "none",
    };
  }

  const se = Math.sqrt(
    pooledP *
      (1 - pooledP) *
      (1 / control.impressions + 1 / challenger.impressions)
  );

  const zScore = (p2 - p1) / se;
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));
  const significant = pValue < 0.05;
  const confidenceLevel = (1 - pValue) * 100;
  const relativeUplift = p1 > 0 ? ((p2 - p1) / p1) * 100 : 0;

  let winner: "control" | "challenger" | "none" = "none";
  if (significant) {
    winner = zScore > 0 ? "challenger" : "control";
  }

  return {
    zScore,
    pValue,
    significant,
    confidenceLevel,
    relativeUplift,
    winner,
  };
}
