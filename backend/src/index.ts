import express from "express";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import session from "express-session";
import type { Session as ExpressSession, SessionData } from "express-session";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import type { Profile as DiscordProfile, StrategyOptions } from "passport-discord";
import type { VerifyCallback } from "passport-oauth2";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import type { User as PrismaUser } from "@prisma/client";
import { loadIntro, loadRiddle, IntroNotFoundError, RiddleNotFoundError } from "./content/loader.js";
import type { Locale, Mode, RiddleContent } from "./content/loader.js";

dotenv.config();

const {
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  DISCORD_CALLBACK_URL,
  SESSION_SECRET = "dev-secret",
  FRONTEND_ORIGIN = "http://localhost:5173",
  SUPER_ADMIN_DISCORD_ID = "",
} = process.env;

if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || !DISCORD_CALLBACK_URL) {
  throw new Error("Missing Discord OAuth environment variables.");
}

const PORT = Number(process.env.PORT) || 3000;
const prisma = new PrismaClient();
const app = express();
const superAdminId = SUPER_ADMIN_DISCORD_ID?.trim() || null;

type SessionWithVersion = ExpressSession & Partial<SessionData> & { sessionVersion?: number };

const isSuperAdminUser = (user?: PrismaUser | null) => Boolean(user?.isSuperAdmin);
const isAdminUser = (user?: PrismaUser | null) => Boolean(user?.isSuperAdmin || user?.isAdmin);

const storeSessionVersion = (req: Request, user: PrismaUser) => {
  if (req.session) {
    (req.session as SessionWithVersion).sessionVersion = user.sessionVersion;
  }
};

const normalizeLocale = (input?: string | null): Locale => {
  if (input && input.toLowerCase().startsWith("de")) return "de";
  return "en";
};

const discordOptions: StrategyOptions = {
  clientID: DISCORD_CLIENT_ID,
  clientSecret: DISCORD_CLIENT_SECRET,
  callbackURL: DISCORD_CALLBACK_URL,
  scope: ["identify"],
};

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
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
    const sessionVersion = (req.session as SessionWithVersion | undefined)?.sessionVersion;
    if (sessionVersion !== req.user.sessionVersion) {
      return req.logout(() => {
        req.session?.destroy(() => {
          res.status(401).json({ error: "Session expired" });
        });
      });
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

const ensureAppState = async () =>
  prisma.appState.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, unlockedDay: 0 },
  });

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
const getUserMode = (user?: PrismaUser): Mode => (user?.mode === "VET" ? "VET" : "NORMAL");

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

