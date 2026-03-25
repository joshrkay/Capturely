import { describe, expect, it } from "vitest";
import {
  buildSettingsPatchPayload,
  deleteAccountSchema,
  updateSettingsSchema,
} from "@/lib/settings";

describe("updateSettingsSchema", () => {
  it("accepts canonical account and notification fields", () => {
    const parsed = updateSettingsSchema.safeParse({
      displayName: "Acme",
      notificationPreferences: {
        weeklyDigest: true,
      },
    });

    expect(parsed.success).toBe(true);
  });

  it("accepts payload built by the UI helper", () => {
    const parsed = updateSettingsSchema.safeParse(
      buildSettingsPatchPayload({
        notificationPreferences: {
          productUpdates: false,
          weeklyDigest: true,
          billingAlerts: true,
          securityAlerts: true,
        },
      })
    );

    expect(parsed.success).toBe(true);
  });

  it("rejects empty payloads", () => {
    const parsed = updateSettingsSchema.safeParse({});

    expect(parsed.success).toBe(false);
  });

  it("rejects legacy keys that diverge from canonical contract", () => {
    const parsed = updateSettingsSchema.safeParse({
      name: "Legacy",
      notifications: {
        email: true,
      },
    });

    expect(parsed.success).toBe(false);
  });
});

describe("deleteAccountSchema", () => {
  it("accepts exact DELETE confirmation", () => {
    const parsed = deleteAccountSchema.safeParse({ confirmation: "DELETE" });

    expect(parsed.success).toBe(true);
  });

  it("rejects non-matching confirmation", () => {
    const parsed = deleteAccountSchema.safeParse({ confirmation: "delete" });

    expect(parsed.success).toBe(false);
  });
});
