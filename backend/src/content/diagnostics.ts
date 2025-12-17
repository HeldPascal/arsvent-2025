import fs from "fs/promises";
import path from "path";
import { createHash } from "crypto";
import matter from "gray-matter";
import {
  loadDayContent,
  loadParsedFile,
  resolveDayPath,
  getDayIndexWarnings,
  setContentWarningHandler,
  type DayContent,
  type Locale,
  type Mode,
  CONTENT_ROOT,
  RiddleNotFoundError,
  type RiddleType,
  loadIntro,
  IntroNotFoundError,
} from "./loader.js";
import { getAssetToken } from "./tokens.js";
import { loadInventory } from "./inventory.js";
import { ContentValidationError } from "./errors.js";

const ASSETS_ROOT = path.join(CONTENT_ROOT, "assets");
const SUPPORTED_LOCALES: Locale[] = ["en", "de"];
const MODES: Mode[] = ["NORMAL", "VETERAN"];
const ALLOWED_ASSET_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".svg", ".webp", ".gif", ".avif"]);
const ENABLE_CROSS_LOCALE_ID_MISMATCH = false;

type VariantStatus = "ok" | "missing" | "warning" | "error";

export type IssueSeverity = "info" | "warning" | "error";
export type IssueSource = "inventory" | "asset" | "content" | "consistency" | "link";
export interface Issue {
  severity: IssueSeverity;
  source: IssueSource;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface VariantDiagnostics {
  day: number;
  locale: Locale;
  mode: Mode;
  status: VariantStatus;
  issues: string[];
  filePath?: string;
  title?: string;
  contentId?: string;
}

export interface DayDiagnostics {
  day: number;
  status: "complete" | "partial" | "issue" | "empty";
  ok: number;
  missing: number;
  issues: number;
}

export interface InventoryLocaleDiagnostics {
  locale: Locale;
  hasFile: boolean;
  items: number;
  missingImages: string[];
  issues: string[];
  ids: string[];
  itemList: Array<{
    id: string;
    title: string;
    description: string;
    image: string;
    rarity: string;
    imageToken?: string;
  }>;
}

export interface InventoryConsistencyDiagnostics {
  locale: Locale;
  missingIds: string[];
  extraIds: string[];
}

export interface ContentDiagnostics {
  variants: VariantDiagnostics[];
  days: DayDiagnostics[];
  stats: {
    totalDays: number;
    completeDays: number;
    partialDays: number;
    issueDays: number;
    emptyDays: number;
  };
  indexWarnings: string[];
  issues: Issue[];
  assets: {
    total: number;
    referenced: number;
    unused: number;
    list: Array<{
      path: string;
      referenced: boolean;
      size: number;
      hash?: string;
      token: string;
    }>;
  };
  inventory: {
    locales: InventoryLocaleDiagnostics[];
    consistency: InventoryConsistencyDiagnostics[];
  };
}

const resolveAssetPath = (ref: string): string | null => {
  const normalized = ref.trim();
  if (!normalized || normalized.startsWith("http://") || normalized.startsWith("https://") || normalized.startsWith("data:")) {
    return null;
  }
  const cleaned = normalized.replace(/^\/?(content-assets|assets)\//i, "").replace(/^\/+/, "");
  return path.join(ASSETS_ROOT, cleaned);
};

const isRemoteAsset = (ref: string) => /^(https?:|data:)/i.test(ref);

const pathIsInside = (target: string, base: string) => {
  const relative = path.relative(path.resolve(base), path.resolve(target));
  return !relative.startsWith("..") && !path.isAbsolute(relative);
};

const detectCaseMismatch = async (assetPath: string): Promise<string | null> => {
  const rel = path.relative(ASSETS_ROOT, assetPath);
  if (rel.startsWith("..")) return null;
  const segments = rel.split(path.sep).filter(Boolean);
  let current = ASSETS_ROOT;
  for (const segment of segments) {
    const entries = await fs.readdir(current);
    const match = entries.find((e) => e.toLowerCase() === segment.toLowerCase());
    if (!match) return null;
    if (match !== segment) return path.join(current, match);
    current = path.join(current, match);
  }
  return null;
};

const normalizeAssetKey = (assetPath: string) => path.relative(ASSETS_ROOT, path.resolve(assetPath)).toLowerCase();

const validateAssetReference = async (
  ref: string,
  issues: Issue[],
  ctx: Record<string, unknown>,
  referencedAssets: Set<string>,
): Promise<void> => {
  const trimmed = ref?.toString().trim();
  if (!trimmed) return;
  if (isRemoteAsset(trimmed)) {
    issues.push({
      severity: "warning",
      source: "asset",
      code: "ASSET_REMOTE_PATH",
      message: `Remote asset path not allowed: ${trimmed}`,
      details: { ...ctx, assetPath: trimmed },
    });
    return;
  }
  const assetPath = resolveAssetPath(trimmed);
  if (!assetPath) return;
  const absPath = path.resolve(assetPath);
  const key = normalizeAssetKey(absPath);
  referencedAssets.add(key);
  if (!pathIsInside(absPath, ASSETS_ROOT)) {
    issues.push({
      severity: "error",
      source: "asset",
      code: "ASSET_OUT_OF_ROOT",
      message: `Asset path escapes assets root: ${trimmed}`,
      details: { ...ctx, assetPath: trimmed },
    });
    return;
  }
  const ext = path.extname(trimmed).toLowerCase();
  if (ext && !ALLOWED_ASSET_EXTENSIONS.has(ext)) {
    issues.push({
      severity: "warning",
      source: "asset",
      code: "ASSET_UNSUPPORTED_EXT",
      message: `Unsupported asset extension ${ext} for ${trimmed}`,
      details: { ...ctx, assetPath: trimmed },
    });
  }
  try {
    await fs.access(absPath);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code === "EACCES" ? "ASSET_UNREADABLE" : "ASSET_NOT_FOUND";
    issues.push({
      severity: code === "ASSET_UNREADABLE" ? "error" : "error",
      source: "asset",
      code,
      message: `${code === "ASSET_UNREADABLE" ? "Unreadable" : "Missing"} asset: ${trimmed}`,
      details: { ...ctx, assetPath: trimmed, error: (err as Error).message },
    });
    return;
  }
  const mismatch = await detectCaseMismatch(absPath);
  if (mismatch) {
    issues.push({
      severity: "warning",
      source: "asset",
      code: "ASSET_CASE_MISMATCH",
      message: `Asset path case differs from filesystem: expected ${path.relative(ASSETS_ROOT, mismatch)}`,
      details: { ...ctx, assetPath: trimmed, expectedPath: mismatch },
    });
  }
};

const extractAssetRefsFromHtml = (html: string | undefined, attach: (ref: string) => void) => {
  if (!html) return;
  const regex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html))) {
    if (match[1]) attach(match[1]);
  }
};

