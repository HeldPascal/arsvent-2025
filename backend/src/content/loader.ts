import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import type { GrayMatterFile } from "gray-matter";
import { marked } from "marked";
import { loadVersionedContent, type LoadedVersionedContent } from "./v1-loader.js";
import { ContentValidationError } from "./errors.js";
import { loadInventory, invalidateInventoryCache } from "./inventory.js";
import { invalidateInventoryTagCache, loadInventoryTags } from "./inventory-tags.js";
import { invalidateDayInventoryCache, loadDayInventorySnapshot } from "./day-inventory.js";

export type Locale = "en" | "de";
export type Mode = "NORMAL" | "VETERAN";
export type RiddleType =
  | "text"
  | "placeholder"
  | "pair-items"
  | "single-choice"
  | "multi-choice"
  | "sort"
  | "group"
  | "drag-sockets"
  | "select-items"
  | "memory"
  | "grid-path";
export type DragShape = "circle" | "square" | "hex";

export interface IntroContent {
  title: string;
  body: string;
}

export interface RiddleOption {
  id: string;
  label: string;
  image?: string;
}

export interface RiddleGroup {
  id: string;
  label: string;
}

export interface DragSocketItem {
  id: string;
  label?: string;
  image?: string;
  shape?: DragShape;
  defaultSocketId?: string;
  position?: { x: number; y: number };
  description?: string;
  rarity?: string;
  source?: "inventory";
}

export interface DragSocketSlot {
  id: string;
  position: { x: number; y: number };
  accepts: string[];
  shape?: DragShape;
  label?: string;
  image?: string;
  hint?: string;
}

export interface MemoryCard {
  id: string;
  image: string;
  label?: string;
}

export interface GridSize {
  width: number;
  height: number;
}

export interface GridPathSolution {
  path: Array<{ x: number; y: number }>;
  startColumn?: number;
  goalColumn?: number;
}

export interface RiddleReward {
  title: string;
  description?: string | null;
  image?: string | null;
}

export interface InventoryItem {
  id: string;
  title: string;
  description: string;
  image: string;
  rarity: string;
  tags: string[];
}

export interface StoryBlock {
  kind: "story";
  id?: string;
  title?: string;
  html: string;
  visible: boolean;
}

export interface PuzzleBlock {
  kind: "puzzle";
  id: string;
  title?: string;
  html: string;
  visible: boolean;
  type: RiddleType;
  optionSize?: "small" | "medium" | "large";
  socketSize?: "small" | "medium" | "large";
  requiredSockets?: string[];
  startColumnHint?: number;
  goalColumnHint?: number;
  options?: RiddleOption[];
  leftOptions?: RiddleOption[];
  rightOptions?: RiddleOption[];
  groups?: RiddleGroup[];
  minSelections?: number;
  requiredSelections?: number;
  ordered?: boolean;
  backgroundImage?: string;
  backgroundSize?: string;
  boardMaxWidth?: string;
  items?: DragSocketItem[];
  sockets?: DragSocketSlot[];
  shape?: DragShape;
  cards?: MemoryCard[];
  backImage?: string;
  hoverBackImage?: string;
  maxMisses?: number | null;
  missIndicator?: "deplete" | "fill";
  missIndicatorAnimation?: "burst" | "shatter";
  flipBackMs?: number;
  grid?: GridSize;
  solved: boolean;
  solution: unknown;
}

export interface RewardBlock {
  kind: "reward";
  id?: string;
  title?: string;
  item?: InventoryItem;
  visible: boolean;
}

export type DayBlock = StoryBlock | PuzzleBlock | RewardBlock;

export interface DayContent {
  schemaVersion: number;
  title: string;
  blocks: DayBlock[];
  puzzleIds: string[];
  solvedCondition: LoadedVersionedContent["solvedCondition"];
}

export class RiddleNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RiddleNotFoundError";
  }
}

export class IntroNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntroNotFoundError";
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const CONTENT_ROOT = path.join(__dirname, "..", "..", "content");

const buildIntroPath = (locale: Locale) => path.join(CONTENT_ROOT, "intro", `intro.${locale}.md`);

export const normalizeId = (value: unknown, message: string) => {
  const id = String(value ?? "").trim();
  if (!id) throw new ContentValidationError(message);
  return id;
};

