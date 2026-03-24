"use client";

import { useState } from "react";
import type { FormSchema } from "../[id]/builder/types";
import { AiHistoryPanel } from "./AiHistoryPanel";

type Tab = "generate" | "history";

export function AiChatPanel({
  campaignType,
  onApplySchema,
}: {
  campaignType: string;
  onApplySchema: (schema: FormSchema) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<Array<{ prompt: string; response: string }>>([]);
  const [activeTab, setActiveTab] = useState<Tab>("generate");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, campaignType }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "AI generation failed");
        return;
      }

      const data = await res.json();
      setHistory((prev) => [...prev, { prompt, response: data.schema }]);

      // Try to parse and apply the schema
      try {
        // Extract JSON from the response (may be wrapped in markdown code blocks)
        let jsonStr = data.schema;
        const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1];
        }
        const schema = JSON.parse(jsonStr) as FormSchema;
        onApplySchema(schema);
      } catch {
        setError("AI returned an invalid schema. Try rephrasing your prompt.");
      }

      setPrompt("");
    } catch {
      setError("Failed to connect to AI service");
    } finally {
      setLoading(false);
    }
  };

  function handleRestoreFromHistory(rawSchema: string) {
    try {
      let jsonStr = rawSchema;
      const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) jsonStr = match[1];
      const schema = JSON.parse(jsonStr) as FormSchema;
      onApplySchema(schema);
    } catch {
      // ignore malformed history entries
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">AI Copilot</h3>
        <div className="flex rounded border border-zinc-200 dark:border-zinc-700 overflow-hidden text-xs">
          <button
            onClick={() => setActiveTab("generate")}
            className={`px-3 py-1 ${activeTab === "generate" ? "bg-indigo-600 text-white" : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}
          >
            Generate
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-3 py-1 ${activeTab === "history" ? "bg-indigo-600 text-white" : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}
          >
            History
          </button>
        </div>
      </div>

      {activeTab === "history" ? (
        <AiHistoryPanel
          filterType="form_generation"
          onRestore={handleRestoreFromHistory}
        />
      ) : (
        <>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Describe your form and AI will generate it for you.</p>

          {error && (
            <div className="rounded bg-red-50 p-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</div>
          )}

          <div className="max-h-48 space-y-2 overflow-y-auto">
            {history.map((h, i) => (
              <div key={i} className="rounded bg-zinc-50 p-2 text-xs dark:bg-zinc-800">
                <div className="font-medium text-zinc-700 dark:text-zinc-300">{h.prompt}</div>
                <div className="mt-1 text-zinc-500 dark:text-zinc-400">Schema applied</div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleGenerate()}
              placeholder="e.g. Lead capture form for a coffee shop"
              disabled={loading}
              className="flex-1 rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={loading || !prompt.trim()}
              className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "..." : "Generate"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
