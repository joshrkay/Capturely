import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { canManageCampaigns } from "@/lib/rbac";
import { resolvePlan } from "@/lib/plans";
import { generateCtaOptions } from "@/lib/ai/claude";

const inputSchema = z.object({
  campaignType: z.enum(["popup", "inline"]).default("popup"),
  formContext: z.string().max(1000).optional().default(""),
});

/** POST /api/ai/suggest-cta — Generate 5 CTA button text options */
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

    const usage = await prisma.accountUsage.findUnique({ where: { accountId: ctx.accountId } });
    if (usage && usage.aiGenerationsCount >= plan.limits.aiGenerationsPerMonth) {
      return NextResponse.json(
        { error: "AI generation limit reached for this billing cycle", code: "USAGE_LIMIT" },
        { status: 402 }
      );
    }

    const body = await req.json();
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await generateCtaOptions({
      campaignType: parsed.data.campaignType,
      formContext: parsed.data.formContext,
    });

    await prisma.accountUsage.upsert({
      where: { accountId: ctx.accountId },
      create: { accountId: ctx.accountId, aiGenerationsCount: 1 },
      update: { aiGenerationsCount: { increment: 1 } },
    });

    await prisma.aiGenerationLog.create({
      data: {
        accountId: ctx.accountId,
        type: "cta_generation",
        inputContext: JSON.stringify(parsed.data),
        outputSchema: result.content,
        tokensUsed: result.tokensUsed,
      },
    });

    // Parse the JSON array from Claude's response
    let options: Array<{ text: string; rationale: string }> = [];
    try {
      let jsonStr = result.content;
      const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) jsonStr = match[1];
      options = JSON.parse(jsonStr) as Array<{ text: string; rationale: string }>;
    } catch {
      // Return raw content if JSON parsing fails
    }

    return NextResponse.json({ options, raw: result.content });
  } catch (err) {
    if (err instanceof AccountContextError) {
      return NextResponse.json({ error: err.message, code: "AUTH_ERROR" }, { status: err.statusCode });
    }
    throw err;
  }
}
