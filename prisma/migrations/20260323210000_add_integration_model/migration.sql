-- CreateTable
CREATE TABLE "integrations" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "credentials" TEXT,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "integrations_account_id_idx" ON "integrations"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "integrations_account_id_platform_key" ON "integrations"("account_id", "platform");

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_account_id_fkey"
FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
