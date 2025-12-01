import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { marked } from "marked";

export type Locale = "en" | "de";
export type Mode = "NORMAL" | "VET";
export type RiddleType = "text" | "single-choice" | "multi-choice" | "sort" | "group";
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

export type RiddleContent =
  | {
      type: "text";
      title: string;
      body: string;
      solution: string;
    }
  | {
      type: "single-choice";
      title: string;
      body: string;
      solution: string;
      options: RiddleOption[];
    }
  | {
      type: "multi-choice";
      title: string;
      body: string;
      solution: string[];
      options: RiddleOption[];
      minSelections: number;
    }
  | {
      type: "sort";
      title: string;
      body: string;
      solution: string[];
      options: RiddleOption[];
    }
  | {
      type: "group";
      title: string;
      body: string;
      solution: Record<string, string[]>;
      options: RiddleOption[];
      groups: RiddleGroup[];
    };

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
  const difficulty = mode === "VET" ? "vet" : "normal";
  return path.join(CONTENT_ROOT, `day${paddedDay}`, `${difficulty}.${locale}.md`);
}

const buildIntroPath = (locale: Locale) => path.join(CONTENT_ROOT, "intro", `intro.${locale}.md`);

type RawOption = string | { id?: string; value?: string; label?: string; name?: string };
type RawGroup = string | { id?: string; label?: string; name?: string };

const normalizeId = (value: unknown, message: string) => {
  const id = String(value ?? "").trim();
  if (!id) {
    throw new Error(message);
  }
  return id;
};

const normalizeOptions = (raw: unknown, fallback?: string[]): RiddleOption[] => {
  const list: unknown[] | undefined = Array.isArray(raw) ? raw : fallback;
  if (!list || list.length === 0) {
    throw new Error("Options are required for this riddle type");
  }
  const options = list.map((entry) => {
    if (typeof entry === "string") {
      const id = normalizeId(entry, "Option id cannot be empty");
      return { id, label: entry };
    }
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      const option = entry as Exclude<RawOption, string>;
      const id = normalizeId(option.id ?? option.value, "Option id is missing");
      const label = String(option.label ?? option.name ?? id);
      const image = typeof (option as { image?: unknown }).image === "string" ? (option as { image: string }).image : undefined;
      return { id, label, ...(image ? { image } : {}) };
    }
    throw new Error("Invalid option entry");
  });
  const seen = new Set<string>();
  options.forEach((opt) => {
    if (seen.has(opt.id)) {
      throw new Error(`Duplicate option id: ${opt.id}`);
    }
    seen.add(opt.id);
  });
  return options;
};

const normalizeGroups = (raw: unknown, fallback?: string[]): RiddleGroup[] => {
  const list: unknown[] | undefined = Array.isArray(raw) ? raw : fallback;
  if (!list || list.length === 0) {
    throw new Error("Groups are required for grouped riddles");
  }
  const groups = list.map((entry) => {
    if (typeof entry === "string") {
      const id = normalizeId(entry, "Group id cannot be empty");
      return { id, label: entry };
    }
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      const group = entry as Exclude<RawGroup, string>;
      const id = normalizeId(group.id ?? group.name, "Group id is missing");
      const label = String(group.label ?? group.name ?? id);
      return { id, label };
    }
    throw new Error("Invalid group entry");
  });
  const seen = new Set<string>();
  groups.forEach((group) => {
    if (seen.has(group.id)) {
      throw new Error(`Duplicate group id: ${group.id}`);
    }
    seen.add(group.id);
  });
  return groups;
};

const ensureStringArray = (value: unknown, message: string) => {
  if (!Array.isArray(value)) {
    throw new Error(message);
  }
  const result = value.map((entry) => normalizeId(entry, "Solution entries must be strings"));
  const unique = new Set(result);
  if (unique.size !== result.length) {
    throw new Error("Solution entries must be unique");
  }
  return result;
};

const resolveType = (input?: string): RiddleType => {
  const normalized = (input ?? "text").toLowerCase();
  if (["single-choice", "single", "choice"].includes(normalized)) return "single-choice";
  if (["multi-choice", "multiple", "multi"].includes(normalized)) return "multi-choice";
  if (["sort", "ordering", "order"].includes(normalized)) return "sort";
  if (["group", "grouping"].includes(normalized)) return "group";
  return "text";
};

