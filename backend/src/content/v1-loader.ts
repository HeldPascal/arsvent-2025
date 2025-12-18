import matter, { type GrayMatterFile } from "gray-matter";
import { marked } from "marked";
import type {
  InventoryItem,
  RiddleOption,
  RiddleType,
  DayBlock,
  DragSocketItem,
  DragSocketSlot,
  DragShape,
  MemoryCard,
  GridSize,
  GridPathSolution,
} from "./loader.js";
import { ContentValidationError } from "./errors.js";

export type WhenCondition =
  | { kind: "all" }
  | { kind: "any" }
  | { kind: "puzzle"; id: string }
  | { kind: "and"; conditions: WhenCondition[] }
  | { kind: "or"; conditions: WhenCondition[] };

interface PuzzleDefinition {
  type: string;
  options?: unknown;
  solution?: unknown;
  raw: Record<string, unknown>;
}

interface StoryBlockRaw {
  kind: "story";
  heading: string;
  title?: string;
  id?: string;
  markdown: string;
  html: string;
}

interface PuzzleBlockRaw {
  kind: "puzzle";
  heading: string;
  title?: string;
  id: string;
  markdown: string;
  html: string;
  definition: PuzzleDefinition;
}

interface RewardBlockRaw {
  kind: "reward";
  heading: string;
  title?: string;
  id?: string;
  markdown: string;
  html: string;
  inventoryId?: string | null;
  condition?: WhenCondition | null;
}

interface ContinueWhenBlock {
  kind: "continue-when";
  heading: string;
  title?: string;
  id?: string;
  condition: WhenCondition;
  source: "continue-when" | "wait-for";
}

type StructuredBlock = StoryBlockRaw | PuzzleBlockRaw | RewardBlockRaw | ContinueWhenBlock;

export interface VersionedMeta {
  id: string;
  version: number;
  release: string;
  language: string;
  mode: string;
  inventory: string[];
  tags: string[];
  solvedWhen?: WhenCondition;
}

export interface LoadedVersionedContent {
  title: string;
  blocks: DayBlock[];
  puzzleIds: string[];
  solvedCondition: WhenCondition | null;
}

const normalizeId = (value: unknown, message: string) => {
  const id = String(value ?? "").trim();
  if (!id) throw new ContentValidationError(message);
  return id;
};

const normalizeOptions = (raw: unknown): RiddleOption[] => {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new ContentValidationError("Options are required for this puzzle type");
  }
  const options = raw.map((entry) => {
    if (typeof entry === "string") {
      const id = normalizeId(entry, "Option id cannot be empty");
      return { id, label: entry };
    }
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      const option = entry as { id?: unknown; value?: unknown; label?: unknown; name?: unknown; image?: unknown };
      const id = normalizeId(option.id ?? option.value, "Option id is missing");
      const label = String(option.label ?? option.name ?? id);
      const image = typeof option.image === "string" ? option.image : undefined;
      return { id, label, ...(image ? { image } : {}) };
    }
    throw new ContentValidationError("Invalid option entry");
  });
  const seen = new Set<string>();
  options.forEach((opt) => {
    if (seen.has(opt.id)) throw new ContentValidationError(`Duplicate option id: ${opt.id}`);
    seen.add(opt.id);
  });
  return options;
};

const normalizePairItemsSolution = (
  raw: unknown,
  leftOptions: RiddleOption[],
  rightOptions: RiddleOption[],
): Array<{ left: string; right: string }> => {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new ContentValidationError("Pair-items puzzles require a solution");
  }
  const leftIds = new Set(leftOptions.map((opt) => opt.id));
  const rightIds = new Set(rightOptions.map((opt) => opt.id));
  const pairs = raw.map((entry) => {
    if (Array.isArray(entry) && entry.length === 2) {
      return {
        left: normalizeId(entry[0], "Pair entries require a left id"),
        right: normalizeId(entry[1], "Pair entries require a right id"),
      };
    }
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      const { left, right, a, b } = entry as { left?: unknown; right?: unknown; a?: unknown; b?: unknown };
      const leftId = normalizeId(left ?? a, "Pair entries require a left id");
      const rightId = normalizeId(right ?? b, "Pair entries require a right id");
      return { left: leftId, right: rightId };
    }
    throw new ContentValidationError("Invalid pair-items solution entry");
  });

  const usedLeft = new Set<string>();
  const usedRight = new Set<string>();
  pairs.forEach(({ left, right }) => {
    if (!leftIds.has(left)) throw new ContentValidationError(`Solution references unknown left item: ${left}`);
    if (!rightIds.has(right)) throw new ContentValidationError(`Solution references unknown right item: ${right}`);
    if (usedLeft.has(left)) throw new ContentValidationError("Each left item must appear in exactly one pair");
    if (usedRight.has(right)) throw new ContentValidationError("Each right item must appear in exactly one pair");
    usedLeft.add(left);
    usedRight.add(right);
  });

  if (usedLeft.size !== leftIds.size || usedRight.size !== rightIds.size) {
    throw new ContentValidationError("Solution must include every item exactly once");
  }

  return pairs;
};

const ensureStringArray = (value: unknown, message: string) => {
  if (!Array.isArray(value)) {
    throw new ContentValidationError(message);
  }
  const result = value.map((entry) => normalizeId(entry, "Entries must be strings"));
  const unique = new Set(result);
  if (unique.size !== result.length) {
    throw new ContentValidationError("Entries must be unique");
  }
  return result;
};

