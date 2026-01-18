-- CreateTable
CREATE TABLE "Draw" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pool" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "seed" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "publishedAt" DATETIME,
    "publishedBy" TEXT,
    "eligibleCount" INTEGER NOT NULL DEFAULT 0,
    "assignedCount" INTEGER NOT NULL DEFAULT 0,
    "eligibilitySnapshotId" TEXT,
    CONSTRAINT "Draw_eligibilitySnapshotId_fkey" FOREIGN KEY ("eligibilitySnapshotId") REFERENCES "EligibilitySnapshot" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DrawAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "drawId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prizeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryStatus" TEXT,
    "deliveredAt" DATETIME,
    "deliveryMethod" TEXT,
    CONSTRAINT "DrawAssignment_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "Draw" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DrawAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("discord_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DrawOverride" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "drawAssignmentId" TEXT NOT NULL,
    "oldPrizeId" TEXT,
    "newPrizeId" TEXT,
    "reason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    CONSTRAINT "DrawOverride_drawAssignmentId_fkey" FOREIGN KEY ("drawAssignmentId") REFERENCES "DrawAssignment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EligibilitySnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pool" TEXT NOT NULL,
    "discordServerId" TEXT,
    "eligibleRoleIds" TEXT NOT NULL,
    "eligibleCount" INTEGER NOT NULL,
    "cutoffAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "EligibilitySnapshotUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "snapshotId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EligibilitySnapshotUser_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "EligibilitySnapshot" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EligibilitySnapshotUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("discord_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Draw_pool_idx" ON "Draw"("pool");

-- CreateIndex
CREATE INDEX "Draw_status_idx" ON "Draw"("status");

-- CreateIndex
CREATE INDEX "DrawAssignment_drawId_idx" ON "DrawAssignment"("drawId");

-- CreateIndex
CREATE INDEX "DrawAssignment_userId_idx" ON "DrawAssignment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DrawAssignment_drawId_userId_key" ON "DrawAssignment"("drawId", "userId");

-- CreateIndex
CREATE INDEX "DrawOverride_drawAssignmentId_idx" ON "DrawOverride"("drawAssignmentId");

-- CreateIndex
CREATE INDEX "EligibilitySnapshot_pool_idx" ON "EligibilitySnapshot"("pool");

-- CreateIndex
CREATE INDEX "EligibilitySnapshot_createdAt_idx" ON "EligibilitySnapshot"("createdAt");

-- CreateIndex
CREATE INDEX "EligibilitySnapshotUser_snapshotId_idx" ON "EligibilitySnapshotUser"("snapshotId");

-- CreateIndex
CREATE INDEX "EligibilitySnapshotUser_userId_idx" ON "EligibilitySnapshotUser"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EligibilitySnapshotUser_snapshotId_userId_key" ON "EligibilitySnapshotUser"("snapshotId", "userId");
