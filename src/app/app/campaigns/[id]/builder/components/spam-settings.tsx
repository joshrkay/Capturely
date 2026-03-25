"use client";

import { useState, useEffect } from "react";

interface SpamConfig {
  rateLimitPerIp?: {
    maxSubmissions: number;
    windowMinutes: number;
  };
  emailBlocklist?: string[];
  ipBlocklist?: string[];
  recaptchaEnabled?: boolean;
  recaptchaThreshold?: number;
}

interface Campaign {
  spamConfigJson: string | null;
}

interface SpamSettingsProps {
  campaign: Campaign;
  onUpdate: (patch: Record<string, unknown>) => void;
}

const labelClass = "block text-xs font-medium text-zinc-700 dark:text-zinc-300";
const inputClass =
  "mt-1 block w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
const textareaClass =
  "mt-1 block w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 font-mono";

function parseConfig(json: string | null): SpamConfig {
  if (!json) return {};
  try {
    return JSON.parse(json) as SpamConfig;
  } catch {
    return {};
  }
}

export function SpamSettings({ campaign, onUpdate }: SpamSettingsProps) {
  const [config, setConfig] = useState<SpamConfig>(() =>
    parseConfig(campaign.spamConfigJson)
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConfig(parseConfig(campaign.spamConfigJson));
  }, [campaign.spamConfigJson]);

  function save(updated: SpamConfig) {
    setConfig(updated);
    onUpdate({ spamConfigJson: JSON.stringify(updated) });
  }

  const rateLimitEnabled = !!config.rateLimitPerIp;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Spam Protection
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Configure spam protection beyond the default honeypot field.
      </p>

      {/* Rate limiting */}
      <section className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={rateLimitEnabled}
            onChange={(e) => {
              if (e.target.checked) {
                save({
                  ...config,
                  rateLimitPerIp: { maxSubmissions: 5, windowMinutes: 60 },
                });
              } else {
                const { rateLimitPerIp: _, ...rest } = config;
                void _;
                save(rest);
              }
            }}
            className="rounded border-zinc-300"
          />
          Rate Limit by IP
        </label>
        {rateLimitEnabled && (
          <div className="ml-5 space-y-2">
            <div>
              <label className={labelClass}>Max submissions</label>
              <input
                type="number"
                min={1}
                value={config.rateLimitPerIp?.maxSubmissions ?? 5}
                onChange={(e) =>
                  save({
                    ...config,
                    rateLimitPerIp: {
                      ...config.rateLimitPerIp!,
                      maxSubmissions: parseInt(e.target.value, 10) || 1,
                    },
                  })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Window (minutes)</label>
              <input
                type="number"
                min={1}
                value={config.rateLimitPerIp?.windowMinutes ?? 60}
                onChange={(e) =>
                  save({
                    ...config,
                    rateLimitPerIp: {
                      ...config.rateLimitPerIp!,
                      windowMinutes: parseInt(e.target.value, 10) || 1,
                    },
                  })
                }
                className={inputClass}
              />
            </div>
          </div>
        )}
      </section>

      {/* Email blocklist */}
      <section className="space-y-1">
        <label className={labelClass}>Email Blocklist</label>
        <p className="text-xs text-zinc-400">
          One per line. Use *@domain.com for wildcard domain blocking.
        </p>
        <textarea
          rows={3}
          value={(config.emailBlocklist ?? []).join("\n")}
          onChange={(e) =>
            save({
              ...config,
              emailBlocklist: e.target.value
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder="spam@example.com&#10;*@spamdomain.com"
          className={textareaClass}
        />
      </section>

      {/* IP blocklist */}
      <section className="space-y-1">
        <label className={labelClass}>IP Blocklist</label>
        <p className="text-xs text-zinc-400">One IP address per line.</p>
        <textarea
          rows={3}
          value={(config.ipBlocklist ?? []).join("\n")}
          onChange={(e) =>
            save({
              ...config,
              ipBlocklist: e.target.value
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder="192.168.1.100&#10;10.0.0.1"
          className={textareaClass}
        />
      </section>

      {/* reCAPTCHA v3 */}
      <section className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={config.recaptchaEnabled ?? false}
            onChange={(e) =>
              save({ ...config, recaptchaEnabled: e.target.checked })
            }
            className="rounded border-zinc-300"
          />
          reCAPTCHA v3
        </label>
        {config.recaptchaEnabled && (
          <div className="ml-5">
            <label className={labelClass}>
              Threshold (0.0 = most lenient, 1.0 = strictest)
            </label>
            <input
              type="number"
              min={0}
              max={1}
              step={0.1}
              value={config.recaptchaThreshold ?? 0.5}
              onChange={(e) =>
                save({
                  ...config,
                  recaptchaThreshold: parseFloat(e.target.value) || 0.5,
                })
              }
              className={inputClass}
            />
          </div>
        )}
      </section>
    </div>
  );
}
