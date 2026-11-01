# Production readiness report

Date: 2026-11-01. Branch: `feat/myspeedgauge-platform`. No deploy was performed. No high-volume load test was run.

## Recommendation

Ship to a staging host after the measurement service is started with `SPEEDTEST_PRODUCTION=true`, a unique HMAC secret, a unique admin token, an explicit CORS allowlist, and `NEXT_PUBLIC_SITE_URL` set to the public origin. Leave ads off. A public launch should wait until that configuration is in place and a real egress price is applied to the bandwidth figures below.

## Features verified

| Tool | Method | Failure state | What was executed |
| --- | --- | --- | --- |
| Speed test | Real download and upload against the Go service. Mbps = (bytes × 8) / (seconds × 1e6). Download timing starts at the first body byte after a warm-up of at most 64 KB that is excluded from the total. Upload includes connection setup and prefers the server byte count. | Button stays disabled until `/api/speedtest/config` returns a base URL. Errors stay on the page. Dashes stay dashes until a run finishes. | Playwright lightweight run completed on the local service and the gauge left the em dash. |
| Ping and jitter | HTTP GET `/ping`, not ICMP. Standard idle path takes 21 samples and drops the first. Jitter is the mean absolute difference of successive valid RTTs. | Config unavailable shows an unavailable state, not a fabricated number. | Page render and overflow checks. The formulas are covered by unit tests. |
| Bufferbloat | Standard mode only. Loaded probes start before the transfer workers and repeat about every 200 ms until the workers finish. The client opens at most 4 throughput connections so an HTTP/1.1 browser still has a socket for those probes. Grade is increase over idle: A under 5 ms, B under 30, C under 60, D under 200, otherwise F. These grades are internal thresholds, not a certification. | Lightweight mode says loaded latency was not measured. | Playwright standard run opened detailed diagnostics and found a numeric download-loaded ping. |
| Request loss | Count of failed application HTTP requests, labeled as request loss. | Shown as not measured on the speed test. The dedicated tool reports the request-loss percent. | Page render. Unit test covers the percent helper. |
| Stability | Repeated HTTP probes for 30, 60, or 300 seconds. The run stops on cancel and on unmount. | No number until the run finishes. | Page render. |
| Gaming, streaming, video calls | The speed test is real. Suitability labels and the streaming/call Mbps figures are planning thresholds, not measurements of a game server, a video CDN, or a call service. | The troubleshooter refuses a gaming-lag diagnosis until an HTTP latency sample exists. | Page render and troubleshooter page. |
| DNS timing | Resource Timing for a same-origin config request. Lookup time is null when the interval is missing. | No invented DNS time. | Page render. Unit test covers a non-positive interval. |
| Troubleshooter | Deterministic rules in `src/lib/network/diagnosis.ts`. It does not call the AI route. | Missing measurements lower confidence and say what is missing. | Page render. Unit tests cover the rules. |
| Calculators | Arithmetic on the numbers the user enters. 1 decimal GB at 100 Mbps is 80 seconds before the efficiency factor. | A rate of 0 asks for a rate greater than 0. | Page render. Unit tests cover the unit conversion. |

## Tests passed and failed

Passed, and actually executed:

- `npm run typecheck` — exit 0.
- `npm run lint` — exit 0, with 2 existing warnings (`history-chart.tsx` unused `range`, `ui-config.ts` unused `dl`).
- `npm test` — Vitest, 21 files, 70 tests, all passed. Includes `tests/api/live-speedtest.test.ts` while `http://127.0.0.1:18443/health` was up, so the session, 256 KB download, upload, and bad-token assertions ran.
- `npm run test:go` — `internal/bandwidth`, `internal/handlers`, and `internal/session` passed. `cmd/server` and `internal/config` have no test files.
- `npx playwright test tests/e2e` — 44 tests passed. That includes desktop and mobile screenshots of the homepage and the primary tools (34 images under `test-results/audit-screenshots/`, gitignored), viewport checks at 1440×900 and 1366×768, a real lightweight test, a real standard test that displayed download-loaded ping, sitemap checks, and the Tools menu path to the bufferbloat page.
- `npm run build` — Next.js 16.4.3 production build completed. 61 static pages generated.

Failed: none of the commands above failed on the final tree.

Not run: a 100, 1,000, or 10,000 user load test. Capacity below is from the budgets in code.

## Bugs fixed

- Loaded-latency probes could queue behind the browser’s six HTTP/1.1 connections per host. Throughput workers are now capped at 4 while those probes run, and at 6 otherwise.
- An empty CORS allowlist allowed every origin. Cross-origin responses now require a listed origin.
- The rate limiter treated the whole `X-Forwarded-For` header as the client key. It now uses the TCP address unless `SPEEDTEST_TRUST_PROXY=true`, in which case it uses the last hop.
- `GET /ping` had no rate limit. The default is 1,200 requests per minute per IP (`SPEEDTEST_PING_RATE_LIMIT_PER_IP`).
- `SPEEDTEST_PRODUCTION=true` now refuses to start when the HMAC secret or admin token is still a development default.
- The public measurement proxy forwarded any path, including admin routes. It now allows only health, servers, sessions, sessions/cancel, ping, download, and upload.
- The start button sat below the gauge, metric tiles, and a decorative map, so it was outside a 768 px-tall window. Controls sit beside the metrics on desktop. The decorative dot map is gone. The idle line no longer says “Press refresh to start.”
- The speed test labeled a permanent dash as “Packet loss.” It now says request loss was not measured on that test.
- The start button could be pressed before configuration loaded and fail immediately. It stays disabled until a base URL is ready.
- AdSense and Google Analytics scripts were injected even if the visitor rejected consent. They load only after an accepted consent value.
- `/tools/mbps-to-mbs` duplicated `/mbps-to-mbs` in the sitemap. The old URL is `noindex` and its canonical is `/mbps-to-mbs`.
- Saved history could be removed one row at a time, and a “View” link pointed at ids that were never stored on the server. There is now “Delete all saved tests.” Deleting a saved row also sends `DELETE /api/results/:id`. The view link appears only after the results API returns an id.

