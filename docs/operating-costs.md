# Operating costs

## What costs money

| Piece | Cost driver | Control |
| --- | --- | --- |
| Vercel | Page renders and small JSON APIs | Calculators and the troubleshooter do not call the network. Guides are static. |
| Go measurement host | Bytes transferred per test | Session budgets, duration caps, concurrency, and daily caps already exist in the Go service. |
| Supabase | Stored rows | Anonymous tests do not write. A write happens when the user saves, or when Settings enables automatic history. |
| OpenAI | Optional narrative | Off unless `DIAGNOSTICS_AI_ENABLED=true` and a key are set. |
| AdSense / GA4 | Third-party scripts | Off until the public ids and flags are set. |

There is no Redis, queue, or extra backend in this design.

## Default test size

Lightweight and standard budgets are the existing environment values (`SPEEDTEST_PER_TEST_BUDGET_MB_LIGHT`, `SPEEDTEST_PER_TEST_BUDGET_MB_STANDARD`, `SPEEDTEST_MAX_DURATION_SEC`). The client additionally spends at most 40% of the signed byte budget in each direction so parallel workers do not overrun the server quota.

A download warm-up of at most 64 KB is extra and is not included in the reported total.

Latency-only tools (ping, jitter, request loss, stability) do not move bulk payloads. A 5-minute stability run is one small HTTP request per second and only starts when the user presses Start.

## Kill switch

Set `MEASUREMENT_TESTS_ENABLED=false` and redeploy or restart the Next.js server. `/api/speedtest/config` then reports the test unavailable. Pages and calculators stay up.

## What not to assume

Cloudflare, a VPS, or a free egress tier is not an unlimited speed-test network. Price the measurement host from the provider’s current bandwidth rates and the daily cap in `SPEEDTEST_DAILY_BANDWIDTH_GB`. This document does not invent a dollar figure for a provider that is not selected here.

Affiliate URLs on `example.com` are hidden. Real programs should be added only with a disclosed `rel="sponsored"` link, which the component already sets.
