import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAccountId } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const accountId = await getAccountId();

    await prisma.notification.updateMany({
      where: { accountId, readAt: null },
      data: { readAt: new Date() },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Mark all read error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
