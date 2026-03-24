import { redirect } from "next/navigation";
import { withAccountContext } from "@/lib/account";
import { prisma } from "@/lib/db";
import { canManageTeam } from "@/lib/rbac";
import { parseNotificationPreferences } from "@/lib/settings";
import { SettingsTabs } from "./components/settings-tabs";
import { TeamTab } from "./components/team-tab";

export default async function SettingsPage() {
  let ctx;
  try {
    ctx = await withAccountContext();
  } catch {
    redirect("/sign-in");
  }

  const [account, members] = await Promise.all([
    prisma.account.findUnique({
      where: { id: ctx.accountId },
      select: {
        id: true,
        name: true,
        timezone: true,
        language: true,
        notificationPreferences: true,
      },
    }),
    prisma.accountMember.findMany({
      where: { accountId: ctx.accountId },
      select: {
        id: true,
        userId: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!account) {
    redirect("/sign-in");
  }

  return (
    <SettingsTabs
      role={ctx.role}
      account={{
        name: account.name,
        timezone: account.timezone ?? "UTC",
        language: account.language ?? "en",
        notificationPreferences: parseNotificationPreferences(
          account.notificationPreferences
        ),
      }}
      teamPanel={
        <TeamTab
          members={members}
          currentUserId={ctx.userId}
          isManager={canManageTeam(ctx.role)}
        />
      }
    />
  );
}
