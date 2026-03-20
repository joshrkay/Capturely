import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { canManageSites, canView } from "@/lib/rbac";
import { generatePublicKey, generateSecretKey } from "@/lib/keys";

const createSiteSchema = z.object({
  name: z.string().min(1).max(100),
  primaryDomain: z.string().min(1).max(255),
  platformType: z.string().max(50).optional(),
});

/** Normalize domain: lowercase, strip protocol and trailing slash */
function normalizeDomain(domain: string): string {
  let d = domain.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "");
  d = d.replace(/\/+$/, "");
  return d;
}

/** POST /api/sites — Create a new site */
export async function POST(req: NextRequest) {
  try {
    const ctx = await withAccountContext();

    if (!canManageSites(ctx.role)) {
      return NextResponse.json(
        { error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createSiteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const site = await prisma.site.create({
      data: {
        accountId: ctx.accountId,
        name: parsed.data.name,
        primaryDomain: normalizeDomain(parsed.data.primaryDomain),
        platformType: parsed.data.platformType ?? null,
        publicKey: generatePublicKey(),
        secretKey: generateSecretKey(),
      },
      select: {
        id: true,
        name: true,
        primaryDomain: true,
        platformType: true,
        publicKey: true,
        secretKey: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ site }, { status: 201 });
  } catch (error) {
    if (error instanceof AccountContextError) {
      return NextResponse.json(
        { error: error.message, code: "AUTH_ERROR" },
        { status: error.statusCode }
      );
    }
    throw error;
  }
}

/** GET /api/sites — List sites for the account */
export async function GET() {
  try {
    const ctx = await withAccountContext();

    if (!canView(ctx.role)) {
      return NextResponse.json(
        { error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const sites = await prisma.site.findMany({
      where: { accountId: ctx.accountId },
      select: {
        id: true,
        name: true,
        primaryDomain: true,
        platformType: true,
        publicKey: true,
        // secretKey intentionally omitted from list view
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ sites });
  } catch (error) {
    if (error instanceof AccountContextError) {
      return NextResponse.json(
        { error: error.message, code: "AUTH_ERROR" },
        { status: error.statusCode }
      );
    }
    throw error;
  }
}
