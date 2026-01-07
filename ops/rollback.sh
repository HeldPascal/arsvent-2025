#!/usr/bin/env bash
set -euo pipefail

## Optional:
# - ROLLBACK_TAG: explicit tag to roll back to (arg or env)
# See ops/load-deploy-env.sh for shared env variables and defaults.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1090
source "${SCRIPT_DIR}/load-deploy-env.sh"
load_deploy_env "${ENV_FILE:-}"

ROLLBACK_TAG="${ROLLBACK_TAG:-${1:-}}"

resolve_target_tag() {
  if [ -n "$ROLLBACK_TAG" ]; then
    echo "$ROLLBACK_TAG"
    return
  fi
  if [ -f "$RELEASES_DIR/previous_release" ]; then
    cat "$RELEASES_DIR/previous_release" | tr -d '\n'
    return
  fi
  echo ""
}

record_release() {
  mkdir -p "$RELEASES_DIR"
  local ts
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  local line="${ts} env=${DEPLOY_ENV} sha=${IMAGE_TAG} tags=rollback"
  if [ -f "$RELEASES_DIR/current_release" ]; then
    cp "$RELEASES_DIR/current_release" "$RELEASES_DIR/previous_release"
  fi
  echo "$IMAGE_TAG" > "$RELEASES_DIR/current_release"
  echo "$line" >> "$RELEASES_DIR/releases.log"
}

wait_for_ready() {
  local deadline=$((SECONDS + READY_TIMEOUT_SECONDS))
  echo "[rollback] Waiting for readiness at ${READY_URL} (timeout ${READY_TIMEOUT_SECONDS}s)..."
  while [ "$SECONDS" -lt "$deadline" ]; do
    local code
    code="$(curl -s -o /dev/null -w "%{http_code}" "$READY_URL" || true)"
    if [ "$code" = "200" ]; then
      echo "[rollback] Readiness check passed."
      return 0
    fi
    sleep "$READY_INTERVAL_SECONDS"
  done
  echo "[rollback] Readiness check timed out."
  return 1
}

enable_maintenance() {
  if [ -f "$APP_DIR/ops/maintenance.html" ]; then
    mkdir -p "$MAINTENANCE_DIR"
    cp "$APP_DIR/ops/maintenance.html" "$MAINTENANCE_DIR/maintenance.html"
  fi
  echo "[rollback] Enabling maintenance mode..."
  touch "$MAINTENANCE_FLAG"
  $NGINX_RELOAD_CMD || echo "[rollback] nginx reload failed (continuing)"
}

disable_maintenance() {
  echo "[rollback] Disabling maintenance mode..."
  rm -f "$MAINTENANCE_FLAG"
  $NGINX_RELOAD_CMD || echo "[rollback] nginx reload failed (continuing)"
}

echo "[rollback] Starting rollback in $APP_DIR on branch $BRANCH"
cd "$APP_DIR"

echo "[rollback] Fetching latest changes..."
git fetch --prune origin

echo "[rollback] Checking out $BRANCH..."
git switch "$BRANCH" 2>/dev/null || git switch -c "$BRANCH" "origin/$BRANCH"

echo "[rollback] Pulling latest commits..."
git pull --ff-only origin "$BRANCH"

TARGET_TAG="$(resolve_target_tag)"
if [ -z "$TARGET_TAG" ]; then
  echo "[rollback] No rollback tag found (arg or previous_release)."
  exit 1
fi

if [ -f "$RELEASES_DIR/current_release" ]; then
  CURRENT_TAG="$(cat "$RELEASES_DIR/current_release" | tr -d '\n')"
  if [ "$CURRENT_TAG" = "$TARGET_TAG" ]; then
    echo "[rollback] Target tag matches current release. Nothing to do."
    exit 0
  fi
fi

IMAGE_TAG="$TARGET_TAG"
export IMAGE_TAG

echo "[rollback] Pulling images for tag $IMAGE_TAG..."
docker compose -f "$COMPOSE_FILE" pull

echo "[rollback] Entering maintenance window..."
enable_maintenance

echo "[rollback] Stopping app..."
docker compose -f "$COMPOSE_FILE" down

echo "[rollback] Starting services..."
docker compose -f "$COMPOSE_FILE" up -d

if ! wait_for_ready; then
  echo "[rollback] Readiness failed. Keeping maintenance mode enabled."
  exit 1
fi

echo "[rollback] Recording release..."
record_release

echo "[rollback] Exiting maintenance window..."
disable_maintenance

echo "[rollback] Rollback script finished."
