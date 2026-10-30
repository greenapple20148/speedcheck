# Architecture Decisions

## ADR-001: Custom Go speed test service (not LibreSpeed fork)

**Decision:** Implement a purpose-built Go measurement service inspired by LibreSpeed concepts rather than forking LibreSpeed.

**Rationale:**
- LibreSpeed (MIT) is suitable reference material for measurement patterns.
- We need first-class signed sessions, daily quotas, concurrency caps, and admin configuration.
- A clean Go service keeps measurement traffic off Vercel and under our control.

**License note:** We do not copy LibreSpeed source verbatim. Measurement concepts (download stream, upload sink, multi-connection, ping samples) are industry-standard and independently implemented.

## ADR-002: Measurement traffic bypasses the Next.js host

**Decision:** Browser clients talk directly to the speed test service origin (`NEXT_PUBLIC_SPEEDTEST_URL`).

**Rationale:** Routing multi-megabyte payloads through Vercel would inflate cost, add latency, and distort throughput.

## ADR-003: Supabase with local JSON store fallback

**Decision:** Schema and client code target Supabase PostgreSQL. When `SUPABASE_URL` is unset, the app uses a privacy-safe local file store for development.

## ADR-004: Privacy-first result storage

**Decision:** Do not store raw client IPs by default. Store truncated/hashed network hints only when needed for aggregates. Public sharing is opt-in.

## ADR-005: Monetization behind feature flags

**Decision:** AdSense and affiliate modules are disabled unless env flags are explicitly enabled. Layout reserves space so enabling ads does not shift Core Web Vitals unexpectedly.