const stripLeadingH1 = (markdown: string) => markdown.replace(/^#\s+.+\s*/m, "").trim();

type ModeNormalized = "normal" | "veteran";

const normalizeMode = (mode: Mode | "VET"): ModeNormalized => (mode === "VETERAN" || mode === "VET" ? "veteran" : "normal");
const normalizeLocale = (locale: string): Locale => (locale.toLowerCase() === "de" ? "de" : "en");

type ParsedCacheEntry = {
  filePath: string;
  parsed: GrayMatterFile<string>;
  mtimeMs: number;
};

const parsedCache = new Map<string, ParsedCacheEntry>();

type DayIndexKey = `${number}-${Locale}-${ModeNormalized}`;
const dayIndex = new Map<DayIndexKey, string>();
const dayIndexWarnings: string[] = [];
let dayIndexStale = true;

type ContentWarningHandler = ((message: string) => void) | null;
let warningHandler: ContentWarningHandler = null;
export const setContentWarningHandler = (handler: ContentWarningHandler) => {
  warningHandler = handler;
};
const warn = (...args: unknown[]) => {
  const message = args.map((a) => (typeof a === "string" ? a : String(a))).join(" ");
  if (warningHandler) {
    warningHandler(message);
  } else {
    console.warn("[content]", ...args);
  }
};
const isProd = process.env.NODE_ENV === "production";
let watcherStarted = false;

export const invalidateContentCache = (filePath?: string) => {
  if (filePath) {
    parsedCache.delete(filePath);
  } else {
    parsedCache.clear();
  }
  dayIndexStale = true;
};

const statMtime = async (filePath: string) => {
  try {
    const stats = await fs.stat(filePath);
    return stats.mtimeMs;
  } catch {
    return 0;
  }
};

export const loadParsedFile = async (filePath: string): Promise<ParsedCacheEntry> => {
  const mtimeMs = await statMtime(filePath);
  const cached = parsedCache.get(filePath);
  if (cached && cached.mtimeMs === mtimeMs) {
    return cached;
  }
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = matter(raw) as GrayMatterFile<string>;
  const entry: ParsedCacheEntry = { filePath, parsed, mtimeMs };
  parsedCache.set(filePath, entry);
  return entry;
};

const expectedFilename = (mode: ModeNormalized, locale: Locale) => `${mode}.${locale}.md`;

const buildDayIndex = async () => {
  if (!dayIndexStale) return;
  dayIndex.clear();
  dayIndexWarnings.length = 0;
  const entries = await fs.readdir(CONTENT_ROOT, { withFileTypes: true });
  for (const dir of entries) {
    if (!dir.isDirectory()) continue;
    const match = dir.name.match(/^day(\d{2})$/i);
    if (!match) continue;
    const day = Number(match[1]);
    const dirPath = path.join(CONTENT_ROOT, dir.name);
    const files = await fs.readdir(dirPath);
    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      const filePath = path.join(dirPath, file);
      try {
        const parsed = (await loadParsedFile(filePath)).parsed;
        const locale = normalizeLocale(String(parsed.data?.language ?? parsed.data?.locale ?? ""));
        const modeMeta = String(parsed.data?.mode ?? "").toLowerCase();
        const mode: ModeNormalized = modeMeta === "veteran" ? "veteran" : "normal";
        const key = `${day}-${locale}-${mode}` as DayIndexKey;

        const expected = expectedFilename(mode, locale);
        if (file.toLowerCase() !== expected.toLowerCase()) {
          const message = `Filename mismatch for ${filePath}: expected ${expected} based on metadata (locale=${locale}, mode=${mode}).`;
          warn(message);
          dayIndexWarnings.push(message);
        }
        const existingPath = dayIndex.get(key);
        if (existingPath) {
          if (existingPath !== filePath) {
            const message = `Duplicate content for day ${day}, locale ${locale}, mode ${mode} (file: ${filePath}). Using first occurrence.`;
            warn(message);
            dayIndexWarnings.push(message);
          }
          continue;
        }
        dayIndex.set(key, filePath);
      } catch (err) {
        warn(`Failed to index content file ${filePath}:`, err);
        dayIndexWarnings.push(`Failed to index ${filePath}: ${(err as Error).message}`);
      }
    }
  }
  dayIndexStale = false;
};

