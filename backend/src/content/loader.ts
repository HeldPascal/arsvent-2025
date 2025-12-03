import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { marked } from "marked";
import { loadVersionedContent, type LoadedVersionedContent } from "./v1-loader.js";
import { loadInventory } from "./inventory.js";

export type Locale = "en" | "de";
export type Mode = "NORMAL" | "VET";
export type RiddleType = "text" | "single-choice" | "multi-choice" | "sort" | "group" | "drag-sockets";
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
}

export interface DragSocketSlot {
  id: string;
  position: { x: number; y: number };
  accepts: string[];
  shape?: DragShape;
  label?: string;
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
  options?: RiddleOption[];
  groups?: RiddleGroup[];
  minSelections?: number;
  backgroundImage?: string;
  items?: DragSocketItem[];
  sockets?: DragSocketSlot[];
   shape?: DragShape;
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
const CONTENT_ROOT = path.join(__dirname, "..", "..", "content");

function buildFilePath(day: number, locale: Locale, mode: Mode) {
  const paddedDay = String(day).padStart(2, "0");
  const difficulty = mode === "VET" ? "veteran" : "normal";
  return path.join(CONTENT_ROOT, `day${paddedDay}`, `${difficulty}.${locale}.md`);
}

const buildIntroPath = (locale: Locale) => path.join(CONTENT_ROOT, "intro", `intro.${locale}.md`);

export const normalizeId = (value: unknown, message: string) => {
  const id = String(value ?? "").trim();
  if (!id) throw new Error(message);
  return id;
};

const stripLeadingH1 = (markdown: string) => markdown.replace(/^#\s+.+\s*/m, "").trim();

export async function loadDayContent(
  day: number,
  locale: Locale,
  mode: Mode,
  solvedPuzzleIds: Set<string>,
  includeHidden: boolean,
): Promise<DayContent> {
  const filePath = buildFilePath(day, locale, mode);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = matter(raw);
    const version = parsed.data?.version;
    if (version !== 1) {
      throw new Error(`Unsupported content version: ${version ?? "none"}`);
    }
    const inventory = await loadInventory(locale);
    const loaded = loadVersionedContent(parsed, { solvedPuzzleIds, includeHidden, inventory });
    const title =
      loaded.title ||
      stripLeadingH1(parsed.content) ||
      normalizeId(parsed.data.title, "Title is required for versioned content");

    return {
      schemaVersion: 1,
      title,
      blocks: loaded.blocks,
      puzzleIds: loaded.puzzleIds,
      solvedCondition: loaded.solvedCondition,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new RiddleNotFoundError("Riddle not found for given parameters");
    }
    throw error;
  }
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
