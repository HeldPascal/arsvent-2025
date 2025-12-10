import express from "express";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import session from "express-session";
import RedisStore from "connect-redis";
import { createClient as createRedisClient } from "redis";
import type { Session as ExpressSession, SessionData } from "express-session";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import type { Profile as DiscordProfile, StrategyOptions } from "passport-discord";
import type { VerifyCallback } from "passport-oauth2";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import type { User as PrismaUser } from "@prisma/client";
import { loadIntro, loadDayContent, IntroNotFoundError, RiddleNotFoundError } from "./content/loader.js";
import type { Locale, Mode, DayContent, DayBlock } from "./content/loader.js";
import { evaluateCondition } from "./content/v1-loader.js";

dotenv.config();

const {
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  DISCORD_CALLBACK_URL,
  SESSION_SECRET = "dev-secret",
  FRONTEND_ORIGIN = "http://localhost:5173",
  REDIS_URL = "redis://localhost:6379",
  SUPER_ADMIN_DISCORD_ID = "",
} = process.env;

if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || !DISCORD_CALLBACK_URL) {
  throw new Error("Missing Discord OAuth environment variables.");
}

const PORT = Number(process.env.PORT) || 3000;
const prisma = new PrismaClient();
const app = express();
const superAdminId = SUPER_ADMIN_DISCORD_ID?.trim() || null;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createSessionStore = async (): Promise<session.Store | undefined> => {
  try {
    const redisClient = createRedisClient({ url: REDIS_URL });
    redisClient.on("error", (err: unknown) => {
      console.error("Redis client error", err);
    });
    await redisClient.connect();
    console.log("[session] Using Redis store at", REDIS_URL);
    return new RedisStore({ client: redisClient, prefix: "arsvent:sess:" });
  } catch (err) {
    console.warn("[session] Redis unavailable, using in-memory store. Error:", err);
    return undefined;
  }
};
const sessionStore = await createSessionStore();

type SessionWithVersion = ExpressSession &
  Partial<SessionData> & {
    sessionVersion?: number;
    stateVersion?: number;
    puzzleProgress?: Record<string, string[]>;
  };

const isSuperAdminUser = (user?: PrismaUser | null) => Boolean(user?.isSuperAdmin);
const isAdminUser = (user?: PrismaUser | null) => Boolean(user?.isSuperAdmin || user?.isAdmin);

const storeSessionVersion = (req: Request, user: PrismaUser) => {
  if (req.session) {
    const sess = req.session as SessionWithVersion;
    sess.sessionVersion = user.sessionVersion;
    sess.stateVersion = user.stateVersion;
  }
};

const normalizeLocale = (input?: string | null): Locale => {
  if (input && input.toLowerCase().startsWith("de")) return "de";
  return "en";
};

const normalizeModeValue = (input?: string | null): Mode => {
  const val = String(input ?? "").toUpperCase();
  if (val === "VETERAN" || val === "VET") return "VETERAN";
  return "NORMAL";
};

const discordOptions: StrategyOptions = {
  clientID: DISCORD_CLIENT_ID,
  clientSecret: DISCORD_CLIENT_SECRET,
  callbackURL: DISCORD_CALLBACK_URL,
  scope: ["identify"],
};


app.set("trust proxy", 1);

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
const assetsPath = path.join(__dirname, "..", "content", "assets");
app.use("/content-assets", express.static(assetsPath));
app.use("/assets", express.static(assetsPath)); // alias for legacy references

const isProd = process.env.NODE_ENV === "production";

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: isProd,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

declare global {
  namespace Express {
    interface User extends PrismaUser {}
  }
}

passport.serializeUser((user: PrismaUser, done: (err: any, id?: string) => void) => {
  done(null, user?.id);
});

passport.deserializeUser(async (id: string, done: (err: any, user?: PrismaUser | false | null) => void) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user || false);
  } catch (error) {
    done(error as Error);
  }
});

passport.use(
  new DiscordStrategy(
    discordOptions,
    async (_accessToken: string, _refreshToken: string, profile: DiscordProfile, done: VerifyCallback) => {
      try {
        const isSuperAdmin = superAdminId === profile.id;
        const now = new Date();
        const user = await prisma.user.upsert({
          where: { id: profile.id },
          update: {
            username: profile.username,
            globalName: (profile as { global_name?: string }).global_name ?? null,
            avatar: profile.avatar ?? null,
            lastLoginAt: now,
            ...(isSuperAdmin ? { isAdmin: true, isSuperAdmin: true } : {}),
          },
          create: {
            id: profile.id,
            username: profile.username,
            globalName: (profile as { global_name?: string }).global_name ?? null,
            avatar: profile.avatar ?? null,
            locale: normalizeLocale(profile.locale),
            mode: "NORMAL",
            isAdmin: isSuperAdmin,
            isSuperAdmin,
            sessionVersion: 1,
            stateVersion: 1,
            introCompleted: false,
            lastLoginAt: now,
          },
        });
        if (user.locale !== normalizeLocale(user.locale)) {
          const fixed = await prisma.user.update({
            where: { id: user.id },
            data: { locale: normalizeLocale(user.locale) },
          });
          return done(null, fixed);
        }
        done(null, user);
      } catch (error) {
        done(error as Error);
      }
    },
  ),
);

