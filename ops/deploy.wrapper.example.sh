#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/env/deploy.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "[wrapper] Missing env file at $ENV_FILE"
  exit 1
fi
# shellcheck disable=SC1090
source "$ENV_FILE"

: "${APP_DIR:?APP_DIR not set}"
IMAGE_TAG="${IMAGE_TAG:-${1:-}}"
if [ -z "$IMAGE_TAG" ]; then
  echo "[wrapper] IMAGE_TAG is required (arg or env)."
  exit 1
fi

cd "$APP_DIR"
./ops/deploy.sh "$IMAGE_TAG"
