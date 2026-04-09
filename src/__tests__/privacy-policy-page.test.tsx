import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PrivacyPolicyPage from "@/app/privacy-policy/page";

describe("privacy policy page", () => {
  it("renders required policy sections and contact details", () => {
    const html = renderToStaticMarkup(<PrivacyPolicyPage />);

    expect(html).toContain("Privacy Policy");
    expect(html).toContain("What We Collect");
    expect(html).toContain("How We Store and Protect Data");
    expect(html).toContain("How We Use Shopify Data");
    expect(html).toContain("GDPR and Privacy Rights");
    expect(html).toContain("Contact");
    expect(html).toContain("privacy@capturely.io");
  });
});
