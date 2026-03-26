export type AccountProfileFields = {
  displayName: string;
  company: string;
  timezone: string;
};

type SettingsPatchResponse = {
  settings: {
    accountId: string;
    displayName: string;
    company: string | null;
    timezone: string | null;
  };
};

export async function saveAccountProfileFields(
  fields: AccountProfileFields,
  fetchImpl: typeof fetch = fetch
): Promise<AccountProfileFields> {
  const response = await fetchImpl("/api/settings", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      displayName: fields.displayName.trim(),
      company: fields.company,
      timezone: fields.timezone,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to save account settings");
  }

  const data = (await response.json()) as SettingsPatchResponse;
  return {
    displayName: data.settings.displayName,
    company: data.settings.company ?? "",
    timezone: data.settings.timezone ?? "",
  };
}
