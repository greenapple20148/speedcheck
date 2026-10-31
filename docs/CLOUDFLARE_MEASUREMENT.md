# Cloudflare edge measurement

MySpeedGauge can run speed tests with either:

1. **Dedicated** — browser → your Go service (`NEXT_PUBLIC_SPEEDTEST_URL` / proxy). Full control, bufferbloat sampling, no third-party logging.
2. **Cloudflare** — browser → [`@cloudflare/speedtest`](https://www.npmjs.com/package/@cloudflare/speedtest) → official endpoints `https://speed.cloudflare.com/__down` and `/__up`. Traffic does **not** pass through Next.js or Vercel.

## Configuration

| Variable | Values | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_SPEEDTEST_PROVIDER` | `auto` (default), `cloudflare`, `dedicated` | Select engine |
| `NEXT_PUBLIC_SPEEDTEST_URL` | HTTPS origin | Dedicated Go API |
| `SPEEDTEST_INTERNAL_URL` | Internal URL | Vercel proxy to Go (dedicated only) |

**`auto`:** use dedicated when `NEXT_PUBLIC_SPEEDTEST_URL` (or proxy) is ready; otherwise Cloudflare.

## What is measured (Cloudflare)

| Metric | Supported |
|--------|-----------|
| Download / upload | Yes (library percentile aggregation) |
| Latency / jitter (idle) | Yes |
| Loaded latency (standard mode) | Yes → bufferbloat grade on MySpeedGauge |
| Packet loss | **No by default** — requires your own TURN credentials ([library docs](https://github.com/cloudflare/speedtest#packetloss)) |
| Colo | Yes — `/cdn-cgi/trace` from the browser (no GPS) |
| Visitor ISP | From existing `/api/network` (edge headers / lookup), not from the speedtest library |

## Production notes

- Cloudflare may **log aggregated results** when tests complete ([library README](https://www.npmjs.com/package/@cloudflare/speedtest)). Review Cloudflare terms before enabling site-wide.
- Do not proxy `__down` / `__up` through your API — CORS and bandwidth limits are designed for direct browser access.
- **Lightweight** mode uses a shorter measurement schedule and `bandwidthAbortRequestDuration` to limit data use.
- For parity with historical MySpeedGauge results, keep **`dedicated`** on your DigitalOcean node.

## Local development

- Default **auto** with local proxy → **dedicated** (Go on `:18443`).
- To try Cloudflare locally: `NEXT_PUBLIC_SPEEDTEST_PROVIDER=cloudflare` in `.env.local`.
