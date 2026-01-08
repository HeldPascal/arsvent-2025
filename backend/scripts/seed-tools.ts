import type { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";

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

type SeedUserInput = {
  discordUserId: string;
  label?: string;
  username?: string;
  globalName?: string;
  locale?: string;
  mode?: string;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  introCompleted?: boolean;
  lastSolvedDay?: number;
  lastSolvedAtDaysAgo?: number;
  lastLoginAtDaysAgo?: number;
};

const normalizeLocaleValue = (value?: string) => (value === "de" || value === "en" ? value : "en");
const normalizeModeValue = (value?: string) => (value === "VETERAN" || value === "NORMAL" ? value : "NORMAL");

const loadSeedUsers = async (seedFilePath: string) => {
  const resolvedPath = path.resolve(seedFilePath);
  const raw = await fs.readFile(resolvedPath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("Seed file must contain a JSON array.");
  }
  return parsed.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new Error(`Seed entry at index ${index} must be an object.`);
    }
    const discordUserId = (entry as SeedUserInput).discordUserId;
    if (!discordUserId || typeof discordUserId !== "string") {
      throw new Error(`Seed entry at index ${index} is missing discordUserId.`);
    }
    const typed = entry as SeedUserInput;
    const validateNumber = (value: number | undefined, field: string) => {
      if (value === undefined) {
        return;
      }
      if (!Number.isFinite(value) || value < 0) {
        throw new Error(`Seed entry at index ${index} has invalid ${field}.`);
      }
    };
    validateNumber(typed.lastSolvedDay, "lastSolvedDay");
    validateNumber(typed.lastSolvedAtDaysAgo, "lastSolvedAtDaysAgo");
    validateNumber(typed.lastLoginAtDaysAgo, "lastLoginAtDaysAgo");
    return {
      discordUserId,
      label: typeof typed.label === "string" ? typed.label : undefined,
      username: typeof typed.username === "string" ? typed.username : undefined,
      globalName: typeof typed.globalName === "string" ? typed.globalName : undefined,
      locale: typeof typed.locale === "string" ? typed.locale : undefined,
      mode: typeof typed.mode === "string" ? typed.mode : undefined,
      isAdmin: typeof typed.isAdmin === "boolean" ? typed.isAdmin : undefined,
      isSuperAdmin: typeof typed.isSuperAdmin === "boolean" ? typed.isSuperAdmin : undefined,
      introCompleted: typeof typed.introCompleted === "boolean" ? typed.introCompleted : undefined,
      lastSolvedDay: typeof typed.lastSolvedDay === "number" ? typed.lastSolvedDay : undefined,
      lastSolvedAtDaysAgo:
        typeof typed.lastSolvedAtDaysAgo === "number" ? typed.lastSolvedAtDaysAgo : undefined,
      lastLoginAtDaysAgo:
        typeof typed.lastLoginAtDaysAgo === "number" ? typed.lastLoginAtDaysAgo : undefined,
    };
  });
};

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

export const runSeed = async (prisma: PrismaClient, target: SeedEnvironment, seedFilePath: string) => {
  ensureEnvironment(target);
  const seedInputs = await loadSeedUsers(seedFilePath);
  console.log(`[seed] Seeding ${target} data...`);

  await prisma.appState.upsert({
    where: { id: 1 },
    update: { unlockedDay: 5, updatedBy: "seed" },
    create: { id: 1, unlockedDay: 5, updatedBy: "seed" },
  });

  for (const [index, input] of seedInputs.entries()) {
    const suffix = input.discordUserId.slice(-6);
    const username = input.username ?? `seed-${index + 1}-${suffix}`;
    const globalName = input.globalName ?? username;
    const locale = normalizeLocaleValue(input.locale);
    const mode = normalizeModeValue(input.mode);
    const isSuperAdmin = input.isSuperAdmin ?? false;
    const isAdmin = input.isAdmin ?? isSuperAdmin;
    const introCompleted = input.introCompleted ?? false;
    const lastSolvedDay = input.lastSolvedDay ?? 0;
    const lastSolvedAt =
      input.lastSolvedAtDaysAgo !== undefined
        ? daysAgo(input.lastSolvedAtDaysAgo)
        : lastSolvedDay > 0
          ? daysAgo(1)
          : null;
    const lastLoginAt = input.lastLoginAtDaysAgo !== undefined ? daysAgo(input.lastLoginAtDaysAgo) : now;
    const seedData = {
      username,
      globalName,
      locale,
      mode,
      isAdmin,
      isSuperAdmin,
      introCompleted,
      lastSolvedDay,
      lastSolvedAt,
      lastLoginAt,
    };
    await prisma.user.upsert({
      where: { id: input.discordUserId },
      update: seedData,
      create: {
        id: input.discordUserId,
        ...seedData,
        sessionVersion: 1,
        stateVersion: 1,
      },
    });
  }
  await prisma.auditLog.createMany({ data: seedAuditLogs });

  console.log("[seed] Done.");
};
