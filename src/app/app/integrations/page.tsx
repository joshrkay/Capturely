import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { withAccountContext } from "@/lib/account";
import { ShopifyCard } from "./components/shopify-card";
import { WordpressCard } from "./components/wordpress-card";
import { ZapierCard } from "./components/zapier-card";
import { WebhooksCard } from "./components/webhooks-card";

type IntegrationStatus = "connected" | "disconnected" | "error";
type IntegrationRecord = {
  id: string;
  platform: "shopify" | "wordpress" | "zapier" | "custom";
  status: IntegrationStatus;
  metadata: string | null;
};

export default async function IntegrationsPage() {
  let ctx;
  try {
    ctx = await withAccountContext();
  } catch {
    redirect("/sign-in");
  }

  const [integrations, sites, webhookCount] = await Promise.all([
    prisma.integration.findMany({ where: { accountId: ctx.accountId } }),
    prisma.site.findMany({
      where: { accountId: ctx.accountId },
      select: { id: true, name: true, publicKey: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.webhook.count({ where: { site: { accountId: ctx.accountId } } }),
  ]);

  const byPlatform = new Map<string, IntegrationRecord>(
    (integrations as IntegrationRecord[]).map((item) => [item.platform, item])
  );
  const shopify = byPlatform.get("shopify") ?? null;
  const wordpress = byPlatform.get("wordpress");
  const zapier = byPlatform.get("zapier");
  const custom = byPlatform.get("custom");

  const getStatus = (integration: IntegrationRecord | undefined): IntegrationStatus =>
    integration?.status ?? "disconnected";
  const customStatus: IntegrationStatus =
    custom?.status ?? (webhookCount > 0 ? "connected" : "disconnected");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const defaultSiteId = sites[0]?.id ?? "";
  const initialWebhooks = defaultSiteId
    ? await prisma.webhook.findMany({ where: { siteId: defaultSiteId }, orderBy: { createdAt: "desc" } })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Integrations</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Connect Capturely to Shopify, WordPress, Zapier, and custom webhook destinations.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2">
        <ShopifyCard integration={shopify} />
        <WordpressCard status={getStatus(wordpress)} />
        <ZapierCard
          status={getStatus(zapier)}
          webhookUrl={`${baseUrl}/api/runtime/submit`}
        />
        <WebhooksCard
          sites={sites}
          status={customStatus}
          initialSiteId={defaultSiteId}
          initialWebhooks={initialWebhooks}
        />
      </div>
    </div>
  );
}
