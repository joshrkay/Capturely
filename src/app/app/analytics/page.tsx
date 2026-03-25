"use client";

import { useState, useEffect } from "react";

interface AnalyticsData {
  period: { days: number; since: string };
  metrics: {
    impressions: number;
    conversions: number;
    conversionRate: number;
    totalSubmissions: number;
  };
  topCampaigns: Array<{ id: string; name: string; submissions: number }>;
  dailySubmissions: Array<{ date: string; count: number }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/analytics/overview?days=${days}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [days]);

  if (loading) {
    return <div className="p-8 text-zinc-500">Loading analytics...</div>;
  }

  if (!data) {
    return <div className="p-8 text-zinc-500">Failed to load analytics</div>;
  }

  const maxCount = Math.max(...data.dailySubmissions.map((d) => d.count), 1);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Analytics</h2>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                days === d
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="mb-8 grid grid-cols-4 gap-4">
        {[
          { label: "Impressions", value: data.metrics.impressions.toLocaleString() },
          { label: "Conversions", value: data.metrics.conversions.toLocaleString() },
          { label: "Conversion Rate", value: `${data.metrics.conversionRate}%` },
          { label: "Submissions", value: data.metrics.totalSubmissions.toLocaleString() },
        ].map((card) => (
          <div key={card.label} className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">{card.label}</div>
            <div className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Submissions Chart (simple bar chart) */}
      <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Daily Submissions</h3>
        {data.dailySubmissions.length === 0 ? (
          <p className="text-sm text-zinc-400">No submissions in this period</p>
        ) : (
          <div className="flex items-end gap-1" style={{ height: "160px" }}>
            {data.dailySubmissions.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-indigo-500"
                  style={{ height: `${(d.count / maxCount) * 140}px`, minHeight: d.count > 0 ? "4px" : "0" }}
                  title={`${d.date}: ${d.count}`}
                />
                <span className="text-[9px] text-zinc-400 rotate-45 origin-left">{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Campaigns */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Top Campaigns</h3>
        {data.topCampaigns.length === 0 ? (
          <p className="text-sm text-zinc-400">No campaigns yet</p>
        ) : (
          <div className="space-y-3">
            {data.topCampaigns.map((c) => (
              <div key={c.id} className="flex items-center justify-between">
                <span className="text-sm text-zinc-700 dark:text-zinc-300">{c.name}</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{c.submissions} submissions</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
