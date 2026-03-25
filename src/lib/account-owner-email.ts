import { clerkClient } from "@clerk/nextjs/server";
import { MemberRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

/**
 * Resolves the Clerk primary (or first) email for the account's owner member.
 * Returns null if no owner, Clerk errors, or the user has no email — callers should log and skip send.
 */
export async function getAccountOwnerEmail(accountId: string): Promise<string | null> {
  const member = await prisma.accountMember.findFirst({
    where: { accountId, role: MemberRole.owner },
    select: { userId: true },
  });
  if (!member) {
    return null;
  }

  const { userId } = member;
  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const primary = user.primaryEmailAddress?.emailAddress;
    if (primary) {
      return primary;
    }
    const first = user.emailAddresses[0]?.emailAddress;
    return first ?? null;
  } catch (err) {
    console.error("[account-owner-email] Clerk lookup failed", { accountId, userId, err });
    return null;
  }
}
