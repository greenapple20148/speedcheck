# Test Results

Last verified: 2026-10-30 ~23:50 UTC (evening America/New_York)

## Go measurement service — PASSED

```
go test ./...
ok  bandwidth
ok  handlers  (session/download/upload, invalid token, admin auth, daily quota 429, rate limit 429)
ok  session
```

Live checks against `http://127.0.0.1:18443` also exercised from Vitest `tests/api/live-speedtest.test.ts`.

## Frontend unit / contract — PASSED

```
npm test
13 tests passed (utils, throughput math, results Zod contract, timeouts, entropy chunking, live API)
```

## Lint / typecheck / build — PASSED

```
npm run lint
npm run typecheck
npm run build   # Next.js 16, 30 routes including /api/results/history
```

## Playwright E2E — PASSED

```
npx playwright test
6 passed:
  - homepage hero/GO
  - SEO tool pages
  - real lightweight GO measurement completes with metrics
  - mobile GO usability
  - a11y landmarks
  - sitemap + canonical validation
```

## Critical bugfixes verified in browser

1. Chromium `getRandomValues` 64 KiB entropy cap — chunked payload fill
2. Concurrent worker overshoot of signed session budget — reserved phase budget + graceful exhaustion

## Controlled network note

Local loopback Mbps is not comparable to WAN. Expect ±10–20% variance vs reference tools on the same remote path.
