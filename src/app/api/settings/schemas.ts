import { z } from "zod";

export const notificationPreferencesSchema = z.object({
  newSubmission: z.boolean(),
  usageWarning: z.boolean(),
  teamInvite: z.boolean(),
  campaignPublish: z.boolean(),
});

export const updateSettingsSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    timezone: z.string().max(50).optional(),
    language: z.string().max(10).optional(),
    notificationPreferences: notificationPreferencesSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const deleteAccountSchema = z.object({
  confirmation: z.literal("DELETE"),
});
