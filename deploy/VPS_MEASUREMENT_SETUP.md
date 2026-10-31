# VPS measurement setup (MySpeedGauge)

Run the Go speed test service on a DigitalOcean (or any Linux) VPS with Caddy TLS in front.

## Layout

```text
/opt/speedcheck/          # git clone of this repo
/opt/speedcheck/.env      # secrets + SPEEDTEST_* (not committed)
/etc/caddy/Caddyfile      # reverse proxy → 127.0.0.1:18443
```

## 1. Clone and configure

```bash
sudo mkdir -p /opt/speedcheck
sudo chown "$USER":"$USER" /opt/speedcheck
git clone https://github.com/greenapple20148/speedcheck.git /opt/speedcheck
cd /opt/speedcheck
cp .env.example .env
```

Edit `.env` (quote values with spaces):

```bash
SPEEDTEST_PUBLIC_URL=https://measure.example.com
SPEEDTEST_SERVER_ID=do-nyc1-1
SPEEDTEST_SERVER_NAME=MySpeedGauge US
SPEEDTEST_SERVER_LOCATION=New York City
SPEEDTEST_SERVER_REGION=us-east
SPEEDTEST_HMAC_SECRET=<long-random>
SPEEDTEST_ADMIN_TOKEN=<long-random>
SPEEDTEST_CORS_ORIGINS=https://myspeedguage.com,https://www.myspeedguage.com
SPEEDTEST_MAX_DURATION_SEC=30
SPEEDTEST_PER_TEST_BUDGET_MB_STANDARD=250
```

## 2. Start Docker

From repo root:

```bash
docker compose -f deploy/docker-compose.production.yml up -d --build
curl -fsS http://127.0.0.1:18443/health
```

Or, if you use a root-level `docker-compose.yml` with `env_file: .env` only, run `docker compose up -d --build` in `/opt/speedcheck`.

## 3. Caddy (HTTPS)

```bash
sudo apt install -y caddy
sudo cp deploy/Caddyfile.example /etc/caddy/Caddyfile
# Edit: replace speed.example.com with measure.example.com
sudo systemctl enable --now caddy
curl -fsS https://measure.example.com/health
```

Open **80/443** in the cloud firewall. Bind **18443 to 127.0.0.1** only (compose file above) so the app is not exposed without TLS.

## 4. Vercel

- `NEXT_PUBLIC_SPEEDTEST_URL=https://measure.example.com`
- Redeploy. Confirm `https://myspeedguage.com/api/speedtest/config` → `"mode":"direct"`, `"probeOk":true`.

## 5. After code updates (e.g. PR #10+ throughput fix)

```bash
cd /opt/speedcheck
git pull origin main
docker compose -f deploy/docker-compose.production.yml up -d --build
# or: docker compose up -d --build
curl -fsS https://measure.example.com/health
```

## Troubleshooting

| Symptom | Check |
|--------|--------|
| Diagnostics show “Local Dev” | `.env` not loaded — use `env_file: .env` only; recreate container |
| Low Mbps | Redeploy latest `main` (zero-buffer download); compare to Speedtest NYC |
| `git pull` fails | `git remote -v`; ensure clone from GitHub |
| HTTPS fails, local health OK | `systemctl status caddy`; firewall 443 |
