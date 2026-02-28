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

import { prisma } from "@/lib/db";
import { ensureAccountForUser } from "@/lib/account";

const mockFindFirst = vi.mocked(prisma.accountMember.findFirst);
const mockCreate = vi.mocked(prisma.account.create);

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
});
