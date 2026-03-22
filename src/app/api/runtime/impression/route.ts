import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const impressionSchema = z.object({
  visitorId: z.string().min(1),
  experimentKey: z.string().min(1),
  variationId: z.string().min(1),
  campaignId: z.string().optional(),
  siteId: z.string().optional(),
});

/** POST /api/runtime/impression — Track experiment impressions (public, CORS) */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = impressionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await prisma.experimentEvent.create({
    data: {
      visitorId: parsed.data.visitorId,
      experimentKey: parsed.data.experimentKey,
      variationId: parsed.data.variationId,
      eventType: "impression",
      campaignId: parsed.data.campaignId,
      siteId: parsed.data.siteId,
    },
  });

  return NextResponse.json({ tracked: true });
}

/** OPTIONS — CORS preflight */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
