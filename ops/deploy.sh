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

backup_backend_data() {
  local sources=()
  if [ -d "$BACKEND_DATA_DIR/prizes" ]; then
    sources+=("prizes")
  fi
  if [ -d "$BACKEND_DATA_DIR/assets" ]; then
    sources+=("assets")
  fi
  if [ "${#sources[@]}" -eq 0 ]; then
    echo "[deploy] No backend data dirs found under $BACKEND_DATA_DIR, skipping data backup."
    return
  fi

  mkdir -p "$DATA_BACKUP_DIR"
  local TS
  local TARGET
  TS="$(date +%Y%m%d-%H%M%S)"
  TARGET="$DATA_BACKUP_DIR/backend-data-${TS}.tar.gz"

  echo "[deploy] Creating backend data backup at $TARGET"
  tar -C "$BACKEND_DATA_DIR" -czf "$TARGET" "${sources[@]}"

  echo "[deploy] Rotating old data backups (keeping $BACKUPS_TO_KEEP)..."
  pushd "$DATA_BACKUP_DIR" >/dev/null
  mapfile -t backups < <(ls -1t backend-data-*.tar.gz 2>/dev/null || true)
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
  if [ -n "${RELEASE_TAGS:-}" ]; then
    line="${line} tags=${RELEASE_TAGS}"
  fi
  if [ -f "$RELEASES_DIR/current_release" ]; then
    cp "$RELEASES_DIR/current_release" "$RELEASES_DIR/previous_release"
  fi
  echo "$IMAGE_TAG" > "$RELEASES_DIR/current_release"
  echo "$line" >> "$RELEASES_DIR/releases.log"
}

rollback_to_previous() {
  local rollback_tag=""
  if [ -f "$RELEASES_DIR/current_release" ]; then
    rollback_tag="$(cat "$RELEASES_DIR/current_release" | tr -d '\n')"
  elif [ -f "$RELEASES_DIR/previous_release" ]; then
    rollback_tag="$(cat "$RELEASES_DIR/previous_release" | tr -d '\n')"
  fi

  if [ -z "$rollback_tag" ]; then
    echo "[deploy] No rollback tag found; cannot rollback."
    return 1
  fi

  if [ "$rollback_tag" = "$IMAGE_TAG" ]; then
    echo "[deploy] Rollback tag matches current target; skipping rollback."
    return 1
  fi

  echo "[deploy] Rolling back to $rollback_tag..."
  IMAGE_TAG="$rollback_tag"
  export IMAGE_TAG

  docker compose -f "$COMPOSE_FILE" pull
  docker compose -f "$COMPOSE_FILE" down
  docker compose -f "$COMPOSE_FILE" up -d

  if ! wait_for_ready; then
    echo "[deploy] Rollback readiness failed."
    return 1
  fi

  RELEASE_TAGS="rollback" record_release
  echo "[deploy] Rollback completed."
  return 0
}

wait_for_ready() {
  local deadline=$((SECONDS + READY_TIMEOUT_SECONDS))
  echo "[deploy] Waiting for readiness at ${READY_URL} (timeout ${READY_TIMEOUT_SECONDS}s)..."
  while [ "$SECONDS" -lt "$deadline" ]; do
    local code
    code="$(curl -s -o /dev/null -w "%{http_code}" "$READY_URL" || true)"
    if [ "$code" = "200" ]; then
      echo "[deploy] Readiness check passed."
      return 0
    fi
    sleep "$READY_INTERVAL_SECONDS"
  done
  echo "[deploy] Readiness check timed out."
  return 1
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

echo "[deploy] Backing up backend data..."
backup_backend_data

echo "[deploy] Running Prisma migrations..."
docker compose -f "$COMPOSE_FILE" run --rm backend npx prisma migrate deploy

echo "[deploy] Starting services..."
docker compose -f "$COMPOSE_FILE" up -d

if ! wait_for_ready; then
  echo "[deploy] Readiness failed. Attempting rollback."
  if ! rollback_to_previous; then
    echo "[deploy] Rollback failed. Keeping maintenance mode enabled."
    exit 1
  fi
  echo "[deploy] Rollback succeeded; exiting maintenance window."
  disable_maintenance
  exit 1
fi

echo "[deploy] Recording release..."
record_release

echo "[deploy] Exiting maintenance window..."
disable_maintenance

echo "[deploy] Deployment script finished."
