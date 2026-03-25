export type SettingsRole = "owner" | "admin" | "member";

export type SettingsTabKey =
  | "account"
  | "team"
  | "notifications"
  | "api-keys"
  | "danger-zone";

export type SettingsTabDefinition = {
  key: SettingsTabKey;
  label: string;
  allowedRoles: readonly SettingsRole[];
  allowedActions: readonly string[];
};

export const SETTINGS_TABS: readonly SettingsTabDefinition[] = [
  {
    key: "account",
    label: "Account",
    allowedRoles: ["owner", "admin", "member"],
    allowedActions: ["View account profile", "Edit account profile (owner/admin)"],
  },
  {
    key: "team",
    label: "Team",
    allowedRoles: ["owner", "admin", "member"],
    allowedActions: ["View members", "Manage invites and roles (owner/admin)"],
  },
  {
    key: "notifications",
    label: "Notifications",
    allowedRoles: ["owner", "admin", "member"],
    allowedActions: ["View notification preferences", "Edit preferences (owner/admin)"],
  },
  {
    key: "api-keys",
    label: "API Keys",
    allowedRoles: ["owner", "admin", "member"],
    allowedActions: ["View site keys", "Rotate/publish keys (owner/admin via API)"],
  },
  {
    key: "danger-zone",
    label: "Danger Zone",
    allowedRoles: ["owner"],
    allowedActions: ["Delete account"],
  },
];

export function getVisibleSettingsTabs(role: SettingsRole): SettingsTabDefinition[] {
  return SETTINGS_TABS.filter((tab) => tab.allowedRoles.includes(role));
}

export function isSettingsTabAllowed(tab: string, role: SettingsRole): tab is SettingsTabKey {
  return getVisibleSettingsTabs(role).some((entry) => entry.key === tab);
}

export function getActiveSettingsTab(tab: string | undefined, role: SettingsRole): SettingsTabKey {
  if (tab && isSettingsTabAllowed(tab, role)) {
    return tab;
  }

  return getVisibleSettingsTabs(role)[0]?.key ?? "account";
}
