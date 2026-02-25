import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAccountId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const accountId = await getAccountId();
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = 20;
    const skip = (page - 1) * pageSize;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { accountId },
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip,
      }),
      prisma.notification.count({
        where: { accountId, readAt: null },
      }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Notifications list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
