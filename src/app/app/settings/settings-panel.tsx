import { MemberRole } from "@/generated/prisma/client";
import {
  getActiveSettingsTab,
  getVisibleSettingsTabs,
  isDeleteButtonEnabled,
  isMemberFormDisabled,
} from "@/lib/settings";

interface SettingsPanelProps {
  role: MemberRole;
  searchParams?: { tab?: string };
  deleteConfirmation?: string;
}

export function SettingsPanel({
  role,
  searchParams,
  deleteConfirmation = "",
}: SettingsPanelProps) {
  const tabs = getVisibleSettingsTabs(role);
  const activeTab = getActiveSettingsTab(searchParams?.tab, role);
  const formDisabled = isMemberFormDisabled(role);
  const canDelete = isDeleteButtonEnabled(deleteConfirmation);

  return (
    <section>
      <nav>
        {tabs.map((tab) => (
          <a key={tab} href={`/app/settings?tab=${tab}`} data-active={String(activeTab === tab)}>
            {tab}
          </a>
        ))}
      </nav>

      <form>
        <input name="displayName" disabled={formDisabled} />
        <input name="weeklyDigest" type="checkbox" disabled={formDisabled} />
      </form>

      <button type="button" disabled={!canDelete}>
        Delete account
      </button>
    </section>
  );
}
