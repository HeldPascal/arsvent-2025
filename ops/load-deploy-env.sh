#!/usr/bin/env bash

# Required: deployment context
# - DEPLOY_ENV: deployment environment label
# - DEPLOY_DIR: absolute base directory for relative paths
#
# Required: registry owner
# - IMAGE_REGISTRY_OWNER: ghcr owner/org
#
# Optional: app paths (absolute or relative to DEPLOY_DIR)
# - APP_DIR: app repo dir (default: app)
# - COMPOSE_FILE: compose file path (default: app/ops/docker-compose.yml)
# Optional: app behavior
# - BRANCH: git branch to deploy (default: main)
# Optional: compose naming
# - COMPOSE_PROJECT_NAME: compose project name override
#
# Optional: readiness checks
# - READY_URL: readiness URL (default: http://127.0.0.1:${BACKEND_PORT}/readyz)
# - READY_TIMEOUT_SECONDS: readiness timeout in seconds (default: 60)
# - READY_INTERVAL_SECONDS: readiness poll interval in seconds (default: 2)
#
# Optional: env paths (absolute or relative to DEPLOY_DIR)
# - ENV_DIR: env dir (default: env)
# - BACKEND_ENV_FILE: backend env file (default: env/backend.env)
# - FRONTEND_ENV_FILE: frontend env file (default: env/frontend.env)
# Optional: ports
# - BACKEND_PORT: backend host port (default: 4000)
# - FRONTEND_PORT: frontend host port (default: 4173)
#
# Optional: data paths (absolute or relative to DEPLOY_DIR)
# - DATA_DIR: data dir (default: data)
# - BACKEND_DATA_DIR: backend data dir (default: data/backend)
# - REDIS_DATA_DIR: redis data dir (default: data/redis)
# - DB_PATH: sqlite db path (default: data/backend/prod.db)
#
# Optional: backups paths (absolute or relative to DEPLOY_DIR)
# - BACKUPS_DIR: backups dir (default: backups)
# - DB_BACKUP_DIR: db backup dir (default: backups/backend-db)
# Optional: backups behavior
# - BACKUPS_TO_KEEP: number of DB backups to keep (default: 7)
#
# Optional: maintenance paths (absolute or relative to DEPLOY_DIR)
# - MAINTENANCE_DIR: maintenance dir (default: maintenance)
# - MAINTENANCE_FLAG: maintenance flag (default: maintenance/MAINTENANCE_ON)
# Optional: maintenance behavior
# - NGINX_RELOAD_CMD: command to reload nginx (default: sudo systemctl reload nginx)
#
# Optional: release metadata paths (absolute or relative to DEPLOY_DIR)
# - RELEASES_DIR: release metadata dir (default: releases)
#
# Optional: image tag
# - IMAGE_TAG: immutable image tag to deploy (e.g. git SHA)

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  echo "[deploy-env] This script must be sourced."
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
    echo "[deploy-env] ${name} not set."
    return 1
  fi
}

load_deploy_env() {
  local env_file="${1:-}"
  local image_tag="${2:-}"
  if [ -n "$env_file" ]; then
    if [ ! -f "$env_file" ]; then
      echo "[deploy-env] Missing env file at $env_file"
      return 1
    fi
    set -a
    # shellcheck disable=SC1090
    source "$env_file"
    set +a
  fi

  require_var "DEPLOY_ENV" || return 1
  require_var "DEPLOY_DIR" || return 1
  require_var "IMAGE_REGISTRY_OWNER" || return 1

  if [ -n "$image_tag" ]; then
    export IMAGE_TAG="$image_tag"
  fi

  export BRANCH="${BRANCH:-main}"
  export BACKUPS_TO_KEEP="${BACKUPS_TO_KEEP:-7}"
  export BACKEND_PORT="${BACKEND_PORT:-4000}"
  export FRONTEND_PORT="${FRONTEND_PORT:-4173}"
  export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-arsvent-${DEPLOY_ENV}}"
  export NGINX_RELOAD_CMD="${NGINX_RELOAD_CMD:-sudo systemctl reload nginx}"
  export READY_URL="${READY_URL:-http://127.0.0.1:${BACKEND_PORT}/readyz}"
  export READY_TIMEOUT_SECONDS="${READY_TIMEOUT_SECONDS:-60}"
  export READY_INTERVAL_SECONDS="${READY_INTERVAL_SECONDS:-2}"

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
}
