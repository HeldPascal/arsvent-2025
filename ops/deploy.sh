#!/usr/bin/env bash
set -euo pipefail

# Required environment variables:
# - APP_DIR: absolute path to the application repository on the server
# - DB_PATH: absolute path to the SQLite database file
# - BACKUP_DIR: directory where DB backups should be stored
# Optional:
# - BRANCH: git branch to deploy (default: main)
# - BACKUPS_TO_KEEP: number of DB backups to keep (default: 7)

: "${APP_DIR:?APP_DIR not set}"
: "${DB_PATH:?DB_PATH not set}"
: "${BACKUP_DIR:?BACKUP_DIR not set}"

BRANCH="${BRANCH:-main}"
BACKUPS_TO_KEEP="${BACKUPS_TO_KEEP:-7}"

backup_db() {
  if [ ! -f "$DB_PATH" ]; then
    echo "[deploy] No DB found at $DB_PATH, skipping backup."
    return
  fi

  mkdir -p "$BACKUP_DIR"
  TS="$(date +%Y%m%d-%H%M%S)"
  TARGET="$BACKUP_DIR/prod-$TS.db"

  echo "[deploy] Creating DB backup at $TARGET"
  cp "$DB_PATH" "$TARGET"

  echo "[deploy] Rotating old backups (keeping $BACKUPS_TO_KEEP)..."
  pushd "$BACKUP_DIR" >/dev/null
  ls -1t prod-*.db | tail -n +$((BACKUPS_TO_KEEP+1)) | xargs -r rm -- || true
  popd >/dev/null
}

echo "[deploy] Starting deployment in $APP_DIR on branch $BRANCH"
cd "$APP_DIR"

echo "[deploy] Fetching latest changes..."
git fetch --all --prune

echo "[deploy] Checking out $BRANCH..."
git checkout "$BRANCH"

echo "[deploy] Pulling latest commits..."
git pull --ff-only origin "$BRANCH"

echo "[deploy] Building images while app stays online..."
docker compose pull || true
docker compose build

echo "[deploy] Stopping app and entering maintenance window..."
docker compose down

echo "[deploy] Backing up database..."
backup_db

echo "[deploy] Running Prisma migrations..."
docker compose run --rm backend npx prisma migrate deploy

echo "[deploy] Starting services..."
docker compose up -d

echo "[deploy] Cleaning up dangling Docker images and build cache..."
docker image prune -f >/dev/null 2>&1 || true
docker builder prune -f >/dev/null 2>&1 || true

echo "[deploy] Deployment script finished."
