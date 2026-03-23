"use client";

import { useState, useCallback, useEffect } from "react";
import { type PlanConfig } from "@/lib/plans";
import { VariantCard, type Variant } from "./VariantCard";

// ─── Pure utility functions (exported for testing) ────────────────────────────

export function rebalanceTraffic(variants: Variant[]): Variant[] {
  const n = variants.length;
  if (n === 0) return [];
  const base = Math.floor(100 / n);
  const remainder = 100 - base * n;
  const control = variants.find((v) => v.isControl) ?? variants[0];
  return variants.map((v) => ({
    ...v,
    trafficPercentage: v.id === control.id ? base + remainder : base,
  }));
}

export function generateVariantName(variants: Variant[]): string {
  return "Variant " + String.fromCharCode(65 + variants.length);
}

export function isTrafficValid(
  variants: Variant[],
  pending: Record<string, number>
): boolean {
  const sum = variants.reduce(
    (acc, v) => acc + (pending[v.id] ?? v.trafficPercentage),
    0
  );
  return sum === 100;
}

// ─── TrafficSummaryBar ────────────────────────────────────────────────────────

const SEGMENT_COLORS = [
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-fuchsia-500",
];

function TrafficSummaryBar({
  variants,
  pending,
}: {
  variants: Variant[];
  pending: Record<string, number>;
}) {
  const sum = variants.reduce(
    (acc, v) => acc + (pending[v.id] ?? v.trafficPercentage),
    0
  );
  const isValid = sum === 100;

  return (
    <div className="mt-3">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
        {variants.map((v, i) => {
          const pct = pending[v.id] ?? v.trafficPercentage;
          return (
            <div
              key={v.id}
              className={`${SEGMENT_COLORS[i % SEGMENT_COLORS.length]} transition-all`}
              style={{ width: `${pct}%` }}
              title={`${v.name}: ${pct}%`}
            />
          );
        })}
      </div>
      <div className="mt-1 flex items-center gap-1">
        {isValid ? (
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
            ✓ {sum}% total
          </span>
        ) : (
          <span className="text-xs text-red-500 dark:text-red-400 font-medium">
            ⚠ {sum}% total — must equal 100%
          </span>
        )}
      </div>
    </div>
  );
}

// ─── PlanLimitBanner ──────────────────────────────────────────────────────────

function PlanLimitBanner({
  used,
  max,
}: {
  used: number;
  max: number;
}) {
  return (
    <div
      role="alert"
      className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
    >
      You&apos;ve used {used}/{max} variants.{" "}
      <a
        href="/app/billing"
        className="font-medium underline hover:no-underline"
      >
        Upgrade your plan
      </a>{" "}
      to add more.
    </div>
  );
}

// ─── VariantManagerPanel ─────────────────────────────────────────────────────

interface VariantManagerPanelProps {
  campaignId: string;
  variants: Variant[];
  activeVariantId: string;
  onActiveVariantChange: (variantId: string) => void;
  onVariantsChange: (variants: Variant[]) => void;
  plan: PlanConfig;
  canEdit: boolean;
}

