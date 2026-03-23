"use client";

import { useCallback } from "react";

interface TrafficSliderProps {
  variantId: string;
  variantName: string;
  value: number;
  onChange: (variantId: string, value: number) => void;
  disabled?: boolean;
}

export function TrafficSlider({ variantId, variantName, value, onChange, disabled = false }: TrafficSliderProps) {
  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(variantId, parseInt(e.target.value, 10));
    },
    [variantId, onChange]
  );

  const handleNumericChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseInt(e.target.value, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        onChange(variantId, parsed);
      }
    },
    [variantId, onChange]
  );

  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={handleSliderChange}
        disabled={disabled}
        className="flex-1 accent-blue-500 disabled:opacity-50"
        aria-label={`Traffic percentage for ${variantName}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      />
      <input
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={handleNumericChange}
        disabled={disabled}
        className="w-14 rounded border border-zinc-300 px-1 py-0.5 text-xs text-center font-mono dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 disabled:opacity-50"
        aria-label={`Traffic percentage number input for ${variantName}`}
      />
      <span className="text-xs font-mono text-zinc-500">%</span>
    </div>
  );
}
