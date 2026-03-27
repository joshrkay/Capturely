import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemberRole } from "@/generated/prisma/client";

type VariantState = {
  id: string;
  campaignId: string;
  name: string;
  isControl: boolean;
  trafficPercentage: number;
  schemaJson: string;
  schemaVersion: number;
  createdAt: number;
};

const {
  mockWithAccountContext,
  mockCampaignFindFirst,
  mockCampaignUpdate,
  mockVariantFindFirst,
  mockVariantUpdate,
  mockTransaction,
} = vi.hoisted(() => ({
  mockWithAccountContext: vi.fn(),
  mockCampaignFindFirst: vi.fn(),
  mockCampaignUpdate: vi.fn(),
  mockVariantFindFirst: vi.fn(),
  mockVariantUpdate: vi.fn(),
  mockTransaction: vi.fn(),
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
    campaign: {
      findFirst: mockCampaignFindFirst,
      update: mockCampaignUpdate,
    },
    variant: {
      findFirst: mockVariantFindFirst,
      update: mockVariantUpdate,
    },
    $transaction: mockTransaction,
  },
}));

import { PATCH } from "@/app/api/campaigns/[id]/variants/route";

const CAMP_1 = "camp_1";
const CAMP_2 = "camp_2";
const VAR_A = "cma1111111111111111111111";
const VAR_B = "cma2222222222222222222222";
const VAR_C = "cma3333333333333333333333";
const VAR_OTHER = "cma4444444444444444444444";
const VAR_MISSING = "cma5555555555555555555555";

function makeTxHarness(initial: VariantState[]) {
  let variants = initial.map((v) => ({ ...v }));
  let queue = Promise.resolve();

  const tx = {
    variant: {
      findUnique: vi.fn(async ({ where: { id } }: { where: { id: string } }) => {
        const found = variants.find((v) => v.id === id);
        return found ? { id: found.id, campaignId: found.campaignId } : null;
      }),
      findMany: vi.fn(async ({ where: { campaignId } }: { where: { campaignId: string } }) => {
        return variants
          .filter((v) => v.campaignId === campaignId)
          .sort((a, b) => a.createdAt - b.createdAt)
          .map((v) => ({
            id: v.id,
            name: v.name,
            isControl: v.isControl,
            trafficPercentage: v.trafficPercentage,
          }));
      }),
      updateMany: vi.fn(async ({ where: { campaignId }, data: { isControl } }: { where: { campaignId: string }, data: { isControl: boolean } }) => {
        variants = variants.map((v) => (v.campaignId === campaignId ? { ...v, isControl } : v));
        return { count: variants.filter((v) => v.campaignId === campaignId).length };
      }),
      update: vi.fn(async ({ where: { id }, data }: { where: { id: string }, data: Record<string, unknown> }) => {
        const idx = variants.findIndex((v) => v.id === id);
        if (idx === -1) {
          throw new Error("missing");
        }
        const current = variants[idx];
        variants[idx] = {
          ...current,
          ...(data.name !== undefined ? { name: String(data.name) } : {}),
          ...(data.schemaJson !== undefined ? { schemaJson: String(data.schemaJson) } : {}),
          ...(data.isControl !== undefined ? { isControl: Boolean(data.isControl) } : {}),
          ...(data.trafficPercentage !== undefined ? { trafficPercentage: Number(data.trafficPercentage) } : {}),
          ...(data.schemaVersion && typeof data.schemaVersion === "object"
            ? { schemaVersion: current.schemaVersion + 1 }
            : {}),
        };
        return variants[idx];
      }),
    },
  };

  mockTransaction.mockImplementation((cb: (arg: typeof tx) => Promise<unknown>) => {
    const run = queue.then(() => cb(tx));
    queue = run.then(() => undefined, () => undefined);
    return run;
  });

  return {
    getState: () => variants.map((v) => ({ ...v })),
  };
}

