"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MemberRole } from "@/generated/prisma/client";
import type { NotificationPreferences } from "@/lib/settings";
import { canManageBilling, canManageTeam } from "@/lib/rbac";
import { AccountTab } from "./account-tab";
import { NotificationsTab } from "./notifications-tab";
import { ApiKeysTab } from "./api-keys-tab";
import { DangerZoneTab } from "./danger-zone-tab";

export type SettingsTabId =
  | "account"
  | "team"
  | "notifications"
  | "api-keys"
  | "danger-zone";

interface SettingsTabsProps {
  role: MemberRole;
  account: {
    name: string;
    timezone: string;
    language: string;
    notificationPreferences: NotificationPreferences;
  };
  teamPanel: React.ReactNode;
}

interface TabOption {
  id: SettingsTabId;
  label: string;
}

export function SettingsTabs({ role, account, teamPanel }: SettingsTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const panelRef = useRef<HTMLDivElement>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const tabs = useMemo<TabOption[]>(() => {
    const base: TabOption[] = [
      { id: "account", label: "Account" },
      { id: "team", label: "Team" },
      { id: "notifications", label: "Notifications" },
    ];

    if (canManageTeam(role)) base.push({ id: "api-keys", label: "API Keys" });
    if (canManageBilling(role)) base.push({ id: "danger-zone", label: "Danger Zone" });

    return base;
  }, [role]);

  const active = searchParams.get("tab") as SettingsTabId | null;
  const activeTab = tabs.some((tab) => tab.id === active) ? active! : "account";

  const setTab = (tab: SettingsTabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    window.setTimeout(() => panelRef.current?.focus(), 0);
  };

  const onSaved = () => {
    setNotice("Settings saved");
    window.setTimeout(() => setNotice(null), 3000);
    router.refresh();
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();

    let nextIndex = idx;
    if (event.key === "ArrowRight") nextIndex = (idx + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (idx - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;

    setTab(tabs[nextIndex].id);
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 dark:border-zinc-800" role="tablist" aria-label="Settings tabs">
        <div className="flex flex-wrap gap-4 px-4">
          {tabs.map((tab, idx) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                id={`tab-${tab.id}`}
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setTab(tab.id)}
                onKeyDown={(event) => handleTabKeyDown(event, idx)}
                className={`border-b-2 py-3 text-sm ${
                  isActive
                    ? "border-zinc-900 font-medium text-zinc-900 dark:border-zinc-100 dark:text-zinc-50"
                    : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {notice && <div className="mx-4 mt-4 rounded bg-green-50 p-2 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">{notice}</div>}

      <div
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        tabIndex={0}
        ref={panelRef}
        className="p-4 outline-none"
      >
        {activeTab === "account" && (
          <AccountTab
            initialName={account.name}
            initialTimezone={account.timezone}
            initialLanguage={account.language}
            disabled={role === MemberRole.member}
            onSaved={onSaved}
          />
        )}
        {activeTab === "team" && teamPanel}
        {activeTab === "notifications" && (
          <NotificationsTab
            initialPreferences={account.notificationPreferences}
            disabled={role === MemberRole.member}
            onSaved={onSaved}
          />
        )}
        {activeTab === "api-keys" && <ApiKeysTab />}
        {activeTab === "danger-zone" && <DangerZoneTab />}
      </div>
    </div>
  );
}
