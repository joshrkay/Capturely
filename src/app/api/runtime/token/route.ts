import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/runtime-token";

const requestSchema = z.object({
  publicKey: z.string().min(1),
});

// CORS headers for widget requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/** OPTIONS /api/runtime/token — CORS preflight */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/** POST /api/runtime/token — Request a 60s signed token for submitting */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR" },
        { status: 400, headers: corsHeaders }
      );
    }

    const { publicKey } = parsed.data;

    // Verify the public key exists and belongs to an active site
    const site = await prisma.site.findUnique({
      where: { publicKey },
      select: { id: true, status: true },
    });

    if (!site || site.status !== "active") {
      return NextResponse.json(
        { error: "Invalid public key", code: "INVALID_KEY" },
        { status: 404, headers: corsHeaders }
      );
    }

    const token = signToken(publicKey);

    return NextResponse.json({ token }, { headers: corsHeaders });
  } catch {
    return NextResponse.json(
      { error: "Internal error", code: "INTERNAL_ERROR" },
      { status: 500, headers: corsHeaders }
    );
  }
}
