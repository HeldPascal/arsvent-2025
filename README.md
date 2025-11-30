## Arsvent 2025

Discord-authenticated Advent calendar for the Ars Necandi community. Users log in with Discord, pick a difficulty (NORMAL or VET), and solve daily riddles in English or German. Backend enforces auth, locale, difficulty rules, and answer validation; frontend is a React SPA with UI/localization matching the provided logo.

## Stack

- Backend: Node.js, Express, TypeScript, Prisma, SQLite (dev), passport-discord sessions
- Frontend: React (Vite + TypeScript), react-router-dom

## Getting started

### Prereqs

- Node 18+ recommended
- `npm` available

### Backend

1) Install deps: `cd backend && npm install`
2) Env: create `backend/.env` with:
```
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
DISCORD_CALLBACK_URL=http://localhost:4000/auth/discord/callback
SESSION_SECRET=dev-secret
SUPER_ADMIN_DISCORD_ID=123456789012345678
DATABASE_URL=file:./dev.db
FRONTEND_ORIGIN=http://localhost:5173
PORT=4000
```
3) Generate DB: `npx prisma migrate dev` (or `prisma generate` if DB already exists)
4) Run dev server: `npm run dev`

### Frontend

1) Install deps: `cd frontend && npm install`
2) Env: create `frontend/.env` with:
```
VITE_BACKEND_URL=http://localhost:4000
```
3) Run dev server: `npm run dev`
4) Open `http://localhost:5173`

## Routes & behavior

- `/` landing: checks `/api/auth/me`, shows login link to backend `/auth/discord` if unauthenticated.
- `/calendar`: grid of days 1–24 with availability/solved state; uses `/api/days`.
- `/day/:day`: shows riddle (HTML from markdown) via `/api/days/:day`, allows answer submit via `/api/days/:day/submit`; when solved, input hides and solved pill remains.
- `/settings`: houses difficulty selector. Rules: can always downgrade VET → NORMAL; upgrading from NORMAL → VET after first choice is blocked by backend and UI.
- Language switcher: toggles EN/DE, calls `/api/user/locale`, updates UI and content.
- Sequential play: riddles must be solved in order. Only the next unlocked day (and past solved days) are playable; backend enforces this using a `lastSolvedDay` field.

## Admin tooling

- Provide a Discord user id via `SUPER_ADMIN_DISCORD_ID` to bootstrap a super admin. They are always treated as admin on login.
- Admin UI lives at `/admin` (no nav link). Accessible only to admins/super admins.
- Features: diagnostics (uptime, runtime, unlocked day), usage stats, recent users/solves, user list with progress counters.
- User actions: change mode, mark a day solved/unsolved, revoke sessions (bumps `sessionVersion` to force logout), delete users/data. Only the super admin can promote/demote admins; super admin account cannot be demoted or deleted.

## Content

Backend reads markdown under `backend/content/dayXX/{normal|vet}.{en|de}.md`. Sample day01 riddles exist; add day02–day24 similarly. Frontmatter requires `title` and `solution`; body is rendered to HTML.

## Design

- Dark theme aligned to `logo-arsvent-2025.png` (favicon and header logo).
- Header elements sized to avoid layout shifts when switching languages.
- Mobile-friendly layouts for header actions and cards.

## Notes / next improvements

- Add riddles for remaining days.
- Add session-expiry handling (401) on the frontend.
- Consider caching parsed riddles on the backend.
- Add API tests (mode rules, submit flows).
