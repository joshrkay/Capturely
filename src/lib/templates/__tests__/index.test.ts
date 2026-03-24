import { describe, it, expect } from "vitest";
import {
  TEMPLATES,
  getTemplate,
  getTemplateCategories,
  getTemplatesByCategory,
} from "@/lib/templates";

describe("templates library", () => {
  it("contains all 10 expected template IDs", () => {
    expect(TEMPLATES).toHaveLength(10);

    const ids = TEMPLATES.map((template) => template.id).sort();
    expect(ids).toEqual([
      "cart-abandonment",
      "contact-form",
      "email-capture",
      "exit-intent",
      "lead-qualification",
      "newsletter-signup",
      "pre-launch-waitlist",
      "product-feedback",
      "survey-nps",
      "welcome-discount",
    ]);
  });

  it("returns the four supported categories", () => {
    expect(getTemplateCategories().sort()).toEqual([
      "E-commerce",
      "Feedback",
      "General",
      "Lead Generation",
    ]);
  });

  it("filters templates by category", () => {
    const feedbackTemplates = getTemplatesByCategory("Feedback");
    expect(feedbackTemplates.map((template) => template.id).sort()).toEqual([
      "product-feedback",
      "survey-nps",
    ]);
  });

  it("finds templates by id", () => {
    expect(getTemplate("email-capture")?.name).toBe("Email Capture");
    expect(getTemplate("missing-template")).toBeUndefined();
  });
});
