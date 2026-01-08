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
import fsSync from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFile } from "child_process";
import { promisify } from "util";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import type { User as PrismaUser } from "@prisma/client";
import {
  loadIntro,
  loadEpilogue,
  loadDayContent,
  IntroNotFoundError,
  EpilogueNotFoundError,
  RiddleNotFoundError,
  resolveDayPath,
} from "./content/loader.js";
import type { Locale, Mode, DayContent, DayBlock } from "./content/loader.js";
import { ContentValidationError } from "./content/errors.js";
import { evaluateCondition } from "./content/v1-loader.js";
import { getContentDiagnostics } from "./content/diagnostics.js";
import { tokenizeDayContent, resolveAssetToken } from "./content/tokens.js";
import { maskHtmlAssets, getAssetToken } from "./content/tokens.js";
import { loadInventory } from "./content/inventory.js";
import { loadInventoryTags } from "./content/inventory-tags.js";
import { loadDayInventorySnapshot } from "./content/day-inventory.js";

dotenv.config();

const {
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  DISCORD_CALLBACK_URL,
  SESSION_SECRET = "dev-secret",
  SESSION_MAX_AGE_MS = "",
  FRONTEND_ORIGIN = "http://localhost:5173",
  REDIS_URL = "redis://localhost:6379",
  SUPER_ADMIN_DISCORD_ID = "",
  APP_ENV,
  IS_PRODUCTION,
} = process.env;

if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || !DISCORD_CALLBACK_URL) {
  throw new Error("Missing Discord OAuth environment variables.");
}

const appEnvRaw = APP_ENV?.toLowerCase();
const resolvedAppEnv =
  appEnvRaw === "production" || appEnvRaw === "staging" || appEnvRaw === "development" ? appEnvRaw : undefined;
if (APP_ENV && !resolvedAppEnv) {
  throw new Error("APP_ENV must be 'production', 'staging', or 'development'");
}
const appEnv = resolvedAppEnv ?? "development";
const nodeEnv = process.env.NODE_ENV?.toLowerCase();
if (appEnv === "production" && nodeEnv && nodeEnv !== "production") {
  throw new Error("NODE_ENV must be 'production' when APP_ENV=production");
}

const isProductionFlag = IS_PRODUCTION?.toLowerCase();
const resolvedIsProduction =
  isProductionFlag === "true" ? true : isProductionFlag === "false" ? false : undefined;
if (appEnv === "production" && resolvedIsProduction === undefined) {
  throw new Error("IS_PRODUCTION must be set explicitly in production");
}

const isProd = resolvedIsProduction ?? appEnv === "production";
if (resolvedIsProduction !== undefined && resolvedIsProduction !== (appEnv === "production")) {
  throw new Error("IS_PRODUCTION must match APP_ENV");
}
if (appEnv !== "development") {
  const callbackUrl = new URL(DISCORD_CALLBACK_URL);
  const frontendUrl = new URL(FRONTEND_ORIGIN);
  if (callbackUrl.origin !== frontendUrl.origin) {
    throw new Error("DISCORD_CALLBACK_URL must match FRONTEND_ORIGIN origin in staging/production");
  }
  if (!callbackUrl.pathname.endsWith("/auth/discord/callback")) {
    throw new Error("DISCORD_CALLBACK_URL must end with /auth/discord/callback in staging/production");
  }
  if (callbackUrl.protocol !== "https:" || frontendUrl.protocol !== "https:") {
    throw new Error("DISCORD_CALLBACK_URL and FRONTEND_ORIGIN must use https in staging/production");
  }
}

const PORT = Number(process.env.PORT) || 3000;
const prisma = new PrismaClient();
const app = express();
const superAdminId = SUPER_ADMIN_DISCORD_ID?.trim() || null;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execFileAsync = promisify(execFile);

type VersionPayload = {
  imageTag: string | null;
  commitSha: string | null;
  dirty: boolean | null;
  builtAt: string | null;
};

const normalizeVersionPayload = (value?: Partial<VersionPayload> | null): VersionPayload => ({
  imageTag: typeof value?.imageTag === "string" && value.imageTag.trim() ? value.imageTag : null,
  commitSha: typeof value?.commitSha === "string" && value.commitSha.trim() ? value.commitSha : null,
  dirty: typeof value?.dirty === "boolean" ? value.dirty : null,
  builtAt: typeof value?.builtAt === "string" && value.builtAt.trim() ? value.builtAt : null,
});

const readVersionFile = async (filePath: string): Promise<VersionPayload | null> => {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw) as Partial<VersionPayload>;
    return normalizeVersionPayload(parsed);
  } catch {
    return null;
  }
};

const findGitRoot = (startDir: string): string | null => {
  let current = startDir;
  while (true) {
    if (fsSync.existsSync(path.join(current, ".git"))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
};

const getGitVersionInfo = async (cwd: string): Promise<Pick<VersionPayload, "commitSha" | "dirty">> => {
  const gitRoot = findGitRoot(cwd);
  if (!gitRoot) {
    return { commitSha: null, dirty: null };
  }
  let commitSha: string | null = null;
  let dirty: boolean | null = null;
  try {
    const { stdout } = await execFileAsync("git", ["rev-parse", "HEAD"], { cwd: gitRoot });
    commitSha = stdout.trim() || null;
  } catch {
    commitSha = null;
  }
  try {
    const { stdout } = await execFileAsync("git", ["status", "--porcelain"], { cwd: gitRoot });
    dirty = stdout.trim().length > 0;
  } catch {
    dirty = null;
  }
  return { commitSha, dirty };
};

const resolveBackendVersion = async (): Promise<VersionPayload> => {
  const versionPath = path.join(process.cwd(), "version.json");
  const fromFile = await readVersionFile(versionPath);
  const resolved = normalizeVersionPayload(fromFile ?? {});

  if (!resolved.imageTag && process.env.IMAGE_TAG) {
    resolved.imageTag = process.env.IMAGE_TAG;
  }

  if (!resolved.commitSha || resolved.dirty === null) {
    const gitInfo = await getGitVersionInfo(process.cwd());
    if (!resolved.commitSha) resolved.commitSha = gitInfo.commitSha;
    if (resolved.dirty === null) resolved.dirty = gitInfo.dirty;
  }

  return resolved;
};

const respondHealth = (res: Response, ok: boolean, reason?: string) => {
  if (ok) {
    return res.status(200).json({ status: "ok" });
  }
  return res.status(503).json({ status: "error", reason: reason ?? "unknown" });
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
};

const fetchFrontendVersion = async (): Promise<VersionPayload> => {
  let url: string;
  try {
    url = new URL("/version.json", FRONTEND_ORIGIN).toString();
  } catch {
    return normalizeVersionPayload({});
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { accept: "application/json" } });
    if (!response.ok) {
      return normalizeVersionPayload({});
    }
    const data = (await response.json()) as Partial<VersionPayload>;
    return normalizeVersionPayload(data);
  } catch {
    return normalizeVersionPayload({});
  } finally {
    clearTimeout(timeout);
  }
};

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
const _usesRedisStore = sessionStore instanceof RedisStore;

let healthRedisClient: ReturnType<typeof createRedisClient> | null = null;
const getHealthRedisClient = () => {
  if (!healthRedisClient) {
    healthRedisClient = createRedisClient({ url: REDIS_URL });
    healthRedisClient.on("error", (err: unknown) => {
      console.warn("[health] Redis error", err);
    });
  }
  return healthRedisClient;
};

