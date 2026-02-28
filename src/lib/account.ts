import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { MemberRole } from "@/generated/prisma/client";

export interface AccountContext {
  accountId: string;
  userId: string;
  role: MemberRole;
}

/**
 * Idempotent: creates an Account + owner membership on first login.
 * If the user already has a membership, returns the existing account context.
 */
export async function ensureAccountForUser(
  userId: string,
  email?: string
): Promise<AccountContext> {
  // Check for existing membership first
  const existing = await prisma.accountMember.findFirst({
    where: { userId },
    select: { accountId: true, role: true },
  });

  if (existing) {
    return {
      accountId: existing.accountId,
      userId,
      role: existing.role,
    };
  }

  // Create new account + owner membership in a transaction
  const account = await prisma.account.create({
    data: {
      name: email ? `${email}'s Account` : "My Account",
      members: {
        create: {
          userId,
          role: MemberRole.owner,
        },
      },
    },
    include: {
      members: {
        where: { userId },
        select: { role: true },
      },
    },
  });

  return {
    accountId: account.id,
    userId,
    role: account.members[0].role,
  };
}

/**
 * Resolves accountId + role from the Clerk session.
 * Throws a 403-style error if the user has no membership.
 */
export async function withAccountContext(): Promise<AccountContext> {
  const { userId } = await auth();

  if (!userId) {
    throw new AccountContextError("Unauthorized", 401);
  }

  const membership = await prisma.accountMember.findFirst({
    where: { userId },
    select: { accountId: true, role: true },
  });

  if (!membership) {
    throw new AccountContextError("No account membership found", 403);
  }

  return {
    accountId: membership.accountId,
    userId,
    role: membership.role,
  };
}

export class AccountContextError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "AccountContextError";
    this.statusCode = statusCode;
  }
}
