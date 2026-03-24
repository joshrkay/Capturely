import { z } from "zod";

const notificationPreferencesSchema = z
  .object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    productUpdates: z.boolean().optional(),
    security: z.boolean().optional(),
    marketing: z.boolean().optional(),
  })
  .strict();

export const updateSettingsSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    timezone: z.string().trim().min(1).max(100).optional(),
    language: z.string().trim().min(2).max(16).optional(),
    notifications: notificationPreferencesSchema.optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.name !== undefined ||
      value.timezone !== undefined ||
      value.language !== undefined ||
      value.notifications !== undefined,
    {
      message:
        "At least one settings field must be provided (name, timezone, language, notifications).",
      path: [],
    }
  );

export const deleteAccountSchema = z
  .object({
    confirmation: z.literal("DELETE"),
  })
  .strict();