const resolveType = (input?: string): RiddleType => {
  const normalized = (input ?? "text").toLowerCase();
  if (["placeholder", "stub"].includes(normalized)) return "placeholder";
  if (["pair-items", "pairing", "pairings", "match-items", "match-pairs"].includes(normalized)) return "pair-items";
  if (["single-choice", "single", "choice"].includes(normalized)) return "single-choice";
  if (["multi-choice", "multiple", "multi"].includes(normalized)) return "multi-choice";
  if (["sort", "ordering", "order"].includes(normalized)) return "sort";
  if (["group", "grouping"].includes(normalized)) return "group";
  if (["select-items", "select", "mark"].includes(normalized)) return "select-items";
  if (["memory", "pairs", "card-pairs"].includes(normalized)) return "memory";
  if (["drag-sockets", "drag", "sockets"].includes(normalized)) return "drag-sockets";
  if (["grid-path", "path-grid", "gridpath"].includes(normalized)) return "grid-path";
  return "text";
};

const normalizeOptionSize = (value: unknown): "small" | "medium" | "large" | undefined => {
  if (typeof value !== "string") return undefined;
  const normalized = value.toLowerCase().trim();
  if (normalized === "small" || normalized === "medium" || normalized === "large") {
    return normalized;
  }
  return undefined;
};

const resolveShape = (input: unknown): DragShape => {
  const normalized = String(input ?? "circle").toLowerCase();
  if (normalized === "circle" || normalized === "round") return "circle";
  if (normalized === "square" || normalized === "box") return "square";
  if (normalized === "hex" || normalized === "hexagon") return "hex";
  throw new ContentValidationError(`Unsupported shape: ${input}`);
};

