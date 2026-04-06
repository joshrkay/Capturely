import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.local", override: true });

type CheckStatus = "pass" | "fail" | "skip";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string;
}

async function httpCheck(input: RequestInfo, init?: RequestInit): Promise<{ ok: boolean; status: number; body: string }> {
  const response = await fetch(input, {
    ...init,
    signal: AbortSignal.timeout(8000),
  });
  const body = await response.text();
  return { ok: response.ok, status: response.status, body };
}

async function checkStripe(): Promise<CheckResult> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return { name: "Stripe API", status: "skip", details: "STRIPE_SECRET_KEY not set" };
  }

  try {
    const res = await httpCheck("https://api.stripe.com/v1/prices?limit=1", {
      headers: { Authorization: `Bearer ${key}` },
    });

    if (res.ok) {
      return { name: "Stripe API", status: "pass", details: `Authenticated (HTTP ${res.status})` };
    }

    return { name: "Stripe API", status: "fail", details: `HTTP ${res.status}: ${res.body.slice(0, 120)}` };
  } catch (error) {
    return { name: "Stripe API", status: "fail", details: `Request failed: ${String(error)}` };
  }
}

async function checkResend(): Promise<CheckResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return { name: "Resend API", status: "skip", details: "RESEND_API_KEY not set" };
  }

  try {
    const res = await httpCheck("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
    });

    if (res.ok) {
      return { name: "Resend API", status: "pass", details: `Authenticated (HTTP ${res.status})` };
    }

    return { name: "Resend API", status: "fail", details: `HTTP ${res.status}: ${res.body.slice(0, 120)}` };
  } catch (error) {
    return { name: "Resend API", status: "fail", details: `Request failed: ${String(error)}` };
  }
}

async function checkAnthropic(): Promise<CheckResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return { name: "Anthropic API", status: "skip", details: "ANTHROPIC_API_KEY not set" };
  }

  try {
    const res = await httpCheck("https://api.anthropic.com/v1/models", {
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
    });

    if (res.ok) {
      return { name: "Anthropic API", status: "pass", details: `Authenticated (HTTP ${res.status})` };
    }

    return { name: "Anthropic API", status: "fail", details: `HTTP ${res.status}: ${res.body.slice(0, 120)}` };
  } catch (error) {
    return { name: "Anthropic API", status: "fail", details: `Request failed: ${String(error)}` };
  }
}

async function checkGrowthBook(): Promise<CheckResult> {
  const host = process.env.GROWTHBOOK_API_HOST;
  const secret = process.env.GROWTHBOOK_SECRET_KEY;

  if (!host || !secret) {
    return { name: "GrowthBook API", status: "skip", details: "GROWTHBOOK_API_HOST or GROWTHBOOK_SECRET_KEY not set" };
  }

  const normalizedHost = host.endsWith("/") ? host.slice(0, -1) : host;

  try {
    const res = await httpCheck(`${normalizedHost}/api/v1/features`, {
      headers: {
        Authorization: `Bearer ${secret}`,
      },
    });

    if (res.ok) {
      return { name: "GrowthBook API", status: "pass", details: `Authenticated (HTTP ${res.status})` };
    }

    return { name: "GrowthBook API", status: "fail", details: `HTTP ${res.status}: ${res.body.slice(0, 120)}` };
  } catch (error) {
    return { name: "GrowthBook API", status: "fail", details: `Request failed: ${String(error)}` };
  }
}

function checkShopifyConfig(): CheckResult {
  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiSecret = process.env.SHOPIFY_API_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!apiKey || !apiSecret) {
    return { name: "Shopify config", status: "skip", details: "SHOPIFY_API_KEY or SHOPIFY_API_SECRET not set" };
  }

  if (!appUrl || !appUrl.startsWith("http")) {
    return { name: "Shopify config", status: "fail", details: "NEXT_PUBLIC_APP_URL must be set to valid absolute URL" };
  }

  return {
    name: "Shopify config",
    status: "pass",
    details: `Keys present; callback base URL set (${appUrl})`,
  };
}

async function main(): Promise<void> {
  const checks = await Promise.all([
    checkStripe(),
    checkResend(),
    checkAnthropic(),
    checkGrowthBook(),
    Promise.resolve(checkShopifyConfig()),
  ]);

  console.log("Capturely integration readiness checks\n");

  let hasFailure = false;
  for (const check of checks) {
    const icon = check.status === "pass" ? "✅" : check.status === "fail" ? "❌" : "⚠️";
    console.log(`${icon} ${check.name}: ${check.details}`);
    if (check.status === "fail") {
      hasFailure = true;
    }
  }

  if (hasFailure) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`❌ Integration readiness script failed: ${String(error)}`);
  process.exitCode = 1;
});
