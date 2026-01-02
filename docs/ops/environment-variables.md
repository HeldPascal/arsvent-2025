# Environment Variables

This document lists all environment variables referenced in code, ops scripts, or docs.
Defaults come from the codebase; values marked "required" must be set explicitly.

## Backend (runtime)

| Variable | Purpose | Default | Possible values / notes |
| --- | --- | --- | --- |
| `DISCORD_CLIENT_ID` | Discord OAuth client id. | Required | From the Discord application. |
| `DISCORD_CLIENT_SECRET` | Discord OAuth client secret. | Required | From the Discord application. |
| `DISCORD_CALLBACK_URL` | OAuth callback URL for Discord. | Required | Must match the Discord app; e.g. `http://localhost:4000/auth/discord/callback`. |
| `SESSION_SECRET` | Session cookie signing secret (also used as fallback for content tokens). | `dev-secret` | Set a strong random value in production. |
| `SESSION_MAX_AGE_MS` | Session cookie max age in milliseconds. | 14 days | Numeric milliseconds; empty or invalid falls back to 14 days. |
| `FRONTEND_ORIGIN` | CORS origin + login redirect base. | `http://localhost:5173` | Must match the frontend origin (scheme + host + port). |
| `REDIS_URL` | Redis connection URL for sessions. | `redis://localhost:6379` | If Redis is unavailable, backend falls back to in-memory sessions (not for production). |
| `SUPER_ADMIN_DISCORD_ID` | Discord user id that is always treated as super admin. | Empty | Optional; if set, the matching user is elevated on login. |
| `PORT` | HTTP port the backend listens on. | `3000` | Common values: `4000` (prod), `3000` (fallback). |
| `NODE_ENV` | Enables production behavior (secure cookies, trust proxy). | Empty | `production` or `development`. |
| `CONTENT_TOKEN_SECRET` | HMAC secret for content asset tokens. | Uses `SESSION_SECRET` | Required if `SESSION_SECRET` is unset. Keep stable across restarts. |
| `DATABASE_URL` | Prisma datasource connection string. | Required | SQLite: `file:./dev.db` (dev) or `file:/app/data/prod.db` (prod). Postgres later. |

## Frontend (build/runtime)

| Variable | Purpose | Default | Possible values / notes |
| --- | --- | --- | --- |
| `VITE_BACKEND_URL` | API base URL for the frontend. | Empty in runtime, `http://localhost:4000` in Vite dev proxy | If unset at runtime, frontend uses same-origin requests. Docker build expects it as a build arg. |

## Ops scripts (`ops/deploy.sh`)

| Variable | Purpose | Default | Possible values / notes |
| --- | --- | --- | --- |
| `APP_DIR` | Absolute path to the repo on the VPS. | Required | Example: `/opt/arsvent-2025/app`. |
| `DB_PATH` | Absolute path to the SQLite database file. | Required | Example: `/opt/arsvent-2025/data/backend/prod.db`. |
| `BACKUP_DIR` | Directory for database backups. | Required | Example: `/opt/arsvent-2025/backups/backend-db`. |
| `BRANCH` | Git branch to deploy. | `main` | Optional override for deployment. |
| `BACKUPS_TO_KEEP` | How many DB backups to retain. | `7` | Integer count. |
| `IMAGE_TAG` | Image tag to deploy for backend/frontend. | Required for tag-based deploys | Immutable tag (e.g. git SHA) referenced by compose. |

## Spec-only / planned flags

These variables are described in specs but are not yet wired into the codebase.

| Variable | Purpose | Default | Possible values / notes |
| --- | --- | --- | --- |
| `APP_ENV` | High-level environment selector. | None | `production` or `staging` (spec: `docs/specs/B1-test-and-staging-environment.md`). |
| `IS_PRODUCTION` | Convenience boolean for production-only behavior. | None | `true` or `false` (spec: `docs/specs/B1-test-and-staging-environment.md`). |

## Examples

Backend dev (`backend/.env`):

```ini
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
DISCORD_CALLBACK_URL=http://localhost:4000/auth/discord/callback
SESSION_SECRET=dev-secret
SUPER_ADMIN_DISCORD_ID=123456789012345678
DATABASE_URL=file:./dev.db
FRONTEND_ORIGIN=http://localhost:5173
PORT=4000
```

Frontend dev (`frontend/.env`):

```ini
VITE_BACKEND_URL=http://localhost:4000
```
