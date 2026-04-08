import { describe, expect, it } from "vitest";
import { pickWeightedVariant } from "../variant-assignment";

describe("pickWeightedVariant", () => {
  it("is sticky for same visitor and experiment", () => {
    const exp = {
      trackingKey: "exp1",
      variantWeights: { a: 50, b: 50 },
    };
    const v1 = pickWeightedVariant(exp, "visitor-1");
    const v2 = pickWeightedVariant(exp, "visitor-1");
    expect(v1).toBe(v2);
  });
});
