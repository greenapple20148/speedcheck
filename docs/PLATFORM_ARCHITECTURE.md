# MySpeedGauge — Platform architecture assessment (Phase 1)

## 1. Existing architecture assessment

| Layer | Current state |
|-------|----------------|
| **Web** | Next.js App Router, TypeScript, Tailwind, Radix/shadcn-style UI, Recharts |
| **Measurement** | Client `engine.ts` → Go service (VPS) direct HTTPS; aggregate Mbps; bufferbloat in Standard mode |
| **Results API** | `POST /api/results` → Supabase `test_results` or local JSON / Vercel `/tmp` |
| **History** | Browser `localStorage` (`history-store.ts`), `/results/history` with charts + plan settings |
| **Health UX** | `connection-assessment.ts`, `connection-insights.ts`, `diagnose.ts` (rule-based), `DiagnosisCard` |
| **Network context** | `GET /api/network` (ISP/city, masked IP) |
| **SEO** | Tool pages, guides, sitemap, JSON-LD |
| **Auth** | None (anonymous); optional `user_id` column unused |
| **Prisma** | Not used |
| **OpenAI** | Not integrated |

**Preserved:** speed test engine, Go VPS, Vercel deploy, existing assessment thresholds.

## 2. Feature gap analysis

| Vision feature | Gap | Phase |
|----------------|-----|-------|
| AI troubleshooting | Rules exist; no AI narrative API or “Diagnose” flow | **1** |
| Historical monitoring | localStorage only; no 90d analytics, hour/day buckets, Supabase sync | 1 partial / **2** |
| ISP accountability PDF | Plan form exists; no PDF, no copy-to-ISP | **2** |
| Gaming diagnostics | Generic gaming chip in assessment; no dedicated page/profiles | **3** |
| Wi‑Fi vs Ethernet | `connectionTag` wifi/wired; no comparison dashboard | **2** |
| Packet loss | Not measured (UI shows —) | **3** |
| Unified nav / diagnostics hub | Partial header links | **1** |
| Premium / billing | Not started | Future |

## 3. Proposed database changes (Phase 2+)

Extend Supabase (no Prisma):

```sql
-- internet_plans (user plan expectations; link to anonymous session_id until auth)
-- diagnostic_reports (speed_test_result_id, findings_json, ai_summary, recommendations_json)
-- connection_comparisons (name, test_result_ids[])
-- test_results: add bufferbloat_*, loaded_latency_ms, connection_type, methodology_version, metadata jsonb
```

Phase 1 continues **localStorage + optional Supabase** for `test_results` only.

## 4. New API endpoints (Phase 1)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/diagnostics/analyze` | Rule engine + optional OpenAI narrative |
| GET | `/api/diagnostics/health` | Feature flags / AI availability |

Existing: `/api/results`, `/api/network`, `/api/speedtest/config`.

## 5. UI component structure (Phase 1)

```
src/app/diagnostics/page.tsx          — hub + tool cards
src/components/diagnostics/
  diagnose-connection-panel.tsx       — post-test AI + rules
  diagnostics-tool-grid.tsx
src/components/layout/site-header-nav.tsx — History, Diagnostics
speed-test-dashboard.tsx              — wires Diagnose after complete
```

Cloudflare-style speed panel remains homepage primary.

## 6. Measurement limitations & accuracy risks

- Mbps is to **selected measurement server**, not global ISP capacity.
- Bufferbloat grades reflect **saturation during our test**, not 24/7 behavior.
- No packet loss without new protocol (ICMP/WebRTC) — do not fabricate.
- Browser cannot detect Wi‑Fi band/Ethernet — user labels only.
- AI must **not** claim router/ISP fault from bandwidth alone.
- Multi-connection aggregate Mbps fixed in PR #14; server CPU still caps small VPS.
- History in one browser ≠ account-wide monitoring.

## 7. Implementation plan

### Phase 1 (this delivery)

1. Structured diagnostic report builder (rules + history hints).
2. Server-side `/api/diagnostics/analyze` with rate limit + Zod + OpenAI fallback.
3. “Diagnose My Connection” UI on completed tests.
4. `/diagnostics` hub + header nav.
5. Tests for report builder.
6. Env docs for `OPENAI_API_KEY`, feature flags.

### Phase 2

ISP plan comparison, PDF, Wi‑Fi/Ethernet comparison UI, Supabase migrations, extended history dashboard.

### Phase 3

Gaming page, game info profiles, packet loss (if feasible), monitoring agent design doc only.