## Outstanding issues

- ESLint still reports the two warnings above. They do not fail `npm run lint` because the warning budget is 50.
- The production build warns that an Edge runtime is deprecated and disables static generation for that route.
- `@vercel/analytics` is mounted in the root layout and is not gated by the consent banner.
- The consent banner stores a local accept/reject flag. It is not an IAB TCF CMP.
- Download and upload tokens are still passed in the query string, so they can land in access logs.
- Creating a session checks the concurrency limit and releases it immediately. Each download or upload request then takes one of the 50 slots. A session does not reserve capacity for its whole lifetime.
- Default HMAC and admin secrets still boot the service when `SPEEDTEST_PRODUCTION` is unset. Local development depends on that.
- Anyone who knows a result id can read or delete that result. The id is the capability. Results are not indexed (`/results/` is disallowed in `robots.txt` and omitted from the sitemap).
- City and ISP pages are short and mostly reuse the speed test. Do not generate more of them until each one has its own useful copy.
- `/` and `/speed-test` both run the speed test. They have different titles and the dedicated page adds method and FAQ copy. `/why-is-my-internet-slow` is the checklist and `/guides/why-is-my-internet-slow` is the article.
- Streaming and video-call suitability uses planning Mbps figures. DNS timing cannot see recursive resolver time beyond Resource Timing.

## Measurement accuracy limitations

- Latency is HTTP round trip to this service, not ICMP, and not the latency of a game, video, or call server.
- Request loss counts failed HTTP requests. It is not packet loss.
- Bufferbloat grades are this app’s thresholds.
- On HTTP/2, probes and transfers share a connection. On HTTP/1.1, four throughput connections leave room for a probe. A saturated link can still delay that probe inside the network, which is the effect the test is trying to see.
- The client spends at most 40% of the signed byte budget in each direction and stops at the session duration. A short or quiet run can under-fill the path and report a lower rate than a longer test.
- Upload timing includes connection setup. Download timing starts at the first counted body byte.
- Lightweight mode does not sample loaded latency.

## Estimated infrastructure costs

Estimates use the default budgets. They are not measurements from a load test.

A full standard test transfers about 32 MiB down and 32 MiB up (40% of the 80 MiB session budget each way) plus at most 64 KiB of warm-up. That is about 64.1 MiB per test.

| Daily standard tests | Approximate transfer | Against the 500 GiB daily cap |
| --- | --- | --- |
| 100 | 6.3 GiB | Inside the cap |
| 1,000 | 63 GiB | Inside the cap |
| 10,000 | 626 GiB | The cap starts refusing around 8,000 full standard tests |

A full lightweight test is about 16 MiB. 100 / 1,000 / 10,000 of those are about 1.6 / 16 / 156 GiB, all inside the default cap.

Ping, jitter, request-loss, and stability runs are tiny HTTP responses. A five-minute stability run is a few hundred small requests.

Concurrency: at most 4 transfer connections per active standard test and 50 concurrent transfer handlers, so on the order of 12 tests can move bulk data at once. Session creation is limited to 30 per minute per IP. Ping is limited to 1,200 per minute per IP.

Dollar cost is the measurement host’s egress price times the GiB above, plus a small Vercel bill for page renders and JSON. This report does not invent a provider price. Calculators, guides, and the troubleshooter do not move bulk data. AI stays off unless both `DIAGNOSTICS_AI_ENABLED=true` and `OPENAI_API_KEY` are set. Supabase writes happen when a visitor saves a result.

## SEO readiness

Ready for indexing of the diagnostic pages and the reviewed guides, with these controls already in the build:

- Titles, descriptions, canonical URLs, Open Graph, and Twitter cards come from `buildMetadata`.
- `sitemap.xml` includes the tools and guides and does not include `/results/` or `/admin/`.
- `robots.txt` allows `/` and `/history`, and disallows `/api/`, `/admin/`, and `/results/`.
- Tool pages emit WebApplication and FAQ structured data. The homepage emits WebApplication and FAQPage.
- `/tools/mbps-to-mbs` is noindex and canonicalizes to `/mbps-to-mbs`.
- `/results/history` is noindex. `/history` is the indexable history URL.
- Set `NEXT_PUBLIC_SITE_URL` in production or canonicals stay on the development origin.

## AdSense readiness

Not ready to turn on, and production ads were not enabled.

- An ad renders only when `NEXT_PUBLIC_ENABLE_ADS` or `NEXT_PUBLIC_ADS_ENABLED` is `true` and `NEXT_PUBLIC_ADSENSE_CLIENT_ID` is set. Otherwise the slot renders nothing, so the speed test does not depend on an ad.
- When ads are enabled, the slot reserves height. The AdSense script is injected only after the visitor accepts the consent banner.
- The banner is a local flag, not a certified CMP. Do not enable AdSense for regulated traffic until a real CMP is in place and a publisher id is configured.

## Security and privacy

- No production secrets were added. `.env.example` still shows the development HMAC and admin defaults and documents `SPEEDTEST_PRODUCTION`.
- The measurement proxy is limited to the test paths. Admin routes are not forwarded.
- CORS is an allowlist.
- History defaults to off. Saving is explicit or an opt-in preference. Rows can be deleted locally, and a saved server row is deleted by id.
- The service role key stays on the server. The new browser tables in the SQL migration are not wired to the client.
