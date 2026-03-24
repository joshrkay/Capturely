import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { canManageCampaigns } from "@/lib/rbac";

/** GET /api/ai/history — List recent AI generation logs for this account */
export async function GET(req: NextRequest) {
  try {
    const ctx = await withAccountContext();
    if (!canManageCampaigns(ctx.role)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const type = req.nextUrl.searchParams.get("type") ?? undefined;
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "20"), 50);

    const logs = await prisma.aiGenerationLog.findMany({
      where: {
        accountId: ctx.accountId,
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        type: true,
        inputContext: true,
        outputSchema: true,
        tokensUsed: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ logs });
  } catch (err) {
    if (err instanceof AccountContextError) {
      return NextResponse.json({ error: err.message, code: "AUTH_ERROR" }, { status: err.statusCode });
    }
    throw err;
  }
}
