import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { withAccountContext } from "@/lib/account";
import { SettingsTabs, type SettingsTabKey } from "./components/settings-tabs";

const allowedTabs: SettingsTabKey[] = [
  "account",
  "team",
  "notifications",
  "api-keys",
  "danger-zone",
];

type SettingsPageProps = {
  searchParams?:
    | {
        tab?: string;
      }
    | Promise<{
        tab?: string;
      }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  let ctx;
  try {
    ctx = await withAccountContext();
  } catch {
    redirect("/sign-in");
  }

  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});

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
  const initialTab: SettingsTabKey = allowedTabs.includes(tabParam as SettingsTabKey)
    ? (tabParam as SettingsTabKey)
    : "account";

  return (
    <SettingsTabs
      initialTab={initialTab}
      role={ctx.role as "owner" | "admin" | "member"}
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
