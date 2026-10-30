# Feature Inventory

## Measurement

- [x] Real download streaming (random bytes, no compression)
- [x] Real upload sink with byte accounting
- [x] Ping samples + jitter calculation
- [x] Multi-connection throughput
- [x] Adaptive duration / per-session budgets
- [x] Lightweight + standard modes
- [x] Signed HMAC sessions with TTL
- [x] Cancellation endpoint
- [x] Invalid session rejection
- [x] Server list + health endpoints

## Bandwidth controls

- [x] Per-session byte budgets
- [x] Max test duration
- [x] Server-wide concurrency caps
- [x] Daily transfer quotas
- [x] Per-IP rate limiting
- [x] Admin metrics/config (token-protected)
- [x] Graceful 429 / 503 responses

## Results & privacy

- [x] Anonymous result persistence (local JSON / Supabase)
- [x] Optional local browser history
- [x] Private-by-default results
- [x] Opt-in public share links
- [x] Masked IP display (no raw IP storage by default)
- [x] SQL migrations + RLS stubs

## SEO

- [x] Tool pages (internet/wifi/upload/ping/jitter)
- [x] Guides (3)
- [x] Mbps→MB/s converter
- [x] Curated ISP pages (3)
- [x] Curated location pages (3)
- [x] Metadata, canonicals, OG, sitemap, robots
- [x] FAQ / Article JSON-LD
- [x] Breadcrumbs + internal links

## Monetization

- [x] AdSense slot component (feature-flagged)
- [x] Reserved ad dimensions (CLS-safe)
- [x] Affiliate offer cards + disclosure
- [x] Sponsored labels + `rel=sponsored`
- [x] Click analytics event

## Analytics & ops

- [x] Client events (start/complete/fail/cancel/share/affiliate)
- [x] Optional privacy beacon API
- [x] GA4 script hook (env-gated)
- [x] Protected admin analytics dashboard
- [x] Docker + Compose + CI workflows
- [x] Deployment / cost / SEO docs
