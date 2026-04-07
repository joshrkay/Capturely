import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemberRole } from "@/generated/prisma/client";

// Mock prisma before importing account module
vi.mock("@/lib/db", () => ({
  prisma: {
    accountMember: {
      findFirst: vi.fn(),
    },
    account: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { ensureAccountForUser, withAccountContext } from "@/lib/account";

const mockFindFirst = vi.mocked(prisma.accountMember.findFirst);
const mockCreate = vi.mocked(prisma.account.create);
const mockAuth = vi.mocked(auth);

describe("ensureAccountForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns existing membership when user already has one", async () => {
    mockFindFirst.mockResolvedValue({
      accountId: "acc_1",
      role: MemberRole.owner,
    } as never);

    const result = await ensureAccountForUser("user_1", "test@example.com");

    expect(result).toEqual({
      accountId: "acc_1",
      userId: "user_1",
      role: MemberRole.owner,
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("creates new account + owner membership for new user", async () => {
    mockFindFirst.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      id: "acc_new",
      name: "test@example.com's Account",
      createdAt: new Date(),
      updatedAt: new Date(),
      members: [{ role: MemberRole.owner }],
    } as never);

    const result = await ensureAccountForUser("user_2", "test@example.com");

    expect(result).toEqual({
      accountId: "acc_new",
      userId: "user_2",
      role: MemberRole.owner,
    });
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        name: "test@example.com's Account",
        members: {
          create: {
            userId: "user_2",
            role: MemberRole.owner,
          },
        },
      },
      include: {
        members: {
          where: { userId: "user_2" },
          select: { role: true },
        },
      },
    });
  });

  it("uses default name when email is not provided", async () => {
    mockFindFirst.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      id: "acc_default",
      name: "My Account",
      createdAt: new Date(),
      updatedAt: new Date(),
      members: [{ role: MemberRole.owner }],
    } as never);

    const result = await ensureAccountForUser("user_3");

    expect(result.accountId).toBe("acc_default");
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "My Account",
        }),
      })
    );
  });

  it("is idempotent — second call returns same result", async () => {
    mockFindFirst.mockResolvedValue({
      accountId: "acc_1",
      role: MemberRole.owner,
    } as never);

    const first = await ensureAccountForUser("user_1");
    const second = await ensureAccountForUser("user_1");

    expect(first).toEqual(second);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("recovers when create fails but membership exists on retry lookup", async () => {
    mockFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        accountId: "acc_retry",
        role: MemberRole.owner,
      } as never);
    mockCreate.mockRejectedValueOnce(new Error("insert failed"));

    const result = await ensureAccountForUser("user_retry", "retry@example.com");

    expect(result).toEqual({
      accountId: "acc_retry",
      userId: "user_retry",
      role: MemberRole.owner,
    });
    expect(mockFindFirst).toHaveBeenCalledTimes(2);
  });
});

describe("withAccountContext integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates account context on first authenticated request", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_new",
      sessionClaims: { email: "new@example.com" },
    } as never);
    mockFindFirst.mockResolvedValueOnce(null);
    mockCreate.mockResolvedValueOnce({
      id: "acc_new",
      members: [{ role: MemberRole.owner }],
    } as never);

    const ctx = await withAccountContext();

    expect(ctx).toEqual({
      accountId: "acc_new",
      userId: "user_new",
      role: MemberRole.owner,
    });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "new@example.com's Account",
        }),
      })
    );
  });

  it("returns existing membership for returning authenticated user", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_existing",
      sessionClaims: { email: "existing@example.com" },
    } as never);
    mockFindFirst.mockResolvedValueOnce({
      accountId: "acc_existing",
      role: MemberRole.admin,
    } as never);

    const ctx = await withAccountContext();

    expect(ctx).toEqual({
      accountId: "acc_existing",
      userId: "user_existing",
      role: MemberRole.admin,
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("handles partial-failure path and succeeds after retry lookup", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_partial",
      sessionClaims: { email: "partial@example.com" },
    } as never);
    mockFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        accountId: "acc_partial",
        role: MemberRole.owner,
      } as never);
    mockCreate.mockRejectedValueOnce(new Error("transaction aborted"));

    const ctx = await withAccountContext();

    expect(ctx).toEqual({
      accountId: "acc_partial",
      userId: "user_partial",
      role: MemberRole.owner,
    });
    expect(mockFindFirst).toHaveBeenCalledTimes(2);
  });
});