const requireAuth: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    const sess = req.session as SessionWithVersion | undefined;
    if (!sess || sess.sessionVersion !== req.user.sessionVersion) {
      return req.logout(() => {
        req.session?.destroy(() => {
          res.status(401).json({ error: "Session expired" });
        });
      });
    }
    if (sess.stateVersion !== req.user.stateVersion) {
      sess.stateVersion = req.user.stateVersion;
      sess.puzzleProgress = {};
    }
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
};

const requireAdmin: RequestHandler = (req, res, next) => {
  if (isAdminUser(req.user as PrismaUser)) {
    return next();
  }
  return res.status(403).json({ error: "Forbidden" });
};

const requireSuperAdmin: RequestHandler = (req, res, next) => {
  if (isSuperAdminUser(req.user as PrismaUser)) {
    return next();
  }
  return res.status(403).json({ error: "Forbidden" });
};

const MAX_DAY = 24;
const getContentDaySet = async () => {
  try {
    const contentRoot = path.join(__dirname, "..", "content");
    const entries = await fs.readdir(contentRoot, { withFileTypes: true });
    const days = entries
      .filter((e) => e.isDirectory() && /^day\d{2}$/.test(e.name))
      .map((e) => Number(e.name.replace("day", "")));
    return new Set(days.filter((n) => Number.isFinite(n) && n >= 1 && n <= MAX_DAY));
  } catch (err) {
    console.warn("[content] Failed to count day folders, falling back to MAX_DAY", err);
    return new Set<number>(Array.from({ length: MAX_DAY }, (_, i) => i + 1));
  }
};
const getContentDayCount = async () => (await getContentDaySet()).size || MAX_DAY;

const ensureAppState = async () =>
  prisma.appState.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, unlockedDay: 0 },
  });

const getSessionPuzzleProgress = (req: Request, day: number) => {
  const store = (req.session as SessionWithVersion | undefined)?.puzzleProgress ?? {};
  return new Set(store[String(day)] ?? []);
};

const setSessionPuzzleProgress = (req: Request, day: number, ids: Set<string>) => {
  const sess = req.session as SessionWithVersion;
  if (!sess.puzzleProgress) sess.puzzleProgress = {};
  sess.puzzleProgress[String(day)] = Array.from(ids);
};

const getUnlockedDay = async () => {
  const state = await ensureAppState();
  return Math.min(Math.max(state.unlockedDay ?? 0, 0), MAX_DAY);
};

const setUnlockedDay = async (day: number, updatedBy?: string | null) => {
  const value = Math.min(Math.max(day, 0), MAX_DAY);
  const state = await prisma.appState.update({
    where: { id: 1 },
    data: { unlockedDay: value, updatedBy: updatedBy ?? null },
  });
  return state.unlockedDay;
};

const logAdminAction = async (action: string, actorId?: string | null, details?: Record<string, unknown>) => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        actorId: actorId ?? null,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (err) {
    console.error("Failed to log admin action", err);
  }
};

const getUserLocale = (user?: PrismaUser): Locale => (user?.locale === "de" ? "de" : "en");
const getUserMode = (user?: PrismaUser): Mode => (user?.mode === "VETERAN" || user?.mode === "VET" ? "VETERAN" : "NORMAL");

const requireIntroComplete: RequestHandler = (req, res, next) => {
  if (req.user?.introCompleted || req.user?.isAdmin || req.user?.isSuperAdmin) {
    return next();
  }
  return res.status(403).json({ error: "Intro not completed" });
};

const normalizeAnswerId = (value: unknown, message: string) => {
  if (typeof value !== "string") {
    throw new Error(message);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(message);
  }
  return trimmed;
};

const ensureStringArrayAnswer = (value: unknown, message: string) => {
  if (!Array.isArray(value)) {
    throw new Error(message);
  }
  return value.map((entry) => normalizeAnswerId(entry, "Each answer entry must be a string"));
};

const ensureDragSocketAnswer = (value: unknown) => {
  if (!Array.isArray(value)) {
    throw new Error("Invalid placement format");
  }
  return value.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error("Invalid placement format");
    }
    const { socketId, itemId } = entry as { socketId?: unknown; itemId?: unknown };
    return {
      socketId: normalizeAnswerId(socketId, "socketId is required"),
      itemId: normalizeAnswerId(itemId, "itemId is required"),
    };
  });
};

const buildCreatureSwap = (locale: Locale) =>
  locale === "de"
    ? [
        { needle: "greif", replacement: "gefiederter Drache" },
        { needle: "drache", replacement: "geschuppter Greif" },
      ]
    : [
        { needle: "gryphon", replacement: "feathered dragon" },
        { needle: "dragon", replacement: "scaled gryphon" },
      ];

