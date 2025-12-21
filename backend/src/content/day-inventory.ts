import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONTENT_ROOT = path.join(__dirname, "..", "..", "content");

export interface DayInventorySnapshot {
  ids: string[];
  exists: boolean;
}

const cache = new Map<number, { mtimeMs: number; snapshot: DayInventorySnapshot }>();

const warn = (...args: unknown[]) => console.warn("[day-inventory]", ...args);

const resolveDayInventoryPath = (day: number) => {
  const dayFolder = `day${String(day).padStart(2, "0")}`;
  return path.join(CONTENT_ROOT, dayFolder, "inventory.yaml");
};

const normalizeIds = (entries: unknown[]): string[] => {
  const ids = entries
    .map((entry) => String(entry ?? "").trim())
    .filter((entry) => entry.length > 0);
  return Array.from(new Set(ids));
};

export const invalidateDayInventoryCache = (day?: number) => {
  if (day) {
    cache.delete(day);
  } else {
    cache.clear();
  }
};

export const loadDayInventorySnapshot = async (day: number): Promise<DayInventorySnapshot> => {
  if (!Number.isInteger(day) || day < 1) return { ids: [], exists: false };
  const filePath = resolveDayInventoryPath(day);
  try {
    const stats = await fs.stat(filePath);
    const cached = cache.get(day);
    if (cached && cached.mtimeMs === stats.mtimeMs) {
      return cached.snapshot;
    }
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = matter(`---\n${raw}\n---\n`).data;
    if (!Array.isArray(parsed)) {
      warn(`Inventory snapshot for day ${day} is not a YAML list (${filePath}).`);
      const snapshot = { ids: [], exists: true };
      cache.set(day, { mtimeMs: stats.mtimeMs, snapshot });
      return snapshot;
    }
    const ids = normalizeIds(parsed);
    const snapshot = { ids, exists: true };
    cache.set(day, { mtimeMs: stats.mtimeMs, snapshot });
    return snapshot;
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error.code !== "ENOENT") {
      warn(`Failed to read inventory snapshot for day ${day}:`, error.message);
    }
    cache.delete(day);
    return { ids: [], exists: false };
  }
};
