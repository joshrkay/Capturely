-- CreateEnum
CREATE TYPE "OptimizationGoalKind" AS ENUM ('maximize_submissions', 'maximize_qualified_leads', 'maximize_field_completion');

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN "optimization_goal_text" TEXT;
ALTER TABLE "campaigns" ADD COLUMN "optimization_goal_kind" "OptimizationGoalKind" NOT NULL DEFAULT 'maximize_submissions';
ALTER TABLE "campaigns" ADD COLUMN "optimization_goal_field_key" TEXT;
