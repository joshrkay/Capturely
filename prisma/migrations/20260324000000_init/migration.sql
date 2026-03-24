-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('owner', 'admin', 'member');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('pending', 'accepted', 'revoked', 'expired');

-- CreateEnum
CREATE TYPE "SiteStatus" AS ENUM ('active', 'archived');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'published', 'paused', 'archived');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('popup', 'inline');

-- CreateEnum
CREATE TYPE "OptimizationStatus" AS ENUM ('idle', 'generating', 'experimenting', 'promoting');

-- CreateEnum
CREATE TYPE "VariantGeneratedBy" AS ENUM ('manual', 'ai', 'auto_optimization');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('new', 'read', 'archived');

-- CreateEnum
CREATE TYPE "ExperimentEventType" AS ENUM ('impression', 'conversion');

-- CreateEnum
CREATE TYPE "OptimizationRunStatus" AS ENUM ('pending', 'generating', 'experimenting', 'promoting', 'completed', 'failed');

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'My Account',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "plan_key" TEXT NOT NULL DEFAULT 'free',
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "payment_status" TEXT NOT NULL DEFAULT 'active',
    "payment_grace_until" TIMESTAMP(3),
    "billing_cycle_start" TIMESTAMP(3),
    "billing_cycle_end" TIMESTAMP(3),

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_members" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'member',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invites" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'member',
    "token" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sites" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "primary_domain" TEXT NOT NULL,
    "platform_type" TEXT,
    "public_key" TEXT NOT NULL,
    "secret_key" TEXT NOT NULL,
    "status" "SiteStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CampaignType" NOT NULL DEFAULT 'popup',
    "status" "CampaignStatus" NOT NULL DEFAULT 'draft',
    "has_unpublished_changes" BOOLEAN NOT NULL DEFAULT true,
    "auto_optimize" BOOLEAN NOT NULL DEFAULT false,
    "optimization_status" "OptimizationStatus" NOT NULL DEFAULT 'idle',
    "targeting_json" TEXT,
    "trigger_json" TEXT,
    "frequency_json" TEXT,
    "webhook_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variants" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Control',
    "is_control" BOOLEAN NOT NULL DEFAULT false,
    "traffic_percentage" INTEGER NOT NULL DEFAULT 100,
    "schema_json" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "growthbook_feature_key" TEXT,
    "generated_by" "VariantGeneratedBy" NOT NULL DEFAULT 'manual',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "variant_id" TEXT,
    "experiment_id" TEXT,
    "submission_id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "name" TEXT,
    "fields_json" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'new',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_usage" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "submission_count" INTEGER NOT NULL DEFAULT 0,
    "overage_count" INTEGER NOT NULL DEFAULT 0,
    "ai_generations_count" INTEGER NOT NULL DEFAULT 0,
    "usage_locked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "account_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhooks" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiment_events" (
    "id" TEXT NOT NULL,
    "visitor_id" TEXT NOT NULL,
    "experiment_key" TEXT NOT NULL,
    "variation_id" TEXT NOT NULL,
    "event_type" "ExperimentEventType" NOT NULL,
    "campaign_id" TEXT,
    "site_id" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link_url" TEXT,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processed_stripe_events" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_stripe_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "optimization_runs" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "status" "OptimizationRunStatus" NOT NULL DEFAULT 'pending',
    "current_control_variant_id" TEXT,
    "challenger_variant_ids" TEXT[],
    "growthbook_experiment_id" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "optimization_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "optimization_run_variants" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "conversion_rate" DOUBLE PRECISION,
    "is_winner" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "optimization_run_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_generation_logs" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "prompt_hash" TEXT,
    "input_context" TEXT,
    "output_schema" TEXT,
    "tokens_used" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_generation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_stripe_customer_id_key" ON "accounts"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "account_members_user_id_idx" ON "account_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_members_account_id_user_id_key" ON "account_members"("account_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "invites_token_key" ON "invites"("token");

-- CreateIndex
CREATE INDEX "invites_account_id_idx" ON "invites"("account_id");

-- CreateIndex
CREATE INDEX "invites_token_idx" ON "invites"("token");

-- CreateIndex
CREATE UNIQUE INDEX "sites_public_key_key" ON "sites"("public_key");

-- CreateIndex
CREATE INDEX "sites_account_id_idx" ON "sites"("account_id");

-- CreateIndex
CREATE INDEX "sites_public_key_idx" ON "sites"("public_key");

-- CreateIndex
CREATE INDEX "campaigns_account_id_idx" ON "campaigns"("account_id");

-- CreateIndex
CREATE INDEX "campaigns_site_id_idx" ON "campaigns"("site_id");

-- CreateIndex
CREATE INDEX "variants_campaign_id_idx" ON "variants"("campaign_id");

-- CreateIndex
CREATE INDEX "submissions_account_id_idx" ON "submissions"("account_id");

-- CreateIndex
CREATE INDEX "submissions_site_id_idx" ON "submissions"("site_id");

-- CreateIndex
CREATE INDEX "submissions_campaign_id_idx" ON "submissions"("campaign_id");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_site_id_submission_id_key" ON "submissions"("site_id", "submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_usage_account_id_key" ON "account_usage"("account_id");

-- CreateIndex
CREATE INDEX "webhooks_site_id_idx" ON "webhooks"("site_id");

-- CreateIndex
CREATE INDEX "experiment_events_experiment_key_idx" ON "experiment_events"("experiment_key");

-- CreateIndex
CREATE INDEX "experiment_events_campaign_id_idx" ON "experiment_events"("campaign_id");

-- CreateIndex
CREATE INDEX "experiment_events_site_id_idx" ON "experiment_events"("site_id");

-- CreateIndex
CREATE INDEX "experiment_events_timestamp_idx" ON "experiment_events"("timestamp");

-- CreateIndex
CREATE INDEX "notifications_account_id_idx" ON "notifications"("account_id");

-- CreateIndex
CREATE INDEX "notifications_account_id_read_at_idx" ON "notifications"("account_id", "read_at");

-- CreateIndex
CREATE UNIQUE INDEX "processed_stripe_events_event_id_key" ON "processed_stripe_events"("event_id");

-- CreateIndex
CREATE INDEX "optimization_runs_campaign_id_idx" ON "optimization_runs"("campaign_id");

-- CreateIndex
CREATE INDEX "optimization_run_variants_run_id_idx" ON "optimization_run_variants"("run_id");

-- CreateIndex
CREATE INDEX "ai_generation_logs_account_id_idx" ON "ai_generation_logs"("account_id");

-- AddForeignKey
ALTER TABLE "account_members" ADD CONSTRAINT "account_members_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variants" ADD CONSTRAINT "variants_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_usage" ADD CONSTRAINT "account_usage_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment_events" ADD CONSTRAINT "experiment_events_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "optimization_runs" ADD CONSTRAINT "optimization_runs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "optimization_run_variants" ADD CONSTRAINT "optimization_run_variants_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "optimization_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

