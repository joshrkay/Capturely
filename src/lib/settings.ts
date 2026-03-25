import { z } from "zod";
import { MemberRole } from "@/generated/prisma/client";

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

export function canUpdateSettings(role: MemberRole): boolean {
  return role === MemberRole.owner || role === MemberRole.admin;
}
