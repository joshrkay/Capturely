-- CreateTable
CREATE TABLE "oauth_attempts" (
    "id" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "shop_domain" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used_at" TIMESTAMP(3),

    CONSTRAINT "oauth_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "oauth_attempts_nonce_key" ON "oauth_attempts"("nonce");

-- CreateIndex
CREATE INDEX "oauth_attempts_account_id_idx" ON "oauth_attempts"("account_id");

-- CreateIndex
CREATE INDEX "oauth_attempts_shop_domain_idx" ON "oauth_attempts"("shop_domain");

-- CreateIndex
CREATE INDEX "oauth_attempts_created_at_idx" ON "oauth_attempts"("created_at");

-- CreateIndex
CREATE INDEX "oauth_attempts_used_at_idx" ON "oauth_attempts"("used_at");

-- AddForeignKey
ALTER TABLE "oauth_attempts" ADD CONSTRAINT "oauth_attempts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
