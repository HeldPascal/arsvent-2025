import { PrismaClient } from "@prisma/client";
import { runSeed } from "./seed-tools.js";

const prisma = new PrismaClient();

runSeed(prisma, "staging")
  .catch((err) => {
    console.error("[seed] Failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
