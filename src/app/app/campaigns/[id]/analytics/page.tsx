"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface VariantMetric {
  variantId: string;
  variantName: string;
  isControl: boolean;
  trafficPercentage: number;
  impressions: number;
  conversions: number;
  submissions: number;
  conversionRate: number;
}

interface CampaignAnalytics {
  campaignId: string;
  campaignName: string;
  period: { days: number; since: string };
  totals: {
    impressions: number;
    conversions: number;
    submissions: number;
    conversionRate: number;
  };
  variants: VariantMetric[];
}

export default function CampaignAnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CampaignAnalytics | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/campaigns/${id}/analytics?days=${days}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id, days]);

  if (loading) return <div className="p-8 text-zinc-500">Loading...</div>;
  if (!data) return <div className="p-8 text-zinc-500">Failed to load analytics</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/app/campaigns" className="text-sm text-zinc-500 hover:text-zinc-700">&larr; Campaigns</Link>
          <h2 className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{data.campaignName}</h2>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                days === d ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="mb-8 grid grid-cols-4 gap-4">
        {[
          { label: "Impressions", value: data.totals.impressions.toLocaleString() },
          { label: "Conversions", value: data.totals.conversions.toLocaleString() },
          { label: "Conv. Rate", value: `${data.totals.conversionRate}%` },
          { label: "Submissions", value: data.totals.submissions.toLocaleString() },
        ].map((card) => (
          <div key={card.label} className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-xs text-zinc-500">{card.label}</div>
            <div className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Per-variant table */}
      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Variant Performance</h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Variant</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Traffic</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Impressions</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Conversions</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Conv. Rate</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Submissions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {data.variants.map((v) => (
              <tr key={v.variantId} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                <td className="px-4 py-3">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{v.variantName}</span>
                  {v.isControl && <span className="ml-1 text-xs text-zinc-400">(control)</span>}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{v.trafficPercentage}%</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{v.impressions.toLocaleString()}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{v.conversions.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`font-medium ${v.conversionRate > 0 ? "text-green-600" : "text-zinc-400"}`}>
                    {v.conversionRate}%
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{v.submissions.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          href={`/app/campaigns/${id}/builder`}
          className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200"
        >
          Edit Campaign
        </Link>
      </div>
    </div>
  );
}
