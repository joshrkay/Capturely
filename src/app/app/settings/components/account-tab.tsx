"use client";

import { useState, type FormEvent } from "react";
import { saveAccountProfileFields } from "./account-settings-client";

type AccountTabProps = {
  account: {
    id: string;
    name: string;
    company: string | null;
    timezone: string | null;
    planKey: string;
    paymentStatus: string;
    createdAt: string;
  };
  disableMutations: boolean;
};

export function AccountTab({ account, disableMutations }: AccountTabProps) {
  const [displayName, setDisplayName] = useState(account.name);
  const [company, setCompany] = useState(account.company ?? "");
  const [timezone, setTimezone] = useState(account.timezone ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const canInteract = !disableMutations;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canInteract || isSaving) {
      return;
    }

    const trimmedName = displayName.trim();
    if (trimmedName.length === 0) {
      setStatusMessage({
        tone: "error",
        message: "Account name is required.",
      });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const next = await saveAccountProfileFields({
        displayName: trimmedName,
        company,
        timezone,
      });
      setDisplayName(next.displayName);
      setCompany(next.company);
      setTimezone(next.timezone);
      setStatusMessage({
        tone: "success",
        message: "Account settings saved.",
      });
    } catch {
      setStatusMessage({
        tone: "error",
        message: "Could not save account settings. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Account</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Manage your account profile and billing metadata.
        </p>
      </div>

      <div className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Account ID</p>
          <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{account.id}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Created</p>
          <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
            {new Date(account.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Plan</p>
          <p className="mt-1 text-sm capitalize text-zinc-900 dark:text-zinc-100">{account.planKey}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Payment status</p>
          <p className="mt-1 text-sm capitalize text-zinc-900 dark:text-zinc-100">{account.paymentStatus}</p>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className={`space-y-4 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 ${disableMutations ? "opacity-60" : ""}`}
      >
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="account-name">
          Account name
        </label>
        <input
          id="account-name"
          name="account-name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          disabled={!canInteract || isSaving}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />

        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="account-company">
          Company
        </label>
        <input
          id="account-company"
          name="account-company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          disabled={!canInteract || isSaving}
          placeholder="Organization name"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />

        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="account-timezone">
          Timezone
        </label>
        <input
          id="account-timezone"
          name="account-timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          disabled={!canInteract || isSaving}
          placeholder="e.g. America/New_York"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Use an IANA timezone name.</p>

        {statusMessage && (
          <p
            className={
              statusMessage.tone === "success"
                ? "text-sm text-emerald-700 dark:text-emerald-400"
                : "text-sm text-red-600 dark:text-red-400"
            }
            role="status"
          >
            {statusMessage.message}
          </p>
        )}

        <button
          type="submit"
          disabled={!canInteract || isSaving}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isSaving ? "Saving…" : "Save account settings"}
        </button>
      </form>
    </div>
  );
}