const applyCreatureSwapText = (text: string, locale: Locale, enabled: boolean) => {
  if (!enabled || !text) return text;
  const swaps = buildCreatureSwap(locale);
  const placeholders: Array<{ token: string; old: string; replacement: string }> = [];
  let working = text;
  swaps.forEach(({ needle, replacement }, idx) => {
    const regex = new RegExp(`\\b${needle}\\b`, "gi");
    working = working.replace(regex, (match) => {
      const token = `__SWAP_${idx}_${placeholders.length}__`;
      placeholders.push({ token, old: match, replacement });
      return token;
    });
  });
  placeholders.forEach(({ token, old, replacement }) => {
    const replacementHtml = `<span class="creature-swap"><span class="creature-old">${old}</span><span class="creature-new">${replacement}</span></span>`;
    working = working.replaceAll(token, replacementHtml);
  });
  return working;
};

const applyCreatureSwapToBlocks = (blocks: DayBlock[], locale: Locale, enabled: boolean): DayBlock[] =>
  blocks.map((block) => {
    if (!enabled) return block;
    if (block.kind === "story") {
      return {
        ...block,
        ...(block.title ? { title: applyCreatureSwapText(block.title, locale, enabled) } : {}),
        html: applyCreatureSwapText(block.html, locale, enabled),
      };
    }
    if (block.kind === "puzzle") {
      return {
        ...block,
        ...(block.title ? { title: applyCreatureSwapText(block.title, locale, enabled) } : {}),
        html: applyCreatureSwapText(block.html, locale, enabled),
        ...(block.options
          ? {
              options: block.options.map((opt) => ({
                ...opt,
                ...(opt.label ? { label: applyCreatureSwapText(opt.label, locale, enabled) } : {}),
              })),
            }
          : {}),
        ...(block.groups
          ? {
              groups: block.groups.map((grp) => ({
                ...grp,
                ...(grp.label ? { label: applyCreatureSwapText(grp.label, locale, enabled) } : {}),
              })),
            }
          : {}),
        ...(block.items
          ? {
              items: block.items.map((itm) => ({
                ...itm,
                ...(itm.label ? { label: applyCreatureSwapText(itm.label, locale, enabled) } : {}),
              })),
            }
          : {}),
        ...(block.sockets
          ? {
              sockets: block.sockets.map((sock) => ({
                ...sock,
                ...(sock.label ? { label: applyCreatureSwapText(sock.label, locale, enabled) } : {}),
              })),
            }
          : {}),
      };
    }
    if (block.kind === "reward") {
      return {
        ...block,
        ...(block.title ? { title: applyCreatureSwapText(block.title, locale, enabled) } : {}),
        ...(block.item
          ? {
              item: {
                ...block.item,
                title: applyCreatureSwapText(block.item.title, locale, enabled),
                ...(block.item.description ? { description: applyCreatureSwapText(block.item.description, locale, enabled) } : {}),
              },
            }
          : {}),
      };
    }
    return block;
  });

const applyCreatureSwapToDay = (content: DayContent, locale: Locale, enabled: boolean): DayContent => {
  if (!enabled) return content;
  return {
    ...content,
    title: applyCreatureSwapText(content.title, locale, enabled),
    blocks: applyCreatureSwapToBlocks(content.blocks, locale, enabled),
  };
};

