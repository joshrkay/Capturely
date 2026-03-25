/**
 * Client-safe settings utilities.
 *
 * This module contains ONLY browser-safe code (no Prisma, no Node.js built-ins).
 * Import from here in "use client" components.
 * Server-only code (e.g. canUpdateSettings) stays in settings.ts.
 */

import { z } from "zod";

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
  })
  .strict()
  .refine((data) => data.displayName !== undefined || data.notificationPreferences !== undefined, {
    message: "At least one setting must be provided",
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
