-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "discord_id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "globalName" TEXT,
    "avatar" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "mode" TEXT NOT NULL DEFAULT 'NORMAL',
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "sessionVersion" INTEGER NOT NULL DEFAULT 1,
    "stateVersion" INTEGER NOT NULL DEFAULT 1,
    "lastSolvedDay" INTEGER NOT NULL DEFAULT 0,
    "lastSolvedAt" DATETIME,
    "lastDowngradedAt" DATETIME,
    "lastDowngradedFromDay" INTEGER NOT NULL DEFAULT 0,
    "introCompleted" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("avatar", "createdAt", "discord_id", "globalName", "isAdmin", "isSuperAdmin", "lastDowngradedAt", "lastDowngradedFromDay", "lastLoginAt", "lastSolvedAt", "lastSolvedDay", "locale", "mode", "sessionVersion", "stateVersion", "updatedAt", "username") SELECT "avatar", "createdAt", "discord_id", "globalName", "isAdmin", "isSuperAdmin", "lastDowngradedAt", "lastDowngradedFromDay", "lastLoginAt", "lastSolvedAt", "lastSolvedDay", "locale", "mode", "sessionVersion", "stateVersion", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";

-- Mark existing users as having completed the intro to avoid blocking them.
UPDATE "User" SET "introCompleted" = 1;

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
