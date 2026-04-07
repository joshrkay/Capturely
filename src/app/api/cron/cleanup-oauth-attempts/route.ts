import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const UNUSED_RETENTION_MS = 24 * 60 * 60 * 1000;
const USED_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * POST /api/cron/cleanup-oauth-attempts — Delete stale Shopify OAuth attempt records.
 * Called by Vercel Cron (CRON_SECRET).
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET ?? ""}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const staleUnusedBefore = new Date(now - UNUSED_RETENTION_MS);
  const staleUsedBefore = new Date(now - USED_RETENTION_MS);

  const deleted = await prisma.oAuthAttempt.deleteMany({
    where: {
      OR: [
        { usedAt: null, createdAt: { lt: staleUnusedBefore } },
        { usedAt: { lt: staleUsedBefore } },
      ],
    },
  });

  return NextResponse.json({
    deletedCount: deleted.count,
    staleUnusedBefore: staleUnusedBefore.toISOString(),
    staleUsedBefore: staleUsedBefore.toISOString(),
  });
}
