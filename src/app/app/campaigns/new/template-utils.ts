import { TEMPLATES, type CampaignTemplate } from "@/lib/templates";

export const CATEGORY_CHIPS = ["All", "Lead Generation", "E-commerce", "General", "Feedback"] as const;
export type CategoryChip = (typeof CATEGORY_CHIPS)[number];

export function getVisibleTemplates(category: CategoryChip): CampaignTemplate[] {
  if (category === "All") return TEMPLATES;
  return TEMPLATES.filter((template) => template.category === category);
}

export function buildUseTemplatePayload(siteId: string, templateId: string) {
  return { siteId, templateId };
}

export function getBuilderPath(campaignId: string) {
  return `/app/campaigns/${campaignId}/builder`;
}

export async function createCampaignFromTemplate(
  siteId: string,
  templateId: string,
  fetchImpl: typeof fetch = fetch
) {
  const res = await fetchImpl("/api/campaigns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildUseTemplatePayload(siteId, templateId)),
  });

  if (!res.ok) {
    const data = await res.json();
    return { ok: false as const, error: data.error ?? "Failed to create campaign" };
  }

  const campaign = await res.json();
  return { ok: true as const, campaignId: campaign.id as string };
}
