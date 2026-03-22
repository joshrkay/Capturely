import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { canView } from "@/lib/rbac";

/** GET /api/campaigns/:id/optimization — List optimization runs */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await withAccountContext();
    if (!canView(ctx.role)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const { id } = await params;
    const campaign = await prisma.campaign.findFirst({
      where: { id, accountId: ctx.accountId },
    });
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const runs = await prisma.optimizationRun.findMany({
      where: { campaignId: id },
      include: {
        variants: true,
      },
      orderBy: { startedAt: "desc" },
    });

    return NextResponse.json({ runs });
  } catch (err) {
    if (err instanceof AccountContextError) {
      return NextResponse.json({ error: err.message, code: "AUTH_ERROR" }, { status: err.statusCode });
    }
    throw err;
  }
}