const collectBlockAssetIssues = async (
  content: DayContent,
  issues: Issue[],
  ctx: { day: number; locale: Locale; mode: Mode },
  referencedAssets: Set<string>,
) => {
  const tasks: Array<Promise<void>> = [];
  const attach = (ref?: string | null) => {
    if (!ref) return;
    tasks.push(validateAssetReference(ref, issues, ctx, referencedAssets));
  };
  content.blocks.forEach((block) => {
    extractAssetRefsFromHtml((block as { html?: string }).html, attach);
    if (block.kind === "puzzle") {
      attach(block.backgroundImage);
      attach((block as { backImage?: string }).backImage);
      attach((block as { hoverBackImage?: string }).hoverBackImage);
      block.options?.forEach((opt) => attach(opt.image));
      block.items?.forEach((item) => attach(item.image));
      block.sockets?.forEach((socket) => attach(socket.image));
      (block as { cards?: Array<{ image?: string; backImage?: string; hoverBackImage?: string }> }).cards?.forEach((card) => {
        attach(card.image);
        attach(card.backImage);
        attach(card.hoverBackImage);
      });
    }
    if (block.kind === "reward" && block.item?.image) {
      attach(block.item.image);
    }
  });
  await Promise.all(tasks);
};

const checkFilenameConsistency = (filePath: string, locale: Locale, mode: Mode): string | null => {
  const base = path.basename(filePath).toLowerCase();
  const expected = `${mode === "VETERAN" ? "veteran" : "normal"}.${locale}.md`;
  return base === expected ? null : `Filename mismatch: expected ${expected}, found ${base}`;
};

