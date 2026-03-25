import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildManifest } from "@/lib/manifest";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
};

/** OPTIONS /api/manifests/[publicKey] — CORS preflight */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/** GET /api/manifests/[publicKey] — Serve site manifest for widget */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ publicKey: string }> }
) {
  const { publicKey } = await params;

  if (!publicKey || publicKey.length < 8) {
    return NextResponse.json(
      { error: "Invalid public key", code: "INVALID_KEY" },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    const site = await prisma.site.findUnique({
      where: { publicKey },
      select: {
        id: true,
        publicKey: true,
        status: true,
        campaigns: {
          where: { status: "published" },
          select: {
            id: true,
            type: true,
            targetingJson: true,
            triggerJson: true,
            frequencyJson: true,
            variants: {
              select: {
                id: true,
                schemaJson: true,
              },
            },
          },
        },
      },
    });

    if (!site || site.status !== "active") {
      return NextResponse.json(
        { error: "Site not found", code: "NOT_FOUND" },
        { status: 404, headers: corsHeaders }
      );
    }

    const manifest = buildManifest(site);
    return NextResponse.json(manifest, { headers: corsHeaders });
  } catch {
    return NextResponse.json(
      { error: "Internal error", code: "INTERNAL_ERROR" },
      { status: 500, headers: corsHeaders }
    );
  }
}