export function VariantManagerPanel({
  campaignId,
  variants: initialVariants,
  activeVariantId,
  onActiveVariantChange,
  onVariantsChange,
  plan,
  canEdit,
}: VariantManagerPanelProps) {
  const [variants, setVariants] = useState<Variant[]>(initialVariants);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pendingTraffic, setPendingTraffic] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Keep local variants in sync when parent updates (e.g. on initial load)
  useEffect(() => {
    setVariants(initialVariants);
  }, [initialVariants]);

  const showError = useCallback((msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(""), 4000);
  }, []);

  const atLimit = variants.length >= plan.limits.maxVariants;

  // ── FREE / abTesting disabled locked state ──────────────────────────────────
  if (!plan.features.abTesting) {
    return (
      <div
        role="region"
        aria-label="Variant manager"
        className="w-72 shrink-0 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-black p-4"
      >
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          Variants
        </p>
        <div className="rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
            A/B testing is available on Starter and above.
          </p>
          <a
            href="/app/billing"
            className="inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Upgrade Plan
          </a>
        </div>
      </div>
    );
  }

  // ── Add Variant ─────────────────────────────────────────────────────────────
  async function handleAddVariant() {
    const activeVariant =
      variants.find((v) => v.id === activeVariantId) ?? variants[0];
    if (!activeVariant) return;

    const newName = generateVariantName(variants);

    // Optimistic: add a placeholder card
    const optimisticId = `optimistic-${Date.now()}`;
    const rebalanced = rebalanceTraffic([
      ...variants,
      {
        id: optimisticId,
        campaignId,
        name: newName,
        isControl: false,
        trafficPercentage: 0,
        schemaJson: activeVariant.schemaJson,
        schemaVersion: activeVariant.schemaVersion,
        generatedBy: "manual",
      },
    ]);
    setVariants(rebalanced);

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          schemaJson: activeVariant.schemaJson,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setVariants(variants); // rollback
        showError(data.error ?? "Failed to add variant");
        return;
      }

      const { allVariants } = await res.json();
      // Merge allVariants with full Variant fields from existing variants
      const updatedVariants: Variant[] = allVariants.map(
        (av: { id: string; name: string; trafficPercentage: number; isControl: boolean }) => {
          const existing = variants.find((v) => v.id === av.id);
          if (existing) {
            return { ...existing, trafficPercentage: av.trafficPercentage };
          }
          // New variant
          return {
            id: av.id,
            campaignId,
            name: av.name,
            isControl: av.isControl,
            trafficPercentage: av.trafficPercentage,
            schemaJson: activeVariant.schemaJson,
            schemaVersion: activeVariant.schemaVersion,
            generatedBy: "manual" as const,
          };
        }
      );
      setVariants(updatedVariants);
      onVariantsChange(updatedVariants);
    } catch {
      setVariants(variants); // rollback
      showError("Failed to add variant");
    }
  }

  // ── Rename ──────────────────────────────────────────────────────────────────
  async function handleCommitRename(variantId: string, name: string) {
    const snapshot = [...variants];
    setVariants((prev) =>
      prev.map((v) => (v.id === variantId ? { ...v, name } : v))
    );
    setEditingNameId(null);

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/variants`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setVariants(snapshot);
        showError(data.error ?? "Failed to rename variant");
      }
    } catch {
      setVariants(snapshot);
      showError("Failed to rename variant");
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  async function handleDeleteConfirm(variantId: string) {
    const snapshot = [...variants];
    setConfirmingDeleteId(null);

    // Optimistic remove + rebalance
    const remaining = variants.filter((v) => v.id !== variantId);
    setVariants(rebalanceTraffic(remaining));

    // If deleting the active variant, switch to control
    if (activeVariantId === variantId) {
      const control = remaining.find((v) => v.isControl) ?? remaining[0];
      if (control) onActiveVariantChange(control.id);
    }

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/variants`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setVariants(snapshot);
        showError(data.error ?? "Failed to delete variant");
        return;
      }

      const { allVariants } = await res.json();
      const updatedVariants: Variant[] = allVariants.map(
        (av: { id: string; name: string; trafficPercentage: number; isControl: boolean }) => {
          const existing = snapshot.find((v) => v.id === av.id);
          return existing
            ? { ...existing, trafficPercentage: av.trafficPercentage }
            : av as unknown as Variant;
        }
      );
      setVariants(updatedVariants);
      onVariantsChange(updatedVariants);
    } catch {
      setVariants(snapshot);
      showError("Failed to delete variant");
    }
  }

  // ── Traffic change ──────────────────────────────────────────────────────────
  function handleTrafficChange(variantId: string, value: number) {
    setPendingTraffic((prev) => ({ ...prev, [variantId]: value }));
  }

  async function handleTrafficSave() {
    if (!isTrafficValid(variants, pendingTraffic)) {
      showError("Traffic percentages must sum to 100%");
      return;
    }

    const changedVariants = variants.filter(
      (v) => pendingTraffic[v.id] !== undefined && pendingTraffic[v.id] !== v.trafficPercentage
    );
    if (changedVariants.length === 0) {
      setPendingTraffic({});
      return;
    }

    setIsSaving(true);
    const snapshot = [...variants];

    // Apply pending to local state
    setVariants((prev) =>
      prev.map((v) =>
        pendingTraffic[v.id] !== undefined
          ? { ...v, trafficPercentage: pendingTraffic[v.id] }
          : v
      )
    );
    setPendingTraffic({});

    try {
      await Promise.all(
        changedVariants.map((v) =>
          fetch(`/api/campaigns/${campaignId}/variants`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              variantId: v.id,
              trafficPercentage: pendingTraffic[v.id],
            }),
          }).then(async (res) => {
            if (!res.ok) throw new Error("PATCH failed");
          })
        )
      );
    } catch {
      setVariants(snapshot);
      showError("Failed to save traffic allocation");
    } finally {
      setIsSaving(false);
    }
  }

  const panelBodyId = `variant-panel-body-${campaignId}`;

  return (
    <div
      role="region"
      aria-label="Variant manager"
      className="w-72 shrink-0 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-black p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Variants ({variants.length})
        </span>
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={handleAddVariant}
              disabled={atLimit || isSaving}
              title={atLimit ? "Upgrade your plan to add more variants" : undefined}
              className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Add Variant
            </button>
          )}
          <button
            onClick={() => setIsCollapsed((c) => !c)}
            aria-expanded={!isCollapsed}
            aria-controls={panelBodyId}
            className="rounded p-1 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 focus-visible:ring-2 focus-visible:ring-blue-500"
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            <svg
              className={`h-4 w-4 transition-transform ${isCollapsed ? "" : "rotate-180"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Inline error */}
      {errorMessage && (
        <div className="mb-2 rounded border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {errorMessage}
        </div>
      )}

      {/* Panel body */}
      {!isCollapsed && (
        <div id={panelBodyId}>
          {/* Variant list */}
          <div
            role="listbox"
            aria-label="Variants"
            className="flex flex-col gap-2 max-h-64 overflow-y-auto"
          >
            {variants.map((variant) => (
              <VariantCard
                key={variant.id}
                variant={variant}
                isActive={variant.id === activeVariantId}
                pendingTraffic={pendingTraffic[variant.id]}
                isEditingName={editingNameId === variant.id}
                isConfirmingDelete={confirmingDeleteId === variant.id}
                canEdit={canEdit}
                onSelect={() => onActiveVariantChange(variant.id)}
                onStartRename={() => setEditingNameId(variant.id)}
                onCommitRename={(name) => handleCommitRename(variant.id, name)}
                onCancelRename={() => setEditingNameId(null)}
                onTrafficChange={handleTrafficChange}
                onDeleteRequest={() => setConfirmingDeleteId(variant.id)}
                onDeleteConfirm={() => handleDeleteConfirm(variant.id)}
                onDeleteCancel={() => setConfirmingDeleteId(null)}
              />
            ))}
          </div>

          {/* Traffic summary */}
          <TrafficSummaryBar variants={variants} pending={pendingTraffic} />

          {/* Save traffic button — shown when pendingTraffic has changes */}
          {Object.keys(pendingTraffic).length > 0 && canEdit && (
            <button
              onClick={handleTrafficSave}
              disabled={isSaving || !isTrafficValid(variants, pendingTraffic)}
              className="mt-2 w-full rounded bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-700 dark:hover:bg-zinc-600"
            >
              {isSaving ? "Saving..." : "Save Traffic"}
            </button>
          )}

          {/* Plan limit banner */}
          {atLimit && (
            <PlanLimitBanner
              used={variants.length}
              max={plan.limits.maxVariants}
            />
          )}
        </div>
      )}
    </div>
  );
}
