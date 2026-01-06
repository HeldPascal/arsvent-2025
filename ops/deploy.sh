#!/usr/bin/env bash
set -euo pipefail

## Required:
# - IMAGE_TAG: immutable image tag to deploy (e.g. git SHA) or pass as arg
# See ops/load-deploy-env.sh for shared env variables and defaults.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1090
source "${SCRIPT_DIR}/load-deploy-env.sh"
load_deploy_env "${ENV_FILE:-}" "${1:-}"

if [ -z "$IMAGE_TAG" ]; then
  echo "[deploy] IMAGE_TAG is required (arg or env)."
  exit 1
fi

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
