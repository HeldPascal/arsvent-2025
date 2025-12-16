import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import type { DayContent, DayBlock, Locale, Mode } from "./loader.js";
import type { WhenCondition } from "./v1-loader.js";

type TokenKind = "block" | "option" | "item" | "socket" | "card" | "asset" | "list";

const TOKEN_SECRET = process.env.CONTENT_TOKEN_SECRET || process.env.SESSION_SECRET;
if (!TOKEN_SECRET) {
  throw new Error("CONTENT_TOKEN_SECRET or SESSION_SECRET must be set for token generation");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const assetsRoot = path.join(__dirname, "..", "..", "content", "assets");

const base64url = (buf: Buffer) =>
  buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const hmacToken = (kind: TokenKind, context: string, value: string, salt = "") => {
  const h = crypto.createHmac("sha256", TOKEN_SECRET);
  h.update(`${kind}|${context}|${value}${salt}`);
  return base64url(h.digest().subarray(0, 18)); // 24 chars approx
};

export type TokenContext = { day: number; locale: Locale; mode: Mode };

export interface TokenizationResult {
  content: DayContent;
  tokenToId: Map<string, string>;
}

const assetTokenMap = new Map<string, string>(); // token -> path
const assetPathToToken = new Map<string, string>(); // path -> token

const ensureAssetToken = (assetPath: string) => {
  if (assetPathToToken.has(assetPath)) return assetPathToToken.get(assetPath)!;
  const token = hmacToken("asset", "global-asset", assetPath);
  assetTokenMap.set(token, assetPath);
  assetPathToToken.set(assetPath, token);
  return token;
};

const isAssetPath = (value?: string | null) => Boolean(value && value.startsWith("/assets/"));

export const resolveAssetToken = async (token: string): Promise<string | null> => {
  if (assetTokenMap.has(token)) return assetTokenMap.get(token)!;
  // lazy scan to populate if missing
  try {
    const entries = await fs.readdir(assetsRoot, { withFileTypes: true });
    const walk = async (prefix: string) => {
      const dirEntries = await fs.readdir(path.join(assetsRoot, prefix), { withFileTypes: true });
      for (const entry of dirEntries) {
        if (entry.isDirectory()) {
          await walk(path.join(prefix, entry.name));
          continue;
        }
        if (!entry.isFile()) continue;
        const rel = `/${path.join("assets", prefix, entry.name).replace(/\\/g, "/")}`;
        const tok = ensureAssetToken(rel);
        assetTokenMap.set(tok, rel);
      }
    };
    for (const entry of entries) {
      if (entry.isDirectory()) {
        await walk(entry.name);
      } else if (entry.isFile()) {
        const rel = `/assets/${entry.name}`;
        const tok = ensureAssetToken(rel);
        assetTokenMap.set(tok, rel);
      }
    }
  } catch {
    // ignore
  }
  return assetTokenMap.get(token) ?? null;
};

const maskAsset = (value?: string | null) => {
  if (!value) return "";
  if (!isAssetPath(value)) return value;
  const token = ensureAssetToken(value);
  return `/content-asset/${token}`;
};

export const maskHtmlAssets = (html: string): string => {
  let result = html.replace(/src=(["'])(\/assets\/[^"']+)\1/g, (_m, quote, src) => {
    const masked = maskAsset(src);
    return `src=${quote}${masked}${quote}`;
  });
  // Also handle src="content-assets/..." fallback
  result = result.replace(/src=(["'])(content-assets\/[^"']+)\1/gi, (_m, quote, src) => {
    const normalized = src.startsWith("/") ? src : `/${src}`;
    const masked = maskAsset(normalized);
    return `src=${quote}${masked}${quote}`;
  });
  // srcset attributes
  result = result.replace(/srcset=(["'])([^"']+)\1/gi, (_m, quote, val) => {
    const rewritten = val
      .split(",")
      .map((part: string) => {
        const [urlRaw, size] = part.trim().split(/\s+/, 2);
        const url = urlRaw ?? "";
        const masked = url.startsWith("/assets/")
          ? maskAsset(url)
          : url.startsWith("content-assets/")
            ? maskAsset(`/${url}`)
            : url;
        return size ? `${masked} ${size}` : masked;
      })
      .join(", ");
    return `srcset=${quote}${rewritten}${quote}`;
  });
  // inline styles with url(...)
  result = result.replace(/url\((['"]?)(\/assets\/[^'")]+)\1\)/gi, (_m, quote, src) => {
    const masked = maskAsset(src);
    return `url(${quote}${masked}${quote})`;
  });
  result = result.replace(/url\((['"]?)(content-assets\/[^'")]+)\1\)/gi, (_m, quote, src) => {
    const normalized = src.startsWith("/") ? src : `/${src}`;
    const masked = maskAsset(normalized);
    return `url(${quote}${masked}${quote})`;
  });
  return result;
};

const mapConditionTokens = (condition: WhenCondition | null, realToToken: Map<string, string>): WhenCondition | null => {
  if (!condition) return condition;
  if (condition.kind === "puzzle") {
    const token = realToToken.get(condition.id);
    return token ? { ...condition, id: token } : condition;
  }
  if (condition.kind === "and" || condition.kind === "or") {
    return {
      ...condition,
      conditions: condition.conditions.map((c: WhenCondition) => mapConditionTokens(c, realToToken) ?? c),
    };
  }
  return condition;
};

export const tokenizeDayContent = (content: DayContent, ctx: TokenContext): TokenizationResult => {
  const tokenToId = new Map<string, string>();
  const ensureToken = (kind: TokenKind, value: string) => {
    let salt = "";
    let token: string;
    const contextKey = `${ctx.day}|${ctx.locale}|${ctx.mode}`;
    do {
      token = hmacToken(kind, contextKey, value, salt);
      if (!tokenToId.has(token) || tokenToId.get(token) === value) break;
      salt = `${salt}*`;
    } while (true);
    tokenToId.set(token, value);
    return token;
  };

  const puzzleIdMap = new Map<string, string>(); // real -> token

  const tokenBlocks: DayContent["blocks"] = content.blocks.map((block) => {
    const blockToken = block.id ? ensureToken("block", block.id) : undefined;
    const baseBlock = { ...block, ...(blockToken ? { id: blockToken } : {}) };
    if ("html" in baseBlock && typeof baseBlock.html === "string") {
      (baseBlock as { html: string }).html = maskHtmlAssets(baseBlock.html);
    }
    if (block.kind !== "puzzle") {
      if (block.kind === "reward" && block.item?.image) {
        return {
          ...baseBlock,
          item: { ...block.item, image: maskAsset(block.item.image) },
        };
      }
      return baseBlock;
    }
    const basePuzzle = baseBlock as Extract<DayBlock, { kind: "puzzle" }>;

    puzzleIdMap.set(block.id, blockToken ?? block.id);

    if (block.type === "single-choice" || block.type === "multi-choice") {
      const options = (block.options ?? []).map((opt) => {
        const optToken = ensureToken("option", opt.id);
        return { ...opt, id: optToken, ...(opt.image ? { image: maskAsset(opt.image) } : {}) };
      });
      const translateId = (id: unknown) => (typeof id === "string" ? ensureToken("option", id) : id);
      const solution =
        block.type === "single-choice"
          ? translateId(block.solution)
          : Array.isArray(block.solution)
            ? (block.solution as unknown[]).map((id) => translateId(id))
            : block.solution;
      return { ...basePuzzle, options, solution };
    }

    if (block.type === "select-items") {
      const items = (block.items ?? []).map((item) => {
        const itemToken = ensureToken("item", item.id);
        return {
          ...item,
          id: itemToken,
          ...(item.image ? { image: maskAsset(item.image) } : {}),
        };
      });
      const solution = Array.isArray(block.solution)
        ? (block.solution as unknown[]).map((id) => (typeof id === "string" ? ensureToken("item", id) : id))
        : block.solution && typeof block.solution === "object" && "items" in (block.solution as Record<string, unknown>)
          ? {
              items: (block.solution as { items?: unknown[] }).items?.map((id) =>
                typeof id === "string" ? ensureToken("item", id) : id,
              ),
            }
          : block.solution;
      return {
        ...basePuzzle,
        items,
        backgroundImage: maskAsset(block.backgroundImage),
        solution,
      };
    }

    if (block.type === "drag-sockets") {
      const items = (block.items ?? []).map((item) => {
        const itemToken = ensureToken("item", item.id);
        return {
          ...item,
          id: itemToken,
          ...(item.image ? { image: maskAsset(item.image) } : {}),
          ...(item.defaultSocketId ? { defaultSocketId: ensureToken("socket", item.defaultSocketId) } : {}),
        };
      });
      const sockets = (block.sockets ?? []).map((sock) => {
        const socketToken = ensureToken("socket", sock.id);
        const accepts = (sock.accepts ?? []).map((acc) => ensureToken("item", acc));
        return {
          ...sock,
          id: socketToken,
          accepts,
          ...(sock.image ? { image: maskAsset(sock.image) } : {}),
        };
      });
      const translateSocketEntry = (entry: { socketId?: string; itemId?: string; listId?: string }) => ({
        ...(entry.socketId ? { socketId: ensureToken("socket", entry.socketId) } : {}),
        ...(entry.itemId ? { itemId: ensureToken("item", entry.itemId) } : {}),
        ...(entry.listId ? { listId: ensureToken("list", entry.listId) } : {}),
      });
      const lists =
        (block.solution as { lists?: Array<{ id?: string; items?: string[] }> } | undefined)?.lists?.map((lst) => ({
          ...lst,
          ...(lst.id ? { id: ensureToken("list", lst.id) } : {}),
          items: (lst.items ?? []).map((itm) => ensureToken("item", itm)),
        })) ?? undefined;
      const solutionSockets =
        (block.solution as { sockets?: Array<{ socketId?: string; itemId?: string; listId?: string }> } | undefined)
          ?.sockets ?? [];
      const normalizedSockets =
        solutionSockets.length > 0
          ? solutionSockets.map((entry) => translateSocketEntry(entry))
          : Array.isArray(block.solution)
            ? (block.solution as Array<{ socketId?: string; itemId?: string }>).map((entry) => translateSocketEntry(entry))
            : [];

      return {
        ...basePuzzle,
        items,
        sockets,
        backgroundImage: maskAsset(block.backgroundImage),
        solution: lists ? { lists, sockets: normalizedSockets } : normalizedSockets,
      };
    }

    if (block.type === "grid-path") {
      return {
        ...basePuzzle,
        backgroundImage: maskAsset(block.backgroundImage),
      };
    }

    if (block.type === "memory") {
      const cards = (block.cards ?? []).map((card) => {
        const cardToken = ensureToken("card", card.id);
        return { ...card, id: cardToken, image: maskAsset(card.image) };
      });
      const solution = Array.isArray(block.solution)
        ? (block.solution as Array<{ a?: string; b?: string; first?: string; second?: string }>).map((pair) => ({
            a: pair?.a
              ? ensureToken("card", pair.a)
              : pair?.first
                ? ensureToken("card", pair.first)
                : pair?.a ?? "",
            b: pair?.b
              ? ensureToken("card", pair.b)
              : pair?.second
                ? ensureToken("card", pair.second)
                : pair?.b ?? "",
          }))
        : block.solution;
      return {
        ...basePuzzle,
        backImage: maskAsset(block.backImage),
        hoverBackImage: maskAsset(block.hoverBackImage),
        cards,
        solution,
      };
    }

    return basePuzzle;
  });

  // remap puzzleIds and solvedCondition to tokens
  const tokenPuzzleIds = content.puzzleIds.map((id) => puzzleIdMap.get(id) ?? ensureToken("block", id));
  const tokenSolvedCondition = mapConditionTokens(content.solvedCondition, puzzleIdMap);

  return {
    content: {
      ...content,
      blocks: tokenBlocks,
      puzzleIds: tokenPuzzleIds,
      solvedCondition: tokenSolvedCondition,
    },
    tokenToId,
  };
};
