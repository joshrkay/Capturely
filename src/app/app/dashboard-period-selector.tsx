"use client";

import { useRouter, useSearchParams } from "next/navigation";

const periods = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "all", label: "All time" },
] as const;

export function DashboardPeriodSelector({ current }: { current: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleClick(period: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", period);
    router.push(`/app?${params.toString()}`);
  }

  return (
    <div className="flex gap-1 rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950">
      {periods.map((p) => (
        <button
          key={p.key}
          onClick={() => handleClick(p.key)}
          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
            current === p.key
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
