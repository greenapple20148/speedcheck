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

Terminate TLS at Cloudflare or Caddy in front of the Go service. Enable HTTP/2. Disable response compression for `/download` (already identity).

## Health & rollback

- Health: `GET /health` on measurement service; Vercel deployment health
- Rollback web: previous Vercel deployment
- Rollback speedtest: `docker compose up -d` prior image tag
- Feature flags: `NEXT_PUBLIC_ENABLE_ADS=false` kills ads without redeploying binary

## CI

GitHub Actions runs typecheck, lint, unit tests, Next build, and Go tests on push.
