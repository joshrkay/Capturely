import { describe, expect, it } from "vitest";
import {
  defaultNotificationPreferences,
  deleteAccountSchema,
  getActiveSettingsTab,
  getVisibleSettingsTabs,
  parseNotificationPreferences,
  serializeNotificationPreferences,
  updateSettingsSchema,
} from "@/lib/settings";
import { SETTINGS_TABS } from "@/lib/settings-tabs-policy";

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

describe("settings tabs policy", () => {
  it("matches canonical tab matrix for owner/admin/member", () => {
    expect(getVisibleSettingsTabs("owner").map((tab) => tab.key)).toEqual([
      "account",
      "team",
      "notifications",
      "api-keys",
      "danger-zone",
    ]);

    expect(getVisibleSettingsTabs("admin").map((tab) => tab.key)).toEqual([
      "account",
      "team",
      "notifications",
      "api-keys",
    ]);

    expect(getVisibleSettingsTabs("member").map((tab) => tab.key)).toEqual([
      "account",
      "team",
      "notifications",
      "api-keys",
    ]);
  });

  it("maps tab query params to canonical active tabs by role", () => {
    expect(getActiveSettingsTab("danger-zone", "owner")).toBe("danger-zone");
    expect(getActiveSettingsTab("danger-zone", "admin")).toBe("account");
    expect(getActiveSettingsTab("danger-zone", "member")).toBe("account");

    expect(getActiveSettingsTab("team", "member")).toBe("team");
    expect(getActiveSettingsTab("unknown", "owner")).toBe("account");
    expect(getActiveSettingsTab(undefined, "admin")).toBe("account");
  });

  it("uses canonical tab keys for query params", () => {
    const canonicalTabKeys = SETTINGS_TABS.map((tab) => tab.key);
    expect(canonicalTabKeys).toEqual([
      "account",
      "team",
      "notifications",
      "api-keys",
      "danger-zone",
    ]);
  });
});
