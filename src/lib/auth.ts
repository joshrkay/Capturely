import { auth } from '@clerk/nextjs/server';
import { prisma } from './prisma';

export async function getAccountId(): Promise<string> {
  const { userId, orgId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  const clerkOrgId = orgId || userId;

  let account = await prisma.account.findUnique({
    where: { clerkOrgId },
  });

  if (!account) {
    account = await prisma.account.create({
      data: {
        clerkOrgId,
        name: 'Default',
      },
    });
  }

  return account.id;
}
