const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export const DNS_PROBE_RATE_LIMIT = MAX_PER_WINDOW;
export const DNS_PROBE_RATE_WINDOW_MS = WINDOW_MS;

/**
 * Best-effort in-memory limit for the DNS timing probe.
 * Resets on cold start. This is not a resolver benchmark.
 */
export function checkDnsProbeRateLimit(
  key: string,
  now = Date.now(),
): { ok: boolean; retryAfterSec?: number } {
  let bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, bucket);
  }
  if (bucket.count >= MAX_PER_WINDOW) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  bucket.count += 1;
  return { ok: true };
}
