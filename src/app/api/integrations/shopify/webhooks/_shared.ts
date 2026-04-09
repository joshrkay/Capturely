import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  ShopifyWebhookConfigurationError,
  verifyShopifyWebhookSignature,
} from "@/lib/shopify-webhook";

type ShopifyGdprTopic =
  | "customers_data_request"
  | "customers_redact"
  | "shop_redact";

const customerSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
  })
  .optional();

const baseSchema = z.object({
  shop_domain: z.string().min(1),
  customer: customerSchema,
});

function safeJsonParse(value: string): Record<string, unknown> | null {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function findAccountIdForShop(shopDomain: string): Promise<string | null> {
  const integrations = await prisma.integration.findMany({
    where: { platform: "shopify" },
    select: { accountId: true, metadata: true },
  });

  for (const integration of integrations) {
    if (!integration.metadata) continue;
    const metadata = safeJsonParse(integration.metadata);
    if (!metadata) continue;
    if (metadata.shopDomain === shopDomain) {
      return integration.accountId;
    }
  }

  return null;
}

function buildSubmissionMatch(customer: { email?: string; phone?: string } | undefined) {
  const or: Array<Record<string, string>> = [];
  if (customer?.email) or.push({ email: customer.email });
  if (customer?.phone) or.push({ phone: customer.phone });
  return or;
}

export async function handleShopifyGdprWebhook(
  topic: ShopifyGdprTopic,
  req: NextRequest
) {
  const payload = await req.text();
  const signature = req.headers.get("x-shopify-hmac-sha256");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  try {
    const valid = verifyShopifyWebhookSignature(payload, signature);
    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } catch (error) {
    if (error instanceof ShopifyWebhookConfigurationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const parsedBody = safeJsonParse(payload);
  if (!parsedBody) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = baseSchema.safeParse(parsedBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const accountId = await findAccountIdForShop(parsed.data.shop_domain);

  if (topic === "customers_data_request") {
    const identifiers = buildSubmissionMatch(parsed.data.customer);
    if (!accountId || identifiers.length === 0) {
      return NextResponse.json({ requested: true, submissions: [] });
    }

    const submissions = await prisma.submission.findMany({
      where: {
        accountId,
        OR: identifiers,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ requested: true, submissions });
  }

  if (topic === "customers_redact") {
    const identifiers = buildSubmissionMatch(parsed.data.customer);
    if (!accountId || identifiers.length === 0) {
      return NextResponse.json({ redacted: true, deleted: 0 });
    }

    const deleted = await prisma.submission.deleteMany({
      where: {
        accountId,
        OR: identifiers,
      },
    });

    return NextResponse.json({ redacted: true, deleted: deleted.count });
  }

  if (!accountId) {
    return NextResponse.json({ redacted: true, accountFound: false });
  }

  await prisma.optimizationRun.deleteMany({ where: { campaign: { accountId } } });
  await prisma.experimentEvent.deleteMany({ where: { campaign: { accountId } } });
  await prisma.aiGenerationLog.deleteMany({ where: { accountId } });
  await prisma.notification.deleteMany({ where: { accountId } });
  await prisma.submission.deleteMany({ where: { accountId } });
  await prisma.webhook.deleteMany({ where: { site: { accountId } } });
  await prisma.campaign.deleteMany({ where: { accountId } });
  await prisma.site.deleteMany({ where: { accountId } });
  await prisma.integration.deleteMany({ where: { accountId } });

  return NextResponse.json({ redacted: true, accountFound: true });
}
