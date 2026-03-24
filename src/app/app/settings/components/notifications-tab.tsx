"use client";

import { useEffect, useRef, useState } from "react";
import { NotificationPreferences, SETTINGS_API_PATHS } from "@/lib/settings";

interface NotificationsTabProps {
  initialPreferences: NotificationPreferences;
  disabled: boolean;
  onSaved: () => void;
}

const items: Array<{ key: keyof NotificationPreferences; label: string }> = [
  { key: "newSubmission", label: "New submission" },
  { key: "usageWarning", label: "Usage warning" },
  { key: "teamInvite", label: "Team invite" },
  { key: "campaignPublish", label: "Campaign publish" },
];

export function NotificationsTab({
  initialPreferences,
  disabled,
  onSaved,
}: NotificationsTabProps) {
  const [prefs, setPrefs] = useState(initialPreferences);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<keyof NotificationPreferences | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const savePrefs = (nextPrefs: NotificationPreferences, key: keyof NotificationPreferences) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      setSavingKey(key);
      setError(null);
      try {
        const res = await fetch(SETTINGS_API_PATHS.settings, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationPreferences: nextPrefs }),
        });
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          throw new Error(data.error ?? "Failed to save notification settings");
        }
        onSaved();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save notification settings");
      } finally {
        setSavingKey(null);
      }
    }, 500);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Notifications</h3>
      <div className={`space-y-3 ${disabled ? "opacity-60" : ""}`}>
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
            <label htmlFor={item.key} className="text-sm text-zinc-700 dark:text-zinc-300">
              {item.label}
            </label>
            <button
              id={item.key}
              type="button"
              role="switch"
              aria-checked={prefs[item.key]}
              onClick={() => {
                if (disabled) return;
                const nextPrefs = { ...prefs, [item.key]: !prefs[item.key] };
                setPrefs(nextPrefs);
                savePrefs(nextPrefs, item.key);
              }}
              disabled={disabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                prefs[item.key]
                  ? "bg-zinc-900 dark:bg-zinc-100"
                  : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  prefs[item.key] ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            {savingKey === item.key && <span className="text-xs text-zinc-500">Saving...</span>}
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
