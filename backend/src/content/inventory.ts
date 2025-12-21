import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import type { Locale, InventoryItem } from "./loader.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const INVENTORY_ROOT = path.join(__dirname, "..", "..", "content", "inventory");
const SUPPORTED_LOCALES: Locale[] = ["en", "de"];

const cache = new Map<Locale, Map<string, InventoryItem>>();

const normalizeId = (value: unknown) => String(value ?? "").trim();

const warn = (...args: unknown[]) => console.warn("[inventory]", ...args);

const normalizeTags = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const normalized = value
    .map((entry) => String(entry ?? "").trim())
    .filter((entry) => entry.length > 0);
  return Array.from(new Set(normalized));
};

const readInventoryFile = async (locale: Locale): Promise<Map<string, InventoryItem>> => {
  const filePath = path.join(INVENTORY_ROOT, `${locale}.yaml`);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = matter(`---\n${raw}\n---\n`).data as Array<{
      id?: unknown;
      title?: unknown;
      description?: unknown;
      image?: unknown;
      rarity?: unknown;
      tags?: unknown;
    }>;
    const map = new Map<string, InventoryItem>();
    parsed.forEach((entry) => {
      const id = normalizeId(entry.id);
      if (!id) return;
      map.set(id, {
        id,
        title: String(entry.title ?? id),
        description: entry.description ? String(entry.description) : "",
        image: entry.image ? String(entry.image) : "",
        rarity: entry.rarity ? String(entry.rarity) : "common",
        tags: normalizeTags(entry.tags),
      });
    });
    if (map.size === 0) {
      warn(`No items parsed for locale ${locale} (file: ${filePath}).`);
    }
    return map;
  } catch (err) {
    warn(`Failed to read inventory for locale ${locale} at ${filePath}:`, err);
    return new Map();
  }
};

export const invalidateInventoryCache = (locale?: Locale) => {
  if (locale) {
    cache.delete(locale);
  } else {
    cache.clear();
  }
};

const validateConsistency = (inventories: Map<Locale, Map<string, InventoryItem>>) => {
  const localesPresent = SUPPORTED_LOCALES.filter((loc) => inventories.get(loc));
  if (localesPresent.length !== SUPPORTED_LOCALES.length) {
    SUPPORTED_LOCALES.forEach((loc) => {
      if (!inventories.get(loc)) warn(`Missing inventory file for locale ${loc}; using empty inventory.`);
    });
  }
  const idSets = SUPPORTED_LOCALES.map((loc) => ({
    locale: loc,
    ids: new Set(inventories.get(loc)?.keys() ?? []),
  }));
  const base = idSets[0]?.ids ?? new Set<string>();
  idSets.slice(1).forEach(({ locale, ids }) => {
    const missing = Array.from(base).filter((id) => !ids.has(id));
    const extras = Array.from(ids).filter((id) => !base.has(id));
    if (missing.length) warn(`Locale ${locale} is missing inventory ids: ${missing.join(", ")}`);
    if (extras.length) warn(`Locale ${locale} has extra inventory ids: ${extras.join(", ")}`);
  });
};

export async function loadInventory(locale: Locale): Promise<Map<string, InventoryItem>> {
  if (cache.has(locale)) {
    return cache.get(locale)!;
  }

  // Load all supported locales to allow consistency checks
  await Promise.all(
    SUPPORTED_LOCALES.map(async (loc) => {
      if (cache.has(loc)) return;
      const map = await readInventoryFile(loc);
      cache.set(loc, map);
    }),
  );

  validateConsistency(cache);

  return cache.get(locale) ?? new Map();
}
