import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemberRole } from "@/generated/prisma/client";
import { SettingsPanel } from "../settings-panel";

describe("SettingsPanel", () => {
  it("shows role-based tabs", () => {
    const ownerHtml = renderToStaticMarkup(<SettingsPanel role={MemberRole.owner} />);
    expect(ownerHtml).toContain("tab=billing");
    expect(ownerHtml).toContain("tab=danger");

    const adminHtml = renderToStaticMarkup(<SettingsPanel role={MemberRole.admin} />);
    expect(adminHtml).not.toContain("tab=billing");
    expect(adminHtml).not.toContain("tab=danger");

    const memberHtml = renderToStaticMarkup(<SettingsPanel role={MemberRole.member} />);
    expect(memberHtml).not.toContain("tab=billing");
    expect(memberHtml).not.toContain("tab=danger");
  });

  it("disables form controls for members", () => {
    const memberHtml = renderToStaticMarkup(<SettingsPanel role={MemberRole.member} />);
    expect(memberHtml).toContain('<input disabled="" name="displayName"/>');
    expect(memberHtml).toContain('<input type="checkbox" disabled="" name="weeklyDigest"/>');
  });

  it("enables delete button only when confirmation equals DELETE", () => {
    const disabledHtml = renderToStaticMarkup(
      <SettingsPanel role={MemberRole.owner} deleteConfirmation="delete" />
    );
    expect(disabledHtml).toContain("Delete account</button>");
    expect(disabledHtml).toContain("disabled");

    const enabledHtml = renderToStaticMarkup(
      <SettingsPanel role={MemberRole.owner} deleteConfirmation="DELETE" />
    );
    expect(enabledHtml).not.toContain("<button type=\"button\" disabled>");
  });

  it("switches active tab from URL query params and falls back for invalid tabs", () => {
    const notificationsHtml = renderToStaticMarkup(
      <SettingsPanel role={MemberRole.owner} searchParams={{ tab: "notifications" }} />
    );
    expect(notificationsHtml).toContain('href="/app/settings?tab=notifications" data-active="true"');

    const fallbackHtml = renderToStaticMarkup(
      <SettingsPanel role={MemberRole.admin} searchParams={{ tab: "danger" }} />
    );
    expect(fallbackHtml).toContain('href="/app/settings?tab=profile" data-active="true"');
  });
});