const diagnoseVariant = async (
  day: number,
  locale: Locale,
  mode: Mode,
  issuesCollector: Issue[],
  referencedInventoryIds: Map<Locale, Set<string>>,
  referencedAssets: Set<string>,
): Promise<VariantDiagnostics> => {
  const issues: string[] = [];
  try {
    const filePath = await resolveDayPath(day, locale, mode);
    const parsed = await loadParsedFile(filePath);
    const localeMeta = parsed.parsed.data?.language ?? parsed.parsed.data?.locale;
    const modeMeta = parsed.parsed.data?.mode;
    const versionMeta = parsed.parsed.data?.version;
    const frontmatterKeys = Object.keys(parsed.parsed.data ?? {});
    const allowedKeys = new Set([
      "id",
      "version",
      "release",
      "language",
      "locale",
      "mode",
      "title",
      "solved",
      "intro",
      "hidden",
      "content",
    ]);
    const unknownKeys = frontmatterKeys.filter((k) => !allowedKeys.has(k));
    if (unknownKeys.length) {
      issuesCollector.push({
        severity: "info",
        source: "content",
        code: "CONTENT_META_UNKNOWN",
        message: `Unknown frontmatter keys: ${unknownKeys.join(", ")}`,
        details: { day, locale, mode, filePath, keys: unknownKeys },
      });
    }
    const contentLocale = String(localeMeta ?? "").toLowerCase() === "de" ? "de" : "en";
    const contentMode =
      String(modeMeta ?? "").toLowerCase() === "veteran" || String(modeMeta ?? "").toLowerCase() === "vet" ? "VETERAN" : "NORMAL";
    const contentId = typeof parsed.parsed.data?.id === "string" ? parsed.parsed.data.id.trim() : undefined;
    if (versionMeta !== 1) {
      const msg = `Unsupported content version: ${versionMeta ?? "none"}`;
      issuesCollector.push({
        severity: "error",
        source: "content",
        code: "CONTENT_UNSUPPORTED_VERSION",
        message: msg,
        details: { day, locale, mode, filePath, version: versionMeta },
      });
      return { day, locale, mode, status: "error", issues: [msg] };
    }
    if (!contentId) {
      const msg = "Missing required content id in frontmatter";
      issues.push(msg);
      issuesCollector.push({
        severity: "error",
        source: "content",
        code: "CONTENT_ID_MISSING",
        message: msg,
        details: { day, locale, mode, filePath },
      });
    }
    if (!localeMeta || !modeMeta) {
      const missing: string[] = [];
      if (!localeMeta) missing.push("locale/language");
      if (!modeMeta) missing.push("mode");
      const msg = `Missing required metadata: ${missing.join(", ")}`;
      issuesCollector.push({
        severity: "error",
        source: "content",
        code: "CONTENT_META_MISSING",
        message: msg,
        details: { day, locale, mode, filePath },
      });
    }
    if (contentLocale !== locale || contentMode !== mode) {
      const msg = `Metadata mismatch: frontmatter mode=${contentMode}, locale=${contentLocale}`;
      issues.push(msg);
      issuesCollector.push({
        severity: "warning",
        source: "content",
        code: "CONTENT_META_MISMATCH",
        message: msg,
        details: { day, locale, mode, filePath },
      });
    }
    const mismatch = checkFilenameConsistency(filePath, locale, mode);
    if (mismatch) {
      issues.push(mismatch);
      issuesCollector.push({
        severity: "warning",
        source: "content",
        code: "CONTENT_FILENAME_MISMATCH",
        message: mismatch,
        details: { day, locale, mode, filePath },
      });
    }

    const inventory = await loadInventory(locale);
    const releaseMeta = parsed.parsed.data?.release;
    if (!releaseMeta) {
      issuesCollector.push({
        severity: "warning",
        source: "content",
        code: "CONTENT_RELEASE_MISSING",
        message: "Release timestamp is missing",
        details: { day, locale, mode, filePath },
      });
    }
    let content: DayContent;
    try {
      content = await loadDayContent(day, locale, mode, new Set(), true);
    } catch (err) {
      if (err instanceof ContentValidationError) {
        const msg = err.message || "Content validation failed";
        issuesCollector.push({
          severity: "error",
          source: "content",
          code: "CONTENT_VALIDATION_ERROR",
          message: msg,
          details: { day, locale, mode, filePath },
        });
        return {
          day,
          locale,
          mode,
          status: "error",
          issues: [msg],
          filePath,
        };
      }
      throw err;
    }
    if (!content.title) {
      issuesCollector.push({
        severity: "warning",
        source: "content",
        code: "CONTENT_TITLE_MISSING",
        message: "Title is missing from content",
        details: { day, locale, mode, filePath },
      });
    }

    await collectBlockAssetIssues(content, issuesCollector, { day, locale, mode }, referencedAssets);

    // Validate rewards still resolve to inventory items
    for (const block of content.blocks) {
      if (block.kind === "reward" && block.item && !inventory.has(block.item.id)) {
        const otherLocales = SUPPORTED_LOCALES.filter((l) => l !== locale);
        let foundElsewhere = false;
        for (const other of otherLocales) {
          const otherInv = await loadInventory(other);
          if (otherInv.has(block.item.id)) {
            foundElsewhere = true;
            break;
          }
        }
        const code = foundElsewhere ? "CONTENT_REWARD_WRONG_LOCALE" : "CONTENT_REWARD_INVALID";
        const severity: IssueSeverity = foundElsewhere ? "warning" : "error";
        const message = foundElsewhere
          ? `Reward references inventory id ${block.item.id} that exists only in another locale`
          : `Reward references missing inventory id: ${block.item.id}`;
        issues.push(message);
        issuesCollector.push({
          severity,
          source: "link",
          code,
          message,
          details: { day, locale, mode, inventoryId: block.item.id, filePath },
        });
      }
      if (block.kind === "reward" && block.item && inventory.has(block.item.id)) {
        const set = referencedInventoryIds.get(locale) ?? new Set<string>();
        set.add(block.item.id);
        referencedInventoryIds.set(locale, set);
      }
    }

    // Duplicate block IDs within file
    const blockIdCounts = new Map<string, number>();
    content.blocks.forEach((block) => {
      if (!block.id) return;
      blockIdCounts.set(block.id, (blockIdCounts.get(block.id) ?? 0) + 1);
    });
    blockIdCounts.forEach((count, id) => {
      if (count > 1) {
        const msg = `Duplicate block id ${id} in content`;
        issuesCollector.push({
          severity: "warning",
          source: "content",
          code: "CONTENT_BLOCK_ID_DUPLICATE",
          message: msg,
          details: { day, locale, mode, filePath, id },
        });
        issues.push(msg);
      }
    });

    // Validate puzzle solutions/options basic consistency
    content.blocks.forEach((block) => {
      if (block.kind !== "puzzle") return;
      if (typeof block.visible !== "boolean") {
        issuesCollector.push({
          severity: "warning",
          source: "content",
          code: "CONTENT_VISIBILITY_INVALID",
          message: `Block visibility is invalid for ${block.id ?? "unknown id"}`,
          details: { day, locale, mode, filePath, blockId: block.id },
        });
        issues.push(`Invalid visibility flag for block ${block.id ?? "unknown"}`);
      }
      const allowedTypes: RiddleType[] = [
        "text",
        "placeholder",
        "single-choice",
        "multi-choice",
        "sort",
        "group",
        "drag-sockets",
        "select-items",
        "memory",
        "grid-path",
      ];
      if (!allowedTypes.includes(block.type as RiddleType)) {
        issuesCollector.push({
          severity: "error",
          source: "content",
          code: "CONTENT_PUZZLE_TYPE_UNSUPPORTED",
          message: `Unsupported puzzle type ${block.type}`,
          details: { day, locale, mode, filePath, puzzleId: block.id, type: block.type },
        });
        issues.push(`Unsupported puzzle type ${block.type}`);
      }
      if (block.type === "single-choice" || block.type === "multi-choice") {
        const optionIds = new Set(block.options?.map((opt) => opt.id) ?? []);
        if (block.type === "single-choice") {
          if (!optionIds.has(String(block.solution))) {
            const msg = `Solution ${String(block.solution)} not found in options`;
            issuesCollector.push({
              severity: "error",
              source: "content",
              code: "CONTENT_SOLUTION_INVALID",
              message: msg,
              details: { day, locale, mode, filePath, puzzleId: block.id },
            });
            issues.push(msg);
          }
        } else {
          const sol = Array.isArray(block.solution) ? block.solution : [];
          sol.forEach((id) => {
            if (!optionIds.has(String(id))) {
              const msg = `Solution ${String(id)} not found in options`;
              issuesCollector.push({
                severity: "error",
                source: "content",
                code: "CONTENT_SOLUTION_INVALID",
                message: msg,
                details: { day, locale, mode, filePath, puzzleId: block.id },
              });
              issues.push(msg);
            }
          });
        }
        // duplicate options
        const dupOpts = new Set<string>();
        block.options?.forEach((opt) => {
          if (dupOpts.has(opt.id)) {
            issuesCollector.push({
              severity: "warning",
              source: "content",
              code: "CONTENT_OPTION_DUPLICATE",
              message: `Duplicate option id ${opt.id} in puzzle ${block.id}`,
              details: { day, locale, mode, filePath, puzzleId: block.id, optionId: opt.id },
            });
          }
          dupOpts.add(opt.id);
        });
      }
      if (block.type === "drag-sockets") {
        const socketIds = new Set<string>();
        block.sockets?.forEach((socket) => {
          if (socketIds.has(socket.id)) {
            issuesCollector.push({
              severity: "warning",
              source: "content",
              code: "CONTENT_SOCKET_DUPLICATE",
              message: `Duplicate socket id ${socket.id} in puzzle ${block.id}`,
              details: { day, locale, mode, filePath, puzzleId: block.id, socketId: socket.id },
            });
          }
          socketIds.add(socket.id);
        });
        const itemIds = new Set<string>();
        block.items?.forEach((item) => {
          if (itemIds.has(item.id)) {
            issuesCollector.push({
              severity: "warning",
              source: "content",
              code: "CONTENT_ITEM_DUPLICATE",
              message: `Duplicate item id ${item.id} in puzzle ${block.id}`,
              details: { day, locale, mode, filePath, puzzleId: block.id, itemId: item.id },
            });
          }
          itemIds.add(item.id);
        });
      }
      if (block.type === "memory") {
        const cardIds = new Set<string>();
        block.cards?.forEach((card) => {
          if (cardIds.has(card.id)) {
            issuesCollector.push({
              severity: "warning",
              source: "content",
              code: "CONTENT_CARD_DUPLICATE",
              message: `Duplicate card id ${card.id} in puzzle ${block.id}`,
              details: { day, locale, mode, filePath, puzzleId: block.id, cardId: card.id },
            });
          }
          cardIds.add(card.id);
        });
      }
    });

    return {
      day,
      locale,
      mode,
      status: issues.length ? "warning" : "ok",
      issues,
      filePath,
      title: content.title,
      ...(contentId ? { contentId } : {}),
    };
  } catch (err) {
    if (err instanceof RiddleNotFoundError) {
      issuesCollector.push({
        severity: "warning",
        source: "content",
        code: "CONTENT_VARIANT_MISSING",
        message: "Content not found for variant",
        details: { day, locale, mode },
      });
      return { day, locale, mode, status: "missing", issues: [] };
    }
    const errorObj = err as NodeJS.ErrnoException;
    const isPermission = errorObj.code === "EACCES";
    const code = isPermission ? "CONTENT_FILE_UNREADABLE" : "CONTENT_LOAD_ERROR";
    const message = isPermission ? "Content file unreadable (permissions)" : errorObj.message;
    issues.push(message);
    issuesCollector.push({
      severity: isPermission ? "error" : "error",
      source: "content",
      code,
      message,
      details: { day, locale, mode },
    });
    return {
      day,
      locale,
      mode,
      status: "error",
      issues,
    };
  }
};

