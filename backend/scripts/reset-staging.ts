import { runReset } from "./reset-tools.js";

runReset("staging").catch((err) => {
  console.error("[reset] Failed:", err);
  process.exitCode = 1;
});
