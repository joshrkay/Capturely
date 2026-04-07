import {
  buildSettingsPatchPayload,
  defaultNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/settings-shared";

type SettingsApiResponse = {
  settings: {
    notificationPreferences: NotificationPreferences;
  };
};

function mergeWithDefaults(
  prefs: Partial<NotificationPreferences> | NotificationPreferences | undefined
): NotificationPreferences {
  return {
    ...defaultNotificationPreferences,
    ...(prefs ?? {}),
  };
}

export async function fetchNotificationPreferences(
  fetchImpl: typeof fetch = fetch
): Promise<NotificationPreferences> {
  const response = await fetchImpl("/api/settings", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load settings");
  }

  const data = (await response.json()) as SettingsApiResponse;
  return mergeWithDefaults(data.settings.notificationPreferences);
}

export async function saveNotificationPreferences(
  preferences: NotificationPreferences,
  fetchImpl: typeof fetch = fetch
): Promise<NotificationPreferences> {
  const response = await fetchImpl("/api/settings", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildSettingsPatchPayload({ notificationPreferences: preferences })),
  });

  if (!response.ok) {
    throw new Error("Failed to save settings");
  }

  const data = (await response.json()) as SettingsApiResponse;
  return mergeWithDefaults(data.settings.notificationPreferences);
}
