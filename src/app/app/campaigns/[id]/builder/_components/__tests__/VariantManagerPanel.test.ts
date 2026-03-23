import { describe, it, expect } from "vitest";
import {
  rebalanceTraffic,
  generateVariantName,
  isTrafficValid,
} from "../VariantManagerPanel";

// Minimal Variant fixture for testing pure functions
function makeVariant(
  id: string,
  isControl: boolean,
  trafficPercentage: number
) {
  return {
    id,
    campaignId: "campaign-1",
    name: isControl ? "Control" : `Variant ${id}`,
    isControl,
    trafficPercentage,
    schemaJson: "{}",
    schemaVersion: 1,
    generatedBy: "manual",
  };
}

describe("rebalanceTraffic", () => {
  it("handles a single variant at 100%", () => {
    const variants = [makeVariant("a", true, 100)];
    const result = rebalanceTraffic(variants);
    expect(result).toHaveLength(1);
    expect(result[0].trafficPercentage).toBe(100);
  });

  it("splits 2 variants evenly (50/50)", () => {
    const variants = [makeVariant("a", true, 50), makeVariant("b", false, 50)];
    const result = rebalanceTraffic(variants);
    expect(result).toHaveLength(2);
    const total = result.reduce((sum, v) => sum + v.trafficPercentage, 0);
    expect(total).toBe(100);
    expect(result.every((v) => v.trafficPercentage === 50)).toBe(true);
  });

  it("splits 3 variants with remainder assigned to control", () => {
    const variants = [
      makeVariant("a", true, 34),
      makeVariant("b", false, 33),
      makeVariant("c", false, 33),
    ];
    const result = rebalanceTraffic(variants);
    expect(result).toHaveLength(3);
    const total = result.reduce((sum, v) => sum + v.trafficPercentage, 0);
    expect(total).toBe(100);
    // base = floor(100/3) = 33, remainder = 100 - 33*3 = 1 → control gets 34
    const control = result.find((v) => v.isControl)!;
    expect(control.trafficPercentage).toBe(34);
    const nonControls = result.filter((v) => !v.isControl);
    expect(nonControls.every((v) => v.trafficPercentage === 33)).toBe(true);
  });

  it("assigns remainder to control even when base divides cleanly", () => {
    const variants = [makeVariant("a", true, 25), makeVariant("b", false, 25),
      makeVariant("c", false, 25), makeVariant("d", false, 25)];
    const result = rebalanceTraffic(variants);
    const total = result.reduce((sum, v) => sum + v.trafficPercentage, 0);
    expect(total).toBe(100);
    // base = floor(100/4) = 25, remainder = 0 → all get 25
    expect(result.every((v) => v.trafficPercentage === 25)).toBe(true);
  });

  it("returns empty array for empty input", () => {
    expect(rebalanceTraffic([])).toEqual([]);
  });

  it("uses first variant as control when no isControl=true exists", () => {
    const variants = [makeVariant("a", false, 50), makeVariant("b", false, 50)];
    const result = rebalanceTraffic(variants);
    // First variant gets remainder
    expect(result[0].trafficPercentage).toBe(50);
    expect(result[1].trafficPercentage).toBe(50);
  });
});

describe("generateVariantName", () => {
  it("returns 'Variant B' when 1 variant exists", () => {
    const variants = [makeVariant("a", true, 100)];
    expect(generateVariantName(variants)).toBe("Variant B");
  });

  it("returns 'Variant C' when 2 variants exist", () => {
    const variants = [makeVariant("a", true, 50), makeVariant("b", false, 50)];
    expect(generateVariantName(variants)).toBe("Variant C");
  });

  it("returns 'Variant A' when no variants exist", () => {
    expect(generateVariantName([])).toBe("Variant A");
  });

  it("returns sequential letters for many variants", () => {
    const variants = Array.from({ length: 4 }, (_, i) =>
      makeVariant(String(i), i === 0, 25)
    );
    expect(generateVariantName(variants)).toBe("Variant E");
  });
});

describe("isTrafficValid", () => {
  it("returns true when variants sum to 100 with no pending", () => {
    const variants = [makeVariant("a", true, 50), makeVariant("b", false, 50)];
    expect(isTrafficValid(variants, {})).toBe(true);
  });

  it("returns false when variants sum to 90", () => {
    const variants = [makeVariant("a", true, 50), makeVariant("b", false, 40)];
    expect(isTrafficValid(variants, {})).toBe(false);
  });

  it("uses pending over variant.trafficPercentage when set", () => {
    const variants = [makeVariant("a", true, 50), makeVariant("b", false, 50)];
    // Pending changes b to 40 → sum becomes 90
    expect(isTrafficValid(variants, { b: 40 })).toBe(false);
  });

  it("returns true when pending adjustments still sum to 100", () => {
    const variants = [makeVariant("a", true, 50), makeVariant("b", false, 50)];
    // Pending: a=60, b=40 → sum=100
    expect(isTrafficValid(variants, { a: 60, b: 40 })).toBe(true);
  });

  it("returns false when pending creates sum over 100", () => {
    const variants = [makeVariant("a", true, 50), makeVariant("b", false, 50)];
    expect(isTrafficValid(variants, { a: 70, b: 50 })).toBe(false);
  });

  it("handles single variant always at 100", () => {
    const variants = [makeVariant("a", true, 100)];
    expect(isTrafficValid(variants, {})).toBe(true);
  });
});
