# AGENTS

## Project Overview

We are building a Discord-authenticated Advent calendar web app for the Ars Necandi community.

High-level goals:

- Web app (SPA) where users log in with Discord.
- Two languages: English and German, seamless switching.
- Two difficulties: `normal` and `vet`. Chosen at first login, can be downgraded later.
- For now: simple per-day riddle (text-based) with server-side verification.
- Later: more complex “board + inventory” puzzle interactions and Discord bot integration.

## Tech Stack

- Backend:
  - Node.js + Express
  - TypeScript
  - Prisma ORM
  - SQLite in development (later Postgres)
  - Discord OAuth2 (via `passport-discord`)
- Frontend:
  - React SPA (Vite + TypeScript)
- Infrastructure:
  - Docker-based deployment later
  - GitHub for version control

## Repository Structure

- `/backend`
  - `src/` – server source code
  - `prisma/` – Prisma schema & migrations
  - `.env` – backend environment variables (not committed)
  - `content/` – markdown-based riddle definitions
- `/frontend`
  - `src/` – React app
  - `.env` – frontend env vars (not committed)
- `AGENTS.md` – this file, with instructions for coding agents
- `README.md` – project documentation

## Coding Principles

- Language: English for code, comments, and commit messages.
- Keep the MVP small and working. Prefer a simple implementation that we can refactor later over over-engineering.
- Backend is the single source of truth for:
  - user identity
  - user settings (locale, difficulty)
  - per-day progress
- All stateful operations must be validated on the server (no trust in the frontend).
- Write small, focused modules and functions.
- Use TypeScript types consistently.
- Prefer clarity over cleverness.

## Data Model (current MVP)

Prisma schema (simplified):

```prisma
model User {
  id             String        @id @map("discord_id")
  username       String
  globalName     String?
  avatar         String?
  locale         String        @default("en")
  mode           String        @default("NORMAL") // "NORMAL" | "VET"
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  progresses     UserProgress[]
}

model UserProgress {
  id          Int       @id @default(autoincrement())
  user        User      @relation(fields: [userId], references: [id])
  userId      String
  day         Int
  solved      Boolean   @default(false)
  solvedAt    DateTime?
  hardMode    Boolean   @default(false)

  @@unique([userId, day])
}
```

We enforce the difficulty values (`NORMAL` | `VET`) in TypeScript, not as a DB enum.

## Backend Requirements (MVP)

The backend should provide:

### Discord authentication

- `GET /auth/discord`
  - Initiates the Discord OAuth2 login flow.
- `GET /auth/discord/callback`
  - Handles the Discord callback.
  - Creates or updates the user in the database using Prisma.
  - Establishes a session (cookie-based).
- `POST /auth/logout`
  - Logs the user out and destroys the session.
  - Clears the session cookie.

### Auth helper

- Middleware that:
  - Checks whether the request is authenticated (session exists and is valid).
  - Loads the current user from the database.
  - Attaches the user to `req.user`.
- If not authenticated, protected endpoints should return HTTP 401 with a JSON error.

### API endpoints

#### `GET /api/auth/me`

- Returns the current authenticated user.
- Response example:

```json
{
  "id": "123456789012345678",
  "username": "SomeUser",
  "globalName": "Some Display Name",
  "avatar": "avatar_hash_or_url",
  "locale": "en",
  "mode": "NORMAL",
  "createdAt": "2025-11-29T12:00:00.000Z"
}
```

- Returns `401` if the user is not authenticated.

#### `POST /api/user/locale`

- Body: `{ "locale": "en" | "de" }`
- Requires authentication.
- Updates the user’s preferred locale in the database.
- Returns the updated user locale:

```json
{
  "id": "123456789012345678",
  "locale": "de"
}
```

- Returns `400` for invalid locale values.

#### `POST /api/user/mode`