const readInventoryDiagnostics = async (
  locale: Locale,
  collector: Issue[],
  referencedInventoryIds: Map<Locale, Set<string>>,
  referencedAssets: Set<string>,
): Promise<InventoryLocaleDiagnostics & { idSet: Set<string> }> => {
  const filePath = path.join(CONTENT_ROOT, "inventory", `${locale}.yaml`);
  const issueMessages: string[] = [];
  const ids = new Set<string>();
  const images: Array<{ path: string; itemId: string }> = [];
  let hasFile = true;
  let entries: Array<Record<string, unknown>> = [];
  const itemList: InventoryLocaleDiagnostics["itemList"] = [];

  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = matter(`---\n${raw}\n---\n`).data;
    if (!Array.isArray(parsed)) {
      throw new Error("Inventory file must be a YAML list");
    }
    entries = parsed as Array<Record<string, unknown>>;
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error.code === "ENOENT") {
      hasFile = false;
      issueMessages.push("Inventory file missing");
      collector.push({
        severity: "error",
        source: "inventory",
        code: "INVENTORY_FILE_MISSING",
        message: `Missing inventory file for locale ${locale}`,
        details: { locale, filePath },
      });
      return {
        locale,
        hasFile,
        items: 0,
        missingImages: [],
        issues: issueMessages,
        ids: [],
        idSet: ids,
        itemList,
      };
    }
    issueMessages.push(`Failed to parse inventory: ${error.message}`);
    collector.push({
      severity: "error",
      source: "inventory",
      code: "INVENTORY_PARSE_ERROR",
      message: `Failed to parse inventory file for ${locale}`,
      details: { locale, filePath, error: error.message },
    });
    return {
      locale,
      hasFile,
      items: 0,
      missingImages: [],
      issues: issueMessages,
      ids: [],
      idSet: ids,
      itemList,
    };
  }

  const duplicateIds = new Set<string>();
  const imageUsage = new Map<string, string[]>();

  entries.forEach((entry, index) => {
    const rawId = entry.id ?? "";
    const id = String(rawId ?? "").trim();
    if (!id) {
      issueMessages.push(`Item #${index + 1} missing id`);
      collector.push({
        severity: "error",
        source: "inventory",
        code: "INVENTORY_ITEM_INVALID",
        message: "Inventory item missing id",
        details: { locale, filePath, index },
      });
      return;
    }
    if (ids.has(id)) {
      duplicateIds.add(id);
      collector.push({
        severity: "warning",
        source: "inventory",
        code: "INVENTORY_ID_DUPLICATE",
        message: `Duplicate inventory id ${id} in ${locale}`,
        details: { locale, filePath, inventoryId: id, index },
      });
    }
    ids.add(id);

    if (String(rawId) !== id) {
      collector.push({
        severity: "info",
        source: "inventory",
        code: "INVENTORY_FIELD_WHITESPACE",
        message: `Inventory id has leading/trailing whitespace: "${rawId as string}"`,
        details: { locale, filePath, inventoryId: id },
      });
    }

    if (!/^[A-Za-z0-9_-]+$/.test(id)) {
      collector.push({
        severity: "warning",
        source: "inventory",
        code: "INVENTORY_ID_INVALID",
        message: `Inventory id contains unsupported characters: ${id}`,
        details: { locale, filePath, inventoryId: id },
      });
    }

    const title = String(entry.title ?? "").trim();
    const description = String(entry.description ?? "").trim();
    const image = String(entry.image ?? "").trim();
    const rarity = String(entry.rarity ?? "").trim();

    const requiredMissing = [];
    if (!title) requiredMissing.push("title");
    if (!description) requiredMissing.push("description");
    if (!image) requiredMissing.push("image");
    if (!rarity) requiredMissing.push("rarity");
    if (requiredMissing.length > 0) {
      issueMessages.push(`Item ${id} missing fields: ${requiredMissing.join(", ")}`);
      collector.push({
        severity: "error",
        source: "inventory",
        code: "INVENTORY_ITEM_INVALID",
        message: `Inventory item ${id} missing fields: ${requiredMissing.join(", ")}`,
        details: { locale, filePath, inventoryId: id, fields: requiredMissing },
      });
    }

    if (entry.title && String(entry.title) !== title) {
      collector.push({
        severity: "info",
        source: "inventory",
        code: "INVENTORY_FIELD_WHITESPACE",
        message: `Inventory item ${id} has whitespace in title`,
        details: { locale, filePath, inventoryId: id, field: "title" },
      });
    }
    if (entry.description && String(entry.description) !== description) {
      collector.push({
        severity: "info",
        source: "inventory",
        code: "INVENTORY_FIELD_WHITESPACE",
        message: `Inventory item ${id} has whitespace in description`,
        details: { locale, filePath, inventoryId: id, field: "description" },
      });
    }
    if (entry.image && String(entry.image) !== image) {
      collector.push({
        severity: "info",
        source: "inventory",
        code: "INVENTORY_FIELD_WHITESPACE",
        message: `Inventory item ${id} has whitespace in image`,
        details: { locale, filePath, inventoryId: id, field: "image" },
      });
    }

    const imageToken = image ? getAssetToken(image) : undefined;
    itemList.push({ id, title, description, image, rarity: rarity || "common", ...(imageToken ? { imageToken } : {}) });

    if (image) {
      images.push({ path: image, itemId: id });
      const list = imageUsage.get(image) ?? [];
      list.push(id);
      imageUsage.set(image, list);
    }
  });

  // Validate assets referenced by inventory items
  const missingImages = new Set<string>();
  await Promise.all(
    images.map(async ({ path: imagePath, itemId }) => {
      await validateAssetReference(imagePath, collector, { locale, inventoryId: itemId, inventoryFile: filePath }, referencedAssets);
      missingImages.add(imagePath);
    }),
  );

  if (duplicateIds.size > 0) {
    issueMessages.push(`Duplicate ids: ${Array.from(duplicateIds).join(", ")}`);
  }

  imageUsage.forEach((list, imagePath) => {
    if (list.length > 1) {
      collector.push({
        severity: "info",
        source: "inventory",
        code: "INVENTORY_IMAGE_REUSED",
        message: `Inventory image reused across items: ${imagePath}`,
        details: { locale, inventoryFile: filePath, assetPath: imagePath, inventoryIds: list },
      });
    }
  });

  const referenced = referencedInventoryIds.get(locale) ?? new Set<string>();
  ids.forEach((id) => {
    if (!referenced.has(id)) {
      collector.push({
        severity: "info",
        source: "inventory",
        code: "INVENTORY_ITEM_UNUSED",
        message: `Inventory item ${id} is not referenced by content rewards`,
        details: { locale, inventoryFile: filePath, inventoryId: id },
      });
    }
  });

  return {
    locale,
    hasFile,
    items: ids.size,
    missingImages: Array.from(missingImages),
    issues: issueMessages,
    ids: Array.from(ids),
    idSet: ids,
    itemList,
  };
};

