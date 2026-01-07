# Ops Overview

## Purpose
Capture the current production setup and the intended direction so deployment
work stays consistent and repeatable.

## Current Production Setup

### VPS Layout
- App root: configurable (see `ops/deploy.env.example`)
- Env files: configurable
- Data: configurable
- Maintenance assets: configurable
- Backups: configurable

### Services and Ports (Docker Compose)
Defined in `ops/docker-compose.yml`:
- `backend` (Node/Express)
  - Exposed: `4000` (bound to configured host port)
  - Volume: `BACKEND_DATA_DIR` -> `/app/data`
- `frontend` (Vite build, served on container port 80)
  - Exposed: configured host port
- `redis`
  - Image: `redis:7-alpine`
  - Volume: `REDIS_DATA_DIR` -> `/data`

### Env Files
- Backend env file path configured via `BACKEND_ENV_FILE`
- Frontend env file path configured via `FRONTEND_ENV_FILE`
- Full list and examples: `docs/ops/environment-variables.md`

### Database
- SQLite file: `DB_PATH`

### Nginx
- TLS via Certbot (Let's Encrypt) for `arsvent25.arsnecandi.de`
- Proxies:
  - `/` -> `127.0.0.1:4173` (frontend)
  - `/api/` and `/auth/` -> `127.0.0.1:4000` (backend)
  - `/content-asset/` -> backend with cache enabled
- Maintenance mode:
  - Checks `MAINTENANCE_FLAG`
  - Returns 503 and serves `maintenance.html` when enabled (from `MAINTENANCE_DIR`)
  - Repo sources: `ops/maintenance.html` (deploy script toggles maintenance)

### Deploy Flow
- GitHub Actions workflow: `.github/workflows/deploy.yml`
  - Manual `workflow_dispatch` only
  - SSH to VPS and runs the wrapper script
- VPS wrapper script
  - Takes the env file path and image tag as args
  - Loads `BRANCH` and `APP_DIR` from the env file
  - Calls `<app_root>/ops/deploy.sh` with `ENV_FILE` set
- Repo script: `ops/deploy.sh`
  - `git fetch/checkout/pull` on branch
  - Pulls prebuilt images by `IMAGE_TAG`
  - `docker compose down`, backup SQLite, migrate, `up -d`
- Shared env loader: `ops/load-deploy-env.sh`
  - Sources `deploy.env` and resolves derived paths for scripts
  - `load_deploy_env` accepts an optional image tag argument
- Manual compose helper: `ops/activate-deploy-env.sh` (pass the deploy env file path)
  - Starts a subshell with a `(arsvent:<env>)` prompt and the same env resolution

### Backups
- SQLite backups created during deploy
- Stored under `DB_BACKUP_DIR`

### Version Metadata
- Backend reads `./version.json` from its working directory.
- Frontend serves `/version.json` from its static output.
- Schema:
  ```
  {
    "imageTag": "string | null",
    "commitSha": "string | null",
    "dirty": "boolean | null",
    "builtAt": "string | null"
  }
  ```
- `IMAGE_TAG` is optional and used when `version.json` is missing.

## Planned Direction (In Scope for B1/B2)

### Staging Environment
- Staging runs on the same VPS with separate ports and domain
  (proposed: `staging.arsvent25.arsnecandi.de`).
- Separate env files, SQLite DB, and Redis data directory.
- Auto-deploy staging on `main` push.

#### Staging Ports and Paths
- Backend port: `4100` (container `4000`)
- Frontend port: `4273` (container `80`)
- Env files:
  - staging `BACKEND_ENV_FILE`
  - staging `FRONTEND_ENV_FILE`
- Data directories:
  - staging `BACKEND_DATA_DIR`
  - staging `REDIS_DATA_DIR`

### CI-Built Images
- CI builds backend/frontend images and pushes to registry.
- VPS deploys by pulling immutable SHA tags.

### Release Logging and Rollback
- Record releases in:
  - `releases.log`
  - `current_release`
  - `previous_release`
- One-command rollback using `previous_release`.

### Health and Readiness
- Add `/healthz`, `/livez`, `/readyz` endpoints.
- Deploy waits for readiness before ending maintenance.

### Future-Proofing
- Keep deploy scripts compatible with blue/green later.
- Keep room for ephemeral test instances (potential Traefik routing).
- Most ops scripts and config live in repo; env/data remain server-specific.

## Preliminary Decisions (Draft)
- Staging deploys automatically from `main` on push/merge (no manual trigger).
- Production remains a manual promotion by immutable image tag.
- Maintenance mode is always enabled during deploys and disabled after readiness.
- CI builds and pushes images; VPS only pulls and runs them.
- SSH remains the mechanism for VPS commands; the trigger is automated.

## Findings / Gaps (Draft)
- Deploy workflow and VPS wrapper scripts must be updated to remove manual triggers.
- Registry naming/tagging convention is defined in B2 and should be applied consistently.
- Health/live/ready endpoints must be added and wired into deploy scripts.

## Migration Plan (Step-by-Step)
1) Define staging domain, ports, and nginx server block for staging.
2) Add staging env files and data directories on VPS (separate DB/Redis paths).
3) Update docker-compose to support staging (single compose file with project isolation; profiles optional).
4) Update CI to build and push backend/frontend images tagged by git SHA.
5) Update deploy scripts to pull images by SHA and record releases.
6) Add `/healthz`, `/livez`, `/readyz` endpoints and wait-for-ready logic.
7) Update GitHub Actions to auto-deploy staging on `main` push.
8) Add rollback tooling using `previous_release` and verify on staging.
9) Document production promotion steps (manual deploy by SHA).
