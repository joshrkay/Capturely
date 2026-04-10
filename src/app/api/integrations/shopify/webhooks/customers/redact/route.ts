import { NextRequest } from "next/server";
import { handleShopifyGdprWebhook } from "../../_shared";

export async function POST(req: NextRequest) {
  return handleShopifyGdprWebhook("customers_redact", req);
}
