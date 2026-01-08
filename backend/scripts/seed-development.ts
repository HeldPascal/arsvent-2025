import { PrismaClient } from "@prisma/client";
import { runSeed } from "./seed-tools.js";

const prisma = new PrismaClient();
const seedFilePath = process.argv[2];
if (!seedFilePath) {
  throw new Error("Seed file path is required (first argument).");
}

runSeed(prisma, "development", seedFilePath)
  .catch((err) => {
    console.error("[seed] Failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