const evaluatePuzzleAnswer = (block: Extract<DayBlock, { kind: "puzzle" }>, answer: unknown) => {
  switch (block.type) {
    case "text": {
      const normalizedAnswer = normalizeAnswerId(answer, "Answer must be a string").toLowerCase();
      const normalizedSolution = String(block.solution).trim().toLowerCase();
      return normalizedAnswer === normalizedSolution;
    }
    case "single-choice": {
      const choice = normalizeAnswerId(answer, "Answer must be a single choice id");
      const validOptions = new Set((block.options ?? []).map((opt) => opt.id));
      if (!validOptions.has(choice)) throw new Error("Unknown choice");
      return choice === block.solution;
    }
    case "multi-choice": {
      const choices = ensureStringArrayAnswer(answer, "Answer must be an array of choices");
      if (choices.length === 0) throw new Error("Select at least one option");
      const validOptions = new Set((block.options ?? []).map((opt) => opt.id));
      const uniqueChoices = new Set<string>();
      choices.forEach((choice) => {
        if (!validOptions.has(choice)) throw new Error("Unknown choice");
        if (uniqueChoices.has(choice)) throw new Error("Duplicate choices are not allowed");
        uniqueChoices.add(choice);
      });
      const expected = new Set(block.solution as string[]);
      return uniqueChoices.size === expected.size && choices.every((choice) => expected.has(choice));
    }
    case "drag-sockets": {
      const placements = ensureDragSocketAnswer(answer);
      const sockets = block.sockets ?? [];
      const items = block.items ?? [];
      if (!sockets.length || !items.length) {
        throw new Error("Puzzle is misconfigured");
      }
      const socketIds = new Set(sockets.map((socket) => socket.id));
      const itemIds = new Set(items.map((item) => item.id));
      const assignment = new Map<string, string>();
      const usedItems = new Set<string>();
      placements.forEach(({ socketId, itemId }) => {
        if (!socketIds.has(socketId)) throw new Error("Unknown socket");
        if (!itemIds.has(itemId)) throw new Error("Unknown item");
        const socket = sockets.find((s) => s.id === socketId);
        const item = items.find((itm) => itm.id === itemId);
        if (socket && socket.accepts.length > 0 && !socket.accepts.includes(itemId)) {
          throw new Error("Item does not fit this socket");
        }
        if (socket?.shape && item?.shape && socket.shape !== item.shape) {
          throw new Error("Item shape does not match socket");
        }
        if (assignment.has(socketId)) throw new Error("Each socket can hold only one item");
        if (usedItems.has(itemId)) throw new Error("Each item can be used only once");
        assignment.set(socketId, itemId);
        usedItems.add(itemId);
      });
      const expected = Array.isArray(block.solution)
        ? (block.solution as Array<{ socketId?: string; itemId?: string }>)
        : block.solution && typeof block.solution === "object" && "sockets" in (block.solution as Record<string, unknown>)
          ? ((block.solution as { sockets?: Array<{ socketId?: string; itemId?: string; listId?: string }>; lists?: Array<{ id: string; items: string[] }> }).sockets ??
              [])
          : [];

      // Item lists support: map listId -> set of itemIds
      const listMap =
        block.solution && typeof block.solution === "object" && "lists" in (block.solution as Record<string, unknown>)
          ? new Map(
              ((block.solution as { lists?: Array<{ id?: string; items?: string[] }> }).lists ?? []).map((lst) => {
                if (!lst?.id || !Array.isArray(lst.items)) {
                  throw new Error("Invalid item list in solution");
                }
                return [lst.id, new Set(lst.items.map(String))];
              }),
            )
          : new Map<string, Set<string>>();

      if (!expected.length) {
        throw new Error("Puzzle is misconfigured");
      }

      const allHaveSockets = expected.every(
        (entry) =>
          entry &&
          typeof entry.socketId === "string" &&
          (typeof (entry as { listId?: string }).listId === "string" || typeof entry.itemId === "string"),
      );
      const itemPresenceOnly = expected.every(
        (entry) => entry && !entry.socketId && typeof entry.itemId === "string",
      );

      if (itemPresenceOnly) {
        const requiredItems = new Set(expected.map((e) => String(e.itemId)));
        const placedItems = new Set(assignment.values());
        return Array.from(requiredItems).every((id) => placedItems.has(id));
      }

      if (allHaveSockets) {
        return expected.every((entry) => {
          const socketId = entry.socketId as string;
          const placedItem = assignment.get(socketId);
          if (!placedItem) return false;
          if (entry.itemId) {
            return placedItem === entry.itemId;
          }
          const listId = (entry as { listId?: string }).listId;
          if (listId) {
            const list = listMap.get(listId);
            if (!list) throw new Error("Unknown item list in solution");
            return list.has(placedItem);
          }
          return false;
        });
      }

      throw new Error("Puzzle is misconfigured");
    }
    default:
      throw new Error("Unsupported puzzle type for answer evaluation");
  }
};

app.get("/auth/discord", passport.authenticate("discord"));

app.get(
  "/auth/discord/callback",
  passport.authenticate("discord", { failureRedirect: `${FRONTEND_ORIGIN}?auth=failed` }),
  (req, res) => {
    if (req.user) {
      storeSessionVersion(req, req.user as PrismaUser);
    }
    res.redirect(`${FRONTEND_ORIGIN}/calendar?auth=success`);
  },
);

app.post("/auth/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session?.destroy(() => {
      res.clearCookie("connect.sid");
      res.status(200).json({ success: true });
    });
  });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  const user = req.user as PrismaUser;
  return res.json({ ...user, mode: normalizeModeValue(user.mode) });
});

