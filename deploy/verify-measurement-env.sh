#!/usr/bin/env bash
# Run on the VPS from /opt/speedcheck after docker compose up.
set -euo pipefail

echo "=== Host .env (server metadata) ==="
grep -E '^SPEEDTEST_SERVER_' .env 2>/dev/null || echo "No SPEEDTEST_SERVER_* in ./.env"

echo ""
echo "=== docker-compose env wiring ==="
grep -E 'env_file|SPEEDTEST_SERVER' docker-compose.yml 2>/dev/null || echo "No env_file / SERVER vars in compose"

echo ""
echo "=== Inside container ==="
docker compose exec -T speedtest printenv 2>/dev/null | grep -E '^SPEEDTEST_SERVER_' || echo "No SPEEDTEST_SERVER_* in container (compose not passing .env)"

echo ""
echo "=== API /servers ==="
curl -sS http://127.0.0.1:18443/servers
echo ""
