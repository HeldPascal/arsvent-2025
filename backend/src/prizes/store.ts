import fs from "fs/promises";
import matter from "gray-matter";
import path from "path";
import { resolveDataRoot } from "./paths.js";

export type PrizePool = "MAIN" | "VETERAN";

export interface PrizePoolMeta {
  cutoffAt: string | null;
}

export type LocalizedText = {
  en: string;
  de: string;
};

export interface PrizeRecord {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  image?: string | null;
  pool: PrizePool;
  quantity?: number | null;
  priority: number;
  isFiller: boolean;
  isActive: boolean;
  backupPrizes?: string[];
  adminNotes?: string | null;
}

export interface PrizeStore {
  pools: Record<PrizePool, PrizePoolMeta>;
  prizes: PrizeRecord[];
}

const DATA_ROOT = resolveDataRoot();
const PRIZES_ROOT = path.join(DATA_ROOT, "prizes");
const PRIZES_PATH = path.join(PRIZES_ROOT, "prizes.yaml");

const warn = (...args: unknown[]) => console.warn("[prizes]", ...args);

const defaultStore = (): PrizeStore => ({
  pools: {
    MAIN: { cutoffAt: null },
    VETERAN: { cutoffAt: null },
  },
  prizes: [],
});

const normalizePool = (value: unknown): PrizePool | null => {
  const pool = String(value ?? "").trim().toUpperCase();
  if (pool === "MAIN" || pool === "VETERAN") return pool;
  return null;
};

const normalizeString = (value: unknown): string => String(value ?? "").trim();

const normalizeBoolean = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const normalizeNumber = (value: unknown, fallback: number | null): number | null => {
  if (value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const normalized = value.map((entry) => normalizeString(entry)).filter(Boolean);
  return Array.from(new Set(normalized));
};

const normalizePoolMeta = (raw: unknown): PrizePoolMeta => {
  if (!raw || typeof raw !== "object") return { cutoffAt: null };
  const cutoff = (raw as { cutoff_at?: unknown }).cutoff_at;
  if (cutoff === null || cutoff === undefined || cutoff === "") return { cutoffAt: null };
  const parsed = new Date(String(cutoff));
  if (Number.isNaN(parsed.getTime())) return { cutoffAt: null };
  return { cutoffAt: parsed.toISOString() };
};

const normalizePrize = (entry: Record<string, unknown>): PrizeRecord | null => {
  const id = normalizeString(entry.id);
  if (!id) return null;
  const pool = normalizePool(entry.pool);
  if (!pool) return null;
  const normalizeLocalizedText = (value: unknown, fallback: string): LocalizedText => {
    if (value && typeof value === "object") {
      const raw = value as { en?: unknown; de?: unknown };
      const en = normalizeString(raw.en ?? fallback) || fallback;
      const de = normalizeString(raw.de ?? en) || en;
      return { en, de };
    }
    const normalized = normalizeString(value) || fallback;
    return { en: normalized, de: normalized };
  };
  return {
    id,
    pool,
    name: normalizeLocalizedText(entry.name, id),
    description: normalizeLocalizedText(entry.description, ""),
    image: entry.image ? normalizeString(entry.image) : null,
    quantity: normalizeNumber(entry.quantity, null),
    priority: normalizeNumber(entry.priority, 0) ?? 0,
    isFiller: normalizeBoolean(entry.is_filler, false),
    isActive: normalizeBoolean(entry.is_active, true),
    backupPrizes: normalizeStringArray(entry.backup_prizes),
    adminNotes: entry.admin_notes ? normalizeString(entry.admin_notes) : null,
  };
};

const parsePrizeStore = (raw: string): PrizeStore => {
  const parsed = matter(`---\n${raw}\n---\n`).data as {
    pools?: Record<string, unknown>;
    prizes?: Array<Record<string, unknown>>;
  };
  const poolsRaw = parsed?.pools ?? {};
  const pools = {
    MAIN: normalizePoolMeta((poolsRaw as Record<string, unknown>)?.MAIN),
    VETERAN: normalizePoolMeta((poolsRaw as Record<string, unknown>)?.VETERAN),
  } satisfies PrizeStore["pools"];
  const prizes = Array.isArray(parsed?.prizes)
    ? parsed.prizes.map((entry) => normalizePrize(entry)).filter(Boolean)
    : [];
  return { pools, prizes: prizes as PrizeRecord[] };
};

export const serializePrizeStore = (store: PrizeStore): string => {
  const data = {
    pools: {
      MAIN: { cutoff_at: store.pools.MAIN.cutoffAt },
      VETERAN: { cutoff_at: store.pools.VETERAN.cutoffAt },
    },
    prizes: store.prizes.map((prize) => ({
      id: prize.id,
      name: prize.name,
      description: prize.description,
      image: prize.image ?? null,
      pool: prize.pool,
      quantity: prize.quantity ?? null,
      priority: prize.priority,
      is_filler: prize.isFiller,
      is_active: prize.isActive,
      backup_prizes: prize.backupPrizes ?? [],
      admin_notes: prize.adminNotes ?? null,
    })),
  };
  const raw = matter.stringify("", data).trim();
  return raw.replace(/^---\s*\n/, "").replace(/\n---\s*$/, "") + "\n";
};

export const getPrizesPath = () => PRIZES_PATH;

export const ensurePrizeDirs = async () => {
  await fs.mkdir(PRIZES_ROOT, { recursive: true });
};

export const ensurePrizeStoreFile = async () => {
  await ensurePrizeDirs();
  try {
    await fs.readFile(PRIZES_PATH, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      throw err;
    }
    const payload = serializePrizeStore(defaultStore());
    await fs.writeFile(PRIZES_PATH, payload, "utf8");
  }
};

export const loadPrizeStore = async (): Promise<PrizeStore> => {
  try {
    const raw = await fs.readFile(PRIZES_PATH, "utf8");
    return parsePrizeStore(raw);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      warn("Failed to read prize store:", err);
    }
    return defaultStore();
  }
};

export const savePrizeStore = async (store: PrizeStore): Promise<void> => {
  await ensurePrizeDirs();
  const payload = serializePrizeStore(store);
  await fs.writeFile(PRIZES_PATH, payload, "utf8");
};

export const parsePrizeYaml = (raw: string): PrizeStore => {
  const parsed = matter(`---\n${raw}\n---\n`).data as Record<string, unknown> | null;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("invalid_prize_yaml");
  }
  if (!Array.isArray(parsed.prizes)) {
    throw new Error("invalid_prize_yaml");
  }
  return parsePrizeStore(raw);
};
