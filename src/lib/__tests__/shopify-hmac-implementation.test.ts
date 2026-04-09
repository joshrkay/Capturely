import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";

describe("shopify oauth HMAC verification implementation", () => {
  it("uses timingSafeEqual instead of direct string comparison", () => {
    const source = readFileSync("src/lib/shopify.ts", "utf8");

    expect(source).toContain("timingSafeEqual");
    expect(source).not.toContain("digest === hmac");
  });
});
