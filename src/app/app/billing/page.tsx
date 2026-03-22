"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface AccountData {
  planKey: string;
  paymentStatus: string;
  billingCycleEnd: string | null;
  usage: {
    submissionCount: number;
    aiGenerationsCount: number;
    usageLocked: boolean;
  } | null;
}

interface PlanTier {
  key: string;
  name: string;
  price: string;
  submissions: string;
  sites: string;
  variants: string;
  aiCopilot: boolean;
  autoOptimization: boolean;
}

const PLANS: PlanTier[] = [
  { key: "free", name: "Free", price: "$0", submissions: "100/mo", sites: "1", variants: "1", aiCopilot: false, autoOptimization: false },
  { key: "starter", name: "Starter", price: "$19/mo", submissions: "1,000/mo", sites: "3", variants: "2", aiCopilot: false, autoOptimization: false },
  { key: "growth", name: "Growth", price: "$49/mo", submissions: "10,000/mo", sites: "10", variants: "5", aiCopilot: true, autoOptimization: true },
  { key: "enterprise", name: "Enterprise", price: "Custom", submissions: "Unlimited", sites: "Unlimited", variants: "Unlimited", aiCopilot: true, autoOptimization: true },
];

export default function BillingPage() {
  const searchParams = useSearchParams();
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  useEffect(() => {
    // Fetch account data
    fetch("/api/team/members")
      .then((r) => r.json())
      .then(() => {
        // For now, use a simulated account state
        // In production, this would come from a dedicated /api/billing endpoint
        setAccount({
          planKey: "free",
          paymentStatus: "active",
          billingCycleEnd: null,
          usage: { submissionCount: 0, aiGenerationsCount: 0, usageLocked: false },
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleUpgrade = async (planKey: string) => {
    setUpgrading(planKey);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setUpgrading(null);
    }
  };

  const handlePortal = async () => {
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  };

  if (loading) return <div className="p-8 text-zinc-500">Loading...</div>;

  return (
    <div className="mx-auto max-w-4xl">
      <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">Billing</h2>

      {success && (
        <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          Payment successful! Your plan has been upgraded.
        </div>
      )}
      {canceled && (
        <div className="mb-6 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
          Checkout was canceled. No changes were made.
        </div>
      )}

      {/* Current Plan & Usage */}
      {account && (
        <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Current plan: <span className="capitalize">{account.planKey}</span>
              </h3>
              {account.paymentStatus !== "active" && (
                <span className="mt-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                  {account.paymentStatus}
                </span>
              )}
            </div>
            {account.planKey !== "free" && (
              <button
                onClick={handlePortal}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400"
              >
                Manage subscription
              </button>
            )}
          </div>

          {account.usage && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-zinc-500">Submissions this cycle</div>
                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {account.usage.submissionCount.toLocaleString()}
                </div>
                {account.usage.usageLocked && (
                  <span className="text-xs text-red-600">Usage limit reached</span>
                )}
              </div>
              <div>
                <div className="text-xs text-zinc-500">AI generations this cycle</div>
                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {account.usage.aiGenerationsCount.toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Plan Cards */}
      <div className="grid grid-cols-4 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = account?.planKey === plan.key;
          const isPopular = plan.key === "growth";

          return (
            <div
              key={plan.key}
              className={`rounded-lg border p-5 ${
                isPopular
                  ? "border-indigo-500 ring-2 ring-indigo-500/20"
                  : "border-zinc-200 dark:border-zinc-800"
              } bg-white dark:bg-zinc-950`}
            >
              {isPopular && (
                <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-indigo-600">Most Popular</div>
              )}
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{plan.name}</h3>
              <div className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{plan.price}</div>

              <ul className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <li>{plan.submissions} submissions</li>
                <li>{plan.sites} sites</li>
                <li>{plan.variants} variants per campaign</li>
                <li>{plan.aiCopilot ? "AI Copilot" : "No AI Copilot"}</li>
                <li>{plan.autoOptimization ? "Auto-optimization" : "No auto-optimization"}</li>
                <li>Team collaboration on all plans</li>
              </ul>

              <div className="mt-6">
                {isCurrent ? (
                  <div className="rounded-lg bg-zinc-100 py-2 text-center text-sm text-zinc-500 dark:bg-zinc-800">
                    Current plan
                  </div>
                ) : plan.key === "enterprise" ? (
                  <button className="w-full rounded-lg border border-zinc-300 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300">
                    Contact sales
                  </button>
                ) : plan.key === "free" ? null : (
                  <button
                    onClick={() => handleUpgrade(plan.key)}
                    disabled={upgrading === plan.key}
                    className={`w-full rounded-lg py-2 text-sm font-medium text-white ${
                      isPopular ? "bg-indigo-600 hover:bg-indigo-700" : "bg-zinc-800 hover:bg-zinc-700"
                    } disabled:opacity-50`}
                  >
                    {upgrading === plan.key ? "Redirecting..." : "Upgrade"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
