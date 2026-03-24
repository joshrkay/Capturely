import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { canManageCampaigns } from "@/lib/rbac";
import { resolvePlan } from "@/lib/plans";
import { generateCtaOptions } from "@/lib/ai/claude";

const ctaSchema = z.object({
  formContext: z.string().min(1).max(2000),
  campaignType: z.enum(["popup", "inline"]),
});

/** POST /api/ai/generate-cta — AI CTA button text optimization */
export async function POST(req: NextRequest) {
  try {
    const ctx = await withAccountContext();
    if (!canManageCampaigns(ctx.role)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const account = await prisma.account.findUnique({
      where: { id: ctx.accountId },
      select: { planKey: true },
    });
    const plan = resolvePlan(account?.planKey ?? "free");
    if (!plan.features.aiCopilot) {
      return NextResponse.json(
        { error: "AI Copilot requires Growth plan or higher", code: "PLAN_LIMIT" },
        { status: 403 }
      );
    }

    const usage = await prisma.accountUsage.findUnique({
      where: { accountId: ctx.accountId },
    });
    if (usage && usage.aiGenerationsCount >= plan.limits.aiGenerationsPerMonth) {
      return NextResponse.json(
        { error: "AI generation limit reached for this billing cycle", code: "USAGE_LIMIT" },
        { status: 402 }
      );
    }

    const body = await req.json();
    const parsed = ctaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await generateCtaOptions(parsed.data);

    await prisma.accountUsage.upsert({
      where: { accountId: ctx.accountId },
      create: { accountId: ctx.accountId, aiGenerationsCount: 1 },
      update: { aiGenerationsCount: { increment: 1 } },
    });

    await prisma.aiGenerationLog.create({
      data: {
        accountId: ctx.accountId,
        type: "cta_optimization",
        inputContext: JSON.stringify(parsed.data),
        outputSchema: result.content,
        tokensUsed: result.tokensUsed,
      },
    });

    return NextResponse.json({ options: result.content, tokensUsed: result.tokensUsed });
  } catch (err) {
    if (err instanceof AccountContextError) {
      return NextResponse.json({ error: err.message, code: "AUTH_ERROR" }, { status: err.statusCode });
    }
    throw err;
  }
}
