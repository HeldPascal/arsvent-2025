/*
  Warnings:

  - Made the column `updatedAt` on table `Draw` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Draw" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pool" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "seed" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" TEXT NOT NULL,
    "publishedAt" DATETIME,
    "publishedBy" TEXT,
    "eligibleCount" INTEGER NOT NULL DEFAULT 0,
    "assignedCount" INTEGER NOT NULL DEFAULT 0,
    "eligibilitySnapshotId" TEXT,
    CONSTRAINT "Draw_eligibilitySnapshotId_fkey" FOREIGN KEY ("eligibilitySnapshotId") REFERENCES "EligibilitySnapshot" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Draw" ("assignedCount", "createdAt", "createdBy", "eligibilitySnapshotId", "eligibleCount", "id", "pool", "publishedAt", "publishedBy", "seed", "status", "updatedAt") SELECT "assignedCount", "createdAt", "createdBy", "eligibilitySnapshotId", "eligibleCount", "id", "pool", "publishedAt", "publishedBy", "seed", "status", "updatedAt" FROM "Draw";
DROP TABLE "Draw";
ALTER TABLE "new_Draw" RENAME TO "Draw";
CREATE INDEX "Draw_pool_idx" ON "Draw"("pool");
CREATE INDEX "Draw_status_idx" ON "Draw"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
