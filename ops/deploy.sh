#!/usr/bin/env bash
set -euo pipefail

# Required environment variables:
# - DEPLOY_ENV: deployment environment label
# - DEPLOY_DIR: absolute base directory for relative paths
# - IMAGE_TAG: immutable image tag to deploy (e.g. git SHA) or pass as arg
# - IMAGE_REGISTRY_OWNER: ghcr owner/org
# Optional (path defaults):
# - APP_DIR: app repo dir (default: app)
# - ENV_DIR: env dir (default: env)
# - DATA_DIR: data dir (default: data)
# - BACKUPS_DIR: backups dir (default: backups)
# - RELEASES_DIR: release metadata dir (default: releases)
# - MAINTENANCE_DIR: maintenance dir (default: maintenance)
# Optional (derived paths):
# - COMPOSE_FILE: compose file path (default: app/ops/docker-compose.yml)
# - MAINTENANCE_FLAG: maintenance flag (default: maintenance/MAINTENANCE_ON)
# - BACKEND_ENV_FILE: backend env file (default: env/backend.env)
# - FRONTEND_ENV_FILE: frontend env file (default: env/frontend.env)
# - BACKEND_DATA_DIR: backend data dir (default: data/backend)
# - REDIS_DATA_DIR: redis data dir (default: data/redis)
# - DB_PATH: sqlite db path (default: data/backend/prod.db)
# - DB_BACKUP_DIR: db backup dir (default: backups/backend-db)
# Optional (deploy behavior):
# - BRANCH: git branch to deploy (default: main)
# - BACKUPS_TO_KEEP: number of DB backups to keep (default: 7)
# - COMPOSE_PROJECT_NAME: compose project name override
# - NGINX_RELOAD_CMD: command to reload nginx (default: sudo systemctl reload nginx)

