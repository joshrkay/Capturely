import { describe, expect, it, vi } from "vitest";
import {
  fetchNotificationPreferences,
  saveNotificationPreferences,
} from "../notifications-client";
import { updateSettingsSchema } from "@/lib/settings";

describe("notifications settings client", () => {
  it("reload reflects previously saved values from persisted settings", async () => {
    let persisted = {
      productUpdates: true,
      weeklyDigest: false,
      billingAlerts: true,
      securityAlerts: true,
    };

    const fetchMock = vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      if (init?.method === "PATCH") {
        const body = JSON.parse(String(init.body)) as unknown;
        const parsed = updateSettingsSchema.safeParse(body);

        expect(parsed.success).toBe(true);
        expect(body).not.toHaveProperty("name");
        expect(body).not.toHaveProperty("notifications");

        persisted = {
          ...persisted,
          ...(parsed.success ? parsed.data.notificationPreferences : {}),
        };

        return {
          ok: true,
          json: async () => ({ settings: { notificationPreferences: persisted } }),
        } as Response;
      }

      return {
        ok: true,
        json: async () => ({ settings: { notificationPreferences: persisted } }),
      } as Response;
    }) as typeof fetch;

    const saved = await saveNotificationPreferences(
      {
        productUpdates: false,
        weeklyDigest: true,
        billingAlerts: true,
        securityAlerts: true,
      },
      fetchMock
    );

    expect(saved.weeklyDigest).toBe(true);
    expect(saved.productUpdates).toBe(false);

    const reloaded = await fetchNotificationPreferences(fetchMock);
    expect(reloaded).toEqual(saved);
  });

  it("throws when save fails so UI can show error state", async () => {
    const fetchMock = vi.fn(async () => ({ ok: false }) as Response) as typeof fetch;

    await expect(
      saveNotificationPreferences(
        {
          productUpdates: true,
          weeklyDigest: false,
          billingAlerts: true,
          securityAlerts: true,
        },
        fetchMock
      )
    ).rejects.toThrow("Failed to save settings");
  });
});
