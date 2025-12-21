import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import type { Locale } from "./loader.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TAGS_ROOT = path.join(__dirname, "..", "..", "content", "inventory");

export interface InventoryTagCatalog {
  list: Array<{ id: string; title: string }>;
  map: Map<string, string>;
}

const cache = new Map<Locale, InventoryTagCatalog>();

const warn = (...args: unknown[]) => console.warn("[inventory-tags]", ...args);

const normalizeId = (value: unknown) => String(value ?? "").trim();

export const invalidateInventoryTagCache = (locale?: Locale) => {
  if (locale) {
    cache.delete(locale);
  } else {
    cache.clear();
  }
};

const readTagFile = async (locale: Locale): Promise<InventoryTagCatalog> => {
  const filePath = path.join(TAGS_ROOT, `tags.${locale}.yaml`);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = matter(`---\n${raw}\n---\n`).data as Array<{
      id?: unknown;
      title?: unknown;
    }>;
    if (!Array.isArray(parsed)) {
      warn(`Inventory tag file for ${locale} must be a YAML list (${filePath}).`);
      return { list: [], map: new Map() };
    }
    const list: Array<{ id: string; title: string }> = [];
    const map = new Map<string, string>();
    parsed.forEach((entry) => {
      const id = normalizeId(entry.id);
      if (!id) return;
      const title = String(entry.title ?? id).trim() || id;
      list.push({ id, title });
      map.set(id, title);
    });
    return { list, map };
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error.code !== "ENOENT") {
      warn(`Failed to read inventory tags for ${locale} at ${filePath}:`, error.message);
    }
    return { list: [], map: new Map() };
  }
};

export async function loadInventoryTags(locale: Locale): Promise<InventoryTagCatalog> {
  if (cache.has(locale)) {
    return cache.get(locale)!;
  }
  const catalog = await readTagFile(locale);
  cache.set(locale, catalog);
  return catalog;
}
