# Measurement validation notes

Reviewed the client engine (`src/lib/speedtest/engine.ts`) and Go service handlers as part of production polish (Oct 2026).

## Throughput (download / upload)

- **Mbps** = `(bytes × 8) / (elapsedMs / 1000) / 1_000_000` per chunk (`bytesToMbps`).
- Download reads the full response body; upload sends random octets and uses server-reported `receivedBytes` when present.
- Final phase Mbps uses the **upper half** of per-chunk samples to reduce TCP slow-start bias (documented in code).
- Download and upload are **separate phases** with independent worker pools and session byte budgets.
- Client requests use `cache: "no-store"` and `Cache-Control: no-cache`; the Go service wraps routes with `Cache-Control: no-store`.
- Go `/download` streams a **zero-filled** payload (not `crypto/rand`) so small VPS CPUs are not the bottleneck.
- **Standard** sessions use **8** parallel download/upload connections; **lightweight** uses 2.

## Results above ~1 Gbps

Very high Mbps (e.g. 1.3 Gbps on localhost) are **often real for the measurement path**, not UI bugs:

1. **Loopback / local dev** — Browser → `127.0.0.1:18443` never leaves the machine; OS loopback can sustain multi‑Gbps.
2. **Concurrent workers** — Multiple parallel download/upload connections multiply throughput samples; final Mbps averages the upper half of per-chunk rates (can exceed single-stream ISP speed).
3. **Short chunks** — Small transfers on fast links finish in milliseconds; timing is still correct but variance is high.
4. **Not WAN** — Production tests should use a remote measurement node (`NEXT_PUBLIC_SPEEDTEST_URL` on a VPS) for ISP-representative numbers.

No clamping or “plausibility” caps are applied in the UI or engine.

## Ping / jitter

- Eight GET `/ping` samples; **first sample dropped** as warmup.
- **Ping** = mean of remaining RTTs.
- **Jitter** = mean absolute difference between consecutive RTTs (internal convention, not RFC 3550).

## Chart duration vs test duration

1. UI samples are throttled to **120ms** apart.
2. Only **download/upload** phases emit throughput samples.
3. Lightweight mode uses smaller budgets — fewer chart points is expected.

## Gauge ring (UI)

- **During download/upload:** ring fill = live Mbps vs a fixed display scale (`gauge-scale.ts`).
- **After complete:** neutral full ring = finished test; center still shows **download** Mbps (not a speed-scale fill).

## Engine changes

No measurement math changes in this audit — values are reported as computed.