const checkRedisHealth = async (required: boolean) => {
  if (!required) {
    return { ok: true };
  }
  try {
    const client = getHealthRedisClient();
    if (!client.isOpen) {
      await withTimeout(client.connect(), 1000, "Redis connect");
    }
    await withTimeout(client.ping(), 1000, "Redis ping");
    return { ok: true };
  } catch {
    return { ok: false, reason: "Redis unreachable" };
  }
};

const checkDbHealth = async () => {
  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, 1000, "DB check");
    return { ok: true };
  } catch {
    return { ok: false, reason: "Database unreachable" };
  }
};

const checkMigrationsHealth = async () => {
  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  if (!fsSync.existsSync(migrationsDir)) {
    return { ok: true };
  }
  let expected: string[] = [];
  try {
    const entries = await fs.readdir(migrationsDir, { withFileTypes: true });
    expected = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch {
    return { ok: false, reason: "Failed to read migrations directory" };
  }
  if (expected.length === 0) {
    return { ok: true };
  }
  try {
    const rows = await withTimeout(
      prisma.$queryRaw<
        Array<{ migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }>
      >`SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations`,
      1000,
      "Migration check",
    );
    const applied = new Set(
      rows
        .filter((row) => row.finished_at && !row.rolled_back_at)
        .map((row) => row.migration_name),
    );
    const missing = expected.filter((name) => !applied.has(name));
    if (missing.length > 0) {
      return { ok: false, reason: `Pending migrations: ${missing.join(", ")}` };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "Migrations table missing or unreadable" };
  }
};

type SessionWithVersion = ExpressSession &
  Partial<SessionData> & {
    sessionVersion?: number;
    stateVersion?: number;
    puzzleProgress?: Record<string, string[]>;
    previewPuzzleProgress?: Record<string, string[]>;
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
const webpCacheDir = path.join(__dirname, "..", "content", ".webp-cache");
const enableStaticAssets = false;
if (enableStaticAssets) {
  app.use("/content-assets", express.static(assetsPath));
  app.use("/assets", express.static(assetsPath)); // alias for legacy references
}
app.get("/content-asset/:token", async (req, res) => {
  const token = req.params.token;
  if (!token) return res.status(400).end();
  const assetPath = await resolveAssetToken(token);
  if (!assetPath) return res.status(404).end();
  const normalized = assetPath.replace(/^\/+/, "");
  const abs = path.join(__dirname, "..", "content", normalized);
  const ext = path.extname(abs).toLowerCase();
  const formatParam = typeof req.query.format === "string" ? req.query.format.toLowerCase() : "";
  const forceWebp = formatParam === "webp";
  const wantsWebp = forceWebp || Boolean(req.accepts("image/webp"));
  const canWebp = wantsWebp && [".png", ".jpg", ".jpeg"].includes(ext);
  const setAssetCacheHeaders = () => {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  };

  if (canWebp) {
    if (!forceWebp) {
      res.setHeader("Vary", "Accept");
    }
    const webpPath = path.join(webpCacheDir, `${token}.webp`);
    try {
      await fs.access(webpPath);
    } catch {
      try {
        await fs.mkdir(webpCacheDir, { recursive: true });
        const tempPath = `${webpPath}.tmp-${process.pid}-${Date.now()}`;
        await sharp(abs).webp({ quality: 82 }).toFile(tempPath);
        await fs.rename(tempPath, webpPath);
      } catch (innerErr) {
        console.error("[assets] WebP generation failed", {
          token,
          assetPath,
          error: innerErr instanceof Error ? innerErr.message : String(innerErr),
        });
        if (forceWebp) return res.status(500).end();
        return res.sendFile(abs, (err) => {
          if (err) res.status(500).end();
        });
      }
    }
    try {
      const stats = await fs.stat(webpPath);
      setAssetCacheHeaders();
      res.setHeader("Content-Length", stats.size);
      res.type("image/webp");
      const stream = fsSync.createReadStream(webpPath);
      stream.on("error", (err) => {
        console.error("[assets] WebP stream failed", {
          token,
          webpPath,
          error: err instanceof Error ? err.message : String(err),
        });
        if (res.headersSent) return;
        if (forceWebp) return res.status(500).end();
        setAssetCacheHeaders();
        res.sendFile(abs, (fallbackErr) => {
          if (fallbackErr) res.status(500).end();
        });
      });
      return stream.pipe(res);
    } catch (err) {
      console.error("[assets] WebP stat failed", {
        token,
        webpPath,
        error: err instanceof Error ? err.message : String(err),
      });
      if (forceWebp) return res.status(500).end();
      setAssetCacheHeaders();
      return res.sendFile(abs, (fallbackErr) => {
        if (fallbackErr) res.status(500).end();
      });
    }
  }

  setAssetCacheHeaders();
  return res.sendFile(abs, (err) => {
    if (err) {
      res.status(500).end();
    }
  });
});

app.locals.appEnv = appEnv;
app.locals.isProduction = isProd;
const sessionMaxAgeMs = Number(SESSION_MAX_AGE_MS) || 1000 * 60 * 60 * 24 * 14;

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    rolling: true,
    saveUninitialized: false,
    proxy: isProd,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: sessionMaxAgeMs,
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
        if (appEnv === "staging") {
          const existing = await prisma.user.findUnique({ where: { id: profile.id } });
          if (!existing) {
            return done(null, false, { message: "staging_login_disabled" });
          }
        }
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

const isTestEnv = appEnv === "staging" || appEnv === "development";
const requireTestEnv: RequestHandler = (_req, res, next) => {
  if (!isProd && isTestEnv) {
    return next();
  }
  return res.status(403).json({ error: "Test utilities are disabled in this environment" });
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
const getContentAvailability = async () => {
  const contentDays = await getContentDaySet();
  let maxContiguousContentDay = 0;
  for (let day = 1; day <= MAX_DAY; day++) {
    if (contentDays.has(day)) {
      maxContiguousContentDay = day;
    } else {
      break;
    }
  }
  return { contentDays, contentDayCount: contentDays.size, maxContiguousContentDay };
};

const ensureAppState = async () =>
  prisma.appState.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, unlockedDay: 0 },
  });

type ProgressScope = "default" | "preview";
const progressStoreKey = (scope: ProgressScope) => (scope === "preview" ? "previewPuzzleProgress" : "puzzleProgress");
const buildProgressKey = (day: number, scope: ProgressScope, locale?: Locale, mode?: Mode) =>
  scope === "preview" ? `${day}:${locale ?? "en"}:${mode ?? "NORMAL"}` : String(day);

const getSessionPuzzleProgress = (req: Request, key: string, scope: ProgressScope) => {
  const storeKey = progressStoreKey(scope);
  const store = (req.session as SessionWithVersion | undefined)?.[storeKey] ?? {};
  return new Set(store[key] ?? []);
};

const setSessionPuzzleProgress = (req: Request, key: string, ids: Set<string>, scope: ProgressScope) => {
  const storeKey = progressStoreKey(scope);
  const sess = req.session as SessionWithVersion;
  if (!sess[storeKey]) {
    sess[storeKey] = {};
  }
  (sess[storeKey] as Record<string, string[]>)[key] = Array.from(ids);
};

