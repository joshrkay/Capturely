"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface OptimizationRunVariant {
  id: string;
  variantId: string;
  conversionRate: number | null;
  isWinner: boolean;
}

interface OptimizationRun {
  id: string;
  status: string;
  currentControlVariantId: string | null;
  challengerVariantIds: string[];
  growthbookExperimentId: string | null;
  startedAt: string;
  completedAt: string | null;
  variants: OptimizationRunVariant[];
}

interface Campaign {
  id: string;
  name: string;
  autoOptimize: boolean;
  optimizationStatus: string;
}

export default function OptimizationPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [runs, setRuns] = useState<OptimizationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/campaigns/${id}`).then((r) => r.json()),
      fetch(`/api/campaigns/${id}/optimization`).then((r) => r.json()).catch(() => ({ runs: [] })),
    ]).then(([campaignData, optimizationData]) => {
      setCampaign(campaignData);
      setRuns(optimizationData.runs ?? []);
      setLoading(false);
    });
  }, [id]);

  const toggleAutoOptimize = async () => {
    if (!campaign) return;
    setToggling(true);
    const res = await fetch(`/api/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ autoOptimize: !campaign.autoOptimize }),
    });
    if (res.ok) {
      setCampaign({ ...campaign, autoOptimize: !campaign.autoOptimize });
    }
    setToggling(false);
  };

  if (loading) return <div className="p-8 text-zinc-500">Loading...</div>;
  if (!campaign) return <div className="p-8 text-zinc-500">Campaign not found</div>;

  const statusColors: Record<string, string> = {
    pending: "bg-zinc-100 text-zinc-700",
    generating: "bg-blue-100 text-blue-700",
    experimenting: "bg-yellow-100 text-yellow-700",
    promoting: "bg-purple-100 text-purple-700",
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };

  // Calculate cumulative lift
  const completedRuns = runs.filter((r) => r.status === "completed");
  const totalLift = completedRuns.reduce((sum, run) => {
    const winner = run.variants.find((v) => v.isWinner);
    const control = run.variants.find((v) => v.variantId === run.currentControlVariantId);
    if (winner && control && control.conversionRate && winner.conversionRate) {
      return sum + ((winner.conversionRate - control.conversionRate) / control.conversionRate) * 100;
    }
    return sum;
  }, 0);

  return (
    <div>
      <div className="mb-6">
        <Link href="/app/campaigns" className="text-sm text-zinc-500 hover:text-zinc-700">&larr; Campaigns</Link>
        <h2 className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{campaign.name} — Optimization</h2>
      </div>

      {/* Status + Toggle */}
      <div className="mb-6 flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-sm text-zinc-500">Auto-optimization</div>
            <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {campaign.autoOptimize ? "Enabled" : "Disabled"}
            </div>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[campaign.optimizationStatus] ?? "bg-zinc-100 text-zinc-700"}`}>
            {campaign.optimizationStatus}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleAutoOptimize}
            disabled={toggling}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              campaign.autoOptimize
                ? "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            } disabled:opacity-50`}
          >
            {toggling ? "..." : campaign.autoOptimize ? "Pause Optimization" : "Enable Optimization"}
          </button>
          <Link
            href={`/app/campaigns/${id}/analytics`}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400"
          >
            View Analytics
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-xs text-zinc-500">Total Runs</div>
          <div className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{runs.length}</div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-xs text-zinc-500">Completed</div>
          <div className="mt-1 text-2xl font-bold text-green-600">{completedRuns.length}</div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-xs text-zinc-500">Cumulative Lift</div>
          <div className={`mt-1 text-2xl font-bold ${totalLift > 0 ? "text-green-600" : "text-zinc-400"}`}>
            {totalLift > 0 ? `+${totalLift.toFixed(1)}%` : "—"}
          </div>
        </div>
      </div>

      {/* Optimization Run Timeline */}
      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Optimization History</h3>
        </div>
        {runs.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-400">
            No optimization runs yet. {!campaign.autoOptimize && "Enable auto-optimization to get started."}
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {runs.map((run) => {
              const winner = run.variants.find((v) => v.isWinner);
              return (
                <div key={run.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[run.status] ?? ""}`}>
                        {run.status}
                      </span>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        Started {new Date(run.startedAt).toLocaleDateString()}
                      </span>
                      {run.completedAt && (
                        <span className="text-xs text-zinc-400">
                          — completed {new Date(run.completedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      {run.challengerVariantIds.length} challengers
                    </div>
                  </div>

                  {run.variants.length > 0 && (
                    <div className="mt-3 rounded bg-zinc-50 p-3 dark:bg-zinc-900">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {run.variants.map((v) => (
                          <div key={v.id} className={`rounded p-2 ${v.isWinner ? "bg-green-50 border border-green-200 dark:bg-green-900/30 dark:border-green-800" : "bg-white dark:bg-zinc-800"}`}>
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                {v.variantId === run.currentControlVariantId ? "Control" : "Challenger"}
                              </span>
                              {v.isWinner && <span className="text-green-600 font-semibold">Winner</span>}
                            </div>
                            <div className="mt-1 text-zinc-500">
                              {v.conversionRate != null ? `${v.conversionRate.toFixed(2)}%` : "—"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {winner && run.currentControlVariantId && (
                    <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                      Winner promoted as new control
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
