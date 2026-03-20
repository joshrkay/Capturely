import type { FrequencyConfig } from "@capturely/shared-forms";

const STORAGE_PREFIX = "capturely_freq_";

/** Check if a campaign should be shown based on frequency rules */
export function shouldShow(campaignId: string, config?: FrequencyConfig): boolean {
  if (!config) return true;

  const key = `${STORAGE_PREFIX}${campaignId}`;

  try {
    const stored = localStorage.getItem(key);
    if (!stored) return true;

    const data = JSON.parse(stored) as { count: number; lastShown: number; sessionShown?: boolean };

    if (config.maxShows && data.count >= config.maxShows) {
      return false;
    }

    if (config.perSession && data.sessionShown) {
      return false;
    }

    if (config.everyDays) {
      const daysSince = (Date.now() - data.lastShown) / (1000 * 60 * 60 * 24);
      if (daysSince < config.everyDays) return false;
    }

    return true;
  } catch {
    return true;
  }
}

/** Record that a campaign was shown */
export function recordShow(campaignId: string): void {
  const key = `${STORAGE_PREFIX}${campaignId}`;
  try {
    const stored = localStorage.getItem(key);
    const data = stored
      ? (JSON.parse(stored) as { count: number; lastShown: number })
      : { count: 0, lastShown: 0 };

    data.count += 1;
    data.lastShown = Date.now();
    (data as Record<string, unknown>).sessionShown = true;

    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // localStorage unavailable — skip
  }
}
