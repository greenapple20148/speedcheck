# SpeedCheck Architecture

## Overview

SpeedCheck is an SEO-first internet speed testing platform with three primary layers:

1. **Web application** (Next.js on Vercel) — UI, SEO pages, result APIs, analytics
2. **Measurement service** (Go on VPS) — real download/upload/ping/jitter over HTTPS
3. **Database** (Supabase PostgreSQL) — results, servers, quotas, SEO metadata, affiliates

```
Browser
  │
  ├─ HTML/SSR/SSG ──────────────► Next.js (Vercel)
  │                                  │
  │                                  ├─ Result APIs ──► Supabase
  │                                  └─ Admin/analytics
  │
  └─ Measurement (direct) ───────► Go SpeedTest Service (VPS)
                                      │
                                      ├─ Signed sessions
                                      ├─ Download/upload streams
                                      ├─ Rate limits & quotas
                                      └─ Health/metrics
```

## Measurement Flow

1. Client requests `POST /sessions` with mode (`lightweight` | `standard`).
2. Server returns a short-lived HMAC-signed session token and test parameters.
3. Client runs ping samples against `GET /ping`.
4. Client opens N concurrent downloads from `GET /download` and measures bytes/time.
5. Client uploads to `POST /upload` similarly.
6. Client computes Mbps, jitter; optionally persists via Next.js API.
7. Session budget is enforced server-side (bytes + duration + concurrency).

## Key Packages

| Path | Role |
|------|------|
| `src/app` | Next.js routes and SEO pages |
| `src/components` | UI, speedometer, ads, layout |
| `src/lib/speedtest` | Client measurement engine |
| `services/speedtest` | Go measurement backend |
| `supabase/migrations` | SQL schema |
| `docs/` | Living documentation |

## Security

- Session tokens: HMAC-SHA256, short TTL, bound to mode/budget
- Admin endpoints: `ADMIN_TOKEN` bearer auth
- CORS: allowlisted frontend origins
- No raw IP persistence by default
- Rate limiting + daily transfer quotas

## Bandwidth Cost Control

- Lightweight mode (~8–20 MB total)
- Standard mode (~40–100 MB total, configurable)
- Per-session byte budgets
- Server-wide concurrency limits
- Daily transfer caps with graceful 429 responses
