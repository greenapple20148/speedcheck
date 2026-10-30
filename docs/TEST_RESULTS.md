# Test Results

Last verified: 2026-10-30 (America/New_York evening run)

## Go measurement service — PASSED

```
go test ./...
ok  bandwidth
ok  handlers  (includes session/download/upload, invalid token, admin auth, daily quota 429, rate limit 429)
ok  session
```

Manual live checks against `http://127.0.0.1:18443`:

- Session create → 201
- Download transferred exact requested bytes
- Upload acknowledged received bytes
- Invalid token → 401
- Cancel → cancelled true

## Frontend unit / contract — PASSED

```
npm test
9 tests passed (utils, throughput math, results Zod contract)
```

## Lint / typecheck / build — PASSED

```
npm run lint       # clean
npm run typecheck  # clean
npm run build      # Next.js 16 production build, 29 routes
```

## Playwright E2E — PASSED

```
npx playwright test
2 passed (homepage hero/GO, SEO tool pages)
```

## API smoke — PASSED

- `POST /api/results` stores private result
- `GET /api/admin/analytics` unauthorized without token; OK with token
- `/sitemap.xml` and `/robots.txt` serve correctly

## Controlled network note

Local loopback throughput is not comparable to WAN speed tests. Expect ±10–20% variance vs reference tools on the same remote path under identical conditions.
