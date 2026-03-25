import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemberRole } from "@/generated/prisma/client";

const {
  mockWithAccountContext,
  mockAccountUpdate,
  mockAccountDelete,
  mockAccountFindUniqueOrThrow,
} = vi.hoisted(() => ({
  mockWithAccountContext: vi.fn(),
  mockAccountUpdate: vi.fn(),
  mockAccountDelete: vi.fn(),
  mockAccountFindUniqueOrThrow: vi.fn(),
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
      findUniqueOrThrow: mockAccountFindUniqueOrThrow,
      update: mockAccountUpdate,
      delete: mockAccountDelete,
    },
  },
}));

import { GET, PATCH } from "@/app/api/settings/route";
import { DELETE } from "@/app/api/settings/account/route";

describe("GET /api/settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns persisted notification preferences from db", async () => {
    mockWithAccountContext.mockResolvedValue({
      accountId: "acc_1",
      role: MemberRole.member,
    });
    mockAccountFindUniqueOrThrow.mockResolvedValue({
      id: "acc_1",
      name: "Acme",
      notificationPreferencesJson: JSON.stringify({ weeklyDigest: true, productUpdates: false }),
    });

    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      settings: {
        accountId: "acc_1",
        displayName: "Acme",
        notificationPreferences: {
          productUpdates: false,
          weeklyDigest: true,
          billingAlerts: true,
          securityAlerts: true,
        },
      },
    });
  });
});

describe("PATCH /api/settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success for owner/admin and forbids member", async () => {
    mockAccountUpdate.mockResolvedValue({
      id: "acc_1",
      name: "Acme",
      notificationPreferencesJson: null,
    });

    mockWithAccountContext.mockResolvedValue({
      accountId: "acc_1",
      role: MemberRole.owner,
    });
    let res = await PATCH(
      new Request("http://localhost/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ displayName: "Acme" }),
      }) as never
    );
    expect(res.status).toBe(200);

    mockWithAccountContext.mockResolvedValue({
      accountId: "acc_1",
      role: MemberRole.admin,
    });
    res = await PATCH(
      new Request("http://localhost/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ displayName: "Acme" }),
      }) as never
    );
    expect(res.status).toBe(200);

    mockWithAccountContext.mockResolvedValue({
      accountId: "acc_1",
      role: MemberRole.member,
    });
    res = await PATCH(
      new Request("http://localhost/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ displayName: "Acme" }),
      }) as never
    );
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({ code: "FORBIDDEN" });
  });

  it("returns 400 for validation errors", async () => {
    mockWithAccountContext.mockResolvedValue({
      accountId: "acc_1",
      role: MemberRole.owner,
    });

    const res = await PATCH(
      new Request("http://localhost/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ displayName: "", rogue: true }),
      }) as never
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(mockAccountUpdate).not.toHaveBeenCalled();
  });

  it("scopes updates to tenant accountId", async () => {
    mockWithAccountContext.mockResolvedValue({
      accountId: "acc_scope",
      role: MemberRole.owner,
    });
    mockAccountUpdate.mockResolvedValue({
      id: "acc_scope",
      name: "Scoped",
      notificationPreferencesJson: null,
    });

    const res = await PATCH(
      new Request("http://localhost/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ displayName: "Scoped" }),
      }) as never
    );

    expect(res.status).toBe(200);
    expect(mockAccountUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "acc_scope" },
      })
    );
  });

  it("persists notification preferences and responds with persisted db value", async () => {
    mockWithAccountContext.mockResolvedValue({
      accountId: "acc_2",
      role: MemberRole.owner,
    });

    mockAccountUpdate.mockResolvedValue({
      id: "acc_2",
      name: "Acme",
      notificationPreferencesJson: JSON.stringify({
        weeklyDigest: true,
        productUpdates: false,
        billingAlerts: true,
        securityAlerts: true,
      }),
    });

    const res = await PATCH(
      new Request("http://localhost/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ notificationPreferences: { weeklyDigest: true } }),
      }) as never
    );

    expect(res.status).toBe(200);
    expect(mockAccountUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          notificationPreferencesJson: JSON.stringify({
            productUpdates: true,
            weeklyDigest: true,
            billingAlerts: true,
            securityAlerts: true,
          }),
        }),
      })
    );

    await expect(res.json()).resolves.toEqual({
      settings: {
        accountId: "acc_2",
        displayName: "Acme",
        notificationPreferences: {
          productUpdates: false,
          weeklyDigest: true,
          billingAlerts: true,
          securityAlerts: true,
        },
      },
    });
  });
});

describe("DELETE /api/settings/account", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows owner and forbids admin/member", async () => {
    mockWithAccountContext.mockResolvedValue({
      accountId: "acc_1",
      role: MemberRole.owner,
    });
    let res = await DELETE(
      new Request("http://localhost/api/settings/account", {
        method: "DELETE",
        body: JSON.stringify({ confirmation: "DELETE" }),
      }) as never
    );
    expect(res.status).toBe(200);
    expect(mockAccountDelete).toHaveBeenCalledWith({ where: { id: "acc_1" } });

    mockWithAccountContext.mockResolvedValue({
      accountId: "acc_1",
      role: MemberRole.admin,
    });
    res = await DELETE(
      new Request("http://localhost/api/settings/account", {
        method: "DELETE",
        body: JSON.stringify({ confirmation: "DELETE" }),
      }) as never
    );
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({ code: "FORBIDDEN" });

    mockWithAccountContext.mockResolvedValue({
      accountId: "acc_1",
      role: MemberRole.member,
    });
    res = await DELETE(
      new Request("http://localhost/api/settings/account", {
        method: "DELETE",
        body: JSON.stringify({ confirmation: "DELETE" }),
      }) as never
    );
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({ code: "FORBIDDEN" });
  });

  it("returns 400 for invalid confirmation", async () => {
    mockWithAccountContext.mockResolvedValue({
      accountId: "acc_1",
      role: MemberRole.owner,
    });

    const res = await DELETE(
      new Request("http://localhost/api/settings/account", {
        method: "DELETE",
        body: JSON.stringify({ confirmation: "NOPE" }),
      }) as never
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(mockAccountDelete).not.toHaveBeenCalled();
  });
});