- Body: `{ "mode": "NORMAL" | "VET" }`
- Requires authentication.
- Business rules:
  - If the user has no mode set yet, allow either value.
  - Allow changing from `VET` to `NORMAL`.
  - Do **NOT** allow changing from `NORMAL` to `VET` after the first choice.
- Returns the updated mode:

```json
{
  "id": "123456789012345678",
  "mode": "VET"
}
```

- Returns `400` if the attempted change violates the business rules.

#### `GET /api/days`

- Requires authentication.
- Returns the list of days (1–24) and status for the current user.
- Only days up to "today" (based on server date) should be marked as available.
- Response example:

```json
[
  {
    "day": 1,
    "isAvailable": true,
    "isSolved": true
  },
  {
    "day": 2,
    "isAvailable": true,
    "isSolved": false
  },
  {
    "day": 3,
    "isAvailable": false,
    "isSolved": false
  }
]
```

#### `GET /api/days/:day`

- Requires authentication.
- `:day` is an integer from 1 to 24.
- Returns the riddle metadata and content for that day, based on:
  - the user’s locale (`en` / `de`)
  - the user’s difficulty mode (`NORMAL` / `VET`)
- Response example:

```json
{
  "day": 1,
  "title": "The riddle of day 1",
  "body": "<p>Here goes the riddle text in HTML or markdown.</p>",
  "isSolved": false,
  "canPlay": true
}
```

- If the day is not yet available (future date), `canPlay` should be `false` and optionally a message may be provided.
- If there is no content file for the requested combination (day/locale/mode), return a suitable error (e.g. `404`).

#### `POST /api/days/:day/submit`

- Requires authentication.
- Body: `{ "answer": "..." }`
- Validates the answer on the server using the `solution` from the riddle content’s frontmatter.
- Simple MVP rules:
  - Trim whitespace.
  - Case-insensitive comparison.
- On success:
  - Mark `UserProgress` as solved for the given day.
  - Set `hardMode` based on the user’s current mode (`mode === "VET"`).
  - Set `solvedAt` to the current timestamp.
- Returns updated status and a feedback message, for example:

```json
{
  "day": 1,
  "isSolved": true,
  "correct": true,
  "message": "Correct! Well done."
}
```

- On incorrect answers, do **not** mark as solved, return `correct: false` and a feedback message.

## Content Handling (MVP)

For now, riddles are defined as markdown files in the backend.

Directory structure:

- `backend/content/day01/normal.en.md`
- `backend/content/day01/normal.de.md`
- `backend/content/day01/vet.en.md`
- `backend/content/day01/vet.de.md`
- etc. for day02, day03, ..., day24.

Each file uses frontmatter plus markdown body, for example:

```md
---
title: "The riddle of day 1"
solution: "penguin"
---

Here goes the riddle text in English.
You can use multiple paragraphs, lists, etc.
```

The backend should:

- Load and parse the file for a given `(day, locale, mode)` using:
  - `gray-matter` for frontmatter
  - A markdown parser (e.g. `marked` or similar) to turn the body into HTML (or pass raw markdown through).
- Use the `solution` field from the frontmatter for answer validation.
  - MVP: case-insensitive string comparison with trimming.
  - The logic should be isolated so it can be extended later (e.g. regex, multiple valid answers, etc.).

If the file is missing or invalid:

- Return a clear error from the API (e.g. `404` with `{ "error": "Riddle not found" }`).

## Frontend Requirements (MVP)

The frontend SPA should:

### Basic routes

- `/`
  - Landing page.
  - Calls `/api/auth/me` to check if the user is logged in.
  - If not logged in, show a "Login with Discord" button that links to the backend `/auth/discord` endpoint.
  - If logged in, redirect or link to `/calendar`.

- `/calendar`
  - Calls `/api/days` to get the list of days and their status.
  - Shows a 1–24 grid (or similar layout).
  - Indicates:
    - which days are available
    - which days are solved
  - Clicking an available day navigates to `/day/:day`.

