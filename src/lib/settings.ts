/**
 * Server-side settings utilities.
 *
 * Re-exports client-safe helpers from settings-shared.ts and adds
 * server-only helpers that depend on Prisma.
 */

import { MemberRole } from "@/generated/prisma/client";
import {
  getActiveSettingsTab as getCanonicalActiveSettingsTab,
  getVisibleSettingsTabs as getCanonicalVisibleSettingsTabs,
  type SettingsRole,
  type SettingsTabDefinition,
  type SettingsTabKey,
} from "@/lib/settings-tabs-policy";

// Re-export everything from the client-safe module so existing server-side
// imports from "@/lib/settings" continue to work without changes.
export {
  notificationPreferencesSchema,
  type NotificationPreferences,
  defaultNotificationPreferences,
  updateSettingsSchema,
  type UpdateSettingsInput,
  buildSettingsPatchPayload,
  deleteAccountSchema,
  serializeNotificationPreferences,
  parseNotificationPreferences,
} from "@/lib/settings-shared";

export function canUpdateSettings(role: MemberRole): boolean {
  return role === MemberRole.owner || role === MemberRole.admin;
}

export function getVisibleSettingsTabs(role: SettingsRole): SettingsTabDefinition[] {
  return getCanonicalVisibleSettingsTabs(role);
}

export function getActiveSettingsTab(tab: string | undefined, role: SettingsRole): SettingsTabKey {
  return getCanonicalActiveSettingsTab(tab, role);
}
