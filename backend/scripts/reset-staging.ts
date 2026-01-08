import { runReset } from "./reset-tools.js";

const seedFilePath = process.argv[2];
if (!seedFilePath) {
  throw new Error("Seed file path is required (first argument).");
}

runReset("staging", seedFilePath).catch((err) => {
  console.error("[reset] Failed:", err);
  process.exitCode = 1;
});
