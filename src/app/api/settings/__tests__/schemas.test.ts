import { describe, expect, it } from "vitest";
import { deleteAccountSchema, updateSettingsSchema } from "../schemas";

describe("updateSettingsSchema", () => {
  it("accepts team-manageable fields", () => {
    const parsed = updateSettingsSchema.safeParse({
      name: "Acme",
      timezone: "America/Los_Angeles",
      language: "en-US",
    });

    expect(parsed.success).toBe(true);
  });

  it("accepts notification preference updates", () => {
    const parsed = updateSettingsSchema.safeParse({
      notifications: {
        email: true,
        push: false,
      },
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects empty payloads", () => {
    const parsed = updateSettingsSchema.safeParse({});

    expect(parsed.success).toBe(false);
  });

  it("rejects unknown notification keys", () => {
    const parsed = updateSettingsSchema.safeParse({
      notifications: {
        sms: true,
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
