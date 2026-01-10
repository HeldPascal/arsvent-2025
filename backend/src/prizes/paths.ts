import fs from "fs";
import path from "path";

export const resolveBackendRoot = () => {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, "data"))) {
    return cwd;
  }
  if (fs.existsSync(path.join(cwd, "backend", "data"))) {
    return path.join(cwd, "backend");
  }
  return cwd;
};

export const resolveDataRoot = () => path.join(resolveBackendRoot(), "data");
