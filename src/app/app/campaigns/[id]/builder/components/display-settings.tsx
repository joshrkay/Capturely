"use client";

import { useMemo } from "react";
import { safeJsonParse } from "@/lib/utils";
import type {
  TargetingRule,
  TargetingConfig,
  DeviceTarget,
  TriggerConfig,
  FrequencyConfig,
} from "@capturely/shared-forms";

// ─── Props ───────────────────────────────────────────────────────────────────

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  hasUnpublishedChanges: boolean;
  autoOptimize: boolean;
  targetingJson: string | null;
  triggerJson: string | null;
  frequencyJson: string | null;
  variants: unknown[];
  site: { id: string; name: string; publicKey: string };
}

interface DisplaySettingsProps {
  campaign: Campaign;
  onUpdate: (updates: Record<string, unknown>) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DEFAULT_TARGETING: TargetingConfig = { rules: [{ type: "all" }] };
const DEFAULT_TRIGGER: TriggerConfig = { type: "immediate" };
const DEFAULT_FREQUENCY: FrequencyConfig = {};

function normalizeTargetingJson(json: string | null): TargetingConfig {
  const parsed = safeJsonParse<Record<string, unknown>>(json, {});
  // New format — has `rules` array
  if (Array.isArray(parsed.rules)) {
    return parsed as unknown as TargetingConfig;
  }
  // Legacy format — plain TargetingRule object
  if (parsed.type && typeof parsed.type === "string") {
    return {
      rules: [{ type: parsed.type, value: parsed.value } as TargetingRule],
    };
  }
  return DEFAULT_TARGETING;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const inputClass =
  "w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
const labelClass =
  "mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400";
const sectionHeadingClass =
  "text-sm font-semibold text-zinc-900 dark:text-zinc-100";
const ghostButtonClass =
  "text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400";
const errorClass = "text-xs text-red-500 mt-0.5";

// ─── Targeting Rules Section ─────────────────────────────────────────────────

function TargetingRulesSection({
  targeting,
  onTargetingChange,
}: {
  targeting: TargetingConfig;
  onTargetingChange: (config: TargetingConfig) => void;
}) {
  const updateRule = (index: number, updates: Partial<TargetingRule>) => {
    const newRules = targeting.rules.map((r, i) =>
      i === index ? { ...r, ...updates } : r
    );
    onTargetingChange({ ...targeting, rules: newRules });
  };

  const addRule = () => {
    onTargetingChange({
      ...targeting,
      rules: [...targeting.rules, { type: "all" as const }],
    });
  };

  const removeRule = (index: number) => {
    onTargetingChange({
      ...targeting,
      rules: targeting.rules.filter((_, i) => i !== index),
    });
  };

  return (
    <div>
      <h4 className={sectionHeadingClass}>URL Targeting</h4>
      <div className="mt-2 space-y-2">
        {targeting.rules.map((rule, index) => (
          <div
            key={index}
            aria-label={`Targeting rule ${index + 1}`}
            className="space-y-1"
          >
            <div className="flex items-center gap-1">
              <div className="flex-1">
                <label
                  htmlFor={`targeting-rule-${index}-type`}
                  className={labelClass}
                >
                  Rule {index + 1}
                </label>
                <select
                  id={`targeting-rule-${index}-type`}
                  value={rule.type}
                  onChange={(e) =>
                    updateRule(index, {
                      type: e.target.value as TargetingRule["type"],
                      value: e.target.value === "all" ? undefined : rule.value,
                    })
                  }
                  className={inputClass}
                >
                  <option value="all">All pages</option>
                  <option value="equals">URL equals</option>
                  <option value="contains">URL contains</option>
                  <option value="starts_with">URL starts with</option>
                  <option value="does_not_contain">URL does not contain</option>
                </select>
              </div>
              {targeting.rules.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRule(index)}
                  aria-label={`Remove targeting rule ${index + 1}`}
                  className={`${ghostButtonClass} mt-5 shrink-0`}
                >
                  Remove
                </button>
              )}
            </div>
            {rule.type !== "all" && (
              <div>
                <label
                  htmlFor={`targeting-rule-${index}-value`}
                  className={labelClass}
                >
                  URL pattern
                </label>
                <input
                  id={`targeting-rule-${index}-value`}
                  type="text"
                  value={rule.value ?? ""}
                  onChange={(e) => updateRule(index, { value: e.target.value })}
                  placeholder="URL pattern"
                  className={inputClass}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <button type="button" onClick={addRule} className={`${ghostButtonClass} mt-2`}>
        Add targeting rule
      </button>
    </div>
  );
}

// ─── Device Targeting Section ────────────────────────────────────────────────

function DeviceTargetingSection({
  device,
  onChange,
}: {
  device: DeviceTarget;
  onChange: (device: DeviceTarget) => void;
}) {
  return (
    <div>
      <label htmlFor="device-targeting" className={labelClass}>
        Device Targeting
      </label>
      <select
        id="device-targeting"
        value={device}
        onChange={(e) => onChange(e.target.value as DeviceTarget)}
        className={inputClass}
      >
        <option value="all">All devices</option>
        <option value="desktop">Desktop only</option>
        <option value="mobile">Mobile only</option>
        <option value="tablet">Tablet only</option>
      </select>
    </div>
  );
}

// ─── Trigger Section ─────────────────────────────────────────────────────────

function TriggerSection({
  trigger,
  onUpdate,
}: {
  trigger: TriggerConfig;
  onUpdate: (trigger: TriggerConfig) => void;
}) {
  const delayError =
    trigger.type === "delay" &&
    trigger.delayMs !== undefined &&
    trigger.delayMs < 0
      ? "Delay must be 0 or greater"
      : null;

  const scrollError =
    trigger.type === "scroll" &&
    trigger.scrollPercent !== undefined &&
    (trigger.scrollPercent < 0 || trigger.scrollPercent > 100)
      ? "Scroll percentage must be between 0 and 100"
      : null;

  const clickError =
    trigger.type === "click" &&
    (trigger.clickSelector === undefined || trigger.clickSelector.trim() === "")
      ? "CSS selector is required"
      : null;

  return (
    <div>
      <label htmlFor="trigger-type" className={labelClass}>
        Trigger
      </label>
      <select
        id="trigger-type"
        value={trigger.type}
        onChange={(e) =>
          onUpdate({ type: e.target.value as TriggerConfig["type"] })
        }
        className={inputClass}
      >
        <option value="immediate">Immediately</option>
        <option value="delay">After delay</option>
        <option value="scroll">On scroll %</option>
        <option value="exit_intent">Exit intent</option>
        <option value="click">On click</option>
      </select>

      {trigger.type === "delay" && (
        <div className="mt-1">
          <label htmlFor="trigger-delay-ms" className={labelClass}>
            Delay (ms)
          </label>
          <input
            id="trigger-delay-ms"
            type="number"
            min={0}
            value={trigger.delayMs ?? 3000}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val) && val >= 0) {
                onUpdate({ type: "delay", delayMs: val });
              } else {
                onUpdate({ type: "delay", delayMs: val });
              }
            }}
            placeholder="Delay (ms)"
            className={inputClass}
          />
          {delayError && <p className={errorClass}>{delayError}</p>}
        </div>
      )}

      {trigger.type === "scroll" && (
        <div className="mt-1">
          <label htmlFor="trigger-scroll-percent" className={labelClass}>
            Scroll percentage
          </label>
          <input
            id="trigger-scroll-percent"
            type="number"
            min={0}
            max={100}
            value={trigger.scrollPercent ?? 50}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              onUpdate({ type: "scroll", scrollPercent: isNaN(val) ? 0 : val });
            }}
            placeholder="Scroll %"
            className={inputClass}
          />
          {scrollError && <p className={errorClass}>{scrollError}</p>}
        </div>
      )}

