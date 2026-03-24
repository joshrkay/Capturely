import { describe, it, expect } from "vitest";
import { MemberRole } from "@/generated/prisma/client";
import { canManageTeam, canManageBilling, canView } from "@/lib/rbac";
import {
  DEFAULT_NOTIFICATION_PREFS,
  parseNotificationPreferences,
  serializeNotificationPreferences,
} from "@/lib/settings";
import { deleteAccountSchema, updateSettingsSchema } from "@/app/api/settings/schemas";

describe("settings helpers", () => {
  it("round-trips notification preference serialization", () => {
    const serialized = serializeNotificationPreferences(DEFAULT_NOTIFICATION_PREFS);
    expect(parseNotificationPreferences(serialized)).toEqual(DEFAULT_NOTIFICATION_PREFS);
  });

  it("falls back to defaults when stored preferences are invalid", () => {
    expect(parseNotificationPreferences("{\"newSubmission\":true}")).toEqual(
      DEFAULT_NOTIFICATION_PREFS
    );
  });
});

describe("settings schemas", () => {
  it("rejects invalid updateSettings payloads", () => {
    expect(updateSettingsSchema.safeParse({ name: "" }).success).toBe(false);
    expect(updateSettingsSchema.safeParse({ timezone: "x".repeat(51) }).success).toBe(false);
    expect(updateSettingsSchema.safeParse({ language: "x".repeat(11) }).success).toBe(false);
    expect(
      updateSettingsSchema.safeParse({
        notificationPreferences: {
          newSubmission: true,
          usageWarning: true,
          teamInvite: true,
        },
      }).success
    ).toBe(false);
  });

  it("enforces DELETE confirmation literal", () => {
    expect(deleteAccountSchema.safeParse({ confirmation: "DELETE" }).success).toBe(true);
    expect(deleteAccountSchema.safeParse({ confirmation: "delete" }).success).toBe(false);
  });
});

describe("rbac helpers", () => {
  it("matches expected role matrix", () => {
    expect(canManageTeam(MemberRole.owner)).toBe(true);
    expect(canManageTeam(MemberRole.admin)).toBe(true);
    expect(canManageTeam(MemberRole.member)).toBe(false);

    expect(canManageBilling(MemberRole.owner)).toBe(true);
    expect(canManageBilling(MemberRole.admin)).toBe(false);
    expect(canManageBilling(MemberRole.member)).toBe(false);

    expect(canView(MemberRole.owner)).toBe(true);
    expect(canView(MemberRole.admin)).toBe(true);
    expect(canView(MemberRole.member)).toBe(true);
  });
});