const stripQuotes = (value: string) => value.replace(/^['"]|['"]$/g, "").trim();

const parseWhenCondition = (value: unknown): WhenCondition => {
  if (value === "all") return { kind: "all" };
  if (value === "any") return { kind: "any" };
  if (typeof value === "string") return { kind: "puzzle", id: value };
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const { and, or } = value as { and?: unknown; or?: unknown };
    if (and) {
      const list = Array.isArray(and) ? and : [and];
      return { kind: "and", conditions: list.map((entry) => parseWhenCondition(entry)) };
    }
    if (or) {
      const list = Array.isArray(or) ? or : [or];
      return { kind: "or", conditions: list.map((entry) => parseWhenCondition(entry)) };
    }
  }
  throw new ContentValidationError("Invalid when condition");
};

const extractBlockId = (lines: string[]) => {
  let index = 0;
  while (index < lines.length && !(lines[index]?.trim())) {
    index += 1;
  }
  const first = lines[index]?.trim();
  if (!first) return { id: undefined, rest: lines };
  const match = first.match(/^id:\s*(.+)$/i);
  if (!match) return { id: undefined, rest: lines };
  return { id: stripQuotes(match[1] ?? ""), rest: lines.slice(index + 1) };
};

const splitBlocks = (content: string) => {
  const lines = content.split(/\r?\n/);
  const blocks: Array<{ heading: string; lines: string[] }> = [];
  let current: { heading: string; lines: string[] } | null = null;
  lines.forEach((line) => {
    const h2 = line.match(/^##\s+(.+)\s*$/);
    if (h2) {
      if (current) blocks.push(current);
      current = { heading: h2[1]?.trim() ?? "", lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  });
  if (current) blocks.push(current);
  return blocks;
};

const parsePuzzleDefinition = (yaml: string): PuzzleDefinition => {
  const parsed = matter(`---\n${yaml}\n---\n`).data as Record<string, unknown>;
  return {
    type: typeof parsed.type === "string" ? parsed.type : "text",
    options: parsed.options,
    solution: parsed.solution,
    raw: parsed,
  };
};

const removeCodeBlocks = (markdown: string) =>
  markdown.replace(/```yaml\s+(puzzle|when)[\s\S]*?```/gi, "").trim();

const toHtml = (markdown: string) => {
  const rendered = marked.parse(markdown);
  return typeof rendered === "string" ? rendered : String(rendered);
};

const parseBlocks = (parsed: GrayMatterFile<string>) => {
  const { data } = parsed;
  const meta: VersionedMeta = {
    id: normalizeId(data.id, "Missing frontmatter id"),
    version: Number(data.version ?? 0),
    release: normalizeId(data.release, "Missing release timestamp"),
    language: normalizeId(data.language, "Missing language"),
    mode: normalizeId(data.mode, "Missing mode"),
    inventory: Array.isArray(data.inventory) ? data.inventory.map((entry) => String(entry)) : [],
    tags: Array.isArray(data.tags) ? data.tags.map((entry) => String(entry)) : [],
  };
  if (data.solved?.when !== undefined) {
    meta.solvedWhen = parseWhenCondition(data.solved.when);
  }

  const normalizedLanguage = meta.language.toLowerCase();
  if (!["en", "de"].includes(normalizedLanguage)) throw new ContentValidationError(`Unsupported language: ${meta.language}`);
  meta.language = normalizedLanguage;

  const normalizedMode = meta.mode.toLowerCase();
  if (!["normal", "veteran"].includes(normalizedMode)) throw new ContentValidationError(`Unsupported mode: ${meta.mode}`);
  meta.mode = normalizedMode;

  const blocks: StructuredBlock[] = [];

  splitBlocks(parsed.content || "").forEach(({ heading, lines }) => {
    const lowerHeading = heading.toLowerCase();
    const isStory = lowerHeading.startsWith("story");
    const isPuzzle = lowerHeading.startsWith("puzzle");
    const isReward = lowerHeading.startsWith("reward");
    const isContinue = lowerHeading.startsWith("continue when");
    const waitMatch = lowerHeading.match(/^wait for:\s*(.+)$/);
    const title = heading.includes(":") ? heading.split(":").slice(1).join(":").trim() : undefined;
    if (!isStory && !isPuzzle && !isReward && !isContinue && !waitMatch) return;

    const { id, rest } = extractBlockId(lines);
    const blockMarkdown = rest.join("\n").trim();
    const markdownWithoutCode = removeCodeBlocks(blockMarkdown);

    if (isStory) {
      blocks.push({
        kind: "story",
        heading,
        markdown: markdownWithoutCode,
        html: toHtml(markdownWithoutCode),
        ...(title ? { title } : {}),
        ...(id ? { id } : {}),
      });
      return;
    }

    if (isPuzzle) {
      const puzzleMatch = blockMarkdown.match(/```yaml\s+puzzle\s*\n([\s\S]*?)```/i);
      if (!puzzleMatch) throw new ContentValidationError("Puzzle block is missing a puzzle definition");
      const definition = parsePuzzleDefinition(puzzleMatch[1] ?? "");
      const puzzleId = id || normalizeId((definition.raw as { id?: unknown }).id, "Puzzle id is required");
      blocks.push({
        kind: "puzzle",
        heading,
        id: puzzleId,
        markdown: markdownWithoutCode,
        html: toHtml(markdownWithoutCode),
        definition,
        ...(title ? { title } : {}),
      });
      return;
    }

    if (isReward) {
      const whenMatch = blockMarkdown.match(/```yaml\s+when\s*\n([\s\S]*?)```/i);
      blocks.push({
        kind: "reward",
        heading,
        markdown: markdownWithoutCode,
        html: toHtml(markdownWithoutCode),
        inventoryId: markdownWithoutCode.match(/inventoryId:\s*(.+)/i)
          ? stripQuotes(markdownWithoutCode.match(/inventoryId:\s*(.+)/i)![1] ?? "")
          : null,
        condition: whenMatch ? parseWhenCondition(parsePuzzleDefinition(whenMatch[1] ?? "").raw) : null,
        ...(title ? { title } : {}),
        ...(id ? { id } : {}),
      });
      return;
    }

    const conditionValue = waitMatch ? waitMatch[1]?.trim() : undefined;
    const whenMatch = blockMarkdown.match(/```yaml\s+when\s*\n([\s\S]*?)```/i);
    const condition = conditionValue
      ? parseWhenCondition(conditionValue)
      : whenMatch
        ? parseWhenCondition(parsePuzzleDefinition(whenMatch[1] ?? "").raw)
        : null;
    if (!condition) throw new ContentValidationError("Continue/Wait block requires a condition");
    blocks.push({
      kind: "continue-when",
      heading,
      condition,
      source: waitMatch ? "wait-for" : "continue-when",
      ...(title ? { title } : {}),
      ...(id ? { id } : {}),
    });
  });

  return { meta, blocks };
};

export const evaluateCondition = (condition: WhenCondition, solvedIds: Set<string>, allPuzzleIds: Set<string>): boolean => {
  switch (condition.kind) {
    case "all":
      return Array.from(allPuzzleIds).every((id) => solvedIds.has(id));
    case "any":
      return solvedIds.size > 0;
    case "puzzle":
      return solvedIds.has(condition.id);
    case "and":
      return condition.conditions.every((sub) => evaluateCondition(sub, solvedIds, allPuzzleIds));
    case "or":
      return condition.conditions.some((sub) => evaluateCondition(sub, solvedIds, allPuzzleIds));
    default:
      return false;
  }
};

const normalizeDragItems = (
  raw: unknown,
  defaultShape: DragShape,
  options: { requirePosition?: boolean } = {},
): DragSocketItem[] => {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new ContentValidationError("This puzzle requires at least one item");
  }
  const items = raw.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new ContentValidationError("Invalid item definition");
    }
    const { id, label, image, shape, defaultSocketId, position } = entry as {
      id?: unknown;
      label?: unknown;
      image?: unknown;
      shape?: unknown;
      defaultSocketId?: unknown;
      position?: unknown;
    };
    const itemId = normalizeId(id, "Drag-sockets items require an id");
    const itemLabel = typeof label === "string" ? label : undefined;
    const itemImage = typeof image === "string" ? image : undefined;
    const itemShape = shape ? resolveShape(shape) : defaultShape;
    const itemDefaultSocketId = typeof defaultSocketId === "string" ? defaultSocketId : undefined;
    const normalizedPosition = position !== undefined ? normalizePosition(position) : undefined;
    if (options.requirePosition && !normalizedPosition) {
      throw new ContentValidationError("Placed items require a position");
    }
    return {
      id: itemId,
      ...(itemLabel !== undefined ? { label: itemLabel } : {}),
      ...(itemImage ? { image: itemImage } : {}),
      shape: itemShape,
      ...(itemDefaultSocketId ? { defaultSocketId: itemDefaultSocketId } : {}),
      ...(normalizedPosition ? { position: normalizedPosition } : {}),
    };
  });
  const seen = new Set<string>();
  items.forEach((item) => {
    if (seen.has(item.id)) throw new ContentValidationError(`Duplicate item id: ${item.id}`);
    seen.add(item.id);
  });
  return items;
};

const normalizePosition = (value: unknown) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ContentValidationError("Position must be an object with x and y");
  }
  const { x, y } = value as { x?: unknown; y?: unknown };
  const toRatio = (val: unknown, axis: "x" | "y") => {
    const num = Number(val);
    if (!Number.isFinite(num)) throw new ContentValidationError(`Position ${axis} must be a number`);
    return Math.min(Math.max(num, 0), 1);
  };
  return { x: toRatio(x, "x"), y: toRatio(y, "y") };
};

