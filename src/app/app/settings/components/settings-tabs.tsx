"use client";

import { useRef, type KeyboardEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getVisibleSettingsTabs, type SettingsTabKey } from "@/lib/settings-tabs-policy";
import { AccountTab } from "./account-tab";
import { TeamTab } from "./team-tab";
import { NotificationsTab } from "./notifications-tab";
import { ApiKeysTab } from "./api-keys-tab";
import { DangerZoneTab } from "./danger-zone-tab";

type SettingsTabsProps = {
  initialTab: SettingsTabKey;
  role: "owner" | "admin" | "member";
  currentUserId: string;
  account: {
    id: string;
    name: string;
    company: string | null;
    timezone: string | null;
    planKey: string;
    paymentStatus: string;
    createdAt: string;
  };
  members: Array<{
    id: string;
    userId: string;
    role: string;
    createdAt: string;
  }>;
  sites: Array<{
    id: string;
    name: string;
    primaryDomain: string;
    publicKey: string;
    secretKey: string;
    status: string;
  }>;
};

export function SettingsTabs({
  initialTab,
  role,
  currentUserId,
  account,
  members,
  sites,
}: SettingsTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const disableMutations = role === "member";
  const tabs = getVisibleSettingsTabs(role);

  const activeTab: SettingsTabKey = tabs.some((tab) => tab.key === initialTab)
    ? initialTab
    : tabs[0]?.key ?? "account";

  const tabRefs = useRef<Record<SettingsTabKey, HTMLButtonElement | null>>({
    account: null,
    team: null,
    notifications: null,
    "api-keys": null,
    "danger-zone": null,
  });

  const updateTab = (tab: SettingsTabKey) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("tab", tab);
    router.replace(`${pathname}?${nextParams.toString()}`);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = tabs.findIndex((tab) => tab.key === activeTab);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % tabs.length;
      event.preventDefault();
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      event.preventDefault();
    } else if (event.key === "Home") {
      nextIndex = 0;
      event.preventDefault();
    } else if (event.key === "End") {
      nextIndex = tabs.length - 1;
      event.preventDefault();
    } else {
      return;
    }

    const nextTab = tabs[nextIndex];
    if (!nextTab) return;

    updateTab(nextTab.key);
    tabRefs.current[nextTab.key]?.focus();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">Settings</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Configure account, team, notification, and API access settings.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Settings tabs"
        onKeyDown={onKeyDown}
        className="flex flex-wrap gap-2 rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950"
      >
        {tabs.map((tab) => {
          const selected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              ref={(node) => {
                tabRefs.current[tab.key] = node;
              }}
              id={`settings-tab-${tab.key}`}
              aria-controls={`settings-panel-${tab.key}`}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => updateTab(tab.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                selected
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`settings-panel-${activeTab}`}
        aria-labelledby={`settings-tab-${activeTab}`}
      >
        {activeTab === "account" && (
          <AccountTab account={account} disableMutations={disableMutations} />
        )}
        {activeTab === "team" && (
          <TeamTab members={members} currentUserId={currentUserId} role={role} />
        )}
        {activeTab === "notifications" && (
          <NotificationsTab disableMutations={disableMutations} />
        )}
        {activeTab === "api-keys" && <ApiKeysTab sites={sites} />}
        {activeTab === "danger-zone" && <DangerZoneTab />}
      </div>
    </div>
  );
}
