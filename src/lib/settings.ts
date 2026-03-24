export interface NotificationPreferences {
  newSubmission: boolean;
  usageWarning: boolean;
  teamInvite: boolean;
  campaignPublish: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  newSubmission: true,
  usageWarning: true,
  teamInvite: true,
  campaignPublish: false,
};

export const SETTINGS_API_PATHS = {
  settings: "/api/settings",
  deleteAccount: "/api/settings/account",
  keys: "/api/settings/keys",
  rotateSiteKeys: (siteId: string) => `/api/sites/${siteId}/rotate-keys`,
};

export function parseNotificationPreferences(
  value: string | null | undefined
): NotificationPreferences {
  if (!value) return DEFAULT_NOTIFICATION_PREFS;

  try {
    const parsed = JSON.parse(value) as Partial<NotificationPreferences>;
    if (
      typeof parsed.newSubmission !== "boolean" ||
      typeof parsed.usageWarning !== "boolean" ||
      typeof parsed.teamInvite !== "boolean" ||
      typeof parsed.campaignPublish !== "boolean"
    ) {
      return DEFAULT_NOTIFICATION_PREFS;
    }

    return parsed as NotificationPreferences;
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

export function serializeNotificationPreferences(
  value: NotificationPreferences
): string {
  return JSON.stringify(value);
}
