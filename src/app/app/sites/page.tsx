import { prisma } from "@/lib/db";
import { withAccountContext } from "@/lib/account";
import { canManageSites } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { SitesList } from "./sites-list";

export default async function SitesPage() {
  let ctx;
  try {
    ctx = await withAccountContext();
  } catch {
    redirect("/sign-in");
  }

  const sites = await prisma.site.findMany({
    where: { accountId: ctx.accountId },
    select: {
      id: true,
      name: true,
      primaryDomain: true,
      platformType: true,
      publicKey: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const isManager = canManageSites(ctx.role);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Sites
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Manage the websites where Capturely is installed.
          </p>
        </div>
      </div>
      <SitesList sites={sites} canManage={isManager} />
    </div>
  );
}
