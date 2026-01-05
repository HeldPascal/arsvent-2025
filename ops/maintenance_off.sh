#!/usr/bin/env bash
set -euo pipefail

FLAG="${MAINTENANCE_FLAG:?MAINTENANCE_FLAG not set}"

echo "[maintenance] Disabling maintenance mode..."
rm -f "$FLAG"

echo "[maintenance] Reloading nginx..."
sudo systemctl reload nginx

echo "[maintenance] Maintenance mode is now OFF."
