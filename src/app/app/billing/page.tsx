"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface BillingStatus {
  planKey: string;
  planName: string;
  paymentStatus: string;
  paymentGraceUntil: string | null;
  billingCycleEnd: string | null;
  hasStripe: boolean;
  limits: {
    sites: number;
    submissionsPerMonth: number;
    maxVariants: number;
    aiGenerationsPerMonth: number;
  };
  features: {
    abTesting: boolean;
    aiCopilot: boolean;
    autoOptimization: boolean;
    webhooks: boolean;
  };
  usage: {
    submissionCount: number;
    submissionLimit: number;
    aiGenerationsCount: number;
    aiGenerationsLimit: number;
    usageLocked: boolean;
    overageCount: number;
  };
  counts: {
    sites: number;
    sitesLimit: number;
    campaigns: number;
  };
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

function UsageBar({ used, limit, label }: { used: number; limit: number; label: string }) {
  const pct = limit === Infinity ? 0 : Math.min((used / limit) * 100, 100);
  const isWarning = pct >= 80;
  const isDanger = pct >= 100;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
        <span className={`font-medium ${isDanger ? "text-red-600" : isWarning ? "text-amber-600" : "text-zinc-900 dark:text-zinc-100"}`}>
          {used.toLocaleString()} / {limit === Infinity ? "Unlimited" : limit.toLocaleString()}
        </span>
      </div>
      {limit !== Infinity && (
        <div className="mt-1 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className={`h-2 rounded-full transition-all ${isDanger ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-indigo-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function BillingPage() {
  const searchParams = useSearchParams();
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => r.json())
      .then((data) => { setBilling(data); setLoading(false); })
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
        window.location.assign(data.url);
      } else {
        setUpgrading(null);
      }
    } catch {
      setUpgrading(null);
    }
  };

  const handlePortal = async () => {
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.assign(data.url);
    }
  };

  if (loading) return <div className="p-8 text-zinc-500">Loading billing...</div>;
  if (!billing) return <div className="p-8 text-zinc-500">Failed to load billing data</div>;

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

      {/* Payment Status Banners */}
      {billing.paymentStatus === "past_due" && (
        <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-4 dark:bg-amber-900/20 dark:border-amber-800">
          <div className="text-sm font-medium text-amber-800 dark:text-amber-300">Payment past due</div>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
            Please update your payment method to avoid service interruption.
            {billing.paymentGraceUntil && ` Grace period ends ${new Date(billing.paymentGraceUntil).toLocaleDateString()}.`}
          </p>
          {billing.hasStripe && (
            <button onClick={handlePortal} className="mt-2 rounded bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700">
              Update payment method
            </button>
          )}
        </div>
      )}
      {billing.paymentStatus === "suspended" && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 dark:bg-red-900/20 dark:border-red-800">
          <div className="text-sm font-medium text-red-800 dark:text-red-300">Account suspended</div>
          <p className="mt-1 text-sm text-red-700 dark:text-red-400">
            Your dashboard is locked. Live forms continue to work. Resolve billing to restore access.
          </p>
          {billing.hasStripe && (
            <button onClick={handlePortal} className="mt-2 rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">
              Resolve billing
            </button>
          )}
        </div>
      )}
      {billing.usage.usageLocked && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 dark:bg-red-900/20 dark:border-red-800">
          <div className="text-sm font-medium text-red-800 dark:text-red-300">Usage limit reached</div>
          <p className="mt-1 text-sm text-red-700 dark:text-red-400">
            You&apos;ve exceeded your submission limit. Upgrade to continue.
          </p>
        </div>
      )}

      {/* Current Plan & Usage */}
      <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Current plan: {billing.planName}
            </h3>
            {billing.billingCycleEnd && (
              <p className="mt-1 text-sm text-zinc-500">
                Billing cycle ends {new Date(billing.billingCycleEnd).toLocaleDateString()}
              </p>
            )}
          </div>
          {billing.hasStripe && (
            <button
              onClick={handlePortal}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400"
            >
              Manage subscription
            </button>
          )}
        </div>

        <div className="mt-6 space-y-4">
          <UsageBar used={billing.usage.submissionCount} limit={billing.usage.submissionLimit} label="Submissions" />
          {billing.features.aiCopilot && (
            <UsageBar used={billing.usage.aiGenerationsCount} limit={billing.usage.aiGenerationsLimit} label="AI Generations" />
          )}
          <UsageBar used={billing.counts.sites} limit={billing.limits.sites} label="Sites" />
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-4 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = billing.planKey === plan.key;
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
                <li className={plan.aiCopilot ? "" : "line-through opacity-50"}>AI Copilot</li>
                <li className={plan.autoOptimization ? "" : "line-through opacity-50"}>Auto-optimization</li>
                <li>Team collaboration</li>
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