describe("PATCH /api/campaigns/:id/variants promotion flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWithAccountContext.mockResolvedValue({
      accountId: "acc_1",
      role: MemberRole.owner,
    });
    mockCampaignFindFirst.mockResolvedValue({ id: CAMP_1, accountId: "acc_1" });
    mockCampaignUpdate.mockResolvedValue({ id: CAMP_1 });
  });

  it("promotes selected variant, demotes siblings, and rebalances to a single control", async () => {
    makeTxHarness([
      { id: VAR_A, campaignId: CAMP_1, name: "Control", isControl: true, trafficPercentage: 50, schemaJson: "{}", schemaVersion: 1, createdAt: 1 },
      { id: VAR_B, campaignId: CAMP_1, name: "B", isControl: false, trafficPercentage: 25, schemaJson: "{}", schemaVersion: 1, createdAt: 2 },
      { id: VAR_C, campaignId: CAMP_1, name: "C", isControl: false, trafficPercentage: 25, schemaJson: "{}", schemaVersion: 1, createdAt: 3 },
    ]);

    const res = await PATCH(
      new Request("http://localhost/api/campaigns/camp_1/variants", {
        method: "PATCH",
        body: JSON.stringify({ variantId: VAR_B, isControl: true }),
      }) as never,
      { params: Promise.resolve({ id: CAMP_1 }) }
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.promotedVariantId).toBe(VAR_B);

    const controls = json.allVariants.filter((v: { isControl: boolean }) => v.isControl);
    expect(controls).toHaveLength(1);
    expect(controls[0].id).toBe(VAR_B);
    const totalTraffic = json.allVariants.reduce(
      (sum: number, v: { trafficPercentage: number }) => sum + v.trafficPercentage,
      0
    );
    expect(totalTraffic).toBe(100);
  });

  it("returns 409 conflict when promoted variant does not belong to campaign", async () => {
    makeTxHarness([
      { id: VAR_OTHER, campaignId: CAMP_2, name: "Elsewhere", isControl: true, trafficPercentage: 100, schemaJson: "{}", schemaVersion: 1, createdAt: 1 },
    ]);

    const res = await PATCH(
      new Request("http://localhost/api/campaigns/camp_1/variants", {
        method: "PATCH",
        body: JSON.stringify({ variantId: VAR_OTHER, isControl: true }),
      }) as never,
      { params: Promise.resolve({ id: CAMP_1 }) }
    );

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({ code: "VARIANT_CAMPAIGN_CONFLICT" });
  });

  it("returns 409 conflict when promoted variant was deleted/missing", async () => {
    makeTxHarness([]);

    const res = await PATCH(
      new Request("http://localhost/api/campaigns/camp_1/variants", {
        method: "PATCH",
        body: JSON.stringify({ variantId: VAR_MISSING, isControl: true }),
      }) as never,
      { params: Promise.resolve({ id: CAMP_1 }) }
    );

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({ code: "VARIANT_NOT_FOUND_CONFLICT" });
  });

  it("keeps single-control invariant under concurrent promotions", async () => {
    const harness = makeTxHarness([
      { id: VAR_A, campaignId: CAMP_1, name: "A", isControl: true, trafficPercentage: 34, schemaJson: "{}", schemaVersion: 1, createdAt: 1 },
      { id: VAR_B, campaignId: CAMP_1, name: "B", isControl: false, trafficPercentage: 33, schemaJson: "{}", schemaVersion: 1, createdAt: 2 },
      { id: VAR_C, campaignId: CAMP_1, name: "C", isControl: false, trafficPercentage: 33, schemaJson: "{}", schemaVersion: 1, createdAt: 3 },
    ]);

    const [r1, r2] = await Promise.all([
      PATCH(
        new Request("http://localhost/api/campaigns/camp_1/variants", {
          method: "PATCH",
          body: JSON.stringify({ variantId: VAR_B, isControl: true }),
        }) as never,
        { params: Promise.resolve({ id: CAMP_1 }) }
      ),
      PATCH(
        new Request("http://localhost/api/campaigns/camp_1/variants", {
          method: "PATCH",
          body: JSON.stringify({ variantId: VAR_C, isControl: true }),
        }) as never,
        { params: Promise.resolve({ id: CAMP_1 }) }
      ),
    ]);

    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);

    const finalState = harness.getState().filter((v) => v.campaignId === CAMP_1);
    expect(finalState.filter((v) => v.isControl)).toHaveLength(1);
    expect(finalState.reduce((sum, v) => sum + v.trafficPercentage, 0)).toBe(100);
  });
});
