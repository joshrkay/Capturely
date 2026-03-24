import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TEMPLATES } from "@/lib/templates";
import {
  CATEGORY_CHIPS,
  createCampaignFromTemplate,
  getVisibleTemplates,
  getBuilderPath,
} from "../template-utils";
import { TemplatePreviewModal } from "../components/TemplatePreviewModal";

describe("new campaign templates", () => {
  it("covers all 10 template ids from TEMPLATES", () => {
    expect(TEMPLATES).toHaveLength(10);

    const ids = TEMPLATES.map((template) => template.id);
    expect(new Set(ids).size).toBe(10);
  });

  it("category chips match exactly the expected set", () => {
    expect(CATEGORY_CHIPS).toEqual([
      "All",
      "Lead Generation",
      "E-commerce",
      "General",
      "Feedback",
    ]);
  });

  it("selecting each category filters correctly", () => {
    for (const category of CATEGORY_CHIPS) {
      const filtered = getVisibleTemplates(category);
      if (category === "All") {
        expect(filtered).toHaveLength(TEMPLATES.length);
        continue;
      }

      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((template) => template.category === category)).toBe(true);
    }
  });

  it("All resets to unfiltered list", () => {
    const allTemplates = getVisibleTemplates("All");
    expect(allTemplates.map((template) => template.id)).toEqual(TEMPLATES.map((template) => template.id));
  });

  it("preview modal mounts and includes FormPreview output", () => {
    const html = renderToStaticMarkup(
      <TemplatePreviewModal template={TEMPLATES[0]} onClose={() => {}} />
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain(TEMPLATES[0].schema.submitLabel);
  });

  it("Use Template posts siteId/templateId and builds builder redirect path on success", async () => {
    const fetchMock = (async (_input: string | URL | Request, init?: RequestInit) => {
      const payload = JSON.parse(String(init?.body));
      expect(payload).toEqual({
        siteId: "site_1",
        templateId: "email-capture",
      });
      return {
        ok: true,
        json: async () => ({ id: "cmp_123" }),
      } as Response;
    }) as typeof fetch;

    const result = await createCampaignFromTemplate("site_1", "email-capture", fetchMock);
    expect(result).toEqual({
      ok: true,
      campaignId: "cmp_123",
    });
    expect(getBuilderPath("cmp_123")).toBe("/app/campaigns/cmp_123/builder");
  });
});
