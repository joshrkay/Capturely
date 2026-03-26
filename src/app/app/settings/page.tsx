import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { withAccountContext } from "@/lib/account";
import { getActiveSettingsTab, type SettingsRole } from "@/lib/settings-tabs-policy";
import { SettingsTabs } from "./components/settings-tabs";

type SettingsPageProps = {
  searchParams?: Promise<{ tab?: string }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  let ctx;
  try {
    ctx = await withAccountContext();
  } catch {
    redirect("/sign-in");
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};

  const [account, members, sites] = await Promise.all([
    prisma.account.findUniqueOrThrow({
      where: { id: ctx.accountId },
      select: {
        id: true,
        name: true,
        planKey: true,
        paymentStatus: true,
        createdAt: true,
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
    prisma.site.findMany({
      where: { accountId: ctx.accountId },
      select: {
        id: true,
        name: true,
        primaryDomain: true,
        publicKey: true,
        secretKey: true,
        status: true,
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const tabParam = resolvedSearchParams?.tab;
  const role = ctx.role as SettingsRole;
  const initialTab = getActiveSettingsTab(tabParam, role);

  return (
    <SettingsTabs
      initialTab={initialTab}
      role={role}
      currentUserId={ctx.userId}
      account={{
        ...account,
        createdAt: account.createdAt.toISOString(),
      }}
      members={members.map((member) => ({
        ...member,
        role: String(member.role),
        createdAt: member.createdAt.toISOString(),
      }))}
      sites={sites.map((site) => ({
        ...site,
        status: String(site.status),
      }))}
    />
  );
}
