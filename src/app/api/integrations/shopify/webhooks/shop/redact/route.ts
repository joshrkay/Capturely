import { NextRequest } from "next/server";
import { handleShopifyGdprWebhook } from "../../_shared";

export async function POST(req: NextRequest) {
  return handleShopifyGdprWebhook("shop_redact", req);
}
