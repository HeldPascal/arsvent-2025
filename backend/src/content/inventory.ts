import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import type { Locale, InventoryItem } from "./loader.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const INVENTORY_ROOT = path.join(__dirname, "..", "..", "content", "inventory");

const cache = new Map<Locale, Map<string, InventoryItem>>();

const normalizeId = (value: unknown) => String(value ?? "").trim();

export async function loadInventory(locale: Locale): Promise<Map<string, InventoryItem>> {
  if (cache.has(locale)) {
    return cache.get(locale)!;
  }
  const filePath = path.join(INVENTORY_ROOT, `${locale}.yaml`);
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = matter(`---\n${raw}\n---\n`).data as Array<{
    id?: unknown;
    title?: unknown;
    description?: unknown;
    image?: unknown;
    rarity?: unknown;
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
    });
  });
  cache.set(locale, map);
  return map;
}
