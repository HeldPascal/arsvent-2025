-- CreateTable
CREATE TABLE "Feedback" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppState" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "unlockedDay" INTEGER NOT NULL DEFAULT 0,
    "feedbackEnabled" BOOLEAN NOT NULL DEFAULT true,
    "feedbackEndsAt" DATETIME,
    "feedbackFreeTextEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL,
    "updatedBy" TEXT
);
INSERT INTO "new_AppState" ("id", "unlockedDay", "updatedAt", "updatedBy") SELECT "id", "unlockedDay", "updatedAt", "updatedBy" FROM "AppState";
DROP TABLE "AppState";
ALTER TABLE "new_AppState" RENAME TO "AppState";
CREATE TABLE "new_User" (
    "discord_id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "globalName" TEXT,
    "avatar" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "mode" TEXT NOT NULL DEFAULT 'NORMAL',
    "creatureSwap" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "hasSubmittedFeedback" BOOLEAN NOT NULL DEFAULT false,
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
INSERT INTO "new_User" ("avatar", "createdAt", "creatureSwap", "discord_id", "globalName", "introCompleted", "isAdmin", "isSuperAdmin", "lastDowngradedAt", "lastDowngradedFromDay", "lastLoginAt", "lastSolvedAt", "lastSolvedDay", "locale", "mode", "sessionVersion", "stateVersion", "updatedAt", "username") SELECT "avatar", "createdAt", "creatureSwap", "discord_id", "globalName", "introCompleted", "isAdmin", "isSuperAdmin", "lastDowngradedAt", "lastDowngradedFromDay", "lastLoginAt", "lastSolvedAt", "lastSolvedDay", "locale", "mode", "sessionVersion", "stateVersion", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
