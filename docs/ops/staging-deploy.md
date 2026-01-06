# Staging Deploy (VPS)

This guide documents a fresh staging setup on the VPS using the tag-based
deploy flow. It assumes the deploy user owns `/opt/arsvent-2025`.

## 1) Create directories

```
mkdir -p /opt/arsvent-2025/staging/{app,env,data,maintenance,releases,backups}
```

## 2) Clone repo

```
git clone -b <BRANCH> git@github.com:HeldPascal/arsvent-2025.git /opt/arsvent-2025/staging/app
```

## 3) Create deploy env

```
cp /opt/arsvent-2025/staging/app/ops/deploy.env.example /opt/arsvent-2025/staging/env/deploy.env
$EDITOR /opt/arsvent-2025/staging/env/deploy.env
```

Minimum values:

```
DEPLOY_ENV="staging"
DEPLOY_DIR="/opt/arsvent-2025/staging"
IMAGE_REGISTRY_OWNER="heldpascal"
```

Add staging overrides:

```
BRANCH="<BRANCH>"
COMPOSE_PROJECT_NAME="arsvent-staging"
BACKEND_PORT=4100
FRONTEND_PORT=4273
DB_PATH="data/backend/staging.db"
```

## 4) Create backend/frontend env files

```
cp /opt/arsvent-2025/staging/app/ops/backend.env.example /opt/arsvent-2025/staging/env/backend.env
cp /opt/arsvent-2025/staging/app/ops/frontend.env.example /opt/arsvent-2025/staging/env/frontend.env
$EDITOR /opt/arsvent-2025/staging/env/backend.env
$EDITOR /opt/arsvent-2025/staging/env/frontend.env
```

Backend minimum:

```
APP_ENV=staging
IS_PRODUCTION=false
NODE_ENV=production
PORT=4000
DATABASE_URL=file:/app/data/staging.db
REDIS_URL=redis://redis:6379
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
DISCORD_CALLBACK_URL=https://staging.arsvent25.arsnecandi.de/auth/discord/callback
SESSION_SECRET=...
FRONTEND_ORIGIN=https://staging.arsvent25.arsnecandi.de
```

## 5) Install wrapper

```
cp /opt/arsvent-2025/staging/app/ops/deploy.wrapper.example.sh /opt/arsvent-2025/staging/deploy.sh
```

## 6) Deploy by tag

Prerequisite (once per VPS user): authenticate to GHCR so private images can be pulled.

```
docker login ghcr.io
```

```
/opt/arsvent-2025/staging/deploy.sh /opt/arsvent-2025/staging/env/deploy.env <IMAGE_TAG_SHA>
```

## 6a) Optional: compose environment shell

To run manual `docker compose` commands without env warnings, start a subshell
with a prefixed prompt:

```
/opt/arsvent-2025/staging/app/ops/activate-deploy-env.sh /opt/arsvent-2025/staging/env/deploy.env
docker compose -f "$COMPOSE_FILE" ps
exit
```

If `IMAGE_TAG` is not set in `deploy.env`, the helper will fall back to the
last deployed tag from `${RELEASES_DIR}/current_release`.

## 6b) Optional: seed/reset staging data

Run these from the compose environment shell. The backend image doesn't
include the seed scripts, so mount them from the repo:

```
docker compose -f "$COMPOSE_FILE" run --rm \
  -v "$APP_DIR/backend/scripts:/app/scripts:ro" \
  -v "$APP_DIR/backend/tsconfig.json:/app/tsconfig.json:ro" \
  --entrypoint /app/node_modules/.bin/tsx \
  backend /app/scripts/seed-staging.ts
```

Reset (destructive):

```
docker compose -f "$COMPOSE_FILE" run --rm \
  -v "$APP_DIR/backend/scripts:/app/scripts:ro" \
  -v "$APP_DIR/backend/tsconfig.json:/app/tsconfig.json:ro" \
  --entrypoint /app/node_modules/.bin/tsx \
  backend /app/scripts/reset-staging.ts
```

## 7) Verify

```
curl -I http://127.0.0.1:4273
curl -i http://127.0.0.1:4100/api/auth/me
curl -I https://staging.arsvent25.arsnecandi.de
```

### Notes
- Prefer the `ops/activate-deploy-env.sh` helper for manual compose commands.
- `docker compose ... --env-file deploy.env` can warn about unset variables because
  derived defaults (like `BACKEND_ENV_FILE`, `BACKEND_DATA_DIR`) are resolved in
  `ops/load-deploy-env.sh`. These warnings are expected if you bypass the helper.

Auth check:

```
https://staging.arsvent25.arsnecandi.de/auth/discord
```
