/**
 * Webhook delivery with retry logic.
 * Fires webhooks for form submissions to external URLs.
 */
import { prisma } from "@/lib/db";

interface WebhookPayload {
  submissionId: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  fields: Record<string, string>;
  campaignId: string;
  variantId: string | null;
  createdAt: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 4000, 8000]; // exponential backoff in ms

/**
 * Fire webhook for a submission. Checks campaign webhookUrl and site-level webhooks.
 * Retries up to 3 times with exponential backoff.
 */
export async function fireWebhook(
  siteId: string,
  campaignId: string,
  payload: WebhookPayload
): Promise<void> {
  // Collect webhook URLs from campaign and site
  const urls: string[] = [];

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { webhookUrl: true },
  });
  if (campaign?.webhookUrl) {
    urls.push(campaign.webhookUrl);
  }

  const siteWebhooks = await prisma.webhook.findMany({
    where: { siteId, active: true },
    select: { url: true, secret: true },
  });
  for (const wh of siteWebhooks) {
    urls.push(wh.url);
  }

  if (urls.length === 0) return;

  // Fire all webhooks concurrently
  await Promise.allSettled(
    urls.map((url) => deliverWithRetry(url, payload))
  );
}

async function deliverWithRetry(
  url: string,
  payload: WebhookPayload,
  attempt: number = 0
): Promise<void> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Capturely-Webhook/1.0",
        "X-Capturely-Submission-Id": payload.submissionId,
      },
      body: JSON.stringify({
        event: "submission.created",
        data: payload,
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!res.ok && attempt < MAX_RETRIES) {
      await delay(RETRY_DELAYS[attempt] ?? 8000);
      return deliverWithRetry(url, payload, attempt + 1);
    }
  } catch {
    if (attempt < MAX_RETRIES) {
      await delay(RETRY_DELAYS[attempt] ?? 8000);
      return deliverWithRetry(url, payload, attempt + 1);
    }
    // Final attempt failed — silently drop (could log to a dead-letter table in the future)
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
