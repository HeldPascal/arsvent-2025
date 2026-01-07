import { PrismaClient } from "@prisma/client";
import { createClient } from "redis";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureEnvironment, runSeed, type SeedEnvironment } from "./seed-tools.js";

const prisma = new PrismaClient();

const resetRedis = async (label: SeedEnvironment) => {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error("REDIS_URL is required to reset Redis.");
  }
  const client = createClient({ url: redisUrl });
  client.on("error", (err) => {
    console.error("[reset] Redis error", err);
  });
  await client.connect();
  await client.flushAll();
  await client.disconnect();
  console.log(`[reset] Cleared ${label} Redis.`);
};

const resetDatabase = async (label: SeedEnvironment) => {
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.appState.deleteMany();
  console.log(`[reset] Cleared ${label} database.`);
};

const runMigrations = () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const backendDir = path.resolve(__dirname, "..");
  console.log("[reset] Running prisma migrate deploy...");
  execSync("npx prisma migrate deploy", { cwd: backendDir, stdio: "inherit" });
};

export const runReset = async (target: SeedEnvironment) => {
  ensureEnvironment(target);

  await resetDatabase(target);
  await resetRedis(target);
  runMigrations();
  await runSeed(prisma, target);

  console.log("[reset] Done.");
  await prisma.$disconnect();
};
