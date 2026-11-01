# Implementation plan

Branch: `feat/myspeedgauge-platform` (from current `main`).

## Audit (this branch)

The app already measured real throughput against the Go service. Mbps is `(bytes × 8) / (seconds × 1,000,000)` from bytes read or bytes the server reports. Latency is HTTP, not ICMP. SEO metadata, sitemap, robots, AdSense flags, GA4, and Supabase already existed. The visual system was a dark gold theme. History and server saves happened automatically after every test. Affiliate cards pointed at `example.com`.

## Done in this branch

- Light teal design system, Inter, compact homepage, tool navigation.
- Working routes for speed, ping, jitter, bufferbloat, request loss, stability, gaming, streaming, video calls, DNS timing, troubleshooter, calculators, guides, methodology, about, contact, settings, and history.
- Download warm-up excluded from the byte count. Download windows start at the first body byte when the stream exposes chunks.
- Standard idle latency uses 20 samples after one warm-up sample.
- History save is explicit unless Settings turns automatic saving on.
- Measurement kill switch. Ads render only when a flag and a client id are set. Placeholder affiliate URLs are not shown.
- AI diagnostics require an explicit server flag.
- Unit tests for the new math, diagnosis rule, and kill switch.

## Deferred

- MDX compiler. Guides are typed modules in `src/content/guides.ts` so they can be reviewed as source. Adding `@next/mdx` was skipped to avoid a second content pipeline beside the existing TSX guides.
- Supabase Auth and the new session tables are specified in a migration but not written by the browser. Explicit saves still use `test_results`.
- A Web Worker for transfers. Fetch streams already run with `AbortController`. Moving them would not reduce bandwidth.
- Multiple regional endpoints and any game-server measurement. The UI says so.
- The remaining editorial backlog (night congestion, 4K streaming, ISP speed checks, and the rest of the 20-topic list). Those pages are not published.
- WebRTC packet loss. No validated endpoint is configured, so the page reports HTTP request loss only.
- Playwright covers the homepage, a real lightweight test, a real standard test with loaded latency, tool-page screenshots, cancel and failure, the troubleshooter, a calculator, mobile navigation, and history deletion. Results are in `docs/production-readiness-report.md` for the audit run; re-run the suite after later edits.

## Suggested next milestones

1. Apply the new Supabase migration in a project and connect “Save” to `test_sessions` with RLS, keeping anonymous users on local storage.
2. Publish the next reviewed guides one at a time.
3. Point `NEXT_PUBLIC_SPEEDTEST_URL` at a budgeted measurement host and confirm the kill switch in that environment.
