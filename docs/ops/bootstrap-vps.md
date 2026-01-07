# VPS Bootstrap (Staging + Production)

This guide bootstraps a clean VPS for the CI-driven deploy flow. It covers
staging + production domains, nginx/TLS, directories, env files, and manual
production promotion by SHA.

Assumptions:
- Deploy user owns `/opt/arsvent-2025`.
- Docker Engine + Compose plugin are installed.
- Nginx + Certbot are installed.
- DNS points to this VPS for both domains.

## 0) Install base dependencies (one-time)

```
sudo apt update
sudo apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx
sudo usermod -aG docker $USER
```

Log out/in if you just added the docker group.

## 1) Create directories

```
mkdir -p /opt/arsvent-2025/{staging,production}/{app,env,data,maintenance,releases,backups}
```

## 2) Clone the repo (once per environment)

Staging:
```
git clone -b <BRANCH> git@github.com:HeldPascal/arsvent-2025.git /opt/arsvent-2025/staging/app
```

Production:
```
git clone -b main git@github.com:HeldPascal/arsvent-2025.git /opt/arsvent-2025/production/app
```

## 3) Create deploy env files

Staging:
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

Staging overrides:
```
BRANCH="<BRANCH>"
COMPOSE_PROJECT_NAME="arsvent-staging"
BACKEND_PORT=4100
FRONTEND_PORT=4273
DB_PATH="data/backend/staging.db"
```

Production:
```
cp /opt/arsvent-2025/production/app/ops/deploy.env.example /opt/arsvent-2025/production/env/deploy.env
$EDITOR /opt/arsvent-2025/production/env/deploy.env
```

Minimum values:
```
DEPLOY_ENV="production"
DEPLOY_DIR="/opt/arsvent-2025/production"
IMAGE_REGISTRY_OWNER="heldpascal"
```

Production overrides:
```
BRANCH="main"
COMPOSE_PROJECT_NAME="arsvent-production"
DB_PATH="data/backend/prod.db"
```

## 4) Create backend/frontend env files

Staging:
```
cp /opt/arsvent-2025/staging/app/ops/backend.env.example /opt/arsvent-2025/staging/env/backend.env
cp /opt/arsvent-2025/staging/app/ops/frontend.env.example /opt/arsvent-2025/staging/env/frontend.env
$EDITOR /opt/arsvent-2025/staging/env/backend.env
$EDITOR /opt/arsvent-2025/staging/env/frontend.env
```

Production:
```
cp /opt/arsvent-2025/production/app/ops/backend.env.example /opt/arsvent-2025/production/env/backend.env
cp /opt/arsvent-2025/production/app/ops/frontend.env.example /opt/arsvent-2025/production/env/frontend.env
$EDITOR /opt/arsvent-2025/production/env/backend.env
$EDITOR /opt/arsvent-2025/production/env/frontend.env
```

Backend minimum (example, per environment):
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

Production should use production Discord app + URLs:
```
APP_ENV=production
IS_PRODUCTION=true
DISCORD_CALLBACK_URL=https://arsvent25.arsnecandi.de/auth/discord/callback
FRONTEND_ORIGIN=https://arsvent25.arsnecandi.de
```

## 5) Install wrapper scripts

Staging:
```
cp /opt/arsvent-2025/staging/app/ops/deploy.wrapper.example.sh /opt/arsvent-2025/staging/deploy.sh
cp /opt/arsvent-2025/staging/app/ops/rollback.wrapper.example.sh /opt/arsvent-2025/staging/rollback.sh
```

Production:
```
cp /opt/arsvent-2025/production/app/ops/deploy.wrapper.example.sh /opt/arsvent-2025/production/deploy.sh
cp /opt/arsvent-2025/production/app/ops/rollback.wrapper.example.sh /opt/arsvent-2025/production/rollback.sh
```

## 6) Configure nginx and TLS

Create server blocks for both domains and point them at the correct host ports.
Maintenance mode uses the per-environment `MAINTENANCE_FLAG` and serves
`maintenance.html` from the `MAINTENANCE_DIR` directory.

Example (staging):
```
server {
  listen 443 ssl http2;
  server_name staging.arsvent25.arsnecandi.de;

  access_log /var/log/arsvent25/nginx/staging.access.log;
  error_log /var/log/arsvent25/nginx/staging.error.log;

  if (-f /opt/arsvent-2025/staging/maintenance/MAINTENANCE_ON) { return 503; }

  location / {
    proxy_pass http://127.0.0.1:4273;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:4100;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /auth/ {
    proxy_pass http://127.0.0.1:4100;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  error_page 503 @maintenance;
  location @maintenance {
    root /opt/arsvent-2025/staging/maintenance;
    try_files /maintenance.html =503;
  }
}
```

Production should mirror this with:
- domain `arsvent25.arsnecandi.de`
- ports `4173` (frontend) and `4000` (backend)
- maintenance path `/opt/arsvent-2025/production/maintenance/MAINTENANCE_ON`

TLS (Certbot, example):
```
sudo certbot --nginx -d arsvent25.arsnecandi.de -d staging.arsvent25.arsnecandi.de
```

## 7) Authenticate to GHCR (once per VPS user)

```
docker login ghcr.io
```

## 8) Deploy staging by SHA tag

```
/opt/arsvent-2025/staging/deploy.sh /opt/arsvent-2025/staging/env/deploy.env <IMAGE_TAG_SHA>
```

## 9) Optional: compose environment shell

To run manual `docker compose` commands without env warnings:
```
/opt/arsvent-2025/staging/app/ops/activate-deploy-env.sh /opt/arsvent-2025/staging/env/deploy.env
docker compose -f "$COMPOSE_FILE" ps
exit
```

If `IMAGE_TAG` is not set in `deploy.env`, the helper falls back to
`${RELEASES_DIR}/current_release`.

## 10) Optional: seed/reset staging data

Run these from the compose environment shell. The backend image does not ship
the seed scripts, so mount them from the repo:

Seed:
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

## 11) Verify

```
curl -I http://127.0.0.1:4273
curl -i http://127.0.0.1:4100/api/auth/me
curl -I https://staging.arsvent25.arsnecandi.de
```

Auth check:
```
https://staging.arsvent25.arsnecandi.de/auth/discord
```

## 12) Promote to production by SHA

Once a staging SHA is validated, deploy it to production manually:

```
/opt/arsvent-2025/production/deploy.sh /opt/arsvent-2025/production/env/deploy.env <IMAGE_TAG_SHA>
```

Optional CI-based promotion (manual approval): use a deploy job that targets the
`production` GitHub Environment with required reviewers enabled. The job pauses
until approval, then deploys the provided SHA tag.

## Notes
- `ops/deploy.sh` copies `ops/maintenance.html` into `MAINTENANCE_DIR` before
  enabling maintenance, so ensure nginx serves that directory.
- `docker compose ... --env-file deploy.env` can warn about unset variables
  because derived defaults are resolved in `ops/load-deploy-env.sh`.