const evaluateAnswer = (content: RiddleContent, answer: unknown) => {
  switch (content.type) {
    case "text": {
      const normalizedAnswer = normalizeAnswerId(answer, "Answer must be a string").toLowerCase();
      const normalizedSolution = content.solution.trim().toLowerCase();
      return normalizedAnswer === normalizedSolution;
    }
    case "single-choice": {
      const choice = normalizeAnswerId(answer, "Answer must be a single choice id");
      const validOptions = new Set(content.options.map((opt) => opt.id));
      if (!validOptions.has(choice)) {
        throw new Error("Unknown choice");
      }
      return choice === content.solution;
    }
    case "multi-choice": {
      const choices = ensureStringArrayAnswer(answer, "Answer must be an array of choices");
      if (choices.length === 0) {
        throw new Error("Select at least one option");
      }
      const validOptions = new Set(content.options.map((opt) => opt.id));
      const uniqueChoices = new Set<string>();
      choices.forEach((choice) => {
        if (!validOptions.has(choice)) {
          throw new Error("Unknown choice");
        }
        if (uniqueChoices.has(choice)) {
          throw new Error("Duplicate choices are not allowed");
        }
        uniqueChoices.add(choice);
      });
      const expected = new Set(content.solution);
      return uniqueChoices.size === expected.size && choices.every((choice) => expected.has(choice));
    }
    case "sort": {
      const order = ensureStringArrayAnswer(answer, "Answer must list the options in order");
      const validOptions = new Set(content.options.map((opt) => opt.id));
      if (order.length !== content.options.length) {
        throw new Error("Answer must include all options in an order");
      }
      const seen = new Set<string>();
      order.forEach((entry) => {
        if (!validOptions.has(entry)) {
          throw new Error("Unknown choice");
        }
        if (seen.has(entry)) {
          throw new Error("Each option can only appear once");
        }
        seen.add(entry);
      });
      return order.every((entry, index) => entry === content.solution[index]);
    }
    case "group": {
      if (!answer || typeof answer !== "object" || Array.isArray(answer)) {
        throw new Error("Answer must map groups to option ids");
      }
      const payload = answer as Record<string, unknown>;
      const validGroups = new Set(content.groups.map((g) => g.id));
      const validOptions = new Set(content.options.map((opt) => opt.id));
      const assignments = new Map<string, string>();
      Object.entries(payload).forEach(([groupId, value]) => {
        if (!validGroups.has(groupId)) {
          throw new Error("Unknown group");
        }
        const ids = ensureStringArrayAnswer(value, "Group answers must be arrays of option ids");
        ids.forEach((id) => {
          if (!validOptions.has(id)) {
            throw new Error("Unknown choice");
          }
          if (assignments.has(id)) {
            throw new Error("Each option can only be assigned once");
          }
          assignments.set(id, groupId);
        });
      });
      if (assignments.size !== validOptions.size) {
        throw new Error("All options must be assigned to a group");
      }
      const expectedGroup = new Map<string, string>();
      Object.entries(content.solution).forEach(([groupId, ids]) => {
        ids.forEach((id) => expectedGroup.set(id, groupId));
      });
      return content.options.every((opt) => assignments.get(opt.id) === expectedGroup.get(opt.id));
    }
    default:
      return false;
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
  return res.json(req.user);
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
    if (mode !== "NORMAL" && mode !== "VET") {
      return res.status(400).json({ error: "Invalid mode" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.mode === "NORMAL" && mode === "VET" && (user.lastSolvedDay ?? 0) > 0) {
      return res.status(400).json({ error: "Cannot switch from NORMAL to VET" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        mode,
        stateVersion: { increment: 1 },
        lastDowngradedAt: user.mode === "VET" && mode === "NORMAL" ? new Date() : null,
        lastDowngradedFromDay: user.mode === "VET" && mode === "NORMAL" ? user.lastSolvedDay ?? 0 : 0,
      },
    });

    req.login(updatedUser, (err) => {
      if (err) return next(err);
      storeSessionVersion(req, updatedUser);
      return res.json({ id: updatedUser.id, mode: updatedUser.mode });
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/intro", requireAuth, async (req, res, next) => {
  try {
    const locale = normalizeLocale(getUserLocale(req.user as PrismaUser));
    const content = await loadIntro(locale);
    return res.json({
      title: content.title,
      body: content.body,
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

    const days = Array.from({ length: MAX_DAY }, (_, index) => {
      const day = index + 1;
      return {
        day,
        isAvailable: day <= playLimit,
        isSolved: day <= lastSolved,
      };
    });

    res.json({ days, unlockedDay });
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
    const unlockedDay = await getUnlockedDay();
    const lastSolved = req.user!.lastSolvedDay ?? 0;
    const orderAllowed = day <= lastSolved + 1;
    const available = day <= unlockedDay;

    const locale = normalizeLocale(getUserLocale(req.user as PrismaUser));
    const mode = getUserMode(req.user as PrismaUser);

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

    const content = await loadRiddle(day, locale, mode);

    const response: Record<string, unknown> = {
      day,
      title: content.title,
      body: content.body,
      type: content.type,
      isSolved: day <= lastSolved,
      canPlay: true,
    };

    if ("options" in content) {
      response.options = content.options;
    }
    if ("groups" in content) {
      response.groups = content.groups;
    }
    if ("minSelections" in content) {
      response.minSelections = content.minSelections;
    }

    return res.json(response);
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

  const { answer, type: submittedType } = req.body as { answer?: unknown; type?: string };

  try {
    const unlockedDay = await getUnlockedDay();
    if (day > unlockedDay) {
      return res.status(400).json({ error: "This day is not available yet." });
    }

    const lastSolved = req.user!.lastSolvedDay ?? 0;
    if (day <= lastSolved) {
      return res.json({
        day,
        isSolved: true,
        correct: true,
        message: "Already solved.",
      });
    }
    if (day !== lastSolved + 1) {
      return res.status(400).json({ error: "Solve previous days first." });
    }

    const locale = getUserLocale(req.user as PrismaUser);
    const mode = getUserMode(req.user as PrismaUser);
    const content = await loadRiddle(day, locale, mode);

    if (submittedType && submittedType !== content.type) {
      return res.status(400).json({ error: "Answer type does not match riddle" });
    }

    let correct = false;
    try {
      correct = evaluateAnswer(content, answer);
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }

    if (correct) {
      await prisma.user.update({
        where: { id: req.user!.id },
        data: { lastSolvedDay: day, lastSolvedAt: new Date(), stateVersion: { increment: 1 } },
      });
    }

    return res.json({
      day,
      isSolved: correct ? true : false,
      correct,
      message: correct ? "Correct! Well done." : "Incorrect answer. Try again.",
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
    ] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isAdmin: true } }),
        prisma.user.count({ where: { mode: "VET" } }),
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
      ]);

    res.json({
      diagnostics: {
        uptimeSeconds: Math.round(process.uptime()),
        serverTime: new Date().toISOString(),
        availableDay: unlockedDay,
        maxDay: MAX_DAY,
        nodeVersion: process.version,
        superAdminId: superAdminId || null,
      },
      stats: {
        totalUsers,
        adminUsers,
        vetUsers,
        normalUsers,
        progressedUsers,
        downgradedUsers,
        solveHistogram,
        downgradeHistogram,
      },
      recentUsers,
      recentSolves,
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
      mode: user.mode,
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
    if (mode !== "NORMAL" && mode !== "VET") {
      return res.status(400).json({ error: "Invalid mode" });
    }

    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) {
      return res.status(404).json({ error: "User not found" });
    }
    if (target.isSuperAdmin && !isSuperAdminUser(req.user)) {
      return res.status(403).json({ error: "Cannot modify super admin" });
    }

    const now = new Date();
    const updated = await prisma.user.update({
      where: { id: target.id },
      data: {
        mode,
        stateVersion: { increment: 1 },
        lastDowngradedAt: mode === "VET" ? null : now,
        lastDowngradedFromDay: mode === "VET" ? 0 : target.lastSolvedDay ?? 0,
      },
    });
    await logAdminAction("admin:set-mode", req.user?.id, { targetId: target.id, mode });
    res.json({ id: updated.id, mode: updated.mode });
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
