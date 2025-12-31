# AGENTS

## What we’re building
Discord-authenticated Advent calendar web app for Ars Necandi. Users log in with Discord, pick locale (EN/DE) and difficulty (NORMAL/VETERAN), and solve per-day riddles served from markdown. Backend is the source of truth for identity, prefs, and progress; frontend is a React SPA that talks to the backend.

## Tech stack
- Backend: Node.js (Express), TypeScript, Prisma, SQLite (dev) / Postgres later, Discord OAuth (`passport-discord`), sessions (+ Redis when available).
- Frontend: React + Vite + TypeScript + React Router.
- Infra: Dockerfiles per app, GitHub Actions CI.

## Repo layout
- `/backend`: Express app, Prisma schema, content loader, markdown riddles in `content/dayXX/{normal|veteran}.{en|de}.md`.
- `/frontend`: React SPA.
- `.github/workflows/build.yml`: CI (backend + frontend lint/build).

## Commands to use
- Backend: `npm run lint` then `npm run build` (uses `tsc`). Start prod: `node dist/index.js` (Docker does this directly).
- Frontend: `npm run lint` then `npm run build` (`tsc -b && vite build`). `npm run preview` serves the built bundle locally.
- Install per app with `npm ci` in `backend/` or `frontend/`.

## Coding principles
- English for code/comments. Prefer clarity over cleverness.
- Keep MVP working; avoid large refactors. Small, focused modules/functions.
- All stateful actions are validated server-side; frontend is not trusted.
- TypeScript everywhere; keep types explicit.
- Backend owns user identity, locale, difficulty, and per-day progress. Difficulty: allow VETERAN→NORMAL; block NORMAL→VETERAN after first choice.
- Riddles are markdown with frontmatter (`title`, `solution`, etc.); solutions are validated server-side (trim + case-insensitive).
- DB/migrations workflow:
  - Update `prisma/schema.prisma` as needed.
  - Check for structural diffs non-interactively: `cd backend && npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --exit-code`.
  - If diff exists, prompt the user to run `npx prisma migrate dev --name <name>` (don’t run interactively yourself). Prod uses `prisma migrate deploy`.
  - For convention/data-only changes Prisma won’t detect (e.g., value renames), add a custom migration SQL under `prisma/migrations/<timestamp>_<name>/` and ask the user to run `npx prisma migrate dev` or `npx prisma db execute --file ... --schema prisma/schema.prisma`.

## Frontend behavior (current)
- Routes: `/` landing, `/calendar`, `/day/:day`, `/settings`, `/intro`, admin pages.
- Session checks and locale/difficulty persisted via backend. EN/DE UI + riddles; NORMAL/VETERAN modes.
- Drag-sockets puzzle: sockets/items sized via `--socket-size`, tooltips rendered via portal above sockets.

## Backend behavior (current)
- Discord OAuth endpoints (`/auth/discord`, callback, `/auth/logout`, `/api/auth/me`).
- User prefs: `/api/user/locale`, `/api/user/mode` with business rules.
- Days: `/api/days`, `/api/days/:day`, `/api/days/:day/submit` with availability and validation; stores `UserProgress`.
- Sessions include `sessionVersion`/`stateVersion` to invalidate on server changes.

## Constraints
- Keep dependencies minimal; no new major frameworks without approval.
- Don’t trust frontend for validation.
- Maintain existing patterns; avoid breaking changes to auth, sessions, or API contracts.
- Use clear errors (e.g., 401/403/404/400) and JSON responses.

## When adding or changing code
- Always run `npm run lint` and `npm run build` in every app you touch (backend or frontend) before wrapping up.
- Keep content paths/patterns intact for loaders.
- Keep Dockerfiles aligned: they rely on `npm run build` in each app; lint runs in CI.

## Ticket Workflow (File-Based Kanban)

This repository uses a file-based ticket workflow.

### Structure
- `work/backlog/` — planned but not ready
- `work/ready/` — fully specified, ready to implement
- `work/in-progress/` — currently being worked on
- `work/review/` — awaiting review or validation
- `work/done/` — completed and archived

### Rules
- One ticket = one Markdown file.
- Tickets move by being moved between folders.
- Agents must:
  - read the linked spec in `docs/specs/` before implementation,
  - update the ticket file if assumptions or scope change,
  - never skip acceptance criteria.

### Specs vs Tickets
- Specs in `docs/specs/` describe **what** and **why**.
- Tickets in `work/` describe **how and when**.

Agents should not implement features that are not covered by a spec or an explicit ticket.

## Roadmap Backlog

The file `docs/roadmap/backlog.md` is an idea and theme inventory.

Agents must not:
- implement features directly from the backlog
- derive tickets without an explicit spec

Backlog items must first be promoted to a spec in `docs/specs/`.
