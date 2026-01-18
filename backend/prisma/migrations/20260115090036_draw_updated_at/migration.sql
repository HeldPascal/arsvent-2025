-- AlterTable
ALTER TABLE "Draw" ADD COLUMN "updatedAt" DATETIME;

UPDATE "Draw"
SET "updatedAt" = COALESCE("createdAt", CURRENT_TIMESTAMP)
WHERE "updatedAt" IS NULL;