const computeInventoryConsistency = (
  locales: Array<InventoryLocaleDiagnostics & { idSet: Set<string> }>,
): InventoryConsistencyDiagnostics[] => {
  if (locales.length === 0) return [];
  const base = locales[0];
  if (!base) return [];
  const baseIds = base.idSet;
  return locales.slice(1).map((loc) => {
    const missingIds = Array.from(baseIds).filter((id) => !loc.idSet.has(id));
    const extraIds = Array.from(loc.idSet).filter((id) => !baseIds.has(id));
    return { locale: loc.locale, missingIds, extraIds };
  });
};

const parseIndexWarningTargets = (warnings: string[]) => {
  const map = new Map<string, string[]>();
  const regex =
    /day\s+(\d+),\s+locale\s+(en|de),\s+mode\s+(normal|veteran|NORMAL|VETERAN).*?/i;
  warnings.forEach((w) => {
    const match = w.match(regex);
    if (match) {
      const day = Number(match[1]);
      const locale = (match[2]?.toLowerCase() as Locale) ?? "en";
      const mode = match[3]?.toUpperCase() === "VETERAN" ? "VETERAN" : "NORMAL";
      const key = `${day}-${locale}-${mode}`;
      const list = map.get(key) ?? [];
      list.push(w);
      map.set(key, list);
    }
  });
  return map;
};

