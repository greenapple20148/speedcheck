#!/usr/bin/env bash
# Quick sanity check inside /opt/speedcheck before restarting compose.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ROOT}/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

required=(
  SPEEDTEST_HMAC_SECRET
  SPEEDTEST_PUBLIC_URL
  SPEEDTEST_CORS_ORIGINS
)

for key in "${required[@]}"; do
  if ! grep -q "^${key}=" "$ENV_FILE"; then
    echo "Missing $key in .env" >&2
    exit 1
  fi
done

echo "OK: required keys present in .env"
curl -fsS "http://127.0.0.1:18443/health" | head -c 200
echo
