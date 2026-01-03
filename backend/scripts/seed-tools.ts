import type { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

export type SeedEnvironment = "staging" | "development";

const resolveAppEnv = () => process.env.APP_ENV?.toLowerCase() ?? "development";
const resolveIsProduction = () => process.env.IS_PRODUCTION?.toLowerCase();

export const ensureEnvironment = (target: SeedEnvironment) => {
  const appEnv = resolveAppEnv();
  const isProduction = resolveIsProduction();
  if (appEnv !== target) {
    throw new Error(`Refusing to run: APP_ENV must be '${target}'.`);
  }
  if (isProduction !== "false") {
    throw new Error("Refusing to run: IS_PRODUCTION must be 'false'.");
  }
};

const now = new Date();
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const seedUsers = [
  {
    id: "362609600287080459",
    username: "staging-super-admin",
    globalName: "Staging Super Admin",
    locale: "de",
    mode: "VETERAN",
    isAdmin: true,
    isSuperAdmin: true,
    lastSolvedDay: 24,
    lastSolvedAt: daysAgo(1),
    introCompleted: true,
    lastLoginAt: now,
  },
  {
    id: "122892188362211330",
    username: "staging-admin",
    globalName: "Staging Admin",
    locale: "de",
    mode: "VETERAN",
    isAdmin: true,
    isSuperAdmin: false,
    lastSolvedDay: 12,
    lastSolvedAt: daysAgo(2),
    introCompleted: true,
    lastLoginAt: now,
  },
  {
    id: "900000000000000001",
    username: "staging-normal-en",
    globalName: "Staging Normal EN",
    locale: "en",
    mode: "NORMAL",
    lastSolvedDay: 3,
    lastSolvedAt: daysAgo(10),
    introCompleted: true,
  },
  {
    id: "900000000000000002",
    username: "staging-veteran-en",
    globalName: "Staging Veteran EN",
    locale: "en",
    mode: "VETERAN",
    lastSolvedDay: 8,
    lastSolvedAt: daysAgo(6),
    introCompleted: true,
  },
  {
    id: "900000000000000003",
    username: "staging-normal-de",
    globalName: "Staging Normal DE",
    locale: "de",
    mode: "NORMAL",
    lastSolvedDay: 0,
    introCompleted: false,
  },
  {
    id: "900000000000000004",
    username: "staging-new-user",
    globalName: "Staging New User",
    locale: "en",
    mode: "NORMAL",
    lastSolvedDay: 0,
    introCompleted: false,
  },
];

const seedAuditLogs = [
  {
    action: "seed:admin:init",
    actorId: "362609600287080459",
    details: JSON.stringify({ note: "Seeded staging admin users" }),
  },
  {
    action: "seed:appstate",
    actorId: "362609600287080459",
    details: JSON.stringify({ note: "Seeded AppState" }),
  },
];

export const runSeed = async (prisma: PrismaClient, target: SeedEnvironment) => {
  ensureEnvironment(target);
  console.log(`[seed] Seeding ${target} data...`);

  await prisma.appState.upsert({
    where: { id: 1 },
    update: { unlockedDay: 5, updatedBy: "seed" },
    create: { id: 1, unlockedDay: 5, updatedBy: "seed" },
  });

  for (const user of seedUsers) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: { ...user },
      create: { ...user },
    });
  }
  await prisma.auditLog.createMany({ data: seedAuditLogs });

  console.log("[seed] Done.");
};
