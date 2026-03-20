import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { canManageSites, canView } from "@/lib/rbac";

const updateSiteSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  primaryDomain: z.string().min(1).max(255).optional(),
  platformType: z.string().max(50).optional().nullable(),
  status: z.enum(["active", "archived"]).optional(),
});

/** GET /api/sites/:id — Get a single site (includes secretKey for owner/admin) */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await withAccountContext();
    const { id } = await params;

    if (!canView(ctx.role)) {
      return NextResponse.json(
        { error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const site = await prisma.site.findFirst({
      where: { id, accountId: ctx.accountId },
    });

    if (!site) {
      return NextResponse.json(
        { error: "Site not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Only owner/admin can see the secret key
    const showSecret = canManageSites(ctx.role);

    return NextResponse.json({
      site: {
        id: site.id,
        name: site.name,
        primaryDomain: site.primaryDomain,
        platformType: site.platformType,
        publicKey: site.publicKey,
        secretKey: showSecret ? site.secretKey : undefined,
        status: site.status,
        createdAt: site.createdAt,
        updatedAt: site.updatedAt,
      },
    });
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

/** PATCH /api/sites/:id — Update a site */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await withAccountContext();
    const { id } = await params;

    if (!canManageSites(ctx.role)) {
      return NextResponse.json(
        { error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = updateSiteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify site belongs to this account
    const existing = await prisma.site.findFirst({
      where: { id, accountId: ctx.accountId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Site not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.primaryDomain !== undefined) {
      let d = parsed.data.primaryDomain.trim().toLowerCase();
      d = d.replace(/^https?:\/\//, "").replace(/\/+$/, "");
      data.primaryDomain = d;
    }
    if (parsed.data.platformType !== undefined) data.platformType = parsed.data.platformType;
    if (parsed.data.status !== undefined) data.status = parsed.data.status;

    const site = await prisma.site.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        primaryDomain: true,
        platformType: true,
        publicKey: true,
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ site });
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
