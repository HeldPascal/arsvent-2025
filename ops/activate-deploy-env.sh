#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-${ENV_FILE:-}}"
if [ -z "$ENV_FILE" ]; then
  echo "[activate-deploy-env] Usage: $0 /path/to/deploy.env"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1090
source "${SCRIPT_DIR}/load-deploy-env.sh"
load_deploy_env "$ENV_FILE"

if [ -z "${IMAGE_TAG:-}" ] && [ -n "${RELEASES_DIR:-}" ] && [ -f "${RELEASES_DIR}/current_release" ]; then
  IMAGE_TAG="$(cat "${RELEASES_DIR}/current_release" | tr -d '\n')"
  export IMAGE_TAG
fi

if [ -z "${IMAGE_REGISTRY_OWNER:-}" ] || [ -z "${IMAGE_TAG:-}" ]; then
  echo "[compose-env] IMAGE_REGISTRY_OWNER/IMAGE_TAG not set. Compose may warn."
fi

export PS1="(arsvent:${DEPLOY_ENV}) ${PS1:-}"

exec bash --noprofile --norc