export async function loadRiddle(day: number, locale: Locale, mode: Mode): Promise<RiddleContent> {
  const filePath = buildFilePath(day, locale, mode);

  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = matter(raw);

    const title = String(parsed.data.title ?? "").trim();
    if (!title) {
      throw new Error("Missing required frontmatter fields");
    }

    const htmlBody = marked.parse(parsed.content);
    const body = typeof htmlBody === "string" ? htmlBody : String(htmlBody);
    const type = resolveType(typeof parsed.data.type === "string" ? parsed.data.type : undefined);

    if (type === "text") {
      const solution = normalizeId(parsed.data.solution, "Solution is required for text riddles");
      return { type, title, solution, body };
    }

    if (type === "single-choice") {
      const options = normalizeOptions(parsed.data.options);
      const solution = normalizeId(parsed.data.solution, "Solution must match a single option id");
      const optionIds = new Set(options.map((opt) => opt.id));
      if (!optionIds.has(solution)) {
        throw new Error("Solution must reference one of the provided options");
      }
      return { type, title, body, solution, options };
    }

    if (type === "multi-choice") {
      const options = normalizeOptions(parsed.data.options);
      const solution = ensureStringArray(parsed.data.solution, "Solution must list the correct options");
      if (solution.length === 0) {
        throw new Error("Solution must include at least one correct option");
      }
      const optionIds = new Set(options.map((opt) => opt.id));
      solution.forEach((id) => {
        if (!optionIds.has(id)) {
          throw new Error("Solution references an unknown option id");
        }
      });
      const desiredMin =
        typeof parsed.data.minSelections === "number" ? parsed.data.minSelections : solution.length || 1;
      const minSelections = Math.min(Math.max(desiredMin, 1), options.length);
      return { type, title, body, solution, options, minSelections };
    }

    if (type === "sort") {
      const solution = ensureStringArray(parsed.data.solution, "Solution must define the correct order");
      if (solution.length === 0) {
        throw new Error("Sort riddles require at least one option");
      }
      const options = normalizeOptions(parsed.data.options, solution);
      const optionIds = new Set(options.map((opt) => opt.id));
      if (solution.length !== options.length) {
        throw new Error("Sort riddles must list the same number of options as the solution order");
      }
      solution.forEach((id) => {
        if (!optionIds.has(id)) {
          throw new Error("Solution references an unknown option id");
        }
      });
      return { type, title, body, solution, options };
    }

    if (!parsed.data.solution || typeof parsed.data.solution !== "object" || Array.isArray(parsed.data.solution)) {
      throw new Error("Solution must map group ids to option ids");
    }

    const rawSolution = parsed.data.solution as Record<string, unknown>;
    const normalizedSolution: Record<string, string[]> = {};
    const optionIdsFromSolution = new Set<string>();

    Object.entries(rawSolution).forEach(([groupKey, value]) => {
      const groupId = normalizeId(groupKey, "Group id cannot be empty in the solution");
      const entries = ensureStringArray(value, "Each group must list option ids");
      entries.forEach((id) => {
        if (optionIdsFromSolution.has(id)) {
          throw new Error("Options must belong to only one group");
        }
        optionIdsFromSolution.add(id);
      });
      normalizedSolution[groupId] = entries;
    });

    const groups = normalizeGroups(parsed.data.groups, Object.keys(normalizedSolution));
    const options = normalizeOptions(parsed.data.options, Array.from(optionIdsFromSolution));
    const optionIds = new Set(options.map((opt) => opt.id));
    const groupIds = new Set(groups.map((group) => group.id));

    if (optionIdsFromSolution.size !== optionIds.size) {
      throw new Error("All options must be assigned to a group in the solution");
    }

    Object.entries(normalizedSolution).forEach(([groupId, ids]) => {
      if (!groupIds.has(groupId)) {
        throw new Error(`Solution references unknown group: ${groupId}`);
      }
      ids.forEach((id) => {
        if (!optionIds.has(id)) {
          throw new Error(`Solution references unknown option: ${id}`);
        }
      });
    });

    return { type, title, body, solution: normalizedSolution, options, groups };
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
