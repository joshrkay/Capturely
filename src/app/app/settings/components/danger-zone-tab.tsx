"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { SETTINGS_API_PATHS } from "@/lib/settings";

export function DangerZoneTab() {
  const router = useRouter();
  const { signOut } = useClerk();
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirmation === "DELETE";

  const onDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(SETTINGS_API_PATHS.deleteAccount, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to delete account");
      }
      await signOut();
      router.push("/sign-up");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border-2 border-red-300 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950/20">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Danger Zone</h3>
      <p id="delete-help" className="text-sm text-zinc-500 dark:text-zinc-400">
        Type DELETE to permanently remove this account and all related data.
      </p>
      <input
        value={confirmation}
        onChange={(e) => setConfirmation(e.target.value)}
        aria-describedby="delete-help"
        disabled={deleting}
        className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />
      <button
        type="button"
        onClick={onDelete}
        disabled={!canDelete || deleting}
        className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        {deleting ? "Deleting..." : "Delete Account"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