const detectUnexpectedInventoryFiles = async (collector: Issue[]) => {
  const inventoryDir = path.join(CONTENT_ROOT, "inventory");
  let files: string[] = [];
  try {
    files = await fs.readdir(inventoryDir);
  } catch {
    return;
  }
  files
    .filter((file) => file.endsWith(".yaml"))
    .forEach((file) => {
      const locale = path.basename(file, ".yaml");
      if (!SUPPORTED_LOCALES.includes(locale as Locale)) {
        collector.push({
          severity: "info",
          source: "inventory",
          code: "INVENTORY_EXTRA_LOCALE",
          message: `Unexpected inventory file found: ${file}`,
          details: { filePath: path.join(inventoryDir, file), locale },
        });
      }
  });
};

const collectExistingAssets = async (): Promise<Array<{ key: string; absolutePath: string }>> => {
  const result: Array<{ key: string; absolutePath: string }> = [];
  const walk = async (dir: string) => {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    await Promise.all(
      entries.map(async (entry: { isDirectory(): boolean; name: string }) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(full);
        } else {
          result.push({ key: normalizeAssetKey(full), absolutePath: full });
        }
      }),
    );
  };
  await walk(ASSETS_ROOT);
  return result;
};

const findUnusedContentFiles = async (maxDay: number): Promise<string[]> => {
  const unused: string[] = [];
  const entries = await fs.readdir(CONTENT_ROOT, { withFileTypes: true });
  for (const dir of entries) {
    if (!dir.isDirectory()) continue;
    const match = dir.name.match(/^day(\d{2})$/i);
    if (!match) continue;
    const dayNum = Number(match[1]);
    if (dayNum <= maxDay) continue;
    const dirPath = path.join(CONTENT_ROOT, dir.name);
    const files = await fs.readdir(dirPath);
    files
      .filter((f) => f.endsWith(".md"))
      .forEach((file) => {
        unused.push(path.join(dirPath, file));
      });
  }
  return unused;
};

