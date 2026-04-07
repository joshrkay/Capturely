import { auth, currentUser } from "@clerk/nextjs/server";
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

  // Create new account + owner membership.
  // If this fails due to a race/partial retry scenario, re-check membership once.
  try {
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
  } catch (error) {
    const retried = await prisma.accountMember.findFirst({
      where: { userId },
      select: { accountId: true, role: true },
    });

    if (retried) {
      return {
        accountId: retried.accountId,
        userId,
        role: retried.role,
      };
    }

    throw error;
  }
}

/**
 * Resolves accountId + role from the Clerk session.
 * Ensures first-login users get an account before membership-dependent operations.
 */
export async function withAccountContext(): Promise<AccountContext> {
  const { userId } = await auth();

  if (!userId) {
    throw new AccountContextError("Unauthorized", 401);
  }

  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;

  try {
    return await ensureAccountForUser(userId, email);
  } catch {
    const membership = await prisma.accountMember.findFirst({
      where: { userId },
      select: { accountId: true, role: true },
    });

    if (membership) {
      return {
        accountId: membership.accountId,
        userId,
        role: membership.role,
      };
    }

    throw new AccountContextError("No account membership found", 403);
  }
}

export class AccountContextError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "AccountContextError";
    this.statusCode = statusCode;
  }
}
