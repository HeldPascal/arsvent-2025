# Environment Variables

This document lists all environment variables referenced in code, ops scripts, or docs.
Defaults come from the codebase; values marked "required" must be set explicitly.

## Backend (runtime)

| Variable | Purpose | Default | Possible values / notes |
| --- | --- | --- | --- |
| `DISCORD_CLIENT_ID` | Discord OAuth client id. | Required | From the Discord application. |
| `DISCORD_CLIENT_SECRET` | Discord OAuth client secret. | Required | From the Discord application. |
| `DISCORD_CALLBACK_URL` | OAuth callback URL for Discord. | Required | Must match the Discord app; e.g. `http://localhost:4000/auth/discord/callback`. In staging/production, must use https and share origin with `FRONTEND_ORIGIN`. |
| `SESSION_SECRET` | Session cookie signing secret (also used as fallback for content tokens). | `dev-secret` | Set a strong random value in production. |
| `SESSION_MAX_AGE_MS` | Session cookie max age in milliseconds. | 14 days | Numeric milliseconds; empty or invalid falls back to 14 days. |
| `FRONTEND_ORIGIN` | CORS origin + login redirect base. | `http://localhost:5173` | Must match the frontend origin (scheme + host + port). In staging/production, must share origin with `DISCORD_CALLBACK_URL`. |
| `REDIS_URL` | Redis connection URL for sessions. | `redis://localhost:6379` | If Redis is unavailable, backend falls back to in-memory sessions (not for production). |
| `SUPER_ADMIN_DISCORD_ID` | Discord user id that is always treated as super admin. | Empty | Optional; if set, the matching user is elevated on login. |
| `PORT` | HTTP port the backend listens on. | `3000` | Common values: `4000` (prod), `3000` (fallback). |
| `NODE_ENV` | Enables production behavior (secure cookies, trust proxy). | Empty | `production` or `development`. |
| `CONTENT_TOKEN_SECRET` | HMAC secret for content asset tokens. | Uses `SESSION_SECRET` | Required if `SESSION_SECRET` is unset. Keep stable across restarts. |
| `DATABASE_URL` | Prisma datasource connection string. | Required | SQLite: `file:./dev.db` (dev) or `file:/app/data/prod.db` (prod). Postgres later. |
| `APP_ENV` | High-level environment selector. | `development` if unset | `production`, `staging`, or `development`. Must be set explicitly in staging/production. |
| `IS_PRODUCTION` | Explicit production guard flag (used for safety checks and admin/test gating). | Derived from `APP_ENV` if unset | `true` or `false`. Required when `APP_ENV=production` and must match `APP_ENV`. |

## Frontend (build/runtime)

| Variable | Purpose | Default | Possible values / notes |
| --- | --- | --- | --- |
| `VITE_BACKEND_URL` | API base URL for the frontend. | Empty in runtime, `http://localhost:4000` in Vite dev proxy | If unset at runtime, frontend uses same-origin requests. Docker build expects it as a build arg. |

## Ops scripts (`ops/deploy.sh`)

| Variable | Purpose | Default | Possible values / notes |
| --- | --- | --- | --- |
| `DEPLOY_ENV` | Environment label for release logs. | Required | Example: `staging`. |
| `DEPLOY_DIR` | Base directory for relative paths. | Required | Example: `/path/to/deploy-root`. |
| `APP_DIR` | App repo dir (absolute or relative to `DEPLOY_DIR`). | Optional | Defaults to `app`. |
| `ENV_DIR` | Env dir (absolute or relative to `DEPLOY_DIR`). | Optional | Defaults to `env`. |
| `DATA_DIR` | Data dir (absolute or relative to `DEPLOY_DIR`). | Optional | Defaults to `data`. |
| `BACKUPS_DIR` | Backups dir (absolute or relative to `DEPLOY_DIR`). | Optional | Defaults to `backups`. |
| `DB_BACKUP_DIR` | DB backups dir (absolute or relative to `DEPLOY_DIR`). | Optional | Defaults to `backups/backend-db`. |
| `DB_PATH` | DB path (absolute or relative to `DEPLOY_DIR`). | Optional | Defaults to `data/backend/prod.db`. |
| `BRANCH` | Git branch to deploy. | `main` | Optional override for deployment. |
| `BACKUPS_TO_KEEP` | How many DB backups to retain. | `7` | Integer count. |
| `NGINX_RELOAD_CMD` | Command used to reload nginx. | `sudo systemctl reload nginx` | Override if sudo is not available. |
| `COMPOSE_PROJECT_NAME` | Docker Compose project name override. | `arsvent-${DEPLOY_ENV}` | Set to keep envs isolated (e.g., `arsvent-staging`). |
| `IMAGE_TAG` | Image tag to deploy for backend/frontend. | Required for tag-based deploys | Immutable tag (e.g. git SHA) referenced by compose; admin version UI may use it when set. |
| `IMAGE_REGISTRY_OWNER` | GHCR owner/org for images. | Required | Should match `ghcr.io/<owner>/arsvent-*`. |
| `RELEASES_DIR` | Release metadata dir (absolute or relative to `DEPLOY_DIR`). | Optional | Defaults to `releases`. |
| `MAINTENANCE_DIR` | Maintenance dir (absolute or relative to `DEPLOY_DIR`). | Optional | Defaults to `maintenance`. |
| `MAINTENANCE_FLAG` | Maintenance flag file (absolute or relative to `DEPLOY_DIR`). | Optional | Defaults to `maintenance/MAINTENANCE_ON`. |
| `COMPOSE_FILE` | Compose file path (absolute or relative to `DEPLOY_DIR`). | Optional | Defaults to `app/ops/docker-compose.yml`. |

## Docker Compose (`ops/docker-compose.yml`)

| Variable | Purpose | Default | Possible values / notes |
| --- | --- | --- | --- |
| `BACKEND_ENV_FILE` | Backend env file path. | Optional | Defaults to `env/backend.env`. |
| `FRONTEND_ENV_FILE` | Frontend env file path. | Optional | Defaults to `env/frontend.env`. |
| `BACKEND_DATA_DIR` | Backend data directory. | Optional | Defaults to `data/backend`. |
| `REDIS_DATA_DIR` | Redis data directory. | Optional | Defaults to `data/redis`. |
| `BACKEND_PORT` | Host port bound to backend container. | `4000` | Staging: `4100`. |
| `FRONTEND_PORT` | Host port bound to frontend container. | `4173` | Staging: `4273`. |

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