      {trigger.type === "click" && (
        <div className="mt-1">
          <label htmlFor="trigger-click-selector" className={labelClass}>
            CSS selector
          </label>
          <input
            id="trigger-click-selector"
            type="text"
            value={trigger.clickSelector ?? ""}
            onChange={(e) =>
              onUpdate({ type: "click", clickSelector: e.target.value })
            }
            placeholder="e.g. .my-button, #cta"
            className={inputClass}
          />
          {clickError && <p className={errorClass}>{clickError}</p>}
        </div>
      )}
    </div>
  );
}

// ─── Frequency Section ───────────────────────────────────────────────────────

function FrequencySection({
  frequency,
  onUpdate,
}: {
  frequency: FrequencyConfig;
  onUpdate: (frequency: FrequencyConfig) => void;
}) {
  return (
    <div>
      <h4 className={sectionHeadingClass}>Frequency</h4>
      <div className="mt-2 space-y-2">
        <div className="flex items-center gap-2">
          <label
            htmlFor="frequency-max-shows"
            className="text-xs text-zinc-500 dark:text-zinc-400 w-24"
          >
            Max shows
          </label>
          <input
            id="frequency-max-shows"
            type="number"
            min={1}
            value={frequency.maxShows ?? ""}
            onChange={(e) =>
              onUpdate({
                ...frequency,
                maxShows: parseInt(e.target.value) || undefined,
              })
            }
            placeholder="unlimited"
            className="flex-1 rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
        <div className="flex items-center gap-2">
          <label
            htmlFor="frequency-every-days"
            className="text-xs text-zinc-500 dark:text-zinc-400 w-24"
          >
            Every N days
          </label>
          <input
            id="frequency-every-days"
            type="number"
            min={1}
            value={frequency.everyDays ?? ""}
            onChange={(e) =>
              onUpdate({
                ...frequency,
                everyDays: parseInt(e.target.value) || undefined,
              })
            }
            placeholder="unlimited"
            className="flex-1 rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="frequency-per-session"
            type="checkbox"
            checked={frequency.perSession ?? false}
            onChange={(e) =>
              onUpdate({ ...frequency, perSession: e.target.checked })
            }
            className="rounded"
          />
          <label
            htmlFor="frequency-per-session"
            className="text-xs text-zinc-500 dark:text-zinc-400"
          >
            Once per session
          </label>
        </div>
      </div>
    </div>
  );
}

