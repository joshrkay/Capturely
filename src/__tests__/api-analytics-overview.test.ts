import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemberRole } from "@/generated/prisma/client";

const { mockWithAccountContext, mockExperimentEventCount, mockSubmissionCount, mockCampaignFindMany, mockQueryRaw } =
  vi.hoisted(() => ({
    mockWithAccountContext: vi.fn(),
    mockExperimentEventCount: vi.fn(),
    mockSubmissionCount: vi.fn(),
    mockCampaignFindMany: vi.fn(),
    mockQueryRaw: vi.fn(),
  }));

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
    experimentEvent: {
      count: mockExperimentEventCount,
    },
    submission: {
      count: mockSubmissionCount,
    },
    campaign: {
      findMany: mockCampaignFindMany,
    },
    $queryRaw: mockQueryRaw,
  },
}));

import { GET } from "@/app/api/analytics/overview/route";

describe("GET /api/analytics/overview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns validation error for invalid days", async () => {
    mockWithAccountContext.mockResolvedValue({ accountId: "acc_1", role: MemberRole.member });

    const res = await GET(new Request("http://localhost/api/analytics/overview?days=0") as never);

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("scopes analytics queries to the current account", async () => {
    mockWithAccountContext.mockResolvedValue({ accountId: "acc_a", role: MemberRole.member });
    mockExperimentEventCount.mockResolvedValueOnce(10).mockResolvedValueOnce(2);
    mockSubmissionCount.mockResolvedValue(3);
    mockCampaignFindMany.mockResolvedValue([]);
    mockQueryRaw.mockResolvedValue([]);

    const res = await GET(new Request("http://localhost/api/analytics/overview?days=7") as never);

    expect(res.status).toBe(200);
    expect(mockExperimentEventCount).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          campaign: { accountId: "acc_a" },
          eventType: "impression",
        }),
      })
    );
    expect(mockExperimentEventCount).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          campaign: { accountId: "acc_a" },
          eventType: "conversion",
        }),
      })
    );
    expect(mockSubmissionCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ accountId: "acc_a" }),
      })
    );
    expect(mockQueryRaw).toHaveBeenCalledTimes(1);
    expect(mockQueryRaw.mock.calls[0][1]).toBe("acc_a");
  });

  it("returns the expected response shape for a happy path", async () => {
    mockWithAccountContext.mockResolvedValue({ accountId: "acc_1", role: MemberRole.member });
    mockExperimentEventCount.mockResolvedValueOnce(100).mockResolvedValueOnce(25);
    mockSubmissionCount.mockResolvedValue(40);
    mockCampaignFindMany.mockResolvedValue([
      { id: "camp_1", name: "Welcome", _count: { submissions: 12 } },
      { id: "camp_2", name: "Promo", _count: { submissions: 8 } },
    ]);
    mockQueryRaw.mockResolvedValue([
      { day: "2026-03-20", count: 2n },
      { day: "2026-03-21", count: 3n },
    ]);

    const res = await GET(new Request("http://localhost/api/analytics/overview?days=30") as never);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.metrics).toMatchObject({
      impressions: 100,
      conversions: 25,
      conversionRate: 25,
      totalSubmissions: 40,
    });
    expect(json.topCampaigns).toEqual([
      { id: "camp_1", name: "Welcome", submissions: 12 },
      { id: "camp_2", name: "Promo", submissions: 8 },
    ]);
    expect(json.dailySubmissions).toEqual([
      { date: "2026-03-20", count: 2 },
      { date: "2026-03-21", count: 3 },
    ]);
  });
});
