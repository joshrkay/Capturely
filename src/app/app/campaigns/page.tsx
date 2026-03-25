import Link from "next/link";
import { prisma } from "@/lib/db";
import { withAccountContext } from "@/lib/account";
import { UnpublishedChangesBadge } from "./components/unpublished-changes-badge";

export default async function CampaignsPage() {
  const ctx = await withAccountContext();

  const campaigns = await prisma.campaign.findMany({
    where: { accountId: ctx.accountId },
    select: {
      id: true,
      name: true,
      type: true,
      status: true,
      hasUnpublishedChanges: true,
      site: { select: { name: true } },
      variants: { select: { id: true, name: true, isControl: true } },
      _count: { select: { submissions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const statusColors: Record<string, string> = {
    draft: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    published: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    paused: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    archived: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Campaigns</h2>
        <Link
          href="/app/campaigns/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Create Campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-zinc-500 dark:text-zinc-400">No campaigns yet. Create your first campaign to get started.</p>
          <Link
            href="/app/campaigns/new"
            className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Create Campaign
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Name</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Site</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Type</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Status</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Variants</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Submissions</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{campaign.name}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{campaign.site.name}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 capitalize">{campaign.type}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[campaign.status] ?? ""}`}>
                        {campaign.status}
                      </span>
                      {campaign.hasUnpublishedChanges && <UnpublishedChangesBadge />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{campaign.variants.length}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{campaign._count.submissions}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/app/campaigns/${campaign.id}/builder`}
                        className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/app/campaigns/${campaign.id}/analytics`}
                        className="text-zinc-600 hover:text-zinc-700 dark:text-zinc-400"
                      >
                        Analytics
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
