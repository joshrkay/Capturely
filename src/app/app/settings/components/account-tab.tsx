"use client";

import { useMemo, useState } from "react";
import { SETTINGS_API_PATHS } from "@/lib/settings";

interface AccountTabProps {
  initialName: string;
  initialTimezone: string;
  initialLanguage: string;
  disabled: boolean;
  onSaved: () => void;
}

const languageOptions = [{ value: "en", label: "English" }];

export function AccountTab({
  initialName,
  initialTimezone,
  initialLanguage,
  disabled,
  onSaved,
}: AccountTabProps) {
  const [name, setName] = useState(initialName);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [language, setLanguage] = useState(initialLanguage);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timezones = useMemo(() => {
    if (typeof Intl.supportedValuesOf !== "function") {
      return ["UTC"];
    }
    return Intl.supportedValuesOf("timeZone");
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(SETTINGS_API_PATHS.settings, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, timezone, language }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to save settings");
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Account</h3>
      <div className={`space-y-4 ${disabled ? "opacity-60" : ""}`}>
        <div>
          <label htmlFor="account-name" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Account name
          </label>
          <input
            id="account-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={disabled || saving}
            className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label htmlFor="account-timezone" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Timezone
          </label>
          <select
            id="account-timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            disabled={disabled || saving}
            className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="account-language" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Language
          </label>
          <select
            id="account-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={disabled || saving}
            className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {languageOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={disabled || saving}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
