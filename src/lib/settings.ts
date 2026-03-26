import { z } from "zod";
import {
  getActiveSettingsTab as getCanonicalActiveSettingsTab,
  getVisibleSettingsTabs as getCanonicalVisibleSettingsTabs,
  type SettingsRole,
  type SettingsTabDefinition,
  type SettingsTabKey,
} from "@/lib/settings-tabs-policy";

/** True if `tz` is a non-empty identifier accepted by the runtime as an IANA time zone. */
export function isValidIanaTimeZone(tz: string): boolean {
  if (tz === "") {
    return false;
  }
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export const notificationPreferencesSchema = z.object({
  productUpdates: z.boolean(),
  weeklyDigest: z.boolean(),
  billingAlerts: z.boolean(),
  securityAlerts: z.boolean(),
});

export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;

export const defaultNotificationPreferences: NotificationPreferences = {
  productUpdates: true,
  weeklyDigest: false,
  billingAlerts: true,
  securityAlerts: true,
};

export const updateSettingsSchema = z
  .object({
    displayName: z.string().trim().min(1).max(100).optional(),
    notificationPreferences: notificationPreferencesSchema.partial().optional(),
    company: z.string().max(200).transform((s) => s.trim()).optional(),
    timezone: z.string().max(64).transform((s) => s.trim()).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      data.displayName === undefined &&
      data.notificationPreferences === undefined &&
      data.company === undefined &&
      data.timezone === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one setting must be provided",
      });
    }
    if (
      data.timezone !== undefined &&
      data.timezone !== "" &&
      !isValidIanaTimeZone(data.timezone)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["timezone"],
        message: "Invalid IANA timezone",
      });
    }
  });

export type UpdateSettingsInput = z.input<typeof updateSettingsSchema>;

export function buildSettingsPatchPayload(input: UpdateSettingsInput): UpdateSettingsInput {
  return input;
}

export const deleteAccountSchema = z
  .object({
    confirmation: z.literal("DELETE"),
  })
  .strict();

export function serializeNotificationPreferences(
  notificationPreferences?: Partial<NotificationPreferences>
): string {
  return JSON.stringify({
    ...defaultNotificationPreferences,
    ...(notificationPreferences ?? {}),
  });
}

export function parseNotificationPreferences(json: string | null | undefined): NotificationPreferences {
  if (!json) {
    return { ...defaultNotificationPreferences };
  }

  try {
    const parsed = JSON.parse(json) as unknown;
    const result = notificationPreferencesSchema.partial().safeParse(parsed);
    if (!result.success) {
      return { ...defaultNotificationPreferences };
    }

    return {
      ...defaultNotificationPreferences,
      ...result.data,
    };
  } catch {
    return { ...defaultNotificationPreferences };
  }
}

export function canUpdateSettings(role: SettingsRole): boolean {
  return role === "owner" || role === "admin";
}

export function getVisibleSettingsTabs(role: SettingsRole): SettingsTabDefinition[] {
  return getCanonicalVisibleSettingsTabs(role);
}

export function getActiveSettingsTab(tab: string | undefined, role: SettingsRole): SettingsTabKey {
  return getCanonicalActiveSettingsTab(tab, role);
}
