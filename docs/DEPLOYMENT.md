# Deployment Runbook

## Components

1. **Web app** — Next.js on Vercel (or Docker)
2. **Measurement service** — Go binary on VPS via Docker Compose
3. **Database** — Supabase PostgreSQL (apply `supabase/migrations`)

## Prerequisites (require explicit approval before production spend)

- Vercel project + custom domain
- VPS with public IP and HTTPS (Caddy/Nginx + Let’s Encrypt)
- Supabase project
- Optional: Cloudflare DNS, GA4, AdSense, Search Console

## Local development

```bash
cp .env.example .env.local
# Terminal A
npm run dev:speedtest
# Terminal B
npm run dev
```

Open http://127.0.0.1:43123

## Measurement VPS

```bash
cd /opt/speedcheck
docker compose up -d --build speedtest
curl -fsS https://speed.example.com/health
```

Point `NEXT_PUBLIC_SPEEDTEST_URL` at the VPS HTTPS origin. Do **not** proxy measurement payloads through Vercel.

## Database

```bash
# Supabase SQL editor or CLI
psql "$DATABASE_URL" -f supabase/migrations/20260322000000_init.sql
```

## Vercel env

Set all `NEXT_PUBLIC_*` and server secrets from `.env.example`. Redeploy after changes.

## HTTPS

Terminate TLS at Cloudflare or Caddy in front of the Go service. Enable HTTP/2. Do not compress `/download` or `/upload` bodies (identity encoding is intentional).

Example Caddy config: [`deploy/Caddyfile.example`](../deploy/Caddyfile.example).

```bash
# On the VPS
sudo cp deploy/Caddyfile.example /etc/caddy/Caddyfile
# edit hostname, then:
sudo systemctl reload caddy
curl -fsS https://speed.example.com/health
```

## Database migrations & jobs

```bash
psql "$DATABASE_URL" -f supabase/migrations/20260322000000_init.sql
# Schedule retention + aggregates (daily)
psql "$DATABASE_URL" -f scripts/retention.sql
psql "$DATABASE_URL" -f scripts/aggregate_stats.sql
```

## Monitoring & alerting

| Signal | Source | Suggested alert |
|--------|--------|-----------------|
| Measurement health | `GET /health` → `healthy=false` | Page within 2m |
| Capacity rejections | `/admin/metrics` `testsRejectedToday` spike | Warn if >5% of starts |
| Daily bandwidth | `bytesTransferredToday / dailyLimitBytes` | Warn at 80%, page at 95% |
| Web availability | Vercel / uptime check on `/` | Page on 5xx |
| Failure rate | analytics `speed_test_failed` / started | Warn if >10% |
| Completion rate | completed / started | Warn if <85% |

Pull admin metrics with:

```bash
curl -fsS -H "Authorization: Bearer $SPEEDTEST_ADMIN_TOKEN" \
  https://speed.example.com/admin/metrics
```

Wire these into UptimeRobot, Better Stack, Grafana Cloud, or Cloudflare Health Checks. Keep tokens in the secret store—never in frontend env.

## Health & rollback

- Health: `GET /health` on measurement service; Vercel deployment health
- Rollback web: promote previous Vercel deployment
- Rollback speedtest: `docker compose up -d` with the prior image tag
- Feature flags: `NEXT_PUBLIC_ENABLE_ADS=false` kills ads without redeploying binary
- Quotas: lower `SPEEDTEST_DAILY_BANDWIDTH_GB` via `/admin/config` under incident load

## CI

GitHub Actions runs typecheck, lint, unit tests, Next build, and Go tests on push.
