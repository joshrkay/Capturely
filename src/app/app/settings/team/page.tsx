import { prisma } from "@/lib/db";
import { withAccountContext } from "@/lib/account";
import { canManageTeam } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { TeamTab } from "../components/team-tab";

export default async function TeamPage() {
  let ctx;
  try {
    ctx = await withAccountContext();
  } catch {
    redirect("/sign-in");
  }

  const members = await prisma.accountMember.findMany({
    where: { accountId: ctx.accountId },
    select: {
      id: true,
      userId: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <TeamTab
      members={members}
      currentUserId={ctx.userId}
      isManager={canManageTeam(ctx.role)}
    />
  );
}
