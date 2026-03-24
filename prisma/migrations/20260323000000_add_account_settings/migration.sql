-- Add account settings fields for Gate G
ALTER TABLE "accounts"
ADD COLUMN "timezone" TEXT DEFAULT 'UTC',
ADD COLUMN "language" TEXT DEFAULT 'en',
ADD COLUMN "notification_preferences" TEXT;
