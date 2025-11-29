import express from "express";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import session from "express-session";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import type { Profile as DiscordProfile, StrategyOptions } from "passport-discord";
import type { VerifyCallback } from "passport-oauth2";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import type { User as PrismaUser } from "@prisma/client";
import { loadRiddle, RiddleNotFoundError } from "./content/loader.ts";
import type { Locale, Mode } from "./content/loader.ts";

dotenv.config();

const {
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  DISCORD_CALLBACK_URL,
  SESSION_SECRET = "dev-secret",
  FRONTEND_ORIGIN = "http://localhost:5173",
} = process.env;

if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || !DISCORD_CALLBACK_URL) {
  throw new Error("Missing Discord OAuth environment variables.");
}

const PORT = Number(process.env.PORT) || 3000;
const prisma = new PrismaClient();
const app = express();

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
        const user = await prisma.user.upsert({
          where: { id: profile.id },
          update: {
            username: profile.username,
            globalName: (profile as { global_name?: string }).global_name ?? null,
            avatar: profile.avatar ?? null,
          },
          create: {
            id: profile.id,
            username: profile.username,
            globalName: (profile as { global_name?: string }).global_name ?? null,
            avatar: profile.avatar ?? null,
            locale: profile.locale ?? "en",
            mode: "NORMAL",
          },
        });
        done(null, user);
      } catch (error) {
        done(error as Error);
      }
    },
  ),
);

const requireAuth: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
};

const MAX_DAY = 24;

const availableThroughToday = () => {
  const today = new Date();
  return Math.min(today.getDate(), MAX_DAY);
};

const isDayAvailable = (day: number) => day >= 1 && day <= availableThroughToday();

const getUserLocale = (user?: PrismaUser): Locale => (user?.locale === "de" ? "de" : "en");
const getUserMode = (user?: PrismaUser): Mode => (user?.mode === "VET" ? "VET" : "NORMAL");

app.get("/auth/discord", passport.authenticate("discord"));

app.get(
  "/auth/discord/callback",
  passport.authenticate("discord", { failureRedirect: `${FRONTEND_ORIGIN}?auth=failed` }),
  (_req, res) => {
    res.redirect(`${FRONTEND_ORIGIN}/calendar`);
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

app.get("/api/auth/me", (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
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
      data: { locale },
    });

    req.login(updatedUser, (err) => {
      if (err) return next(err);
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

    if (user.mode === "NORMAL" && mode === "VET") {
      return res.status(400).json({ error: "Cannot switch from NORMAL to VET" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { mode },
    });

    req.login(updatedUser, (err) => {
      if (err) return next(err);
      return res.json({ id: updatedUser.id, mode: updatedUser.mode });
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/days", requireAuth, async (req, res, next) => {
  try {
    const progress = await prisma.userProgress.findMany({
      where: { userId: req.user!.id },
    });
    const progressByDay = new Map(progress.map((entry) => [entry.day, entry]));
    const limit = availableThroughToday();

    const days = Array.from({ length: MAX_DAY }, (_, index) => {
      const day = index + 1;
      const solved = progressByDay.get(day)?.solved ?? false;
      return {
        day,
        isAvailable: day <= limit,
        isSolved: solved,
      };
    });

    res.json(days);
  } catch (error) {
    next(error);
  }
});

app.get("/api/days/:day", requireAuth, async (req, res, next) => {
  const day = Number(req.params.day);
  if (!Number.isInteger(day) || day < 1 || day > MAX_DAY) {
    return res.status(400).json({ error: "Day must be between 1 and 24" });
  }

  const available = isDayAvailable(day);
  try {
    const progress = await prisma.userProgress.findUnique({
      where: {
        userId_day: {
          userId: req.user!.id,
          day,
        },
      },
    });

    if (!available) {
      return res.json({
        day,
        isSolved: progress?.solved ?? false,
        canPlay: false,
        message: "This day is not available yet.",
      });
    }

    const locale = getUserLocale(req.user as PrismaUser);
    const mode = getUserMode(req.user as PrismaUser);
    const content = await loadRiddle(day, locale, mode);

    return res.json({
      day,
      title: content.title,
      body: content.body,
      isSolved: progress?.solved ?? false,
      canPlay: true,
    });
  } catch (error) {
    if (error instanceof RiddleNotFoundError) {
      return res.status(404).json({ error: "Riddle not found" });
    }
    return next(error);
  }
});

app.post("/api/days/:day/submit", requireAuth, async (req, res, next) => {
  const day = Number(req.params.day);
  if (!Number.isInteger(day) || day < 1 || day > MAX_DAY) {
    return res.status(400).json({ error: "Day must be between 1 and 24" });
  }

  if (!isDayAvailable(day)) {
    return res.status(400).json({ error: "This day is not available yet." });
  }

  const { answer } = req.body as { answer?: string };
  if (typeof answer !== "string") {
    return res.status(400).json({ error: "Answer must be a string" });
  }

  try {
    const locale = getUserLocale(req.user as PrismaUser);
    const mode = getUserMode(req.user as PrismaUser);
    const content = await loadRiddle(day, locale, mode);

    const normalizedAnswer = answer.trim().toLowerCase();
    const normalizedSolution = content.solution.trim().toLowerCase();
    const correct = normalizedAnswer === normalizedSolution;

    const existingProgress = await prisma.userProgress.findUnique({
      where: { userId_day: { userId: req.user!.id, day } },
    });

    if (correct) {
      const solvedAt = new Date();
      await prisma.userProgress.upsert({
        where: { userId_day: { userId: req.user!.id, day } },
        update: { solved: true, solvedAt, hardMode: getUserMode(req.user as PrismaUser) === "VET" },
        create: {
          userId: req.user!.id,
          day,
          solved: true,
          solvedAt,
          hardMode: getUserMode(req.user as PrismaUser) === "VET",
        },
      });
    }

    return res.json({
      day,
      isSolved: correct ? true : existingProgress?.solved ?? false,
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
