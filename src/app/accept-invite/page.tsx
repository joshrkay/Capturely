import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { MemberRole } from "@/generated/prisma/client";

interface AcceptInvitePageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AcceptInvitePage({ searchParams }: AcceptInvitePageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">Invalid Link</h2>
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">No invite token provided.</p>
        </div>
      </div>
    );
  }

  const { userId } = await auth();
  if (!userId) {
    // Redirect to sign-in, then back here
    redirect(`/sign-in?redirect_url=/accept-invite?token=${encodeURIComponent(token)}`);
  }

  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { account: { select: { name: true } } },
  });

  if (!invite) {
    return <InviteError title="Not Found" message="This invite link is invalid." />;
  }

  if (invite.status === "revoked") {
    return <InviteError title="Revoked" message="This invite has been revoked." />;
  }

  if (invite.status === "accepted") {
    // Idempotent — already accepted, redirect to dashboard
    redirect("/app");
  }

  if (invite.status === "expired" || invite.expiresAt < new Date()) {
    // Mark as expired if not already
    if (invite.status === "pending") {
      await prisma.invite.update({
        where: { id: invite.id },
        data: { status: "expired" },
      });
    }
    return <InviteError title="Expired" message="This invite has expired. Please request a new one." />;
  }

  // Check if user is already a member of this account
  const existingMembership = await prisma.accountMember.findUnique({
    where: {
      accountId_userId: {
        accountId: invite.accountId,
        userId,
      },
    },
  });

  if (existingMembership) {
    // Already a member — mark invite accepted and redirect
    await prisma.invite.update({
      where: { id: invite.id },
      data: { status: "accepted" },
    });
    redirect("/app");
  }

  // Create membership and mark invite as accepted in a transaction
  await prisma.$transaction([
    prisma.accountMember.create({
      data: {
        accountId: invite.accountId,
        userId,
        role: invite.role as MemberRole,
      },
    }),
    prisma.invite.update({
      where: { id: invite.id },
      data: { status: "accepted" },
    }),
  ]);

  redirect("/app");
}

function InviteError({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950">
        <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">{title}</h2>
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{message}</p>
        <a
          href="/app"
          className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