app.post("/api/user/locale", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { locale } = req.body as { locale?: string };
    if (locale !== "en" && locale !== "de") {
      return res.status(400).json({ error: "Invalid locale" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: { locale, stateVersion: { increment: 1 } },
    });

    req.login(updatedUser, (err) => {
      if (err) return next(err);
      storeSessionVersion(req, updatedUser);
      return res.json({ id: updatedUser.id, locale: updatedUser.locale });
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/user/mode", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mode } = req.body as { mode?: string };
    const nextMode = normalizeModeValue(mode);

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const currentMode = normalizeModeValue(user.mode);
    if (currentMode === "NORMAL" && nextMode === "VETERAN" && (user.lastSolvedDay ?? 0) > 0) {
      return res.status(400).json({ error: "Cannot switch from NORMAL to VETERAN" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        mode: nextMode,
        stateVersion: { increment: 1 },
        lastDowngradedAt: currentMode === "VETERAN" && nextMode === "NORMAL" ? new Date() : null,
        lastDowngradedFromDay: currentMode === "VETERAN" && nextMode === "NORMAL" ? user.lastSolvedDay ?? 0 : 0,
      },
    });

    req.login(updatedUser, (err) => {
      if (err) return next(err);
      storeSessionVersion(req, updatedUser);
      return res.json({ id: updatedUser.id, mode: normalizeModeValue(updatedUser.mode) });
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/user/creature-swap", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { creatureSwap } = req.body as { creatureSwap?: unknown };
    if (typeof creatureSwap !== "boolean") {
      return res.status(400).json({ error: "Invalid creature swap value" });
    }
    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: { creatureSwap, stateVersion: { increment: 1 } },
    });
    req.login(updatedUser, (err) => {
      if (err) return next(err);
      storeSessionVersion(req, updatedUser);
      return res.json({ id: updatedUser.id, creatureSwap: updatedUser.creatureSwap });
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/intro", requireAuth, async (req, res, next) => {
  try {
    const locale = normalizeLocale(getUserLocale(req.user as PrismaUser));
    const funSwap = Boolean((req.user as PrismaUser)?.creatureSwap);
    const content = await loadIntro(locale);
    return res.json({
      title: applyCreatureSwapText(content.title, locale, funSwap),
      body: applyCreatureSwapText(content.body, locale, funSwap),
      introCompleted: Boolean(req.user?.introCompleted),
      mode: req.user?.mode ?? "NORMAL",
    });
  } catch (error) {
    if (error instanceof IntroNotFoundError) {
      return res.status(404).json({ error: "Intro not found" });
    }
    return next(error);
  }
});

app.post("/api/intro/complete", requireAuth, async (req, res, next) => {
  try {
    if (req.user?.introCompleted) {
      return res.json({ introCompleted: true });
    }
    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: { introCompleted: true, stateVersion: { increment: 1 } },
    });
    req.login(updated, (err) => {
      if (err) return next(err);
      storeSessionVersion(req, updated);
      return res.json({ introCompleted: true });
    });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/days", requireAuth, requireIntroComplete, async (req, res, next) => {
  try {
    const unlockedDay = await getUnlockedDay();
    const lastSolved = req.user!.lastSolvedDay ?? 0;
    const playLimit = Math.min(unlockedDay, lastSolved + 1);
    const contentDays = await getContentDaySet();
    const contentDayCount = contentDays.size;

    const days = Array.from({ length: MAX_DAY }, (_, index) => {
      const day = index + 1;
      return {
        day,
        isAvailable: day <= playLimit,
        isSolved: day <= lastSolved,
        hasContent: contentDays.has(day),
      };
    });

    res.json({ days, unlockedDay, contentDayCount });
  } catch (error) {
    next(error);
  }
});

app.get("/api/days/:day", requireAuth, requireIntroComplete, async (req, res, next) => {
  const day = Number(req.params.day);
  if (!Number.isInteger(day) || day < 1 || day > MAX_DAY) {
    return res.status(400).json({ error: "Day must be between 1 and 24" });
  }

  try {
    const isAdminOverride = Boolean(
      (req.user?.isAdmin || req.user?.isSuperAdmin) &&
        (req.query.override === "1" || req.query.override === "true" || req.query.override === "yes"),
    );
    const unlockedDay = await getUnlockedDay();
    const lastSolved = req.user!.lastSolvedDay ?? 0;
    const orderAllowed = isAdminOverride || day <= lastSolved + 1;
    const available = isAdminOverride || day <= unlockedDay;
    const funSwap = Boolean(req.user?.creatureSwap);

    const requestedLocale =
      typeof req.query.locale === "string" && (req.query.locale === "en" || req.query.locale === "de")
        ? normalizeLocale(req.query.locale)
        : null;
    const requestedMode = typeof req.query.mode === "string" ? normalizeModeValue(req.query.mode) : null;

    const locale = isAdminOverride && requestedLocale ? requestedLocale : normalizeLocale(getUserLocale(req.user as PrismaUser));
    const mode = isAdminOverride && requestedMode ? requestedMode : getUserMode(req.user as PrismaUser);

    if (!available) {
      return res.json({
        day,
        isSolved: day <= lastSolved,
        canPlay: false,
        message: "This day is not available yet.",
      });
    }
    if (!orderAllowed) {
      return res.json({
        day,
        isSolved: day <= lastSolved,
        canPlay: false,
        message: "Solve the previous day first.",
      });
    }

    const sessionSolved = isAdminOverride ? new Set<string>() : getSessionPuzzleProgress(req, day);
    let content = applyCreatureSwapToDay(
      await loadDayContent(day, locale, mode, sessionSolved, false),
      locale,
      funSwap,
    );

    const daySolvedInDb = day <= lastSolved && !isAdminOverride;
    if (daySolvedInDb) {
      const solvedAll = new Set(content.puzzleIds);
      content = applyCreatureSwapToDay(
        await loadDayContent(day, locale, mode, solvedAll, false),
        locale,
        funSwap,
      );
    }

    return res.json({
      day,
      title: content.title,
      blocks: content.blocks,
      isSolved: daySolvedInDb,
      canPlay: true,
    });
  } catch (error) {
    if (error instanceof RiddleNotFoundError) {
      return res.status(404).json({ error: "Riddle not found" });
    }
    return next(error);
  }
});

app.post("/api/days/:day/submit", requireAuth, requireIntroComplete, async (req, res, next) => {
  const day = Number(req.params.day);
  if (!Number.isInteger(day) || day < 1 || day > MAX_DAY) {
    return res.status(400).json({ error: "Day must be between 1 and 24" });
  }

  const { answer, puzzleId, type: submittedType } = req.body as { answer?: unknown; puzzleId?: string; type?: string };

  try {
    const isAdminOverride = Boolean(
      (req.user?.isAdmin || req.user?.isSuperAdmin) &&
        (req.query.override === "1" || req.query.override === "true" || req.query.override === "yes"),
    );
    const funSwap = Boolean(req.user?.creatureSwap);
    const unlockedDay = await getUnlockedDay();
    if (!isAdminOverride && day > unlockedDay) {
      return res.status(400).json({ error: "This day is not available yet." });
    }

    const lastSolved = req.user!.lastSolvedDay ?? 0;
    if (!isAdminOverride && day <= lastSolved) {
      return res.json({ day, isSolved: true, correct: true, message: "Already solved." });
    }
    if (!isAdminOverride && day !== lastSolved + 1) {
      return res.status(400).json({ error: "Solve previous days first." });
    }

    const requestedLocale =
      typeof req.query.locale === "string" && (req.query.locale === "en" || req.query.locale === "de")
        ? normalizeLocale(req.query.locale)
        : null;
    const requestedMode = typeof req.query.mode === "string" ? normalizeModeValue(req.query.mode) : null;

    const locale = isAdminOverride && requestedLocale ? requestedLocale : getUserLocale(req.user as PrismaUser);
    const mode = isAdminOverride && requestedMode ? requestedMode : getUserMode(req.user as PrismaUser);
    const sessionSolved = isAdminOverride ? new Set<string>() : getSessionPuzzleProgress(req, day);
    const content = await loadDayContent(day, locale, mode, sessionSolved, false);

    if (!puzzleId) {
      return res.status(400).json({ error: "Missing puzzleId" });
    }

    const puzzleBlock = content.blocks.find(
      (block): block is Extract<DayBlock, { kind: "puzzle" }> => block.kind === "puzzle" && block.id === puzzleId,
    );
    if (!puzzleBlock) {
      return res.status(400).json({ error: "Puzzle not found or not available yet" });
    }
    if (puzzleBlock.visible === false) {
      return res.status(400).json({ error: "Puzzle is not available yet" });
    }
    let effectivePuzzle = puzzleBlock;
    if (isAdminOverride && puzzleBlock.solved) {
      // In override mode we still allow re-testing; treat as unsolved for evaluation
      effectivePuzzle = { ...puzzleBlock, solved: false };
    }
    if (!isAdminOverride && puzzleBlock.solved) {
      const funSwap = Boolean(req.user?.creatureSwap);
      const swapped = applyCreatureSwapToDay(content, locale, funSwap);
      return res.json({
        day,
        isSolved: false,
        correct: true,
        message: "Already solved.",
        blocks: swapped.blocks,
      });
    }
    if (submittedType && submittedType !== effectivePuzzle.type) {
      return res.status(400).json({ error: "Answer type does not match puzzle" });
    }

    let correct = false;
    try {
      correct = evaluatePuzzleAnswer(effectivePuzzle, answer);
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }

    const updatedSolved = new Set(sessionSolved);
    if (correct) {
      updatedSolved.add(effectivePuzzle.id);
      if (!isAdminOverride) {
        setSessionPuzzleProgress(req, day, updatedSolved);
      }
    }

    let nextContent = await loadDayContent(day, locale, mode, updatedSolved, false);
    const solvedCondition = nextContent.solvedCondition ?? { kind: "all" as const };
    const allPuzzleIds = new Set(nextContent.puzzleIds);
    const daySolved = evaluateCondition(solvedCondition, updatedSolved, allPuzzleIds);

    if (!isAdminOverride && correct && daySolved) {
      await prisma.user.update({
        where: { id: req.user!.id },
        data: { lastSolvedDay: day, lastSolvedAt: new Date(), stateVersion: { increment: 1 } },
      });
      const solvedAll = new Set(nextContent.puzzleIds);
      nextContent = await loadDayContent(day, locale, mode, solvedAll, false);
    }

    return res.json({
      day,
      isSolved: daySolved,
      correct,
      message: correct ? "Correct! Well done." : "Incorrect answer. Try again.",
      blocks: applyCreatureSwapToDay(nextContent, locale, funSwap).blocks,
    });
  } catch (error) {
    if (error instanceof RiddleNotFoundError) {
      return res.status(404).json({ error: "Riddle not found" });
    }
    return next(error);
  }
});

app.get("/api/admin/overview", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const [
      totalUsers,
      adminUsers,
      vetUsers,
      normalUsers,
      progressedUsers,
      downgradedUsers,
      recentUsers,
      recentSolves,
      solveHistogram,
      downgradeHistogram,
      unlockedDay,
      contentDayCount,
    ] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isAdmin: true } }),
        prisma.user.count({ where: { mode: { in: ["VETERAN", "VET"] } } }),
        prisma.user.count({ where: { mode: "NORMAL" } }),
        prisma.user.count({ where: { lastSolvedDay: { gt: 0 } } }),
        prisma.user.count({ where: { lastDowngradedAt: { not: null } } }),
        prisma.user.findMany({
          orderBy: { createdAt: "desc" },
          take: 8,
          select: {
            id: true,
            username: true,
            locale: true,
            mode: true,
            isAdmin: true,
            isSuperAdmin: true,
            createdAt: true,
            updatedAt: true,
            lastLoginAt: true,
            lastSolvedDay: true,
          },
        }),
        prisma.user.findMany({
          where: { lastSolvedAt: { not: null } },
          orderBy: { lastSolvedAt: "desc" },
          take: 8,
          select: { id: true, username: true, lastSolvedDay: true, lastSolvedAt: true, mode: true },
        }),
        (async () => {
          const users = await prisma.user.findMany({ select: { lastSolvedDay: true } });
          const hist = Array.from({ length: MAX_DAY + 1 }, () => 0);
          users.forEach((u) => {
            const idx = Math.min(Math.max(u.lastSolvedDay ?? 0, 0), MAX_DAY);
            hist[idx] = (hist[idx] ?? 0) + 1;
          });
          return hist;
        })(),
        (async () => {
          const users = await prisma.user.findMany({ select: { lastSolvedDay: true, lastDowngradedAt: true, lastDowngradedFromDay: true } });
          const hist = Array.from({ length: MAX_DAY + 1 }, () => 0);
          users.forEach((u) => {
            if (u.lastDowngradedAt) {
              const idx = Math.min(Math.max(u.lastDowngradedFromDay ?? u.lastSolvedDay ?? 0, 0), MAX_DAY);
              hist[idx] = (hist[idx] ?? 0) + 1;
            }
          });
          return hist;
        })(),
        getUnlockedDay(),
        getContentDayCount(),
      ]);

    res.json({
      diagnostics: {
        uptimeSeconds: Math.round(process.uptime()),
        serverTime: new Date().toISOString(),
        availableDay: unlockedDay,
        maxDay: MAX_DAY,
        contentDayCount,
        nodeVersion: process.version,
        superAdminId: superAdminId || null,
      },
      stats: {
        totalUsers,
        adminUsers,
        veteranUsers: vetUsers,
        normalUsers,
        progressedUsers,
        downgradedUsers,
        solveHistogram,
        downgradeHistogram,
      },
      recentUsers: recentUsers.map((u) => ({ ...u, mode: normalizeModeValue(u.mode) })),
      recentSolves: recentSolves.map((u) => ({ ...u, mode: normalizeModeValue(u.mode) })),
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const summaries = users.map((user) => ({
      id: user.id,
      username: user.username,
      globalName: user.globalName,
      locale: user.locale,
      mode: normalizeModeValue(user.mode),
      isAdmin: user.isAdmin,
      isSuperAdmin: user.isSuperAdmin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      sessionVersion: user.sessionVersion,
      lastSolvedDay: user.lastSolvedDay ?? 0,
      stateVersion: user.stateVersion,
      lastSolvedAt: user.lastSolvedAt,
    }));

    res.json(summaries);
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/users/:id/mode", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const targetId = req.params.id;
    if (!targetId) {
      return res.status(400).json({ error: "User id is required" });
    }
    const { mode } = req.body as { mode?: string };
    const nextMode = normalizeModeValue(mode);

    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) {
      return res.status(404).json({ error: "User not found" });
    }
    if (target.isSuperAdmin && !isSuperAdminUser(req.user)) {
      return res.status(403).json({ error: "Cannot modify super admin" });
    }

    const now = new Date();
    const currentMode = normalizeModeValue(target.mode);
    const updated = await prisma.user.update({
      where: { id: target.id },
      data: {
        mode: nextMode,
        stateVersion: { increment: 1 },
        lastDowngradedAt: currentMode === "VETERAN" && nextMode === "NORMAL" ? now : null,
        lastDowngradedFromDay: currentMode === "VETERAN" && nextMode === "NORMAL" ? target.lastSolvedDay ?? 0 : 0,
      },
    });
    await logAdminAction("admin:set-mode", req.user?.id, { targetId: target.id, mode: nextMode });
    res.json({ id: updated.id, mode: normalizeModeValue(updated.mode) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/users/:id/progress", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const targetId = req.params.id;
    if (!targetId) {
      return res.status(400).json({ error: "User id is required" });
    }
    const { lastSolvedDay, lastSolvedAt } = req.body as { lastSolvedDay?: number; lastSolvedAt?: string | null };
    if (!Number.isInteger(lastSolvedDay) || lastSolvedDay === undefined || lastSolvedDay < 0 || lastSolvedDay > MAX_DAY) {
      return res.status(400).json({ error: "lastSolvedDay must be between 0 and 24" });
    }

    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) {
      return res.status(404).json({ error: "User not found" });
    }
    if (target.isSuperAdmin && !isSuperAdminUser(req.user)) {
      return res.status(403).json({ error: "Cannot modify super admin progress" });
    }

    const solvedAt = lastSolvedDay > 0 ? (lastSolvedAt ? new Date(lastSolvedAt) : new Date()) : null;

    const updated = await prisma.user.update({
      where: { id: target.id },
      data: { lastSolvedDay, lastSolvedAt: solvedAt, stateVersion: { increment: 1 } },
    });

    await logAdminAction("admin:set-progress", req.user?.id, { targetId: target.id, lastSolvedDay, lastSolvedAt: solvedAt });

    res.json({ id: updated.id, lastSolvedDay: updated.lastSolvedDay, lastSolvedAt: updated.lastSolvedAt });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/users/:id/revoke-sessions", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const targetId = req.params.id;
    if (!targetId) {
      return res.status(400).json({ error: "User id is required" });
    }

    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) {
      return res.status(404).json({ error: "User not found" });
    }
    if (target.isSuperAdmin && !isSuperAdminUser(req.user)) {
      return res.status(403).json({ error: "Cannot revoke sessions for super admin" });
    }

    const updated = await prisma.user.update({
      where: { id: target.id },
      data: { sessionVersion: { increment: 1 } },
    });

    await logAdminAction("admin:revoke-sessions", req.user?.id, { targetId: target.id });

    res.json({ id: updated.id, sessionVersion: updated.sessionVersion });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/unlock/increment", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const current = await getUnlockedDay();
    const next = Math.min(current + 1, MAX_DAY);
    const newVal = await setUnlockedDay(next, req.user?.id);
    await logAdminAction("admin:unlock-next", req.user?.id, { from: current, to: newVal });
    res.json({ unlockedDay: newVal });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/unlock/set", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { unlockedDay } = req.body as { unlockedDay?: number };
    if (!Number.isInteger(unlockedDay) || unlockedDay === undefined || unlockedDay < 0 || unlockedDay > MAX_DAY) {
      return res.status(400).json({ error: "unlockedDay must be between 0 and 24" });
    }
    const current = await getUnlockedDay();
    const newVal = await setUnlockedDay(unlockedDay, req.user?.id);
    await logAdminAction("admin:unlock-set", req.user?.id, { from: current, to: newVal });
    res.json({ unlockedDay: newVal });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/users/:id/admin", requireAuth, requireSuperAdmin, async (req, res, next) => {
  try {
    const targetId = req.params.id;
    if (!targetId) {
      return res.status(400).json({ error: "User id is required" });
    }
    const { isAdmin } = req.body as { isAdmin?: boolean };
    if (typeof isAdmin !== "boolean") {
      return res.status(400).json({ error: "isAdmin must be boolean" });
    }

    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) {
      return res.status(404).json({ error: "User not found" });
    }
    if (target.isSuperAdmin) {
      return res.status(400).json({ error: "Super admin status cannot be changed" });
    }

    const updated = await prisma.user.update({
      where: { id: target.id },
      data: { isAdmin, stateVersion: { increment: 1 } },
    });
    await logAdminAction("admin:set-admin", req.user?.id, { targetId: target.id, isAdmin });
    res.json({ id: updated.id, isAdmin: updated.isAdmin });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const targetId = req.params.id;
    if (!targetId) {
      return res.status(400).json({ error: "User id is required" });
    }

    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { isAdmin: true, isSuperAdmin: true, id: true },
    });
    if (!target) {
      return res.status(404).json({ error: "User not found" });
    }
    if (target.isSuperAdmin || (target.isAdmin && !isSuperAdminUser(req.user))) {
      return res.status(403).json({ error: "Cannot delete this user" });
    }

    await prisma.user.delete({ where: { id: target.id } });
    await logAdminAction("admin:delete-user", req.user?.id, { targetId: target.id });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/audit", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const limitParam = req.query.limit ? Number(req.query.limit) : null;
    const limit = limitParam && Number.isInteger(limitParam) ? Math.max(Math.min(limitParam, 200), 1) : 20;
    const entries = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    res.json(entries);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/audit/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }
    await prisma.auditLog.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.get("/", (_req, res) => {
  res.json({ status: "ok" });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // Basic error handler for now; logs can be added later if needed
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