const normalizeDragSockets = (raw: unknown, items: DragSocketItem[], defaultShape: DragShape): DragSocketSlot[] => {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new ContentValidationError("Drag-sockets puzzles require sockets");
  }
  const itemIds = new Set(items.map((item) => item.id));
  const sockets = raw.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new ContentValidationError("Invalid socket definition");
    }
    const { id, position, accepts, shape, label, image } = entry as {
      id?: unknown;
      position?: unknown;
      accepts?: unknown;
      shape?: unknown;
      label?: unknown;
      image?: unknown;
    };
    const socketId = normalizeId(id, "Sockets require an id");
    const socketShape = shape ? resolveShape(shape) : defaultShape;
    const socketLabel = typeof label === "string" ? label : undefined;
    const socketImage = typeof image === "string" ? image : undefined;
    const shapeScopedItems =
      socketShape && items.some((item) => item.shape === socketShape)
        ? items.filter((item) => item.shape === socketShape).map((item) => item.id)
        : Array.from(itemIds);
    const normalizedAccepts =
      accepts === undefined ? shapeScopedItems : ensureStringArray(accepts, "Sockets require accepted item ids");
    normalizedAccepts.forEach((acc) => {
      if (!itemIds.has(acc)) {
        throw new ContentValidationError(`Socket accepts unknown item id: ${acc}`);
      }
    });
    return {
      id: socketId,
      position: normalizePosition(position),
      accepts: normalizedAccepts,
      shape: socketShape,
      ...(socketLabel !== undefined ? { label: socketLabel } : {}),
      ...(socketImage ? { image: socketImage } : {}),
    };
  });
  const seen = new Set<string>();
  sockets.forEach((socket) => {
    if (seen.has(socket.id)) throw new ContentValidationError(`Duplicate socket id: ${socket.id}`);
    seen.add(socket.id);
  });
  return sockets;
};

const normalizeDragSolution = (
  raw: unknown,
  sockets: DragSocketSlot[],
  items: DragSocketItem[],
): { lists?: Array<{ id: string; items: string[] }> | undefined; sockets: Array<{ socketId?: string; itemId?: string; listId?: string }> } => {
  if (!raw || typeof raw !== "object") {
    throw new ContentValidationError("Drag-sockets puzzles require a solution");
  }

  const socketIds = new Set(sockets.map((socket) => socket.id));
  const itemIds = new Set(items.map((item) => item.id));

  const maybeLists = (raw as { lists?: unknown }).lists;
  const lists =
    Array.isArray(maybeLists) && maybeLists.length > 0
      ? maybeLists.map((entry) => {
          if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
            throw new ContentValidationError("Invalid drag-sockets list entry");
          }
          const { id, items: listItems } = entry as { id?: unknown; items?: unknown };
          const listId = normalizeId(id, "List entries require an id");
          if (!Array.isArray(listItems) || listItems.length === 0) {
            throw new ContentValidationError(`List ${listId} requires items`);
          }
          const normalizedItems = listItems.map((itm) => normalizeId(itm, "List items must be strings"));
          normalizedItems.forEach((itm) => {
            if (!itemIds.has(itm)) throw new ContentValidationError(`List ${listId} references unknown item: ${itm}`);
          });
          return { id: listId, items: normalizedItems };
        })
      : undefined;
  const listIds = new Set((lists ?? []).map((l) => l.id));

  const rawSockets =
    Array.isArray((raw as { sockets?: unknown }).sockets) && (raw as { sockets?: unknown }).sockets
      ? ((raw as { sockets?: Array<unknown> }).sockets as Array<unknown>)
      : Array.isArray(raw)
        ? (raw as Array<unknown>)
        : [];

  if (!rawSockets.length) {
    throw new ContentValidationError("Drag-sockets puzzles require a solution");
  }

  const solutionSockets = rawSockets.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new ContentValidationError("Invalid drag-sockets solution entry");
    }
    const { socketId, itemId, listId } = entry as { socketId?: unknown; itemId?: unknown; listId?: unknown };
    const normalizedSocketId = socketId !== undefined ? normalizeId(socketId, "Solution entries require a socketId") : undefined;
    const normalizedItemId = itemId !== undefined ? normalizeId(itemId, "Solution entries require an itemId") : undefined;
    const normalizedListId = listId !== undefined ? normalizeId(listId, "Solution entries require a listId") : undefined;

    if (!normalizedSocketId && !normalizedItemId) {
      throw new ContentValidationError("Solution entries require at least an itemId or a listId");
    }
    if (normalizedSocketId && !socketIds.has(normalizedSocketId)) {
      throw new ContentValidationError(`Solution references unknown socket: ${normalizedSocketId}`);
    }
    if (normalizedItemId && !itemIds.has(normalizedItemId)) {
      throw new ContentValidationError(`Solution references unknown item: ${normalizedItemId}`);
    }
    if (normalizedListId && !listIds.has(normalizedListId)) {
      throw new ContentValidationError(`Solution references unknown list: ${normalizedListId}`);
    }
    if (normalizedListId && normalizedItemId) {
      throw new ContentValidationError("Solution entries should not specify both itemId and listId");
    }
    const socket = normalizedSocketId ? sockets.find((s) => s.id === normalizedSocketId) : null;
    if (socket && socket.accepts.length > 0 && normalizedItemId && !socket.accepts.includes(normalizedItemId)) {
      throw new ContentValidationError(`Solution assigns an item that the socket does not accept: ${normalizedSocketId}`);
    }
    return {
      ...(normalizedSocketId !== undefined ? { socketId: normalizedSocketId } : {}),
      ...(normalizedItemId !== undefined ? { itemId: normalizedItemId } : {}),
      ...(normalizedListId !== undefined ? { listId: normalizedListId } : {}),
    };
  });

  const seenSockets = new Set<string>();
  const seenItems = new Set<string>();
  solutionSockets.forEach(({ socketId, itemId }) => {
    if (socketId) {
      if (seenSockets.has(socketId)) throw new ContentValidationError(`Solution lists socket multiple times: ${socketId}`);
      seenSockets.add(socketId);
    }
    if (itemId) {
      if (seenItems.has(itemId)) throw new ContentValidationError(`Solution uses item multiple times: ${itemId}`);
      seenItems.add(itemId);
    }
  });

  return { lists, sockets: solutionSockets };
};