resolve_path() {
  local value="$1"
  if [[ "$value" = /* ]]; then
    echo "$value"
  else
    echo "${DEPLOY_DIR%/}/$value"
  fi
}

resolve_export_path() {
  local name="$1"
  local fallback="$2"
  local current="${!name:-}"
  if [ -z "$current" ]; then
    current="$fallback"
  fi
  export "$name"="$(resolve_path "$current")"
}

require_var() {
  local name="$1"
  local value="${!name:-}"
  if [ -z "$value" ]; then
    echo "[deploy] ${name} not set."
    exit 1
  fi
}

require_var "DEPLOY_ENV"
require_var "DEPLOY_DIR"

export IMAGE_TAG="${IMAGE_TAG:-${1:-}}"
if [ -z "$IMAGE_TAG" ]; then
  echo "[deploy] IMAGE_TAG is required (arg or env)."
  exit 1
fi
require_var "IMAGE_REGISTRY_OWNER"
export IMAGE_REGISTRY_OWNER

export BRANCH="${BRANCH:-main}"
export BACKUPS_TO_KEEP="${BACKUPS_TO_KEEP:-7}"
export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-arsvent-${DEPLOY_ENV}}"
export NGINX_RELOAD_CMD="${NGINX_RELOAD_CMD:-sudo systemctl reload nginx}"

resolve_export_path APP_DIR "app"
resolve_export_path ENV_DIR "env"
resolve_export_path DATA_DIR "data"
resolve_export_path BACKUPS_DIR "backups"
resolve_export_path RELEASES_DIR "releases"
resolve_export_path MAINTENANCE_DIR "maintenance"
resolve_export_path MAINTENANCE_FLAG "${MAINTENANCE_DIR}/MAINTENANCE_ON"
resolve_export_path COMPOSE_FILE "${APP_DIR}/ops/docker-compose.yml"
resolve_export_path BACKEND_ENV_FILE "${ENV_DIR}/backend.env"
resolve_export_path FRONTEND_ENV_FILE "${ENV_DIR}/frontend.env"
resolve_export_path BACKEND_DATA_DIR "${DATA_DIR}/backend"
resolve_export_path REDIS_DATA_DIR "${DATA_DIR}/redis"
resolve_export_path DB_PATH "${DATA_DIR}/backend/prod.db"
resolve_export_path DB_BACKUP_DIR "${BACKUPS_DIR}/backend-db"

backup_db() {
  if [ ! -f "$DB_PATH" ]; then
    echo "[deploy] No DB found at $DB_PATH, skipping backup."
    return
  fi

  mkdir -p "$DB_BACKUP_DIR"
  local TS
  local base_name
  local stem
  local ext
  local glob
  TS="$(date +%Y%m%d-%H%M%S)"
  base_name="$(basename "$DB_PATH")"
  if [[ "$base_name" == *.* ]]; then
    stem="${base_name%.*}"
    ext="${base_name##*.}"
    TARGET="$DB_BACKUP_DIR/${stem}-${TS}.${ext}"
    glob="${stem}-*.${ext}"
  else
    TARGET="$DB_BACKUP_DIR/${base_name}-${TS}"
    glob="${base_name}-*"
  fi

  echo "[deploy] Creating DB backup at $TARGET"
  cp "$DB_PATH" "$TARGET"

  echo "[deploy] Rotating old backups (keeping $BACKUPS_TO_KEEP)..."
  pushd "$DB_BACKUP_DIR" >/dev/null
  mapfile -t backups < <(ls -1t $glob 2>/dev/null || true)
  if [ "${#backups[@]}" -gt "$BACKUPS_TO_KEEP" ]; then
    printf '%s\n' "${backups[@]}" | tail -n +$((BACKUPS_TO_KEEP+1)) | xargs -r rm --
  fi
  popd >/dev/null
}

sync_maintenance_assets() {
  if [ -f "$APP_DIR/ops/maintenance.html" ]; then
    mkdir -p "$MAINTENANCE_DIR"
    cp "$APP_DIR/ops/maintenance.html" "$MAINTENANCE_DIR/maintenance.html"
  fi
}

enable_maintenance() {
  sync_maintenance_assets
  echo "[deploy] Enabling maintenance mode..."
  touch "$MAINTENANCE_FLAG"
  $NGINX_RELOAD_CMD || echo "[deploy] nginx reload failed (continuing)"
}

disable_maintenance() {
  echo "[deploy] Disabling maintenance mode..."
  rm -f "$MAINTENANCE_FLAG"
  $NGINX_RELOAD_CMD || echo "[deploy] nginx reload failed (continuing)"
}

record_release() {
  mkdir -p "$RELEASES_DIR"
  local ts
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  local line="${ts} env=${DEPLOY_ENV} sha=${IMAGE_TAG}"
  if [ -f "$RELEASES_DIR/current_release" ]; then
    cp "$RELEASES_DIR/current_release" "$RELEASES_DIR/previous_release"
  fi
  echo "$IMAGE_TAG" > "$RELEASES_DIR/current_release"
  echo "$line" >> "$RELEASES_DIR/releases.log"
}

echo "[deploy] Starting deployment in $APP_DIR on branch $BRANCH"
cd "$APP_DIR"

echo "[deploy] Fetching latest changes..."
git fetch --prune origin

echo "[deploy] Checking out $BRANCH..."
git switch "$BRANCH" 2>/dev/null || git switch -c "$BRANCH" "origin/$BRANCH"

echo "[deploy] Pulling latest commits..."
git pull --ff-only origin "$BRANCH"

echo "[deploy] Pulling images for tag $IMAGE_TAG..."
docker compose -f "$COMPOSE_FILE" pull

echo "[deploy] Entering maintenance window..."
enable_maintenance

echo "[deploy] Stopping app..."
docker compose -f "$COMPOSE_FILE" down

echo "[deploy] Backing up database..."
backup_db

echo "[deploy] Running Prisma migrations..."
docker compose -f "$COMPOSE_FILE" run --rm backend npx prisma migrate deploy

echo "[deploy] Starting services..."
docker compose -f "$COMPOSE_FILE" up -d

echo "[deploy] Recording release..."
record_release

echo "[deploy] Exiting maintenance window..."
disable_maintenance

echo "[deploy] Deployment script finished."