const collectIntroAssetIssues = async (issues: Issue[], referencedAssets: Set<string>) => {
  const attach = (ref: string, locale: Locale) =>
    validateAssetReference(ref, issues, { locale, intro: true }, referencedAssets);
  await Promise.all(
    SUPPORTED_LOCALES.map(async (locale) => {
      try {
        const intro = await loadIntro(locale);
        extractAssetRefsFromHtml(intro.body, (ref) => {
          void attach(ref, locale);
        });
      } catch (err) {
        if (err instanceof IntroNotFoundError) return;
        issues.push({
          severity: "warning",
          source: "content",
          code: "INTRO_LOAD_ERROR",
          message: `Failed to load intro for ${locale}`,
          details: { locale, error: (err as Error).message },
        });
      }
    }),
  );
};

export const getContentDiagnostics = async (maxDay: number): Promise<ContentDiagnostics> => {
  const variantDiagnostics: VariantDiagnostics[] = [];
  const tasks: Array<Promise<void>> = [];
  const issues: Issue[] = [];
  const referencedInventoryIds: Map<Locale, Set<string>> = new Map();
  const referencedAssets = new Set<string>();

  setContentWarningHandler((msg: string) => {
    issues.push({ severity: "warning", source: "content", code: "CONTENT_INDEX_WARNING", message: msg });
  });

  try {
    await detectUnexpectedInventoryFiles(issues);
    const indexWarnings = await getDayIndexWarnings();
    const indexWarningMap = parseIndexWarningTargets(indexWarnings);
    indexWarnings.forEach((msg) => {
      if (msg.toLowerCase().includes("duplicate content")) {
        issues.push({
          severity: "warning",
          source: "content",
          code: "CONTENT_VARIANT_DUPLICATE",
          message: msg,
        });
      }
    });

    for (let day = 1; day <= maxDay; day++) {
      SUPPORTED_LOCALES.forEach((locale) => {
        MODES.forEach((mode) => {
          tasks.push(
            diagnoseVariant(day, locale, mode, issues, referencedInventoryIds, referencedAssets).then((diag) => {
              variantDiagnostics.push(diag);
            }),
          );
        });
      });
    }

    await Promise.all(tasks);
    await collectIntroAssetIssues(issues, referencedAssets);

    // Attach index warnings to specific variants and upgrade status to warning
    variantDiagnostics.forEach((variant) => {
      const key = `${variant.day}-${variant.locale}-${variant.mode}`;
      const warnings = indexWarningMap.get(key);
      if (warnings?.length) {
        variant.issues.push(...warnings);
        if (variant.status === "ok") {
          variant.status = "warning";
        }
      }
    });

    // Detect duplicate content ids across variants
    const contentIdMap = new Map<string, VariantDiagnostics>();
    variantDiagnostics.forEach((variant) => {
      if (!variant.contentId) return;
      const existing = contentIdMap.get(variant.contentId);
      if (!existing) {
        contentIdMap.set(variant.contentId, variant);
        return;
      }
      // Allow same id for the same day+mode across locales; warn when reused for a different day or mode.
      const sameVariant = existing.day === variant.day && existing.mode === variant.mode;
      if (sameVariant) return;
      const message = `Duplicate content id "${variant.contentId}" also used by day ${existing.day} ${existing.mode}`;
      [existing, variant].forEach((entry) => {
        entry.issues.push(message);
        if (entry.status === "ok") entry.status = "warning";
      });
      issues.push({
        severity: "warning",
        source: "content",
        code: "CONTENT_ID_DUPLICATE",
        message,
        details: {
          first: { day: existing.day, locale: existing.locale, mode: existing.mode },
          second: { day: variant.day, locale: variant.locale, mode: variant.mode },
          contentId: variant.contentId,
        },
      });
    });

    // Cross-locale consistency for content IDs/titles
    const dayModeMap = new Map<string, VariantDiagnostics[]>();
    variantDiagnostics.forEach((variant) => {
      if (variant.status === "missing") return;
      const key = `${variant.day}-${variant.mode}`;
      const list = dayModeMap.get(key) ?? [];
      list.push(variant);
      dayModeMap.set(key, list);
    });
    dayModeMap.forEach((variants) => {
      if (variants.length < 2) return;
      const first = variants[0];
      if (!first) return;
      const rest = variants.slice(1);
      rest.forEach((other) => {
        if (
          ENABLE_CROSS_LOCALE_ID_MISMATCH &&
          first.contentId &&
          other.contentId &&
          first.contentId !== other.contentId
        ) {
          issues.push({
            severity: "warning",
            source: "consistency",
            code: "CONTENT_CROSS_LOCALE_ID_MISMATCH",
            message: `Content id mismatch between locales for day ${first.day} ${first.mode}`,
            details: {
              day: first.day,
              mode: first.mode,
              ids: [
                { locale: first.locale, id: first.contentId },
                { locale: other.locale, id: other.contentId },
              ],
            },
          });
        }
        if (first.title && other.title && first.title !== other.title) {
          issues.push({
            severity: "info",
            source: "consistency",
            code: "CONTENT_CROSS_LOCALE_TITLE_MISMATCH",
            message: `Title mismatch between locales for day ${first.day} ${first.mode}`,
            details: {
              day: first.day,
              mode: first.mode,
              titles: [
                { locale: first.locale, title: first.title },
                { locale: other.locale, title: other.title },
              ],
            },
          });
        }
      });
    });

    const days: DayDiagnostics[] = [];
    let completeDays = 0;
    let partialDays = 0;
    let issueDays = 0;
    let emptyDays = 0;

    for (let day = 1; day <= maxDay; day++) {
      const variants = variantDiagnostics.filter((v) => v.day === day);
      const ok = variants.filter((v) => v.status === "ok").length;
      const warnings = variants.filter((v) => v.status === "warning" || v.status === "error").length;
      const missing = variants.filter((v) => v.status === "missing").length;

      let status: DayDiagnostics["status"] = "empty";
      if (warnings > 0) {
        status = "issue";
        issueDays += 1;
      } else if (ok === variants.length && variants.length > 0) {
        status = "complete";
        completeDays += 1;
      } else if (ok > 0 && missing > 0) {
        status = "partial";
        partialDays += 1;
      } else if (missing === variants.length) {
        status = "empty";
        emptyDays += 1;
      }

      days.push({ day, status, ok, missing, issues: warnings });
    }

    const inventoryLocales = await Promise.all(
      SUPPORTED_LOCALES.map((locale) => readInventoryDiagnostics(locale, issues, referencedInventoryIds, referencedAssets)),
    );
    const consistency = computeInventoryConsistency(inventoryLocales);
    const inventoryResponse: InventoryLocaleDiagnostics[] = inventoryLocales.map((entry) => ({
      locale: entry.locale,
      hasFile: entry.hasFile,
      items: entry.items,
      missingImages: entry.missingImages,
      issues: entry.issues,
      ids: Array.from(entry.ids),
      itemList: entry.itemList,
    }));

    consistency.forEach((entry) => {
      if (entry.missingIds.length || entry.extraIds.length) {
      issues.push({
        severity: "warning",
        source: "consistency",
        code: "INVENTORY_INCONSISTENT",
        message: `Inventory mismatch for ${entry.locale}`,
        details: { ...entry } as Record<string, unknown>,
        });
      }
    });

    const existingAssets = await collectExistingAssets();
    const hashMap = new Map<string, string[]>(); // hash -> asset paths
    const assetList: ContentDiagnostics["assets"]["list"] = [];
    await Promise.all(
      existingAssets.map(async ({ key, absolutePath }) => {
        if (!referencedAssets.has(key)) {
          issues.push({
            severity: "info",
            source: "asset",
            code: "ASSET_UNUSED",
            message: `Asset not referenced by content or inventory: ${key}`,
            details: { assetPath: key },
          });
        }
        try {
          const stat = await fs.stat(absolutePath);
          const assetEntry: ContentDiagnostics["assets"]["list"][number] = {
            path: key,
            referenced: referencedAssets.has(key),
            size: stat.size,
            token: getAssetToken(`/assets/${key}`),
          };
          if (stat.size === 0) {
            issues.push({
              severity: "error",
              source: "asset",
              code: "ASSET_EMPTY",
              message: `Asset file is empty: ${key}`,
              details: { assetPath: key },
            });
          }
          const buf = await fs.readFile(absolutePath);
          const hash = createHash("sha1").update(buf).digest("hex");
          const list = hashMap.get(hash) ?? [];
          list.push(key);
          hashMap.set(hash, list);
          assetList.push({ ...assetEntry, hash });
        } catch (err) {
          issues.push({
            severity: "error",
            source: "asset",
            code: "ASSET_UNREADABLE",
            message: `Failed to read asset: ${key}`,
            details: { assetPath: key, error: (err as Error).message },
          });
        }
      }),
    );
    hashMap.forEach((paths) => {
      if (paths.length > 1) {
        issues.push({
          severity: "info",
          source: "asset",
          code: "ASSET_DUPLICATE_HASH",
          message: `Duplicate asset content detected (${paths.length} files share the same hash): ${paths.join(", ")}`,
          details: { assets: paths },
        });
      }
    });

    const unusedContentFiles = await findUnusedContentFiles(maxDay);
    unusedContentFiles.forEach((filePath) => {
      issues.push({
        severity: "info",
        source: "content",
        code: "CONTENT_FILE_UNUSED",
        message: `Content file not in scope (day beyond max): ${filePath}`,
        details: { filePath },
      });
    });

    return {
      variants: variantDiagnostics,
      days,
      stats: {
        totalDays: maxDay,
        completeDays,
        partialDays,
        issueDays,
        emptyDays,
    },
    indexWarnings,
    issues,
    assets: {
      total: existingAssets.length,
      referenced: referencedAssets.size,
      unused: existingAssets.length - referencedAssets.size >= 0 ? existingAssets.length - referencedAssets.size : 0,
      list: assetList,
    },
    inventory: {
      locales: inventoryResponse,
      consistency,
    },
  };
  } finally {
    setContentWarningHandler(null);
  }
};
