import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemberRole } from "@/generated/prisma/client";

const {
  mockWithAccountContext,
  mockAccountFindUnique,
  mockAccountUsageFindUnique,
  mockSiteCount,
  mockCampaignCount,
} = vi.hoisted(() => ({
  mockWithAccountContext: vi.fn(),
  mockAccountFindUnique: vi.fn(),
  mockAccountUsageFindUnique: vi.fn(),
  mockSiteCount: vi.fn(),
  mockCampaignCount: vi.fn(),
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
    account: {
      findUnique: mockAccountFindUnique,
    },
    accountUsage: {
      findUnique: mockAccountUsageFindUnique,
    },
    site: {
      count: mockSiteCount,
    },
    campaign: {
      count: mockCampaignCount,
    },
  },
}));

import { GET } from "@/app/api/billing/status/route";

describe("GET /api/billing/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns plan, usage, counts, and Stripe flags from DB read model", async () => {
    mockWithAccountContext.mockResolvedValue({
      accountId: "acc_bill",
      role: MemberRole.owner,
    });

    mockAccountFindUnique.mockResolvedValue({
      planKey: "starter",
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_456",
      paymentStatus: "active",
      paymentGraceUntil: null,
      billingCycleStart: new Date("2025-01-01T00:00:00.000Z"),
      billingCycleEnd: new Date("2025-02-01T00:00:00.000Z"),
    });

    mockAccountUsageFindUnique.mockResolvedValue({
      accountId: "acc_bill",
      submissionCount: 42,
      aiGenerationsCount: 3,
      usageLocked: false,
      overageCount: 0,
    });

    mockSiteCount.mockResolvedValue(2);
    mockCampaignCount.mockResolvedValue(5);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toMatchObject({
      planKey: "starter",
      planName: "Starter",
      paymentStatus: "active",
      paymentGraceUntil: null,
      hasStripe: true,
      limits: expect.objectContaining({
        sites: 3,
        submissionsPerMonth: 1000,
      }),
      features: expect.objectContaining({
        abTesting: true,
      }),
      usage: {
        submissionCount: 42,
        submissionLimit: 1000,
        aiGenerationsCount: 3,
        aiGenerationsLimit: expect.any(Number),
        usageLocked: false,
        overageCount: 0,
      },
      counts: {
        sites: 2,
        sitesLimit: 3,
        campaigns: 5,
      },
    });

    expect(body.billingCycleStart).toBe("2025-01-01T00:00:00.000Z");
    expect(body.billingCycleEnd).toBe("2025-02-01T00:00:00.000Z");

    expect(mockAccountFindUnique).toHaveBeenCalledWith({
      where: { id: "acc_bill" },
      select: expect.any(Object),
    });
  });

  it("allows any account role with canView", async () => {
    mockWithAccountContext.mockResolvedValue({
      accountId: "acc_x",
      role: MemberRole.member,
    });

    mockAccountFindUnique.mockResolvedValue({
      planKey: "free",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      paymentStatus: "active",
      paymentGraceUntil: null,
      billingCycleStart: null,
      billingCycleEnd: null,
    });

    mockAccountUsageFindUnique.mockResolvedValue(null);
    mockSiteCount.mockResolvedValue(0);
    mockCampaignCount.mockResolvedValue(0);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.hasStripe).toBe(false);
    expect(body.usage.submissionCount).toBe(0);
    expect(body.usage.usageLocked).toBe(false);
  });

  it("returns 404 when account row is missing", async () => {
    mockWithAccountContext.mockResolvedValue({
      accountId: "missing",
      role: MemberRole.owner,
    });
    mockAccountFindUnique.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toMatchObject({ code: "NOT_FOUND" });
  });
});
