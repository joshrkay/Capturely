"use client";

import { twoProportionZTest } from "@/lib/statistics";
import type { SignificanceResult } from "@/lib/statistics";

interface VariantMetric {
  variantId: string;
  variantName: string;
  isControl: boolean;
  impressions: number;
  conversions: number;
  conversionRate: number;
}

interface SignificanceTableProps {
  variants: VariantMetric[];
}

const MIN_IMPRESSIONS = 100;

function StatusBadge({
  result,
  impressions,
}: {
  result: SignificanceResult;
  impressions: number;
}) {
  if (impressions < MIN_IMPRESSIONS) {
    return (
      <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
        Not enough data
      </span>
    );
  }
  if (!result.significant) {
    return (
      <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
        Not significant
      </span>
    );
  }
  if (result.winner === "challenger") {
    return (
      <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
        Winner
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-300">
      Underperforming
    </span>
  );
}

function confidenceColor(confidence: number): string {
  if (confidence >= 95) return "text-green-600 dark:text-green-400";
  if (confidence >= 90) return "text-yellow-600 dark:text-yellow-400";
  return "text-zinc-500 dark:text-zinc-400";
}

export function SignificanceTable({ variants }: SignificanceTableProps) {
  const control = variants.find((v) => v.isControl);
  const challengers = variants.filter((v) => !v.isControl);

  if (!control || challengers.length === 0) return null;

  const results = challengers.map((challenger) => ({
    challenger,
    result: twoProportionZTest(
      { impressions: control.impressions, conversions: control.conversions },
      {
        impressions: challenger.impressions,
        conversions: challenger.conversions,
      }
    ),
  }));

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Statistical Significance
      </h3>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Two-proportion z-test comparing each variant against the control (
        {control.variantName}).
      </p>
      <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-600 dark:text-zinc-400">
                Variant
              </th>
              <th className="px-4 py-2 text-right font-medium text-zinc-600 dark:text-zinc-400">
                Conv. Rate
              </th>
              <th className="px-4 py-2 text-right font-medium text-zinc-600 dark:text-zinc-400">
                Uplift
              </th>
              <th className="px-4 py-2 text-right font-medium text-zinc-600 dark:text-zinc-400">
                Confidence
              </th>
              <th className="px-4 py-2 text-right font-medium text-zinc-600 dark:text-zinc-400">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {/* Control row */}
            <tr className="bg-white dark:bg-zinc-950">
              <td className="px-4 py-2 text-zinc-900 dark:text-zinc-100">
                {control.variantName}{" "}
                <span className="text-xs text-zinc-400">(control)</span>
              </td>
              <td className="px-4 py-2 text-right text-zinc-700 dark:text-zinc-300">
                {control.conversionRate.toFixed(1)}%
              </td>
              <td className="px-4 py-2 text-right text-zinc-400">—</td>
              <td className="px-4 py-2 text-right text-zinc-400">—</td>
              <td className="px-4 py-2 text-right text-zinc-400">Baseline</td>
            </tr>
            {/* Challenger rows */}
            {results.map(({ challenger, result }) => (
              <tr
                key={challenger.variantId}
                className="bg-white dark:bg-zinc-950"
              >
                <td className="px-4 py-2 text-zinc-900 dark:text-zinc-100">
                  {challenger.variantName}
                </td>
                <td className="px-4 py-2 text-right text-zinc-700 dark:text-zinc-300">
                  {challenger.conversionRate.toFixed(1)}%
                </td>
                <td
                  className={`px-4 py-2 text-right ${
                    result.relativeUplift >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {result.relativeUplift >= 0 ? "+" : ""}
                  {result.relativeUplift.toFixed(1)}%
                </td>
                <td
                  className={`px-4 py-2 text-right ${confidenceColor(result.confidenceLevel)}`}
                >
                  {result.confidenceLevel.toFixed(1)}%
                </td>
                <td className="px-4 py-2 text-right">
                  <StatusBadge
                    result={result}
                    impressions={challenger.impressions}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
