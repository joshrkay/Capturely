import { describe, expect, it } from "vitest";
import { parseSitesApiResponse } from "../page";

describe("parseSitesApiResponse", () => {
  it("accepts payloads with a sites array", () => {
    const payload = {
      sites: [
        { id: "site_1", name: "My Site", primaryDomain: "example.com" },
      ],
    };

    expect(parseSitesApiResponse(payload)).toEqual(payload);
  });

  it("rejects invalid payload shapes", () => {
    expect(() => parseSitesApiResponse(null)).toThrow("Invalid sites payload");
    expect(() => parseSitesApiResponse([{ id: "site_1" }])).toThrow("Invalid sites payload");
    expect(() => parseSitesApiResponse({ sites: "not-an-array" })).toThrow("Invalid sites payload");
  });
});
