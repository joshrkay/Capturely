import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemberRole } from "@/generated/prisma/client";

const { mockWithAccountContext, mockCampaignFindFirst, mockExperimentEventGroupBy, mockSubmissionGroupBy } = vi.hoisted(
  () => ({
    mockWithAccountContext: vi.fn(),
    mockCampaignFindFirst: vi.fn(),
    mockExperimentEventGroupBy: vi.fn(),
    mockSubmissionGroupBy: vi.fn(),
  })
);

vi.mock("@/lib/account", () => ({
  withAccountContext: mockWithAccountContext,
  AccountContextError: class AccountContextError extends Error {
    constructor(
      message: string,
      public statusCode: number
    ) {
      super(message);
    }
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    campaign: {
      findFirst: mockCampaignFindFirst,
    },
    experimentEvent: {
      groupBy: mockExperimentEventGroupBy,
    },
    submission: {
      groupBy: mockSubmissionGroupBy,
    },
  },
}));

import { GET } from "@/app/api/campaigns/[id]/analytics/route";

describe("GET /api/campaigns/:id/analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when campaign is missing or belongs to another account", async () => {
    mockWithAccountContext.mockResolvedValue({ accountId: "acc_1", role: MemberRole.member });
    mockCampaignFindFirst.mockResolvedValue(null);

    const res = await GET(new Request("http://localhost/api/campaigns/camp_x/analytics?days=30") as never, {
      params: Promise.resolve({ id: "camp_x" }),
    });

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toMatchObject({ code: "NOT_FOUND" });
  });

  it("returns validation error for invalid days", async () => {
    mockWithAccountContext.mockResolvedValue({ accountId: "acc_1", role: MemberRole.member });
    mockCampaignFindFirst.mockResolvedValue({
      id: "camp_1",
      name: "Campaign",
      variants: [],
    });

    const res = await GET(new Request("http://localhost/api/campaigns/camp_1/analytics?days=abc") as never, {
      params: Promise.resolve({ id: "camp_1" }),
    });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("returns campaign and per-variant analytics", async () => {
    mockWithAccountContext.mockResolvedValue({ accountId: "acc_1", role: MemberRole.member });
    mockCampaignFindFirst.mockResolvedValue({
      id: "camp_1",
      name: "Spring Sale",
      variants: [
        { id: "var_a", name: "Control", isControl: true, trafficPercentage: 50 },
        { id: "var_b", name: "Challenger", isControl: false, trafficPercentage: 50 },
      ],
    });
    mockExperimentEventGroupBy.mockResolvedValue([
      { variationId: "var_a", eventType: "impression", _count: { _all: 100 } },
      { variationId: "var_a", eventType: "conversion", _count: { _all: 20 } },
      { variationId: "var_b", eventType: "impression", _count: { _all: 80 } },
      { variationId: "var_b", eventType: "conversion", _count: { _all: 16 } },
    ]);
    mockSubmissionGroupBy.mockResolvedValue([
      { variantId: "var_a", _count: { _all: 11 } },
      { variantId: "var_b", _count: { _all: 9 } },
    ]);

    const res = await GET(new Request("http://localhost/api/campaigns/camp_1/analytics?days=30") as never, {
      params: Promise.resolve({ id: "camp_1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockCampaignFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "camp_1", accountId: "acc_1" } })
    );
    expect(json.campaignId).toBe("camp_1");
    expect(json.totals).toMatchObject({
      impressions: 180,
      conversions: 36,
      submissions: 20,
      conversionRate: 20,
    });
    expect(json.variants).toEqual([
      {
        variantId: "var_a",
        variantName: "Control",
        isControl: true,
        trafficPercentage: 50,
        impressions: 100,
        conversions: 20,
        submissions: 11,
        conversionRate: 20,
      },
      {
        variantId: "var_b",
        variantName: "Challenger",
        isControl: false,
        trafficPercentage: 50,
        impressions: 80,
        conversions: 16,
        submissions: 9,
        conversionRate: 20,
      },
    ]);
  });
});
