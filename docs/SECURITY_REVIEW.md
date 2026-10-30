# Security Review

## Controls implemented

| Area | Control |
|------|---------|
| Sessions | HMAC-signed tokens; short TTL; budget binding |
| Admin APIs | Bearer `ADMIN_TOKEN` / `ADMIN_DASHBOARD_TOKEN` |
| CORS | Allowlisted frontend origins |
| Caching | `no-store` on measurement endpoints; identity encoding |
| Input | Zod validation on result payloads; event allowlists |
| Privacy | No raw IP persistence by default; PII keys stripped from analytics |
| Abuse | Rate limits, concurrency caps, daily quotas, cancel |
| Headers | nosniff, frame deny, referrer policy, permissions-policy |
| Secrets | Env-only; `.env*` gitignored |

## Tested

- Invalid measurement tokens → 401
- Admin without token → 401
- Daily quota exceeded → 429
- Session rate limit → 429
- Cancelled session rejected on subsequent use

## Residual risks / next hardening

- Add CAPTCHA or proof-of-work under sustained abuse
- Rotate HMAC secrets with dual-key verification
- Put measurement service behind Cloudflare with bot rules
- Enforce Supabase RLS policies for any direct client access (currently service-role via API)
- Add CSP once ad/analytics domains are finalized
- Penetration test before public launch

## Explicit non-actions

- No production DNS/Vercel deploy performed (requires authorization)
- No paid infrastructure purchased
- AdSense not assumed approved
