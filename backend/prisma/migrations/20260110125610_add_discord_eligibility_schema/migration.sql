-- AlterTable
ALTER TABLE "User" ADD COLUMN "discordRolesUpdatedAt" DATETIME;

-- CreateTable
CREATE TABLE "EventConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "discordServerId" TEXT,
    "eligibleRoleIds" TEXT NOT NULL,
    "userRolesRefreshIntervalMinutes" INTEGER NOT NULL DEFAULT 60,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserDiscordRole" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserDiscordRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("discord_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminDiscordToken" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "accessToken" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "refreshToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdminDiscordToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("discord_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "UserDiscordRole_userId_idx" ON "UserDiscordRole"("userId");

-- CreateIndex
CREATE INDEX "UserDiscordRole_guildId_idx" ON "UserDiscordRole"("guildId");

-- CreateIndex
CREATE INDEX "UserDiscordRole_roleId_idx" ON "UserDiscordRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDiscordRole_userId_guildId_roleId_key" ON "UserDiscordRole"("userId", "guildId", "roleId");
