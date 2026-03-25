"use client";

import { useState, useEffect, useCallback } from "react";

interface AiGenerationLog {
  id: string;
  type: string;
  inputContext: string | null;
  outputSchema: string | null;
  tokensUsed: number | null;
  createdAt: string;
}

interface AiHistoryPanelProps {
  /** Called when the user wants to restore a past generation's schema */
  onRestore: (schema: string) => void;
  /** Optional filter — show only logs of this type (e.g. "form_generation") */
  filterType?: string;
}

function extractPromptLabel(log: AiGenerationLog): string {
  try {
    const ctx = JSON.parse(log.inputContext ?? "{}") as Record<string, unknown>;
    if (typeof ctx.prompt === "string" && ctx.prompt.length > 0) {
      return ctx.prompt.slice(0, 80);
    }
    if (typeof ctx.campaignId === "string") {
      return `Auto-optimization run for campaign`;
    }
  } catch {
    // fall through
  }
  return log.type.replace(/_/g, " ");
}

const TYPE_LABELS: Record<string, string> = {
  form_generation: "Form generated",
  field_suggestion: "Fields suggested",
  copy_generation: "Copy generated",
  style_suggestion: "Style suggested",
  variant_generation: "Variants generated",
};

export function AiHistoryPanel({ onRestore, filterType }: AiHistoryPanelProps) {
  const [logs, setLogs] = useState<AiGenerationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "20" });
      if (filterType) params.set("type", filterType);
      const res = await fetch(`/api/ai/history?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load history");
      const data = (await res.json()) as { logs: AiGenerationLog[] };
      setLogs(data.logs);
    } catch {
      setError("Could not load generation history.");
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  function handleRestore(log: AiGenerationLog) {
    if (!log.outputSchema) return;
    setRestoringId(log.id);
    try {
      onRestore(log.outputSchema);
    } finally {
      setRestoringId(null);
    }
  }

  if (loading) {
    return (
      <div className="p-4 text-sm text-zinc-500 dark:text-zinc-400">
        Loading history…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-500">
        {error}{" "}
        <button
          onClick={() => void fetchHistory()}
          className="underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="p-4 text-sm text-zinc-400 dark:text-zinc-500 text-center">
        No generation history yet.
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
      {logs.map((log) => (
        <div key={log.id} className="flex items-start gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {TYPE_LABELS[log.type] ?? log.type}
            </div>
            <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {extractPromptLabel(log)}
            </div>
            <div className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
              {new Date(log.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
              {log.tokensUsed != null && ` · ${log.tokensUsed} tokens`}
            </div>
          </div>
          {log.outputSchema && (
            <button
              onClick={() => handleRestore(log)}
              disabled={restoringId === log.id}
              className="shrink-0 rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              {restoringId === log.id ? "Applying…" : "Restore"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
