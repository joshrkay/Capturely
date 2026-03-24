import Link from "next/link";
import { withAccountContext } from "@/lib/account";
import { prisma } from "@/lib/db";
import { DashboardPeriodSelector } from "./dashboard-period-selector";

function getPeriodDates(period: string): { since: Date; previousSince: Date } {
  const now = new Date();
  let days: number;
  switch (period) {
    case "7d":
      days = 7;
      break;
    case "90d":
      days = 90;
      break;
    case "all":
      days = 3650; // ~10 years
      break;
    default:
      days = 30;
  }
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const previousSince = new Date(since.getTime() - days * 24 * 60 * 60 * 1000);
  return { since, previousSince };
}

function computeTrend(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

interface StatCardProps {
  label: string;
  value: string;
  trend: number | null;
}

function StatCard({ label, value, trend }: StatCardProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
      {trend !== null && (
        <p
          className={`mt-1 text-xs font-medium ${
            trend >= 0
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {trend >= 0 ? "\u2191" : "\u2193"} {Math.abs(trend)}% vs prev period
        </p>
      )}
    </div>
  );
}

interface TopCampaign {
  id: string;
  name: string;
  submissions: number;
  conversionRate: number;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await withAccountContext();
  const params = await searchParams;
  const period =
    typeof params.period === "string" ? params.period : "30d";
  const { since, previousSince } = getPeriodDates(period);

  // Parallel data fetching
  const [
    submissionsCurrent,
    submissionsPrevious,
    activeCampaigns,
    activeSites,
    impressionsCurrent,
    impressionsPrevious,
    conversionsCurrent,
    conversionsPrevious,
    topCampaignsRaw,
    hasSite,
    hasCampaign,
    hasPublished,
    hasSubmission,
  ] = await Promise.all([
    prisma.submission.count({
      where: { accountId: ctx.accountId, createdAt: { gte: since } },
    }),
    prisma.submission.count({
      where: {
        accountId: ctx.accountId,
        createdAt: { gte: previousSince, lt: since },
      },
    }),
    prisma.campaign.count({
      where: { accountId: ctx.accountId, status: "published" },
    }),
    prisma.site.count({
      where: { accountId: ctx.accountId, status: "active" },
    }),
    prisma.experimentEvent.count({
      where: {
        campaign: { accountId: ctx.accountId },
        eventType: "impression",
        timestamp: { gte: since },
      },
    }),
    prisma.experimentEvent.count({
      where: {
        campaign: { accountId: ctx.accountId },
        eventType: "impression",
        timestamp: { gte: previousSince, lt: since },
      },
    }),
    prisma.experimentEvent.count({
      where: {
        campaign: { accountId: ctx.accountId },
        eventType: "conversion",
        timestamp: { gte: since },
      },
    }),
    prisma.experimentEvent.count({
      where: {
        campaign: { accountId: ctx.accountId },
        eventType: "conversion",
        timestamp: { gte: previousSince, lt: since },
      },
    }),
    prisma.campaign.findMany({
      where: { accountId: ctx.accountId, status: "published" },
      select: {
        id: true,
        name: true,
        _count: { select: { submissions: true, experimentEvents: true } },
        experimentEvents: {
          where: { eventType: "impression" },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.site.count({ where: { accountId: ctx.accountId } }).then((c) => c > 0),
    prisma.campaign.count({ where: { accountId: ctx.accountId } }).then((c) => c > 0),
    prisma.campaign
      .count({ where: { accountId: ctx.accountId, status: "published" } })
      .then((c) => c > 0),
    prisma.submission
      .count({ where: { accountId: ctx.accountId } })
      .then((c) => c > 0),
  ]);

  const conversionRate =
    impressionsCurrent > 0
      ? ((conversionsCurrent / impressionsCurrent) * 100).toFixed(1)
      : "0.0";
  const prevConversionRate =
    impressionsPrevious > 0
      ? (conversionsPrevious / impressionsPrevious) * 100
      : 0;
  const currentConversionRateNum =
    impressionsCurrent > 0
      ? (conversionsCurrent / impressionsCurrent) * 100
      : 0;

  const topCampaigns: TopCampaign[] = topCampaignsRaw.map((c) => ({
    id: c.id,
    name: c.name,
    submissions: c._count.submissions,
    conversionRate:
      c.experimentEvents.length > 0
        ? Math.round(
            (c._count.experimentEvents / c.experimentEvents.length) * 100
          )
        : 0,
  }));

  const onboardingComplete = hasSite && hasCampaign && hasPublished && hasSubmission;
  const onboardingSteps = [
    { label: "Create a site", done: hasSite, href: "/app/sites" },
    { label: "Create a campaign", done: hasCampaign, href: "/app/campaigns" },
    {
      label: "Publish a campaign",
      done: hasPublished,
      href: "/app/campaigns",
    },
    {
      label: "Receive your first submission",
      done: hasSubmission,
      href: "/app/submissions",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h2>
        <DashboardPeriodSelector current={period} />
      </div>

      {/* Onboarding checklist */}
      {!onboardingComplete && (
        <div className="mt-6 rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950">
          <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
            Getting Started
          </h3>
          <ul className="mt-2 space-y-1">
            {onboardingSteps.map((step) => (
              <li key={step.label} className="flex items-center gap-2 text-sm">
                <span
                  className={
                    step.done
                      ? "text-green-600 dark:text-green-400"
                      : "text-zinc-400 dark:text-zinc-600"
                  }
                >
                  {step.done ? "\u2713" : "\u25CB"}
                </span>
                {step.done ? (
                  <span className="text-zinc-500 line-through dark:text-zinc-400">
                    {step.label}
                  </span>
                ) : (
                  <Link
                    href={step.href}
                    className="text-indigo-700 underline dark:text-indigo-300"
                  >
                    {step.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stats cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Submissions"
          value={submissionsCurrent.toLocaleString()}
          trend={computeTrend(submissionsCurrent, submissionsPrevious)}
        />
        <StatCard
          label="Active Campaigns"
          value={String(activeCampaigns)}
          trend={null}
        />
        <StatCard
          label="Conversion Rate"
          value={`${conversionRate}%`}
          trend={computeTrend(currentConversionRateNum, prevConversionRate)}
        />
        <StatCard
          label="Active Sites"
          value={String(activeSites)}
          trend={null}
        />
      </div>

      {/* Top campaigns */}
      {topCampaigns.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Top Campaigns
          </h3>
          <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-zinc-600 dark:text-zinc-400">
                    Campaign
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-zinc-600 dark:text-zinc-400">
                    Submissions
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-zinc-600 dark:text-zinc-400">
                    Conv. Rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {topCampaigns.map((c) => (
                  <tr
                    key={c.id}
                    className="bg-white dark:bg-zinc-950"
                  >
                    <td className="px-4 py-2 text-zinc-900 dark:text-zinc-100">
                      <Link
                        href={`/app/campaigns/${c.id}`}
                        className="hover:underline"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-right text-zinc-700 dark:text-zinc-300">
                      {c.submissions}
                    </td>
                    <td className="px-4 py-2 text-right text-zinc-700 dark:text-zinc-300">
                      {c.conversionRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="mt-8 flex gap-3">
        <Link
          href="/app/campaigns/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Create Campaign
        </Link>
        <Link
          href="/app/sites"
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Add Site
        </Link>
      </div>
    </div>
  );
}