// ─── Scheduling Section ──────────────────────────────────────────────────────

function SchedulingSection({
  startDate,
  endDate,
  onChange,
}: {
  startDate: string;
  endDate: string;
  onChange: (schedule: { startDate?: string; endDate?: string }) => void;
}) {
  const dateError =
    startDate && endDate && endDate <= startDate
      ? "End date must be after start date"
      : null;

  return (
    <div>
      <h4 className={sectionHeadingClass}>Scheduling</h4>
      <div className="mt-2 space-y-2">
        <div>
          <label htmlFor="schedule-start-date" className={labelClass}>
            Start date
          </label>
          <input
            id="schedule-start-date"
            type="date"
            value={startDate}
            onChange={(e) =>
              onChange({
                startDate: e.target.value || undefined,
                endDate: endDate || undefined,
              })
            }
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="schedule-end-date" className={labelClass}>
            End date
          </label>
          <input
            id="schedule-end-date"
            type="date"
            value={endDate}
            onChange={(e) =>
              onChange({
                startDate: startDate || undefined,
                endDate: e.target.value || undefined,
              })
            }
            className={inputClass}
          />
          {dateError && <p className={errorClass}>{dateError}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function CampaignSettingsPanel({
  campaign,
  onUpdate,
}: DisplaySettingsProps) {
  const targeting = useMemo(
    () => normalizeTargetingJson(campaign.targetingJson),
    [campaign.targetingJson]
  );

  const trigger = useMemo(
    () => safeJsonParse<TriggerConfig>(campaign.triggerJson, DEFAULT_TRIGGER),
    [campaign.triggerJson]
  );

  const frequency = useMemo(
    () =>
      safeJsonParse<FrequencyConfig>(campaign.frequencyJson, DEFAULT_FREQUENCY),
    [campaign.frequencyJson]
  );

  // ── Targeting (rules + device + schedule) ────────────────────────────────

  const handleTargetingChange = (config: TargetingConfig) => {
    onUpdate({ targetingJson: JSON.stringify(config) });
  };

  const handleDeviceChange = (device: DeviceTarget) => {
    handleTargetingChange({ ...targeting, device });
  };

  const handleScheduleChange = (schedule: {
    startDate?: string;
    endDate?: string;
  }) => {
    // Block save when end date is before start date
    if (
      schedule.startDate &&
      schedule.endDate &&
      schedule.endDate <= schedule.startDate
    ) {
      return;
    }
    handleTargetingChange({ ...targeting, schedule });
  };

  // ── Trigger ──────────────────────────────────────────────────────────────

  const handleTriggerUpdate = (config: TriggerConfig) => {
    // Don't save invalid values
    if (config.type === "delay" && config.delayMs !== undefined && config.delayMs < 0) return;
    if (
      config.type === "scroll" &&
      config.scrollPercent !== undefined &&
      (config.scrollPercent < 0 || config.scrollPercent > 100)
    ) return;
    if (
      config.type === "click" &&
      (!config.clickSelector || config.clickSelector.trim() === "")
    ) return;
    onUpdate({ triggerJson: JSON.stringify(config) });
  };

  // ── Frequency ────────────────────────────────────────────────────────────

  const handleFrequencyUpdate = (config: FrequencyConfig) => {
    onUpdate({ frequencyJson: JSON.stringify(config) });
  };

  return (
    <div className="space-y-6">
      <h3 className={sectionHeadingClass}>Display Settings</h3>

      <TargetingRulesSection
        targeting={targeting}
        onTargetingChange={handleTargetingChange}
      />

      <DeviceTargetingSection
        device={targeting.device ?? "all"}
        onChange={handleDeviceChange}
      />

      <TriggerSection trigger={trigger} onUpdate={handleTriggerUpdate} />

      <FrequencySection
        frequency={frequency}
        onUpdate={handleFrequencyUpdate}
      />

      <SchedulingSection
        startDate={targeting.schedule?.startDate ?? ""}
        endDate={targeting.schedule?.endDate ?? ""}
        onChange={handleScheduleChange}
      />
    </div>
  );
}
