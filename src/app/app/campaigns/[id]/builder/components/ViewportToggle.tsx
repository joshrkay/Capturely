"use client";

import type { ViewportKey } from "./FormPreview";

export interface ViewportToggleProps {
  value: ViewportKey;
  onChange: (viewport: ViewportKey) => void;
}

const BUTTONS: { key: ViewportKey; label: string }[] = [
  { key: "desktop", label: "Desktop" },
  { key: "tablet", label: "Tablet" },
  { key: "mobile", label: "Mobile" },
];

export function ViewportToggle({ value, onChange }: ViewportToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Preview viewport size"
      className="inline-flex rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden"
    >
      {BUTTONS.map(({ key, label }, i) => (
        <button
          key={key}
          role="radio"
          aria-checked={value === key}
          onClick={() => onChange(key)}
          className={[
            "px-3 py-1.5 text-xs focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset",
            i < BUTTONS.length - 1
              ? "border-r border-zinc-200 dark:border-zinc-800"
              : "",
            value === key
              ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 font-medium"
              : "text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
