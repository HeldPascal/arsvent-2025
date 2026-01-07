#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-}"
IMAGE_TAG="${2:-}"
if [ -z "$ENV_FILE" ] || [ -z "$IMAGE_TAG" ]; then
  echo "[wrapper] Usage: $0 /path/to/deploy.env <image_tag>"
  exit 1
fi
if [ ! -f "$ENV_FILE" ]; then
  echo "[wrapper] Missing env file at $ENV_FILE"
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

if [ -z "${DEPLOY_DIR:-}" ]; then
  echo "[wrapper] DEPLOY_DIR not set."
  exit 1
fi

resolve_path() {
  local value="$1"
  if [[ "$value" = /* ]]; then
    echo "$value"
  else
    echo "${DEPLOY_DIR%/}/$value"
  fi
}

APP_DIR="$(resolve_path "${APP_DIR:-app}")"
if [ ! -d "$APP_DIR" ]; then
  echo "[wrapper] App dir not found at $APP_DIR"
  exit 1
fi

cd "$APP_DIR"
git fetch --prune origin
BRANCH="${BRANCH:-main}"
git switch "$BRANCH" 2>/dev/null || git switch -c "$BRANCH" "origin/$BRANCH"
git pull --ff-only origin "$BRANCH"
ENV_FILE="$ENV_FILE" ./ops/deploy.sh "$IMAGE_TAG"
