import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

config({ path: ".env" });
config({ path: ".env.local", override: true });

interface EnvRequirement {
  key: string;
  description: string;
  required: boolean;
}

const requirements: EnvRequirement[] = [
  { key: "DATABASE_URL", description: "Database connectivity", required: true },
  { key: "NEXT_PUBLIC_APP_URL", description: "Absolute app URL for redirects/callbacks", required: true },
  { key: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", description: "Clerk client auth", required: true },
  { key: "CLERK_SECRET_KEY", description: "Clerk server auth", required: true },
  { key: "RUNTIME_SIGNING_SECRET", description: "Widget token signing", required: true },
  { key: "CRON_SECRET", description: "Cron endpoint authentication", required: true },
  { key: "STRIPE_SECRET_KEY", description: "Billing checkout + portal", required: true },
  { key: "STRIPE_WEBHOOK_SECRET", description: "Stripe webhook verification", required: true },
  { key: "STRIPE_STARTER_PRICE_ID", description: "Starter plan checkout", required: true },
  { key: "STRIPE_GROWTH_PRICE_ID", description: "Growth plan checkout", required: true },
  { key: "RESEND_API_KEY", description: "Transactional email", required: true },
  { key: "FROM_EMAIL", description: "Email sender identity", required: true },
  { key: "ANTHROPIC_API_KEY", description: "AI generation endpoints", required: true },
  { key: "GROWTHBOOK_API_HOST", description: "Experimentation API host", required: true },
  { key: "GROWTHBOOK_SECRET_KEY", description: "Experimentation API auth", required: true },
  { key: "SHOPIFY_API_KEY", description: "Shopify OAuth", required: false },
  { key: "SHOPIFY_API_SECRET", description: "Shopify OAuth", required: false },
  { key: "SHOPIFY_SCOPES", description: "Shopify permissions", required: false },
  { key: "RECAPTCHA_SECRET_KEY", description: "Spam protection verification", required: false },
];

export interface EnvValidationResult {
  missingRequired: EnvRequirement[];
  missingRecommended: EnvRequirement[];
  present: EnvRequirement[];
}

export function validateEnvironment(): EnvValidationResult {
  const missingRequired: EnvRequirement[] = [];
  const missingRecommended: EnvRequirement[] = [];
  const present: EnvRequirement[] = [];

  for (const req of requirements) {
    const value = process.env[req.key];
    if (value && value.trim().length > 0) {
      present.push(req);
      continue;
    }

    if (req.required) {
      missingRequired.push(req);
    } else {
      missingRecommended.push(req);
    }
  }

  return { missingRequired, missingRecommended, present };
}

function printList(title: string, items: EnvRequirement[], marker: string): void {
  console.log(`\n${title}`);
  if (items.length === 0) {
    console.log(`${marker} none`);
    return;
  }

  for (const item of items) {
    console.log(`${marker} ${item.key} — ${item.description}`);
  }
}

function main(): void {
  const result = validateEnvironment();

  console.log("Capturely environment readiness check\n");
  console.log(`Present variables: ${result.present.length}/${requirements.length}`);

  printList("Missing required", result.missingRequired, "❌");
  printList("Missing recommended", result.missingRecommended, "⚠️");

  if (result.missingRequired.length > 0) {
    process.exitCode = 1;
    return;
  }

  console.log("\n✅ Environment meets required launch variables.");
}

const isDirectExecution =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  main();
}