const clearSessionPuzzleProgress = (req: Request, key: string, scope: ProgressScope) => {
  const storeKey = progressStoreKey(scope);
  const sess = req.session as SessionWithVersion | undefined;
  if (sess?.[storeKey]) {
    delete (sess[storeKey] as Record<string, string[]>)[key];
  }
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

const ensureMemoryAnswer = (value: unknown) => {
  if (!Array.isArray(value)) {
    throw new Error("Invalid memory answer format");
  }
  return value.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error("Invalid memory answer format");
    }
    const { a, b, first, second } = entry as { a?: unknown; b?: unknown; first?: unknown; second?: unknown };
    const left = normalizeAnswerId(a ?? first, "Answer must include a card id for a/first");
    const right = normalizeAnswerId(b ?? second, "Answer must include a card id for b/second");
    if (left === right) throw new Error("A pair must contain two different cards");
    return { a: left, b: right };
  });
};

const ensurePairItemsAnswer = (value: unknown) => {
  if (!Array.isArray(value)) {
    throw new Error("Invalid pairing answer format");
  }
  return value.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error("Invalid pairing answer format");
    }
    const { left, right } = entry as { left?: unknown; right?: unknown };
    const leftId = normalizeAnswerId(left, "Answer must include a left id");
    const rightId = normalizeAnswerId(right, "Answer must include a right id");
    if (leftId === rightId) {
      throw new Error("A pair must contain two different items");
    }
    return { left: leftId, right: rightId };
  });
};

const mapTokenId = (token: string, tokenMap: Map<string, string>, allowRaw = false) => {
  if (typeof token !== "string") {
    throw new Error("Invalid id token");
  }
  const mapped = tokenMap.get(token);
  if (mapped) return mapped;
  if (allowRaw) return token;
  throw new Error("Unknown id token");
};

const translateAnswerTokens = (
  block: Extract<DayBlock, { kind: "puzzle" }>,
  answer: unknown,
  tokenMap: Map<string, string>,
) => {
  switch (block.type) {
    case "placeholder": {
      throw new Error("This puzzle cannot accept answers");
    }
    case "pair-items": {
      if (!Array.isArray(answer)) throw new Error("Invalid answer");
      return answer.map((entry) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new Error("Invalid answer");
        const { left, right } = entry as { left?: unknown; right?: unknown };
        return {
          left: mapTokenId(String(left ?? ""), tokenMap, false),
          right: mapTokenId(String(right ?? ""), tokenMap, false),
        };
      });
    }
    case "single-choice": {
      if (typeof answer !== "string") throw new Error("Invalid answer");
      return mapTokenId(answer, tokenMap, false);
    }
    case "multi-choice": {
      if (!Array.isArray(answer)) throw new Error("Invalid answer");
      return answer.map((entry) => mapTokenId(String(entry), tokenMap, false));
    }
    case "select-items": {
      if (!Array.isArray(answer)) throw new Error("Invalid answer");
      return answer.map((entry) => mapTokenId(String(entry), tokenMap, false));
    }
    case "memory": {
      if (!Array.isArray(answer)) throw new Error("Invalid answer");
      return answer.map((pair) => {
        if (!pair || typeof pair !== "object" || Array.isArray(pair)) throw new Error("Invalid answer");
        const { a, b, first, second } = pair as { a?: unknown; b?: unknown; first?: unknown; second?: unknown };
        return {
          a: mapTokenId(String(a ?? first ?? ""), tokenMap, false),
          b: mapTokenId(String(b ?? second ?? ""), tokenMap, false),
        };
      });
    }
    case "drag-sockets": {
      if (!Array.isArray(answer)) throw new Error("Invalid answer");
      return answer.map((entry) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new Error("Invalid answer");
        const { socketId, itemId, listId } = entry as { socketId?: unknown; itemId?: unknown; listId?: unknown };
        return {
          ...(socketId ? { socketId: mapTokenId(String(socketId), tokenMap, false) } : {}),
          ...(itemId ? { itemId: mapTokenId(String(itemId), tokenMap, false) } : {}),
          ...(listId ? { listId: mapTokenId(String(listId), tokenMap, false) } : {}),
        };
      });
    }
    case "text":
    default:
      return answer;
  }
};

const redactSolutions = (content: DayContent): DayContent => {
  const blocks = content.blocks.map((block) => {
    if (block.kind !== "puzzle") return block;
    if (block.solved) return block;
    return { ...block, solution: undefined };
  });
  return { ...content, blocks };
};

const buildMemoryPairMap = (solution: unknown) => {
  if (!Array.isArray(solution)) {
    throw new Error("Memory puzzle misconfigured");
  }
  const pairKey = new Map<string, string>();
  (solution as Array<{ a?: string; b?: string }>).forEach((entry, idx) => {
    const key = `pair-${idx}`;
    const a = String(entry?.a ?? "");
    const b = String(entry?.b ?? "");
    if (a) pairKey.set(a, key);
    if (b) pairKey.set(b, key);
  });
  return pairKey;
};

const buildPairItemsMap = (solution: unknown) => {
  if (!Array.isArray(solution)) {
    throw new Error("Pair-items puzzle misconfigured");
  }
  const map = new Map<string, string>();
  (solution as Array<{ left?: string; right?: string }>).forEach((entry) => {
    const left = String(entry?.left ?? "");
    const right = String(entry?.right ?? "");
    if (left) map.set(left, right);
  });
  return map;
};