export const resolveDayPath = async (day: number, locale: Locale, mode: Mode): Promise<string> => {
  await buildDayIndex();
  const key = `${day}-${normalizeLocale(locale)}-${normalizeMode(mode)}` as DayIndexKey;
  const filePath = dayIndex.get(key);
  if (!filePath) {
    throw new RiddleNotFoundError("Riddle not found for given parameters");
  }
  return filePath;
};

export const getDayIndexWarnings = async () => {
  await buildDayIndex();
  return [...dayIndexWarnings];
};

export async function loadDayContent(
  day: number,
  locale: Locale,
  mode: Mode,
  solvedPuzzleIds: Set<string>,
  includeHidden: boolean,
): Promise<DayContent> {
  const filePath = await resolveDayPath(day, locale, mode);
  const { parsed } = await loadParsedFile(filePath);
  const version = parsed.data?.version;
  if (version !== 1) {
    throw new Error(`Unsupported content version: ${version ?? "none"}`);
  }
  const inventory = await loadInventory(locale);
  const inventoryTags = await loadInventoryTags(locale);
  const snapshotDay = Math.max(0, day - 1);
  const snapshot = snapshotDay > 0 ? await loadDayInventorySnapshot(snapshotDay) : { ids: [], exists: false };
  const loaded = loadVersionedContent(parsed, {
    solvedPuzzleIds,
    includeHidden,
    inventory,
    inventoryTags: inventoryTags.map,
    inventorySnapshot: snapshot.ids,
  });
  const title =
    loaded.title || stripLeadingH1(parsed.content) || normalizeId(parsed.data.title, "Title is required for versioned content");

  return {
    schemaVersion: 1,
    title,
    blocks: loaded.blocks,
    puzzleIds: loaded.puzzleIds,
    solvedCondition: loaded.solvedCondition,
  };
}

const handleFileChange = (filePath: string) => {
  if (filePath.endsWith(".md")) {
    invalidateContentCache(filePath);
  } else if (filePath.endsWith(".yaml")) {
    if (filePath.endsWith(`${path.sep}inventory.yaml`)) {
      invalidateDayInventoryCache();
    }
    if (filePath.includes(`${path.sep}inventory${path.sep}`) && path.basename(filePath).startsWith("tags.")) {
      invalidateInventoryTagCache();
    }
    invalidateInventoryCache();
  }
};

export const startContentWatcher = async () => {
  if (isProd || watcherStarted) return;
  try {
    const chokidar = await import("chokidar");
    const watcher = chokidar.watch(CONTENT_ROOT, {
      ignoreInitial: true,
      ignored: (_path, stats) => {
        if (!stats) return false;
        if (stats.isDirectory()) return false;
        const rel = path.relative(CONTENT_ROOT, _path);
        if (!rel || rel.startsWith("..")) return true;
        if (rel.endsWith(".md")) return false;
        if (rel.startsWith(`inventory${path.sep}`) && rel.endsWith(".yaml")) return false;
        if (/^day\d{2}\/inventory\.yaml$/i.test(rel)) return false;
        return true;
      },
    });
    watcher
      .on("all", (event, filePath) => {
        console.log("[content] Watcher event", event, filePath);
        handleFileChange(filePath);
      })
      .on("error", (err) => warn("Watcher error", err));
    watcherStarted = true;
    console.log("[content] Watcher started (dev only)");
  } catch (err) {
    warn("Failed to start content watcher; live reload disabled.", err);
  }
};

if (!isProd) {
  // Fire and forget; failures are logged.
  void startContentWatcher();
}

export async function loadIntro(locale: Locale): Promise<IntroContent> {
  const filePath = buildIntroPath(locale);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = matter(raw);
    const title = String(parsed.data.title ?? "").trim();
    if (!title) {
      throw new Error("Missing intro title");
    }
    const htmlBody = marked.parse(parsed.content);
    return {
      title,
      body: typeof htmlBody === "string" ? htmlBody : String(htmlBody),
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new IntroNotFoundError("Intro not found for locale");
    }
    throw error;
  }
}
