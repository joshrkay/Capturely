"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  defaultNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/settings";
import {
  fetchNotificationPreferences,
  saveNotificationPreferences,
} from "./notifications-client";

type NotificationsTabProps = {
  disableMutations: boolean;
};


export function NotificationsTab({ disableMutations }: NotificationsTabProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    ...defaultNotificationPreferences,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setStatusMessage(null);

      try {
        const nextPreferences = await fetchNotificationPreferences();
        if (!isMounted) return;

        setPreferences(nextPreferences);
      } catch {
        if (!isMounted) return;
        setStatusMessage({
          tone: "error",
          message: "Could not load saved notification settings.",
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  const canInteract = !disableMutations;

  const onToggle = (key: keyof NotificationPreferences, checked: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: checked,
    }));
    setStatusMessage(null);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canInteract || isSaving) {
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const nextPreferences = await saveNotificationPreferences(preferences);
      setPreferences(nextPreferences);
      setStatusMessage({
        tone: "success",
        message: "Notification settings saved.",
      });
    } catch {
      setStatusMessage({
        tone: "error",
        message: "Could not save notification settings. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const busyLabel = useMemo(() => {
    if (isLoading) return "Loading…";
    if (isSaving) return "Saving…";
    return "Save notification settings";
  }, [isLoading, isSaving]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Notifications</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Configure email alerts and product updates.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className={`space-y-4 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 ${disableMutations ? "opacity-60" : ""}`}
        aria-busy={isSaving || isLoading}
      >
        <label className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={preferences.weeklyDigest}
            disabled={!canInteract}
            onChange={(event) => onToggle("weeklyDigest", event.target.checked)}
          />
          Campaign performance summaries
        </label>
        <label className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={preferences.billingAlerts}
            disabled={!canInteract}
            onChange={(event) => onToggle("billingAlerts", event.target.checked)}
          />
          Team invitations and role updates
        </label>
        <label className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={preferences.productUpdates}
            disabled={!canInteract}
            onChange={(event) => onToggle("productUpdates", event.target.checked)}
          />
          Product release updates
        </label>

        <button
          type="submit"
          disabled={!canInteract}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {busyLabel}
        </button>

        {statusMessage ? (
          <p
            role="status"
            className={`text-sm ${
              statusMessage.tone === "success"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {statusMessage.message}
          </p>
        ) : null}
      </form>
    </div>
  );
}