const normalizeMemoryCards = (raw: unknown): MemoryCard[] => {
  if (!Array.isArray(raw) || raw.length < 2) {
    throw new ContentValidationError("Memory puzzles require at least two cards");
  }
  if (raw.length % 2 !== 0) {
    throw new ContentValidationError("Memory puzzles require an even number of cards");
  }
  const cards = raw.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new ContentValidationError("Invalid memory card definition");
    }
    const { id, image, label } = entry as { id?: unknown; image?: unknown; label?: unknown };
    const cardId = normalizeId(id, "Memory cards require an id");
    const cardImage = normalizeId(image, "Memory cards require an image");
    const cardLabel = typeof label === "string" ? label : undefined;
    return { id: cardId, image: cardImage, ...(cardLabel ? { label: cardLabel } : {}) };
  });
  const seen = new Set<string>();
  cards.forEach((card) => {
    if (seen.has(card.id)) throw new ContentValidationError(`Duplicate memory card id: ${card.id}`);
    seen.add(card.id);
  });
  return cards;
};

const normalizeMemoryPairs = (raw: unknown, cards: MemoryCard[]): Array<{ a: string; b: string }> => {
  const cardIds = new Set(cards.map((card) => card.id));
  const rawPairs =
    Array.isArray(raw) && raw.length > 0
      ? raw
      : raw && typeof raw === "object" && Array.isArray((raw as { pairs?: unknown }).pairs)
        ? ((raw as { pairs?: unknown[] }).pairs ?? [])
        : [];
  if (!rawPairs.length) {
    throw new ContentValidationError("Memory puzzles require pairs in the solution");
  }
  const pairs = rawPairs.map((entry) => {
    if (Array.isArray(entry) && entry.length === 2) {
      const [a, b] = entry;
      return { a: normalizeId(a, "Pair ids must be strings"), b: normalizeId(b, "Pair ids must be strings") };
    }
    if (entry && typeof entry === "object") {
      const { a, b, first, second } = entry as { a?: unknown; b?: unknown; first?: unknown; second?: unknown };
      const left = normalizeId(a ?? first, "Pair entries require an id for a/first");
      const right = normalizeId(b ?? second, "Pair entries require an id for b/second");
      return { a: left, b: right };
    }
    throw new ContentValidationError("Invalid memory solution entry");
  });

  const used = new Set<string>();
  pairs.forEach(({ a, b }) => {
    if (a === b) throw new ContentValidationError("Pairs must reference two different cards");
    if (!cardIds.has(a)) throw new ContentValidationError(`Solution references unknown card: ${a}`);
    if (!cardIds.has(b)) throw new ContentValidationError(`Solution references unknown card: ${b}`);
    if (used.has(a) || used.has(b)) throw new ContentValidationError("Each card must appear in exactly one pair");
    used.add(a);
    used.add(b);
  });

  if (used.size !== cardIds.size) {
    throw new ContentValidationError("Solution must include every card exactly once");
  }

  return pairs;
};

const normalizeMaxMisses = (value: unknown): number | null => {
  if (value === undefined || value === null) return null;
  if (typeof value === "string" && ["unlimited", "infinite", "none"].includes(value.toLowerCase())) return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    throw new ContentValidationError("maxMisses must be a non-negative number or omitted for unlimited");
  }
  return Math.floor(num);
};

const normalizeMissIndicator = (
  value: unknown,
): { mode: "deplete" | "fill"; animation?: "burst" | "shatter" | undefined } => {
  if (typeof value !== "string") return { mode: "deplete", animation: undefined };
  const [rawMode, rawAnim] = value.toLowerCase().split(":");
  const mode: "deplete" | "fill" =
    rawMode === "fill" || rawMode === "gain" || rawMode === "charge" ? "fill" : "deplete";
  const animation = rawAnim === "burst" || rawAnim === "shatter" ? rawAnim : undefined;
  return { mode, animation };
};

const normalizeFlipBackMs = (value: unknown, fallback: number): number => {
  if (value === undefined || value === null) return fallback;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    throw new ContentValidationError("flipBackMs must be a non-negative number");
  }
  return Math.floor(num);
};

const normalizeGridSize = (value: unknown): GridSize => {
  const raw = value && typeof value === "object" && !Array.isArray(value) ? (value as { width?: unknown; height?: unknown }) : {};
  const width = Number(raw.width ?? 9);
  const height = Number(raw.height ?? 9);
  if (!Number.isInteger(width) || width <= 0) {
    throw new ContentValidationError("Grid width must be a positive integer");
  }
  if (!Number.isInteger(height) || height <= 0) {
    throw new ContentValidationError("Grid height must be a positive integer");
  }
  return { width, height };
};

