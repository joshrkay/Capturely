import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { withAccountContext, AccountContextError } from "@/lib/account";
import { canManageTeam } from "@/lib/rbac";
import { MemberRole } from "@/generated/prisma/client";

const createInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]).default("member"),
});

/** POST /api/invites — Create a new invite */
export async function POST(req: NextRequest) {
  try {
    const ctx = await withAccountContext();

    if (!canManageTeam(ctx.role)) {
      return NextResponse.json(
        { error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createInviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, role } = parsed.data;

    // Check if user is already a member
    const existingMembers = await prisma.accountMember.findMany({
      where: { accountId: ctx.accountId },
      select: { userId: true },
    });
    // We can't check by email directly since AccountMember stores userId.
    // We check for existing pending invite instead.

    const existingInvite = await prisma.invite.findFirst({
      where: {
        accountId: ctx.accountId,
        email,
        status: "pending",
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: "An invite for this email is already pending", code: "INVITE_EXISTS" },
        { status: 409 }
      );
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await prisma.invite.create({
      data: {
        accountId: ctx.accountId,
        email,
        role: role as MemberRole,
        token,
        expiresAt,
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ invite }, { status: 201 });
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

/** GET /api/invites — List invites for the account */
export async function GET() {
  try {
    const ctx = await withAccountContext();

    if (!canManageTeam(ctx.role)) {
      return NextResponse.json(
        { error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const invites = await prisma.invite.findMany({
      where: { accountId: ctx.accountId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invites });
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
