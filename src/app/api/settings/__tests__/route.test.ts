import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemberRole } from "@/generated/prisma/client";

vi.mock("@/lib/account", () => ({
  withAccountContext: vi.fn(),
  AccountContextError: class AccountContextError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    account: {
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { withAccountContext } from "@/lib/account";
import { prisma } from "@/lib/db";
import { PATCH } from "@/app/api/settings/route";
import { DELETE } from "@/app/api/settings/account/route";

const mockWithAccountContext = vi.mocked(withAccountContext);
const mockUpdate = vi.mocked(prisma.account.update);
const mockDelete = vi.mocked(prisma.account.delete);

describe("PATCH /api/settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWithAccountContext.mockResolvedValue({
      accountId: "acc_1",
      userId: "user_1",
      role: MemberRole.owner,
    });
  });

  it("updates account fields for owner", async () => {
    mockUpdate.mockResolvedValue({
      id: "acc_1",
      name: "Acme",
      timezone: "UTC",
      language: "en",
      notificationPreferences: null,
    } as never);

    const res = await PATCH(
      new Request("http://localhost/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ name: "Acme", timezone: "UTC", language: "en" }),
      }) as never
    );

    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "acc_1" } })
    );
  });

  it("rejects member when updating account fields", async () => {
    mockWithAccountContext.mockResolvedValue({
      accountId: "acc_1",
      userId: "user_2",
      role: MemberRole.member,
    });

    const res = await PATCH(
      new Request("http://localhost/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ name: "Nope" }),
      }) as never
    );

    expect(res.status).toBe(403);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("allows member to update notification preferences", async () => {
    mockWithAccountContext.mockResolvedValue({
      accountId: "acc_1",
      userId: "user_2",
      role: MemberRole.member,
    });
    mockUpdate.mockResolvedValue({
      id: "acc_1",
      name: "Acme",
      timezone: "UTC",
      language: "en",
      notificationPreferences: JSON.stringify({
        newSubmission: true,
        usageWarning: true,
        teamInvite: true,
        campaignPublish: false,
      }),
    } as never);

    const res = await PATCH(
      new Request("http://localhost/api/settings", {
        method: "PATCH",
        body: JSON.stringify({
          notificationPreferences: {
            newSubmission: true,
            usageWarning: true,
            teamInvite: true,
            campaignPublish: false,
          },
        }),
      }) as never
    );

    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledOnce();
  });

  it("returns 400 for invalid payload", async () => {
    const res = await PATCH(
      new Request("http://localhost/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ name: "" }),
      }) as never
    );

    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/settings/account", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWithAccountContext.mockResolvedValue({
      accountId: "acc_1",
      userId: "user_1",
      role: MemberRole.owner,
    });
  });

  it("deletes account for owner", async () => {
    mockDelete.mockResolvedValue({ id: "acc_1" } as never);
    const res = await DELETE(
      new Request("http://localhost/api/settings/account", {
        method: "DELETE",
        body: JSON.stringify({ confirmation: "DELETE" }),
      }) as never
    );

    expect(res.status).toBe(200);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "acc_1" } });
  });

  it("returns 403 for admin", async () => {
    mockWithAccountContext.mockResolvedValue({
      accountId: "acc_1",
      userId: "admin_1",
      role: MemberRole.admin,
    });

    const res = await DELETE(
      new Request("http://localhost/api/settings/account", {
        method: "DELETE",
        body: JSON.stringify({ confirmation: "DELETE" }),
      }) as never
    );

    expect(res.status).toBe(403);
  });

  it("returns 400 for invalid confirmation", async () => {
    const res = await DELETE(
      new Request("http://localhost/api/settings/account", {
        method: "DELETE",
        body: JSON.stringify({ confirmation: "NOPE" }),
      }) as never
    );

    expect(res.status).toBe(400);
  });
});