- `/day/:day`
  - Calls `/api/days/:day` to get the riddle content.
  - Displays:
    - Riddle title
    - Riddle body (HTML or markdown)
  - Shows an input field for the answer and a submit button.
  - On submit:
    - Sends `POST /api/days/:day/submit` with `{ answer }`.
    - Shows visual feedback for correct/incorrect answers (e.g. message, color change).
    - If solved, the UI should reflect that state.

### Language switcher

- A simple `LanguageSwitcher` component that:
  - Toggles between `en` and `de`.
  - Calls `POST /api/user/locale` with the new locale.
  - Refetches data from the APIs so that the UI and riddle content show the correct language.

### State handling

- The SPA should store the current user (from `/api/auth/me`) in state.
- After login or logout, the frontend should refresh the state accordingly.

## Tasks for Coding Agents (initial)

### Task 1 – Backend bootstrap

Implement `backend/src/index.ts` with:

- Express app.
- CORS configured to allow the frontend origin (e.g. `http://localhost:5173`) with credentials.
- `cookie-parser`.
- `express-session` configured for development (non-secure cookie, `sameSite: "lax"`).
- `passport` with `passport-discord` strategy using environment variables:
  - `DISCORD_CLIENT_ID`
  - `DISCORD_CLIENT_SECRET`
  - `DISCORD_CALLBACK_URL`
- Routes:
  - `GET /auth/discord`
  - `GET /auth/discord/callback`
  - `POST /auth/logout`
  - `GET /api/auth/me`
- Session-based auth middleware.

Ensure TypeScript build & dev scripts in `backend/package.json`:

- `"dev": "nodemon --watch src --exec ts-node src/index.ts"`
- `"build": "tsc"`
- `"start": "node dist/index.js"`

### Task 2 – Prisma integration

- Integrate Prisma client (`@prisma/client`) into the backend.
- Implement user creation/update in the Discord strategy verify callback:
  - `upsert` on `User` using the Discord user id.
- Implement `GET /api/auth/me` using Prisma to read the user from the DB.
- Implement `POST /api/user/locale` and `POST /api/user/mode` with the business rules described above.

### Task 3 – Content loading & per-day API

- Add a content loader module in the backend, e.g. `src/content/loader.ts`, that:
  - Given `(day: number, locale: "en" | "de", mode: "NORMAL" | "VET")`, constructs the file path.
  - Loads and parses the markdown file using `gray-matter`.
  - Returns an object with:
    - `title: string`
    - `body: string` (HTML or markdown)
    - `solution: string`
- Implement:
  - `GET /api/days`
    - Computes `isAvailable` based on the current date.
    - Reads `UserProgress` to determine `isSolved`.
  - `GET /api/days/:day`
    - Uses the loader to fetch riddle metadata and content.
    - Returns `isSolved` and `canPlay`.
  - `POST /api/days/:day/submit`
    - Validates the day is available.
    - Loads riddle solution.
    - Compares the submitted answer.
    - Updates `UserProgress` if correct.

### Task 4 – Frontend SPA

- Bootstrap React SPA with Vite + TypeScript in `/frontend`.
- Implement pages/components:
  - `Home`:
    - Calls `/api/auth/me` on mount.
    - If not authenticated, shows login link to `/auth/discord`.
    - If authenticated, shows link/button to `/calendar`.
  - `Calendar`:
    - Calls `/api/days`.
    - Renders a grid/list of days with available/solved states.
  - `DayView`:
    - Calls `/api/days/:day`.
    - Renders the riddle.
    - Handles answer submission and feedback display.
  - `LanguageSwitcher`:
    - Calls `POST /api/user/locale` and then refetches.
- All API calls should use `fetch` with `credentials: "include"` so that cookies are sent.

## Constraints

- Do not introduce additional major frameworks unless necessary.
- Keep dependencies minimal and focused on the tech stack defined above.
- Prefer clarity over cleverness.
- All public APIs and functions should have clear TypeScript types.
- Keep the MVP working at all times; avoid big, breaking refactors in a single step.
