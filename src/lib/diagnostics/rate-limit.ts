const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 20;

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Best-effort in-memory limiter (resets on cold start — acceptable for Phase 1). */
export function checkDiagnosticsRateLimit(key: string): {
  ok: boolean;
  retryAfterSec?: number;
} {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now > b.resetAt) {
    b = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, b);
  }
  if (b.count >= MAX_PER_WINDOW) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((b.resetAt - now) / 1000),
    };
  }
  b.count += 1;
  return { ok: true };
}
