import { runReset } from "./reset-tools.js";

runReset("development").catch((err) => {
  console.error("[reset] Failed:", err);
  process.exitCode = 1;
});
