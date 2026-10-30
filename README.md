# SpeedCheck

SEO-first internet speed testing platform with **real** download/upload measurements, bandwidth quotas, shareable results, and monetization hooks.

## Stack

- **Web:** Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui
- **Measurement:** Go service (signed sessions, quotas, concurrency limits)
- **Data:** Supabase PostgreSQL schema + local JSON fallback for development

## Quick start

```bash
cp .env.example .env.local
npm install

# Terminal 1 — measurement service (required for real tests)
npm run dev:speedtest

# Terminal 2 — web UI
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js on port 43123 |
| `npm run dev:speedtest` | Go measurement service on 18443 |
| `npm run build` | Production web build |
| `npm test` | Vitest unit/contract tests |
| `npm run test:go` | Go unit/API tests |
| `npm run test:e2e` | Playwright (servers must be up) |
| `npm run typecheck` | TypeScript check |

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Measurement traffic goes **directly** from the browser to the Go service (`NEXT_PUBLIC_SPEEDTEST_URL`), not through Vercel.

## Documentation

- [Agent progress](docs/AGENT_PROGRESS.md)
- [Decisions](docs/DECISIONS.md)
- [SEO strategy](docs/SEO_STRATEGY.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Cost model](docs/COST_MODEL.md)
- [Test results](docs/TEST_RESULTS.md)

## Docker

```bash
docker compose up -d --build speedtest
```

Optional Postgres profile: `docker compose --profile db up -d`

## License notes

SpeedCheck’s measurement service is an independent implementation. LibreSpeed (MIT) was reviewed as prior art; we did not vendor its source. See `docs/DECISIONS.md`.