const ensureGridPathAnswer = (value: unknown) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid grid path answer format");
  }
  const { path, startColumn, goalColumn } = value as { path?: unknown; startColumn?: unknown; goalColumn?: unknown };
  if (!Array.isArray(path) || path.length === 0) {
    throw new Error("Path is required");
  }

  const normalizedPath = path.map((entry, idx) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error("Invalid path entry");
    }
    const { x, y } = entry as { x?: unknown; y?: unknown };
    const coordX = Number(x);
    const coordY = Number(y);
    if (!Number.isInteger(coordX) || !Number.isInteger(coordY)) {
      throw new Error(`Path entry ${idx + 1} must use integer coordinates`);
    }
    return { x: coordX, y: coordY };
  });

  const normalizedStart =
    startColumn === undefined ? undefined : Number.isInteger(Number(startColumn)) ? Number(startColumn) : undefined;
  const normalizedGoal =
    goalColumn === undefined ? undefined : Number.isInteger(Number(goalColumn)) ? Number(goalColumn) : undefined;

  if (startColumn !== undefined && normalizedStart === undefined) {
    throw new Error("startColumn must be an integer");
  }
  if (goalColumn !== undefined && normalizedGoal === undefined) {
    throw new Error("goalColumn must be an integer");
  }

  return {
    path: normalizedPath,
    ...(normalizedStart !== undefined ? { startColumn: normalizedStart } : {}),
    ...(normalizedGoal !== undefined ? { goalColumn: normalizedGoal } : {}),
  };
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
        ...(block.leftOptions
          ? {
              leftOptions: block.leftOptions.map((opt) => ({
                ...opt,
                ...(opt.label ? { label: applyCreatureSwapText(opt.label, locale, enabled) } : {}),
              })),
            }
          : {}),
        ...(block.rightOptions
          ? {
              rightOptions: block.rightOptions.map((opt) => ({
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
    case "placeholder": {
      throw new Error("This puzzle is a placeholder and can only be solved via admin override");
    }
    case "pair-items": {
      const pairs = ensurePairItemsAnswer(answer);
      const leftOptions = block.leftOptions ?? [];
      const rightOptions = block.rightOptions ?? [];
      if (!leftOptions.length || !rightOptions.length) {
        throw new Error("Puzzle is misconfigured");
      }
      const leftIds = new Set(leftOptions.map((opt) => opt.id));
      const rightIds = new Set(rightOptions.map((opt) => opt.id));
      const seenLeft = new Set<string>();
      const seenRight = new Set<string>();
      pairs.forEach(({ left, right }) => {
        if (!leftIds.has(left)) throw new Error("Unknown left item");
        if (!rightIds.has(right)) throw new Error("Unknown right item");
        if (seenLeft.has(left)) throw new Error("Each left item can only be used once");
        if (seenRight.has(right)) throw new Error("Each right item can only be used once");
        seenLeft.add(left);
        seenRight.add(right);
      });
      const expectedPairs = Array.isArray(block.solution)
        ? (block.solution as Array<{ left?: string; right?: string }>)
        : [];
      if (!expectedPairs.length) {
        throw new Error("Puzzle is misconfigured");
      }
      const expectedMap = new Map<string, string>();
      expectedPairs.forEach((entry) => {
        const left = normalizeAnswerId(entry.left, "Solution pairs must have a left id");
        const right = normalizeAnswerId(entry.right, "Solution pairs must have a right id");
        if (expectedMap.has(left)) {
          throw new Error("Puzzle is misconfigured");
        }
        expectedMap.set(left, right);
      });
      if (expectedMap.size !== leftIds.size || expectedMap.size !== rightIds.size) {
        throw new Error("Puzzle is misconfigured");
      }
      if (pairs.length !== expectedMap.size) return false;
      return pairs.every((pair) => expectedMap.get(pair.left) === pair.right);
    }
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
      const solution = block.solution as string[];
      if (block.ordered) {
        if (choices.length !== solution.length) return false;
        return choices.every((choice, idx) => choice === solution[idx]);
      }
      const expected = new Set(solution);
      return uniqueChoices.size === expected.size && choices.every((choice) => expected.has(choice));
    }
    case "select-items": {
      const selections = ensureStringArrayAnswer(answer, "Answer must list selected items");
      if (selections.length === 0) throw new Error("Select at least one item");
      const items = block.items ?? [];
      if (!items.length) {
        throw new Error("Puzzle is misconfigured");
      }
      const itemIds = new Set(items.map((item) => item.id));
      const uniqueSelections = new Set<string>();
      selections.forEach((id) => {
        if (!itemIds.has(id)) throw new Error("Unknown item");
        if (uniqueSelections.has(id)) throw new Error("Duplicate selections are not allowed");
        uniqueSelections.add(id);
      });
      const rawSolutionItems: unknown[] =
        Array.isArray(block.solution)
          ? block.solution
          : block.solution && typeof block.solution === "object" && "items" in (block.solution as Record<string, unknown>)
            ? ((block.solution as { items?: unknown }).items as unknown[] | undefined) ?? []
            : [];
      const solutionItems = rawSolutionItems.map((entry) => normalizeAnswerId(entry, "Solution entries must be strings"));
      if (!solutionItems.length) {
        throw new Error("Puzzle is misconfigured");
      }
      solutionItems.forEach((id) => {
        if (!itemIds.has(id)) {
          throw new Error("Puzzle is misconfigured");
        }
      });
      const solutionSet = new Set(solutionItems);
      const required = Math.min(
        solutionSet.size,
        Math.max(
          1,
          typeof block.requiredSelections === "number" && Number.isFinite(block.requiredSelections)
            ? Math.floor(block.requiredSelections)
            : solutionSet.size,
        ),
      );
      let correctCount = 0;
      for (const id of uniqueSelections) {
        if (!solutionSet.has(id)) {
          return false; // any selection not in solution invalidates the answer
        }
        correctCount += 1;
      }
      return correctCount >= required;
    }
    case "memory": {
      const pairs = ensureMemoryAnswer(answer);
      const cards = block.cards ?? [];
      if (!cards.length) {
        throw new Error("Puzzle is misconfigured");
      }
      const cardIds = new Set(cards.map((card) => card.id));
      const seenCards = new Set<string>();
      const providedPairs = new Set<string>();
      pairs.forEach(({ a, b }) => {
        if (!cardIds.has(a) || !cardIds.has(b)) {
          throw new Error("Unknown card");
        }
        if (seenCards.has(a) || seenCards.has(b)) {
          throw new Error("Each card can only be matched once");
        }
        seenCards.add(a);
        seenCards.add(b);
        const canonical = [a, b].sort().join("|");
        providedPairs.add(canonical);
      });
      const expectedPairs =
        Array.isArray(block.solution) && block.solution.length > 0
          ? (block.solution as Array<{ a?: string; b?: string }>)
          : [];
      if (!expectedPairs.length) {
        throw new Error("Puzzle is misconfigured");
      }
      const expectedSet = new Set(
        expectedPairs.map((entry) => {
          const a = normalizeAnswerId(entry.a, "Solution pairs must have a card id");
          const b = normalizeAnswerId(entry.b, "Solution pairs must have a card id");
          return [a, b].sort().join("|");
        }),
      );
      return (
        seenCards.size === cardIds.size &&
        providedPairs.size === expectedSet.size &&
        Array.from(expectedSet).every((id) => providedPairs.has(id))
      );
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
    case "grid-path": {
      const { path, startColumn, goalColumn } = ensureGridPathAnswer(answer);
      const grid = block.grid ?? { width: 9, height: 9 };
      if (!grid.width || !grid.height) {
        throw new Error("Puzzle is misconfigured");
      }

      const boundsChecked = path.map((coord, idx) => {
        if (coord.x < 0 || coord.x >= grid.width || coord.y < 0 || coord.y >= grid.height) {
          throw new Error(`Path entry ${idx + 1} is out of bounds`);
        }
        return coord;
      });

      if (!boundsChecked.length) {
        throw new Error("Path is required");
      }
      if (boundsChecked[0]?.y !== 0) {
        throw new Error("Path must start on the top row");
      }
      if (startColumn !== undefined && boundsChecked[0]?.x !== startColumn) {
        throw new Error("Path must start in the chosen start column");
      }

      const visited = new Set<string>();
      boundsChecked.forEach(({ x, y }) => {
        const key = `${x}:${y}`;
        if (visited.has(key)) {
          throw new Error("Cells cannot be visited twice");
        }
        visited.add(key);
      });

      boundsChecked.forEach((coord, idx) => {
        if (idx === 0) return;
        const prev = boundsChecked[idx - 1]!;
        const dx = Math.abs(coord.x - prev.x);
        const dy = Math.abs(coord.y - prev.y);
        if (dx + dy !== 1) {
          throw new Error("Moves must be orthogonal steps");
        }
      });

      const last = boundsChecked[boundsChecked.length - 1];
      if (!last || last.y !== grid.height - 1) {
        throw new Error("Path must end on the bottom row");
      }
      if (goalColumn !== undefined && last.x !== goalColumn) {
        throw new Error("Path must reach the chosen goal column");
      }

      const solution = (block.solution ?? {}) as {
        path?: Array<{ x?: number; y?: number }>;
        startColumn?: number;
        goalColumn?: number;
      };
      const solutionPath = Array.isArray(solution.path)
        ? solution.path.map((entry, idx) => {
            const x = Number(entry?.x);
            const y = Number(entry?.y);
            if (!Number.isInteger(x) || !Number.isInteger(y)) {
              throw new Error(`Puzzle is misconfigured at solution entry ${idx + 1}`);
            }
            return { x, y };
          })
        : [];
      if (!solutionPath.length) {
        throw new Error("Puzzle is misconfigured");
      }

      const matches =
        solutionPath.length === boundsChecked.length &&
        solutionPath.every((step, idx) => step.x === boundsChecked[idx]?.x && step.y === boundsChecked[idx]?.y);

      return matches;
    }
    default:
      throw new Error("Unsupported puzzle type for answer evaluation");
  }
};

app.get("/auth/discord", passport.authenticate("discord"));

app.get(
  "/auth/discord/callback",
  (req, res, next) => {
    passport.authenticate("discord", (err: unknown, user: PrismaUser | false, info?: { message?: string }) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        if (info?.message === "staging_login_disabled") {
          return res.redirect(`${FRONTEND_ORIGIN}?auth=staging_login_disabled`);
        }
        return res.redirect(`${FRONTEND_ORIGIN}?auth=failed`);
      }
      return req.logIn(user, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }
        storeSessionVersion(req, user);
        return res.redirect(`${FRONTEND_ORIGIN}/calendar?auth=success`);
      });
    })(req, res, next);
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
  return res.json({
    ...user,
    mode: normalizeModeValue(user.mode),
    appEnv,
    isProduction: isProd,
  });
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

app.get("/api/inventory", requireAuth, requireIntroComplete, async (req, res, next) => {
  try {
    const user = req.user as PrismaUser;
    const isAdminOverride = Boolean(
      (user?.isAdmin || user?.isSuperAdmin) &&
        (req.query.override === "1" || req.query.override === "true" || req.query.override === "yes"),
    );
    const requestedDay = Number(req.query.day);
    const fallbackDay = user.lastSolvedDay ?? 0;
    const snapshotDay = isAdminOverride && Number.isInteger(requestedDay) && requestedDay > 0 ? requestedDay : fallbackDay;
    if (!snapshotDay || snapshotDay < 1) {
      return res.json({ day: 0, items: [] });
    }

    const locale = normalizeLocale(getUserLocale(user));
    const funSwap = Boolean(user?.creatureSwap);
    const inventory = await loadInventory(locale);
    const snapshot = await loadDayInventorySnapshot(snapshotDay);
    if (!snapshot.exists) {
      return res.json({ day: snapshotDay, items: [] });
    }

    const items = snapshot.ids
      .map((id) => inventory.get(id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .map((item) => ({
        ...item,
        title: applyCreatureSwapText(item.title, locale, funSwap),
        ...(item.description ? { description: applyCreatureSwapText(item.description, locale, funSwap) } : {}),
        image: item.image ? `/content-asset/${getAssetToken(item.image)}` : "",
      }));

    const tagCatalog = await loadInventoryTags(locale);
    const usedTags = new Set<string>();
    items.forEach((item) => (item.tags ?? []).forEach((tag) => usedTags.add(tag)));
    const ordered = tagCatalog.list.filter((tag) => usedTags.has(tag.id));
    const fallback = Array.from(usedTags)
      .filter((id) => !tagCatalog.map.has(id))
      .map((id) => ({ id, title: id }));
    const tagList = ordered.length > 0 ? [...ordered, ...fallback] : fallback;

    return res.json({ day: snapshotDay, items, tags: tagList });
  } catch (error) {
    next(error);
  }
});

app.get("/api/intro", requireAuth, async (req, res, next) => {
  try {
    const requestedLocale =
      typeof req.query.locale === "string" && (req.query.locale === "en" || req.query.locale === "de")
        ? normalizeLocale(req.query.locale)
        : null;
    const locale = requestedLocale ?? normalizeLocale(getUserLocale(req.user as PrismaUser));
    const funSwap = Boolean((req.user as PrismaUser)?.creatureSwap);
    const content = await loadIntro(locale);
    return res.json({
      title: applyCreatureSwapText(content.title, locale, funSwap),
      body: applyCreatureSwapText(maskHtmlAssets(content.body), locale, funSwap),
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

app.get("/api/epilogue", requireAuth, requireIntroComplete, async (req, res, next) => {
  try {
    const locale = normalizeLocale(getUserLocale(req.user as PrismaUser));
    const isAdmin = Boolean(req.user?.isAdmin || req.user?.isSuperAdmin);
    const lastSolved = req.user?.lastSolvedDay ?? 0;
    if (!isAdmin && lastSolved < MAX_DAY) {
      return res.status(403).json({ error: "Epilogue not unlocked yet" });
    }
    const funSwap = Boolean((req.user as PrismaUser)?.creatureSwap);
    const content = await loadEpilogue(locale);
    return res.json({
      title: applyCreatureSwapText(content.title, locale, funSwap),
      body: applyCreatureSwapText(maskHtmlAssets(content.body), locale, funSwap),
    });
  } catch (error) {
    if (error instanceof EpilogueNotFoundError) {
      return res.status(404).json({ error: "Epilogue not found" });
    }
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
    const resetPreview =
      isAdminOverride &&
      (req.query.resetPreview === "1" || req.query.resetPreview === "true" || req.query.resetPreview === "yes");

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

    const sessionScope: ProgressScope = isAdminOverride ? "preview" : "default";
    const progressKey = buildProgressKey(day, sessionScope, locale, mode);
    if (isAdminOverride && resetPreview) {
      clearSessionPuzzleProgress(req, progressKey, sessionScope);
    }
    const sessionSolved = getSessionPuzzleProgress(req, progressKey, sessionScope);
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

    const redacted = redactSolutions(content);
    const tokenized = tokenizeDayContent(redacted, { day, locale, mode });

    return res.json({
      day,
      title: tokenized.content.title,
      blocks: tokenized.content.blocks,
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

app.post("/api/days/:day/memory/check", requireAuth, requireIntroComplete, async (req, res, next) => {
  const day = Number(req.params.day);
  if (!Number.isInteger(day) || day < 1 || day > MAX_DAY) {
    return res.status(400).json({ error: "Day must be between 1 and 24" });
  }
  const { puzzleId, cards } = req.body as { puzzleId?: string; cards?: unknown };
  if (!puzzleId || !Array.isArray(cards) || cards.length !== 2) {
    return res.status(400).json({ error: "Invalid payload" });
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
    if (!available) {
      return res.status(400).json({ error: "This day is not available yet." });
    }
    if (!orderAllowed) {
      return res.status(400).json({ error: "Solve previous days first." });
    }

    const requestedLocale =
      typeof req.query.locale === "string" && (req.query.locale === "en" || req.query.locale === "de")
        ? normalizeLocale(req.query.locale)
        : null;
    const requestedMode = typeof req.query.mode === "string" ? normalizeModeValue(req.query.mode) : null;
    const locale = isAdminOverride && requestedLocale ? requestedLocale : normalizeLocale(getUserLocale(req.user as PrismaUser));
    const mode = isAdminOverride && requestedMode ? requestedMode : getUserMode(req.user as PrismaUser);

    const sessionScope: ProgressScope = isAdminOverride ? "preview" : "default";
    const progressKey = buildProgressKey(day, sessionScope, locale, mode);
    const sessionSolved = getSessionPuzzleProgress(req, progressKey, sessionScope);
    const content = await loadDayContent(day, locale, mode, sessionSolved, false);
    const tokenized = tokenizeDayContent(content, { day, locale, mode });

    const resolvedPuzzleId = tokenized.tokenToId.get(String(puzzleId));
    const puzzleBlock = content.blocks.find(
      (block): block is Extract<DayBlock, { kind: "puzzle" }> =>
        block.kind === "puzzle" && block.id === resolvedPuzzleId,
    );
    if (!puzzleBlock || puzzleBlock.type !== "memory") {
      return res.status(400).json({ error: "Puzzle not found or not a memory puzzle" });
    }
    const pairMap = buildMemoryPairMap(puzzleBlock.solution);
    const [firstToken, secondToken] = cards as [string, string];
    const first = tokenized.tokenToId.get(String(firstToken));
    const second = tokenized.tokenToId.get(String(secondToken));
    if (!first || !second) {
      return res.status(400).json({ error: "Unknown card token" });
    }
    const match = Boolean(pairMap.get(first) && pairMap.get(first) === pairMap.get(second));
    return res.json({ match });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/days/:day/pair-items/check", requireAuth, requireIntroComplete, async (req, res, next) => {
  const day = Number(req.params.day);
  if (!Number.isInteger(day) || day < 1 || day > MAX_DAY) {
    return res.status(400).json({ error: "Day must be between 1 and 24" });
  }
  const { puzzleId, left, right } = req.body as { puzzleId?: string; left?: unknown; right?: unknown };
  if (!puzzleId || typeof left !== "string" || typeof right !== "string") {
    return res.status(400).json({ error: "Invalid payload" });
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
    if (!available) {
      return res.status(400).json({ error: "This day is not available yet." });
    }
    if (!orderAllowed) {
      return res.status(400).json({ error: "Solve previous days first." });
    }

    const requestedLocale =
      typeof req.query.locale === "string" && (req.query.locale === "en" || req.query.locale === "de")
        ? normalizeLocale(req.query.locale)
        : null;
    const requestedMode = typeof req.query.mode === "string" ? normalizeModeValue(req.query.mode) : null;
    const locale = isAdminOverride && requestedLocale ? requestedLocale : normalizeLocale(getUserLocale(req.user as PrismaUser));
    const mode = isAdminOverride && requestedMode ? requestedMode : getUserMode(req.user as PrismaUser);

    const sessionScope: ProgressScope = isAdminOverride ? "preview" : "default";
    const progressKey = buildProgressKey(day, sessionScope, locale, mode);
    const sessionSolved = getSessionPuzzleProgress(req, progressKey, sessionScope);
    const content = await loadDayContent(day, locale, mode, sessionSolved, false);
    const tokenized = tokenizeDayContent(content, { day, locale, mode });

    const resolvedPuzzleId = tokenized.tokenToId.get(String(puzzleId));
    const puzzleBlock = content.blocks.find(
      (block): block is Extract<DayBlock, { kind: "puzzle" }> =>
        block.kind === "puzzle" && block.id === resolvedPuzzleId,
    );
    if (!puzzleBlock || puzzleBlock.type !== "pair-items") {
      return res.status(400).json({ error: "Puzzle not found or not a pair-items puzzle" });
    }
    const leftId = tokenized.tokenToId.get(String(left));
    const rightId = tokenized.tokenToId.get(String(right));
    if (!leftId || !rightId) {
      return res.status(400).json({ error: "Unknown item token" });
    }
    const pairMap = buildPairItemsMap(puzzleBlock.solution);
    const match = pairMap.get(leftId) === rightId;
    return res.json({ match });
  } catch (error) {
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
    const sessionScope: ProgressScope = isAdminOverride ? "preview" : "default";
    const progressKey = buildProgressKey(day, sessionScope, locale, mode);
    const sessionSolved = getSessionPuzzleProgress(req, progressKey, sessionScope);
    const content = await loadDayContent(day, locale, mode, sessionSolved, false);
    const tokenizedContent = tokenizeDayContent(redactSolutions(content), { day, locale, mode });

    if (!puzzleId) {
      return res.status(400).json({ error: "Missing puzzleId" });
    }

    const resolvedPuzzleId = puzzleId ? tokenizedContent.tokenToId.get(puzzleId) ?? null : null;
    const puzzleBlock = content.blocks.find(
      (block): block is Extract<DayBlock, { kind: "puzzle" }> => block.kind === "puzzle" && block.id === resolvedPuzzleId,
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
      const responseContent = tokenizeDayContent(redactSolutions(swapped), { day, locale, mode });
      return res.json({
        day,
        isSolved: false,
        correct: true,
        message: "Already solved.",
        blocks: responseContent.content.blocks,
      });
    }
    if (submittedType && submittedType !== effectivePuzzle.type) {
      return res.status(400).json({ error: "Answer type does not match puzzle" });
    }

    let correct = false;
    try {
      const translatedAnswer = translateAnswerTokens(effectivePuzzle, answer, tokenizedContent.tokenToId);
      correct = evaluatePuzzleAnswer(effectivePuzzle, translatedAnswer);
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }

    const updatedSolved = new Set(sessionSolved);
    if (correct) {
      updatedSolved.add(effectivePuzzle.id);
      setSessionPuzzleProgress(req, progressKey, updatedSolved, sessionScope);
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

    const responseContent = tokenizeDayContent(
      redactSolutions(applyCreatureSwapToDay(nextContent, locale, funSwap)),
      { day, locale, mode },
    );

    return res.json({
      day,
      isSolved: daySolved,
      correct,
      message: correct ? "Correct! Well done." : "Incorrect answer. Try again.",
      blocks: responseContent.content.blocks,
    });
  } catch (error) {
    if (error instanceof RiddleNotFoundError) {
      return res.status(404).json({ error: "Riddle not found" });
    }
    return next(error);
  }
});

app.post("/api/days/:day/puzzle/:puzzleId/reset", requireAuth, requireIntroComplete, async (req, res, next) => {
  const day = Number(req.params.day);
  const puzzleId = String(req.params.puzzleId);
  if (!Number.isInteger(day) || day < 1 || day > MAX_DAY) {
    return res.status(400).json({ error: "Day must be between 1 and 24" });
  }
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
    if (!isAdminOverride && day > lastSolved + 1) {
      return res.status(400).json({ error: "Solve previous days first." });
    }

    const requestedLocale =
      typeof req.query.locale === "string" && (req.query.locale === "en" || req.query.locale === "de")
        ? normalizeLocale(req.query.locale)
        : null;
    const requestedMode = typeof req.query.mode === "string" ? normalizeModeValue(req.query.mode) : null;

    const locale = isAdminOverride && requestedLocale ? requestedLocale : getUserLocale(req.user as PrismaUser);
    const mode = isAdminOverride && requestedMode ? requestedMode : getUserMode(req.user as PrismaUser);
    const sessionScope: ProgressScope = isAdminOverride ? "preview" : "default";
    const progressKey = buildProgressKey(day, sessionScope, locale, mode);
    const sessionSolved = getSessionPuzzleProgress(req, progressKey, sessionScope);
    const content = await loadDayContent(day, locale, mode, sessionSolved, false);
    const tokenized = tokenizeDayContent(content, { day, locale, mode });
    const resolvedPuzzleId = tokenized.tokenToId.get(puzzleId) ?? puzzleId;
    const puzzleBlock = content.blocks.find(
      (block): block is Extract<DayBlock, { kind: "puzzle" }> => block.kind === "puzzle" && block.id === resolvedPuzzleId,
    );
    if (!puzzleBlock) {
      return res.status(400).json({ error: "Puzzle not found or not available yet" });
    }
    if (puzzleBlock.visible === false) {
      return res.status(400).json({ error: "Puzzle is not available yet" });
    }

    const updatedSolved = new Set(sessionSolved);
    updatedSolved.delete(resolvedPuzzleId);
    setSessionPuzzleProgress(req, progressKey, updatedSolved, sessionScope);

    const nextContent = await loadDayContent(day, locale, mode, updatedSolved, false);
    const solvedCondition = nextContent.solvedCondition ?? { kind: "all" as const };
    const allPuzzleIds = new Set(nextContent.puzzleIds);
    const daySolved = evaluateCondition(solvedCondition, updatedSolved, allPuzzleIds);

    const responseContent = tokenizeDayContent(
      redactSolutions(applyCreatureSwapToDay(nextContent, locale, funSwap)),
      { day, locale, mode },
    );

    return res.json({
      day,
      isSolved: daySolved,
      blocks: responseContent.content.blocks,
    });
  } catch (error) {
    if (error instanceof RiddleNotFoundError) {
      return res.status(404).json({ error: "Riddle not found" });
    }
    return next(error);
  }
});

app.post("/api/days/:day/puzzle/:puzzleId/solve", requireAuth, requireIntroComplete, async (req, res, next) => {
  const day = Number(req.params.day);
  const puzzleId = String(req.params.puzzleId);
  if (!Number.isInteger(day) || day < 1 || day > MAX_DAY) {
    return res.status(400).json({ error: "Day must be between 1 and 24" });
  }
  try {
    const isAdminOverride = Boolean(
      (req.user?.isAdmin || req.user?.isSuperAdmin) &&
        (req.query.override === "1" || req.query.override === "true" || req.query.override === "yes"),
    );
    if (!isAdminOverride) {
      return res.status(403).json({ error: "Admin override required" });
    }
    const funSwap = Boolean(req.user?.creatureSwap);
    const requestedLocale =
      typeof req.query.locale === "string" && (req.query.locale === "en" || req.query.locale === "de")
        ? normalizeLocale(req.query.locale)
        : null;
    const requestedMode = typeof req.query.mode === "string" ? normalizeModeValue(req.query.mode) : null;

    const locale = isAdminOverride && requestedLocale ? requestedLocale : getUserLocale(req.user as PrismaUser);
    const mode = isAdminOverride && requestedMode ? requestedMode : getUserMode(req.user as PrismaUser);
    const sessionScope: ProgressScope = "preview";
    const progressKey = buildProgressKey(day, sessionScope, locale, mode);
    const sessionSolved = getSessionPuzzleProgress(req, progressKey, sessionScope);
    const content = await loadDayContent(day, locale, mode, sessionSolved, false);
    const tokenized = tokenizeDayContent(content, { day, locale, mode });
    const resolvedPuzzleId = tokenized.tokenToId.get(puzzleId) ?? puzzleId;
    const puzzleBlock = content.blocks.find(
      (block): block is Extract<DayBlock, { kind: "puzzle" }> => block.kind === "puzzle" && block.id === resolvedPuzzleId,
    );
    if (!puzzleBlock) {
      return res.status(400).json({ error: "Puzzle not found or not available yet" });
    }
    if (puzzleBlock.visible === false) {
      return res.status(400).json({ error: "Puzzle is not available yet" });
    }

    const updatedSolved = new Set(sessionSolved);
    updatedSolved.add(resolvedPuzzleId);
    setSessionPuzzleProgress(req, progressKey, updatedSolved, sessionScope);

    const nextContent = await loadDayContent(day, locale, mode, updatedSolved, false);
    const solvedCondition = nextContent.solvedCondition ?? { kind: "all" as const };
    const allPuzzleIds = new Set(nextContent.puzzleIds);
    const daySolved = evaluateCondition(solvedCondition, updatedSolved, allPuzzleIds);

    const responseContent = tokenizeDayContent(
      redactSolutions(applyCreatureSwapToDay(nextContent, locale, funSwap)),
      { day, locale, mode },
    );

    return res.json({
      day,
      isSolved: daySolved,
      blocks: responseContent.content.blocks,
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
      veteranUsers,
      normalUsers,
      progressedUsers,
      downgradedUsers,
      recentUsers,
      recentSolves,
      solveHistogram,
      downgradeHistogram,
      unlockedDay,
      contentAvailability,
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
        getContentAvailability(),
      ]);

    const nextDayHasContent =
      unlockedDay < MAX_DAY && unlockedDay < contentAvailability.maxContiguousContentDay;

    res.json({
      diagnostics: {
        uptimeSeconds: Math.round(process.uptime()),
        serverTime: new Date().toISOString(),
        availableDay: unlockedDay,
        maxDay: MAX_DAY,
        contentDayCount: contentAvailability.contentDayCount,
        maxContiguousContentDay: contentAvailability.maxContiguousContentDay,
        nextDayHasContent,
        nodeVersion: process.version,
        superAdminId: superAdminId || null,
      },
      stats: {
        totalUsers,
        adminUsers,
        veteranUsers,
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

app.get("/healthz", (_req, res) => {
  return respondHealth(res, true);
});

app.get("/livez", async (_req, res) => {
  const redis = await checkRedisHealth(appEnv !== "development");
  if (!redis.ok) {
    return respondHealth(res, false, redis.reason);
  }
  return respondHealth(res, true);
});

app.get("/readyz", async (_req, res) => {
  const db = await checkDbHealth();
  if (!db.ok) {
    return respondHealth(res, false, db.reason);
  }
  const [redis, migrations] = await Promise.all([
    checkRedisHealth(appEnv !== "development"),
    checkMigrationsHealth(),
  ]);
  const reasons: string[] = [];
  if (!redis.ok && redis.reason) reasons.push(redis.reason);
  if (!migrations.ok && migrations.reason) reasons.push(migrations.reason);
  if (reasons.length > 0) {
    return respondHealth(res, false, reasons.join("; "));
  }
  return respondHealth(res, true);
});

app.get("/api/admin/version", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const [backend, frontend] = await Promise.all([resolveBackendVersion(), fetchFrontendVersion()]);
    res.json({ backend, frontend, updatedAt: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/content/diagnostics", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const diagnostics = await getContentDiagnostics(MAX_DAY);
    res.json(diagnostics);
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/content/day", requireAuth, requireAdmin, async (req, res, next) => {
  const day = Number(req.query.day ?? req.params.day);
  const localeParam = typeof req.query.locale === "string" ? req.query.locale : undefined;
  const modeParam = typeof req.query.mode === "string" ? req.query.mode : undefined;
  if (!Number.isInteger(day) || day < 1 || day > MAX_DAY) {
    return res.status(400).json({ error: "Day must be between 1 and 24" });
  }
  const locale = normalizeLocale(localeParam);
  const mode = normalizeModeValue(modeParam);
  const maskAssetPath = (value?: string | null) => {
    if (!value) return value;
    if (value.startsWith("/content-asset/")) return value;
    try {
      return `/content-asset/${getAssetToken(value)}`;
    } catch {
      return value;
    }
  };
  const maskBlockAssets = (block: DayBlock): DayBlock => {
    if (block.kind === "story") {
      return {
        ...block,
        html: maskHtmlAssets(block.html ?? ""),
      };
    }
    if (block.kind === "reward" && block.item) {
      const next = { ...block, item: { ...block.item } };
      if (block.item.image) {
        next.item.image = maskAssetPath(block.item.image) ?? block.item.image;
      }
      return next;
    }
    if (block.kind !== "puzzle") return block;
    const next = { ...block };
    if ((block as { html?: string }).html !== undefined) {
      (next as { html?: string }).html = maskHtmlAssets((block as { html?: string }).html ?? "");
    }
    if (block.backgroundImage) next.backgroundImage = maskAssetPath(block.backgroundImage) ?? block.backgroundImage;
    if (block.backgroundVideo) {
      const video = block.backgroundVideo;
      const sources =
        video.sources?.map((source) => ({
          ...source,
          src: maskAssetPath(source.src) ?? source.src,
        })) ?? undefined;
      next.backgroundVideo = {
        ...video,
        ...(video.src ? { src: maskAssetPath(video.src) ?? video.src } : {}),
        ...(sources && sources.length > 0 ? { sources } : {}),
      };
    }
    if (block.backImage) next.backImage = maskAssetPath(block.backImage) ?? block.backImage;
    if (block.hoverBackImage) next.hoverBackImage = maskAssetPath(block.hoverBackImage) ?? block.hoverBackImage;
    if (block.options) {
      next.options = block.options.map((opt) => ({
        ...opt,
        ...(opt.image ? { image: maskAssetPath(opt.image) ?? opt.image } : {}),
      }));
    }
    if (block.items) {
      next.items = block.items.map((itm) => ({
        ...itm,
        ...(itm.image ? { image: maskAssetPath(itm.image) ?? itm.image } : {}),
      }));
    }
    if (block.sockets) {
      next.sockets = block.sockets.map((sock) => ({
        ...sock,
        ...(sock.image ? { image: maskAssetPath(sock.image) ?? sock.image } : {}),
      }));
    }
    if (block.cards) {
      next.cards = block.cards.map((card) => ({
        ...card,
        image: maskAssetPath(card.image) ?? card.image,
      }));
    }
    return next;
  };
  try {
    const content = await loadDayContent(day, locale, mode, new Set(), true);
    const filePath = await resolveDayPath(day, locale, mode);
    res.json({
      day,
      locale,
      mode,
      filePath,
      title: content.title,
      blocks: content.blocks.map(maskBlockAssets),
      puzzleIds: content.puzzleIds,
      solvedCondition: content.solvedCondition,
    });
  } catch (error) {
    if (error instanceof RiddleNotFoundError) {
      return res.status(404).json({ error: "Content not found for this variant" });
    }
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
    if (current >= MAX_DAY) {
      return res.status(400).json({ error: "All days are already unlocked." });
    }
    const { maxContiguousContentDay } = await getContentAvailability();
    const next = Math.min(current + 1, MAX_DAY);
    if (next > maxContiguousContentDay) {
      return res.status(400).json({ error: `Cannot unlock day ${next}: missing content for the next day.` });
    }
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
    const { maxContiguousContentDay } = await getContentAvailability();
    if (unlockedDay > maxContiguousContentDay) {
      const missingDay = Math.min(maxContiguousContentDay + 1, MAX_DAY);
      return res
        .status(400)
        .json({ error: `Cannot unlock day ${unlockedDay}: missing content for day ${missingDay}.` });
    }
    const newVal = await setUnlockedDay(unlockedDay, req.user?.id);
    await logAdminAction("admin:unlock-set", req.user?.id, { from: current, to: newVal });
    res.json({ unlockedDay: newVal });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/test/unlock/increment", requireAuth, requireAdmin, requireTestEnv, async (req, res, next) => {
  try {
    const current = await getUnlockedDay();
    if (current >= MAX_DAY) {
      return res.status(400).json({ error: "All days are already unlocked." });
    }
    const { maxContiguousContentDay } = await getContentAvailability();
    const next = Math.min(current + 1, MAX_DAY);
    if (next > maxContiguousContentDay) {
      return res.status(400).json({ error: `Cannot unlock day ${next}: missing content for the next day.` });
    }
    const newVal = await setUnlockedDay(next, req.user?.id);
    await logAdminAction("admin:test:unlock-next", req.user?.id, { from: current, to: newVal });
    res.json({ unlockedDay: newVal });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/test/unlock/set", requireAuth, requireAdmin, requireTestEnv, async (req, res, next) => {
  try {
    const { unlockedDay } = req.body as { unlockedDay?: number };
    if (!Number.isInteger(unlockedDay) || unlockedDay === undefined || unlockedDay < 0 || unlockedDay > MAX_DAY) {
      return res.status(400).json({ error: "unlockedDay must be between 0 and 24" });
    }
    const current = await getUnlockedDay();
    const { maxContiguousContentDay } = await getContentAvailability();
    if (unlockedDay > maxContiguousContentDay) {
      const missingDay = Math.min(maxContiguousContentDay + 1, MAX_DAY);
      return res
        .status(400)
        .json({ error: `Cannot unlock day ${unlockedDay}: missing content for day ${missingDay}.` });
    }
    const newVal = await setUnlockedDay(unlockedDay, req.user?.id);
    await logAdminAction("admin:test:unlock-set", req.user?.id, { from: current, to: newVal });
    res.json({ unlockedDay: newVal });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/test/unlock/all", requireAuth, requireAdmin, requireTestEnv, async (req, res, next) => {
  try {
    const current = await getUnlockedDay();
    const { maxContiguousContentDay } = await getContentAvailability();
    const newVal = await setUnlockedDay(maxContiguousContentDay, req.user?.id);
    await logAdminAction("admin:test:unlock-all", req.user?.id, { from: current, to: newVal });
    res.json({ unlockedDay: newVal });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/test/users/:id/complete", requireAuth, requireAdmin, requireTestEnv, async (req, res, next) => {
  try {
    const targetId = req.params.id;
    if (!targetId) {
      return res.status(400).json({ error: "User id is required" });
    }
    const { day } = req.body as { day?: number };
    if (!Number.isInteger(day) || day === undefined || day < 0 || day > MAX_DAY) {
      return res.status(400).json({ error: "day must be between 0 and 24" });
    }
    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) {
      return res.status(404).json({ error: "User not found" });
    }
    if (target.isSuperAdmin && !isSuperAdminUser(req.user)) {
      return res.status(403).json({ error: "Cannot modify super admin progress" });
    }

    const solvedAt = day > 0 ? new Date() : null;
    const updated = await prisma.user.update({
      where: { id: target.id },
      data: {
        lastSolvedDay: day,
        lastSolvedAt: solvedAt,
        introCompleted: day > 0 ? true : target.introCompleted,
        stateVersion: { increment: 1 },
      },
    });
    await logAdminAction("admin:test:force-complete", req.user?.id, { targetId: target.id, day });
    res.json({ id: updated.id, lastSolvedDay: updated.lastSolvedDay, lastSolvedAt: updated.lastSolvedAt });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/test/users/:id/eligibility", requireAuth, requireAdmin, requireTestEnv, async (req, res, next) => {
  try {
    const targetId = req.params.id;
    if (!targetId) {
      return res.status(400).json({ error: "User id is required" });
    }
    const { eligible } = req.body as { eligible?: boolean };
    if (typeof eligible !== "boolean") {
      return res.status(400).json({ error: "eligible must be boolean" });
    }
    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) {
      return res.status(404).json({ error: "User not found" });
    }
    if (target.isSuperAdmin && !isSuperAdminUser(req.user)) {
      return res.status(403).json({ error: "Cannot modify super admin eligibility" });
    }

    const lastSolvedDay = eligible ? MAX_DAY : 0;
    const lastSolvedAt = eligible ? new Date() : null;
    const updated = await prisma.user.update({
      where: { id: target.id },
      data: {
        introCompleted: eligible ? true : false,
        lastSolvedDay,
        lastSolvedAt,
        stateVersion: { increment: 1 },
      },
    });
    await logAdminAction("admin:test:set-eligibility", req.user?.id, { targetId: target.id, eligible });
    res.json({
      id: updated.id,
      introCompleted: updated.introCompleted,
      lastSolvedDay: updated.lastSolvedDay,
      lastSolvedAt: updated.lastSolvedAt,
    });
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
  if (err instanceof ContentValidationError) {
    return res.status(400).json({ error: err.message });
  }
  // Basic error handler for now; logs can be added later if needed
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
