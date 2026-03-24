import { describe, expect, it } from "vitest";
import {
  defaultNotificationPreferences,
  deleteAccountSchema,
  parseNotificationPreferences,
  serializeNotificationPreferences,
  updateSettingsSchema,
} from "@/lib/settings";

describe("settings validation", () => {
  it("rejects updateSettingsSchema payloads with unknown keys", () => {
    const result = updateSettingsSchema.safeParse({
      displayName: "Acme",
      rogue: true,
    });

    expect(result.success).toBe(false);
  });

  it("rejects updateSettingsSchema when no fields are provided", () => {
    const result = updateSettingsSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects deleteAccountSchema unless confirmation is exactly DELETE", () => {
    expect(deleteAccountSchema.safeParse({ confirmation: "delete" }).success).toBe(false);
    expect(deleteAccountSchema.safeParse({ confirmation: "DELETE NOW" }).success).toBe(false);
    expect(deleteAccountSchema.safeParse({ confirmation: "DELETE" }).success).toBe(true);
  });
});

describe("notification preferences serialization", () => {
  it("round-trips and keeps defaults for unspecified values", () => {
    const serialized = serializeNotificationPreferences({ weeklyDigest: true });
    const parsed = parseNotificationPreferences(serialized);

    expect(parsed).toEqual({
      ...defaultNotificationPreferences,
      weeklyDigest: true,
    });
  });

  it("falls back to defaults for invalid json", () => {
    expect(parseNotificationPreferences("{not-json")).toEqual(defaultNotificationPreferences);
  });
});
