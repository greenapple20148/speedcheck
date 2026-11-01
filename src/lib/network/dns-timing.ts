/**
 * Resource Timing DNS duration, only when the browser actually exposed a lookup.
 * A zero or missing interval is unavailable (cache, connection reuse, or cross-origin),
 * not a 0 ms DNS lookup.
 */
export function domainLookupMs(
  entry: Pick<PerformanceResourceTiming, "domainLookupStart" | "domainLookupEnd">,
): number | null {
  const start = entry.domainLookupStart;
  const end = entry.domainLookupEnd;
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (start <= 0 || end <= 0 || end < start) return null;
  const ms = end - start;
  if (ms <= 0) return null;
  return ms;
}
