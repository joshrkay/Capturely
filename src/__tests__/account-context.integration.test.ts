import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemberRole } from "@/generated/prisma/client";

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
import { withAccountContext } from "@/lib/account";

const mockFindFirst = vi.mocked(prisma.accountMember.findFirst);
const mockCreate = vi.mocked(prisma.account.create);
const mockAuth = vi.mocked(auth);

describe("withAccountContext integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates membership on first authenticated login", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_1",
      sessionClaims: { email_address: "first@login.test" },
    } as never);
    mockFindFirst.mockResolvedValueOnce(null);
    mockCreate.mockResolvedValueOnce({
      id: "acc_new",
      members: [{ role: MemberRole.owner }],
    } as never);

    const ctx = await withAccountContext();

    expect(ctx).toEqual({
      accountId: "acc_new",
      userId: "user_1",
      role: MemberRole.owner,
    });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "first@login.test's Account",
        }),
      })
    );
  });

  it("returns existing membership for returning users", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_returning",
      sessionClaims: { email: "returning@login.test" },
    } as never);
    mockFindFirst.mockResolvedValueOnce({
      accountId: "acc_existing",
      role: MemberRole.admin,
    } as never);

    const ctx = await withAccountContext();

    expect(ctx).toEqual({
      accountId: "acc_existing",
      userId: "user_returning",
      role: MemberRole.admin,
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("recovers from create failure by retrying membership lookup", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_retry",
      sessionClaims: { email_address: "retry@login.test" },
    } as never);
    mockFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        accountId: "acc_retry",
        role: MemberRole.owner,
      } as never);
    mockCreate.mockRejectedValueOnce(new Error("race failure"));

    const ctx = await withAccountContext();

    expect(ctx).toEqual({
      accountId: "acc_retry",
      userId: "user_retry",
      role: MemberRole.owner,
    });
    expect(mockFindFirst).toHaveBeenCalledTimes(2);
  });
});
