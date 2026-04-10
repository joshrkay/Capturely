import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Home from "@/app/page";

describe("marketing landing page", () => {
  it("renders required sections and plan tiers", () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain("Capturely");
    expect(html).toContain("Build high-converting Shopify forms in minutes");

    expect(html).toContain("Drag-and-drop builder");
    expect(html).toContain("Conditional logic");
    expect(html).toContain("Integrations");
    expect(html).toContain("Analytics");

    expect(html).toContain("Free");
    expect(html).toContain("Starter");
    expect(html).toContain("Growth");
    expect(html).toContain("Enterprise");
    expect(html).toContain("$19/mo");
    expect(html).toContain("$49/mo");
    expect(html).toContain("Custom pricing");

    expect(html).toContain("Trusted by growth teams");

    expect(html).toContain("Start on Shopify App Store");
    expect(html).toContain('href="https://apps.shopify.com"');
  });
});
