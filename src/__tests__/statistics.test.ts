import { describe, it, expect } from "vitest";
import { normalCDF, twoProportionZTest } from "@/lib/statistics";

describe("normalCDF", () => {
  it("returns 0.5 for x = 0", () => {
    expect(normalCDF(0)).toBeCloseTo(0.5, 6);
  });

  it("returns ~0.975 for x = 1.96", () => {
    expect(normalCDF(1.96)).toBeCloseTo(0.975, 3);
  });

  it("returns ~0.025 for x = -1.96", () => {
    expect(normalCDF(-1.96)).toBeCloseTo(0.025, 3);
  });

  it("is symmetric: CDF(-x) = 1 - CDF(x)", () => {
    const x = 1.5;
    expect(normalCDF(-x)).toBeCloseTo(1 - normalCDF(x), 6);
  });

  it("returns ~0.8413 for x = 1", () => {
    expect(normalCDF(1)).toBeCloseTo(0.8413, 3);
  });

  it("clamps to 0 for very negative values", () => {
    expect(normalCDF(-10)).toBe(0);
  });

  it("clamps to 1 for very positive values", () => {
    expect(normalCDF(10)).toBe(1);
  });
});

describe("twoProportionZTest", () => {
  it("returns not significant for identical rates", () => {
    const result = twoProportionZTest(
      { impressions: 1000, conversions: 50 },
      { impressions: 1000, conversions: 50 }
    );
    expect(result.significant).toBe(false);
    expect(result.zScore).toBeCloseTo(0, 3);
    expect(result.relativeUplift).toBeCloseTo(0, 3);
    expect(result.winner).toBe("none");
  });

  it("detects a significant winner with large difference", () => {
    // Control: 5% conv, Challenger: 8% conv, n=1000 each
    const result = twoProportionZTest(
      { impressions: 1000, conversions: 50 },
      { impressions: 1000, conversions: 80 }
    );
    expect(result.significant).toBe(true);
    expect(result.winner).toBe("challenger");
    expect(result.relativeUplift).toBeCloseTo(60, 0); // 60% uplift
    expect(result.confidenceLevel).toBeGreaterThan(95);
  });

  it("detects control as winner when challenger is worse", () => {
    const result = twoProportionZTest(
      { impressions: 1000, conversions: 80 },
      { impressions: 1000, conversions: 50 }
    );
    expect(result.significant).toBe(true);
    expect(result.winner).toBe("control");
    expect(result.relativeUplift).toBeLessThan(0);
  });

  it("returns not significant for small samples", () => {
    const result = twoProportionZTest(
      { impressions: 20, conversions: 1 },
      { impressions: 20, conversions: 2 }
    );
    expect(result.significant).toBe(false);
    expect(result.winner).toBe("none");
  });

  it("handles 0 impressions gracefully", () => {
    const result = twoProportionZTest(
      { impressions: 0, conversions: 0 },
      { impressions: 1000, conversions: 50 }
    );
    expect(result.significant).toBe(false);
    expect(result.pValue).toBe(1);
    expect(result.winner).toBe("none");
  });

  it("handles 0 conversions in both", () => {
    const result = twoProportionZTest(
      { impressions: 1000, conversions: 0 },
      { impressions: 1000, conversions: 0 }
    );
    expect(result.significant).toBe(false);
    expect(result.winner).toBe("none");
  });

  it("returns pValue between 0 and 1", () => {
    const result = twoProportionZTest(
      { impressions: 500, conversions: 25 },
      { impressions: 500, conversions: 35 }
    );
    expect(result.pValue).toBeGreaterThanOrEqual(0);
    expect(result.pValue).toBeLessThanOrEqual(1);
  });
});