const normalizeGridPathSolution = (value: unknown, grid: GridSize): GridPathSolution => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ContentValidationError("Grid-path puzzles require a solution");
  }
  const { path, startColumn, goalColumn } = value as { path?: unknown; startColumn?: unknown; goalColumn?: unknown };
  if (!Array.isArray(path) || path.length === 0) {
    throw new ContentValidationError("Grid-path puzzles require a solution path");
  }

  const normalizeCoord = (entry: unknown, idx: number) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new ContentValidationError("Solution path entries must be coordinate objects");
    }
    const { x, y } = entry as { x?: unknown; y?: unknown };
    const coordX = Number(x);
    const coordY = Number(y);
    if (!Number.isInteger(coordX) || !Number.isInteger(coordY)) {
      throw new ContentValidationError(`Path entry ${idx + 1} must use integer coordinates`);
    }
    if (coordX <= 0 || coordX > grid.width || coordY <= 0 || coordY > grid.height) {
      throw new ContentValidationError(`Path entry ${idx + 1} is out of bounds`);
    }
    return { x: coordX - 1, y: coordY - 1 };
  };

  const normalizedPath = path.map((entry, idx) => normalizeCoord(entry, idx));
  const seen = new Set<string>();
  normalizedPath.forEach(({ x, y }) => {
    const key = `${x}:${y}`;
    if (seen.has(key)) {
      throw new ContentValidationError("Path cannot visit the same cell twice");
    }
    seen.add(key);
  });

  normalizedPath.forEach((coord, idx) => {
    if (idx === 0) return;
    const prev = normalizedPath[idx - 1]!;
    const dx = Math.abs(coord.x - prev.x);
    const dy = Math.abs(coord.y - prev.y);
    if (dx + dy !== 1) {
      throw new ContentValidationError("Path steps must be orthogonally adjacent");
    }
  });

  if (normalizedPath[0]?.y !== 0) {
    throw new ContentValidationError("Path must start on the top row (y = 1 in the specification)");
  }
  const startRaw = startColumn === undefined ? undefined : Number(startColumn);
  if (startRaw !== undefined) {
    if (!Number.isInteger(startRaw) || startRaw <= 0 || startRaw > grid.width) {
      throw new ContentValidationError("startColumn is out of bounds");
    }
    const start = startRaw - 1;
    if (normalizedPath[0]?.x !== start) {
      throw new ContentValidationError("Path must start in the specified startColumn");
    }
  }

  const last = normalizedPath[normalizedPath.length - 1];
  if (!last || last.y !== grid.height - 1) {
    throw new ContentValidationError("Path must end on the bottom row");
  }
  const goalRaw = goalColumn === undefined ? undefined : Number(goalColumn);
  if (goalRaw !== undefined) {
    if (!Number.isInteger(goalRaw) || goalRaw <= 0 || goalRaw > grid.width) {
      throw new ContentValidationError("goalColumn is out of bounds");
    }
    const goal = goalRaw - 1;
    if (last.x !== goal) {
      throw new ContentValidationError("Path must end in the specified goalColumn");
    }
  }

  return {
    path: normalizedPath,
    ...(startRaw !== undefined ? { startColumn: startRaw - 1 } : {}),
    ...(goalRaw !== undefined ? { goalColumn: goalRaw - 1 } : {}),
  };
};

const segmentBlocks = (blocks: StructuredBlock[]) => {
  const segments: Array<{ required: WhenCondition | null; blocks: StructuredBlock[] }> = [
    { required: null, blocks: [] },
  ];
  blocks.forEach((block) => {
    if (block.kind === "continue-when") {
      segments.push({ required: block.condition, blocks: [] });
      return;
    }
    segments[segments.length - 1]?.blocks.push(block);
  });
  return segments;
};

const mapToDayBlocks = (
  blocks: StructuredBlock[],
  solvedIds: Set<string>,
  includeHidden: boolean,
  inventory: Map<string, InventoryItem>,
): DayBlock[] => {
  const segments = segmentBlocks(blocks);
  const puzzleIds = new Set(blocks.filter((b) => b.kind === "puzzle").map((b) => (b as PuzzleBlockRaw).id));
  const visibleStoryPuzzle: StructuredBlock[] = [];
  const postSegments: StructuredBlock[] = [];
  let gateSeen = false;
  for (const segment of segments) {
    if (segment.required) {
      gateSeen = true;
      if (!evaluateCondition(segment.required, solvedIds, puzzleIds)) break;
      postSegments.push(...segment.blocks);
      continue;
    }
    if (gateSeen) {
      postSegments.push(...segment.blocks);
    } else {
      visibleStoryPuzzle.push(...segment.blocks);
    }
  }
  const visibleSet = new Set([...visibleStoryPuzzle, ...postSegments]);

  const mapped: DayBlock[] = [];
  const convert = (block: StructuredBlock): DayBlock | null => {
    if (block.kind === "story") {
      return {
        kind: "story",
        html: block.html,
        visible: visibleSet.has(block),
        ...(block.id ? { id: block.id } : {}),
        ...(block.title ? { title: block.title } : {}),
      };
    }
    if (block.kind === "puzzle") {
      const type = resolveType(block.definition.type);
      const solved = solvedIds.has(block.id);

      if (type === "placeholder") {
        return {
          kind: "puzzle",
          id: block.id,
          html: block.html,
          visible: visibleSet.has(block),
          type,
          solution: block.definition.solution ?? null,
          solved,
          ...(block.title ? { title: block.title } : {}),
        };
      }

      if (type === "pair-items") {
        const rawDef = block.definition.raw as Record<string, unknown>;
        const leftOptions = normalizeOptions(rawDef.left);
        const rightOptions = normalizeOptions(rawDef.right);
        if (leftOptions.length !== rightOptions.length) {
          throw new ContentValidationError("Pair-items puzzles require the same number of left and right items");
        }
        if (!leftOptions.length) {
          throw new ContentValidationError("Pair-items puzzles require at least one item per group");
        }
        const leftIds = new Set(leftOptions.map((opt) => opt.id));
        const rightIds = new Set(rightOptions.map((opt) => opt.id));
        leftIds.forEach((id) => {
          if (rightIds.has(id)) {
            throw new ContentValidationError(`Pair-items puzzles require unique ids across groups: ${id}`);
          }
        });
        const solution = normalizePairItemsSolution(block.definition.solution, leftOptions, rightOptions);
        const optionSize = normalizeOptionSize((block.definition.raw as { size?: unknown }).size);
        return {
          kind: "puzzle",
          id: block.id,
          html: block.html,
          visible: visibleSet.has(block) || includeHidden,
          type,
          leftOptions,
          rightOptions,
          solution,
          ...(optionSize ? { optionSize } : {}),
          solved,
          ...(block.title ? { title: block.title } : {}),
        };
      }

      if (type === "text") {
        const solution = normalizeId(block.definition.solution, "Text puzzles require a solution");
        return {
          kind: "puzzle",
          id: block.id,
          html: block.html,
          visible: visibleSet.has(block),
          type,
          solution,
          solved,
          ...(block.title ? { title: block.title } : {}),
        };
      }

      if (type === "single-choice") {
        const options = normalizeOptions(block.definition.options);
        const solution = normalizeId(block.definition.solution, "Solution must match a single option id");
        const optionIds = new Set(options.map((opt) => opt.id));
        if (!optionIds.has(solution)) throw new ContentValidationError("Solution must reference one of the provided options");
        const optionSize = normalizeOptionSize((block.definition.raw as { size?: unknown }).size);
        return {
          kind: "puzzle",
          id: block.id,
          html: block.html,
          visible: visibleSet.has(block),
          type,
          solution,
          options,
          ...(optionSize ? { optionSize } : {}),
          solved,
          ...(block.title ? { title: block.title } : {}),
        };
      }

      if (type === "multi-choice") {
        const options = normalizeOptions(block.definition.options);
        const solution = ensureStringArray(block.definition.solution, "Solution must list the correct options");
        if (solution.length === 0) throw new ContentValidationError("Solution must include at least one correct option");
        const optionIds = new Set(options.map((opt) => opt.id));
        const orderedRaw = (block.definition.raw as { ordered?: unknown }).ordered;
        const ordered = typeof orderedRaw === "boolean" ? orderedRaw : typeof orderedRaw === "string" ? orderedRaw.toLowerCase() === "true" : false;
        const solutionIds = new Set<string>();
        solution.forEach((id) => {
          if (!optionIds.has(id)) {
            throw new ContentValidationError("Solution references an unknown option id");
          }
          if (solutionIds.has(id)) {
            throw new ContentValidationError("Solution cannot contain duplicate options");
          }
          solutionIds.add(id);
        });
        const rawMin = (block.definition.raw as { minSelections?: unknown }).minSelections;
        const parsedMin =
          typeof rawMin === "number"
            ? rawMin
            : typeof rawMin === "string" && rawMin.trim()
              ? Number(rawMin)
              : null;
        const clampedRequested =
          parsedMin && Number.isFinite(parsedMin) ? Math.min(Math.max(parsedMin, 1), options.length) : null;
        const minSelections = Math.min(options.length, clampedRequested ?? 1);
        const optionSize = normalizeOptionSize((block.definition.raw as { size?: unknown }).size);
        return {
          kind: "puzzle",
          id: block.id,
          html: block.html,
          visible: visibleSet.has(block),
          type,
          solution,
          options,
          minSelections,
          ...(ordered ? { ordered } : {}),
          ...(optionSize ? { optionSize } : {}),
          solved,
          ...(block.title ? { title: block.title } : {}),
        };
      }

      if (type === "memory") {
        const rawDef = block.definition.raw as Record<string, unknown>;
        const backImageCandidate = rawDef.backImage ?? rawDef["back-image"] ?? rawDef.cardBack ?? rawDef["card-back"];
        const hoverBackCandidate =
          rawDef.hoverBackImage ?? rawDef["hover-back-image"] ?? rawDef.hoverCardBack ?? rawDef["hover-card-back"];
        const backImage = typeof backImageCandidate === "string" ? backImageCandidate : undefined;
        const hoverBackImage = typeof hoverBackCandidate === "string" ? hoverBackCandidate : undefined;
        if (!backImage) {
          throw new ContentValidationError("Memory puzzles require a card back image");
        }
        const cards = normalizeMemoryCards(rawDef.cards ?? rawDef.items);
        const solutionPairs = normalizeMemoryPairs(block.definition.solution, cards);
        const maxMisses = normalizeMaxMisses(rawDef.maxMisses ?? rawDef["max-misses"]);
        const { mode: missIndicator, animation: missIndicatorAnimation } = normalizeMissIndicator(
          rawDef.missIndicator ?? rawDef["miss-indicator"],
        );
        const flipBackMs = normalizeFlipBackMs(
          rawDef.flipBackMs ?? rawDef["flip-back-ms"] ?? rawDef.flipBackDelay ?? rawDef["flip-back-delay"],
          700,
        );
        return {
          kind: "puzzle",
          id: block.id,
          html: block.html,
          visible: visibleSet.has(block),
          type,
          backImage,
          ...(hoverBackImage ? { hoverBackImage } : {}),
          cards,
          solution: solutionPairs,
          ...(maxMisses !== null ? { maxMisses } : {}),
          ...(missIndicator ? { missIndicator } : {}),
          ...(missIndicatorAnimation ? { missIndicatorAnimation } : {}),
          flipBackMs,
          solved,
          ...(block.title ? { title: block.title } : {}),
        };
      }

      if (type === "select-items") {
        const rawDef = block.definition.raw as Record<string, unknown>;
        const backgroundImageCandidate = rawDef.backgroundImage ?? rawDef["background-image"];
        const backgroundImage =
          typeof backgroundImageCandidate === "string" ? backgroundImageCandidate : undefined;
        if (!backgroundImage) {
          throw new ContentValidationError("Select-items puzzles require a background image");
        }
        const shape = rawDef.shape ? resolveShape(rawDef.shape) : "circle";
        const items = normalizeDragItems(rawDef.items, shape, { requirePosition: true });
        const rawSolution = block.definition.solution;
        const solutionItems =
          Array.isArray(rawSolution) || typeof rawSolution === "string"
            ? ensureStringArray(
                Array.isArray(rawSolution) ? rawSolution : [rawSolution],
                "Solution must list the correct items",
              )
            : rawSolution && typeof rawSolution === "object" && "items" in rawSolution
              ? ensureStringArray((rawSolution as { items?: unknown }).items, "Solution must list the correct items")
              : null;
        if (!solutionItems || solutionItems.length === 0) {
          throw new ContentValidationError("Solution must include at least one item id");
        }
        const rawRequired =
          rawDef.requiredSelections ??
          rawDef["required-selections"] ??
          rawDef.required ??
          rawDef["required"] ??
          rawDef.minSelections ??
          rawDef["min-selections"];
        let requiredSelections = solutionItems.length;
        if (rawRequired !== undefined && rawRequired !== null && rawRequired !== "") {
          const parsed = Number(rawRequired);
          if (!Number.isFinite(parsed) || parsed <= 0) {
            throw new ContentValidationError("requiredSelections must be a positive number");
          }
          requiredSelections = Math.min(solutionItems.length, Math.max(1, Math.floor(parsed)));
        }
        const itemIds = new Set(items.map((itm) => itm.id));
        solutionItems.forEach((id) => {
          if (!itemIds.has(id)) {
            throw new ContentValidationError("Solution references an unknown item id");
          }
        });
        return {
          kind: "puzzle",
          id: block.id,
          html: block.html,
          visible: visibleSet.has(block),
          type,
          solution: solutionItems,
          requiredSelections,
          backgroundImage,
          items,
          shape,
          solved,
          ...(block.title ? { title: block.title } : {}),
        };
      }

      if (type === "drag-sockets") {
        const rawDef = block.definition.raw as Record<string, unknown>;
        const backgroundImageCandidate = rawDef.backgroundImage ?? rawDef["background-image"];
        const backgroundImage =
          typeof backgroundImageCandidate === "string" ? backgroundImageCandidate : undefined;
        if (!backgroundImage) {
          throw new ContentValidationError("Drag-sockets puzzles require a background image");
        }
        const shape = rawDef.shape ? resolveShape(rawDef.shape) : "circle";
        const items = normalizeDragItems(rawDef.items, shape);
        const sockets = normalizeDragSockets(rawDef.sockets, items, shape);
        const solution = normalizeDragSolution(block.definition.solution, sockets, items);
        return {
          kind: "puzzle",
          id: block.id,
          html: block.html,
          visible: visibleSet.has(block),
          type,
          solution,
          backgroundImage,
          items,
          sockets,
          shape,
          solved,
          ...(block.title ? { title: block.title } : {}),
        };
      }

      if (type === "grid-path") {
        const rawDef = block.definition.raw as Record<string, unknown>;
        const backgroundImageCandidate = rawDef.backgroundImage ?? rawDef["background-image"];
        const backgroundImage =
          typeof backgroundImageCandidate === "string" ? backgroundImageCandidate : undefined;
        if (!backgroundImage) {
          throw new ContentValidationError("Grid-path puzzles require a background image");
        }
        const grid = normalizeGridSize(rawDef.grid);
        const solution = normalizeGridPathSolution(block.definition.solution, grid);
        return {
          kind: "puzzle",
          id: block.id,
          html: block.html,
          visible: visibleSet.has(block),
          type,
          backgroundImage,
          grid,
          solution,
          solved,
          ...(block.title ? { title: block.title } : {}),
        };
      }

      throw new ContentValidationError(`Unsupported puzzle type for versioned content: ${type}`);
    }
    if (block.kind === "reward") {
      const unlocked = block.condition ? evaluateCondition(block.condition, solvedIds, puzzleIds) : true;
      const item = block.inventoryId ? inventory.get(block.inventoryId) : undefined;
      if (!item) return null;
      return {
        kind: "reward",
        visible: visibleSet.has(block) && unlocked,
        item,
        ...(block.id ? { id: block.id } : {}),
        ...(block.title ? { title: block.title } : {}),
      };
    }
    return null;
  };

  blocks.forEach((block) => {
    const converted = convert(block);
    if (converted && (converted.visible || includeHidden)) {
      mapped.push(converted);
    }
  });

  return mapped;
};

export const loadVersionedContent = (
  parsed: GrayMatterFile<string>,
  options: { solvedPuzzleIds: Set<string>; includeHidden: boolean; inventory: Map<string, InventoryItem> },
): LoadedVersionedContent => {
  const { meta, blocks } = parseBlocks(parsed);
  if (!meta.version || Number.isNaN(meta.version)) throw new ContentValidationError("Invalid content version");

  const h1Match = parsed.content.match(/^#\s+(.+)\s*$/m);
  const derivedTitle = h1Match?.[1]?.trim() ?? "";
  const title = derivedTitle || meta.id;

  const puzzleIds = blocks.filter((block) => block.kind === "puzzle").map((block) => (block as PuzzleBlockRaw).id);
  const dayBlocks = mapToDayBlocks(blocks, options.solvedPuzzleIds, options.includeHidden, options.inventory);

  return {
    title,
    blocks: dayBlocks,
    puzzleIds,
    solvedCondition: meta.solvedWhen ?? null,
  };
};
