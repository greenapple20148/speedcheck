/**
 * SI megabits per second.
 * Mbps = (bytes × 8) / (elapsedSeconds × 1_000_000)
 */
export function bytesToMbps(bytes: number, elapsedMs: number): number {
  if (!Number.isFinite(bytes) || !Number.isFinite(elapsedMs)) return 0;
  if (bytes <= 0 || elapsedMs <= 0) return 0;
  return (bytes * 8) / (elapsedMs / 1000) / 1_000_000;
}

export interface TransferSpan {
  bytes: number;
  firstMs: number;
  lastMs: number;
}

/**
 * Browsers allow about six HTTP/1.1 connections per host. Loaded-latency probes
 * share that host, so throughput workers stay at or below four whenever those
 * probes must run during the transfer.
 */
export function throughputConnectionCount(
  requested: number,
  measureLoadedLatency: boolean,
): number {
  const n = Number.isFinite(requested) ? Math.floor(requested) : 1;
  const safe = Math.max(1, n);
  const cap = measureLoadedLatency ? 4 : 6;
  return Math.min(safe, cap);
}

/** Aggregate parallel transfers over the union of their transfer windows. */
export function aggregateThroughput(spans: TransferSpan[]): {
  bytes: number;
  elapsedMs: number;
  mbps: number;
} {
  let bytes = 0;
  let first = Number.POSITIVE_INFINITY;
  let last = 0;
  for (const span of spans) {
    if (span.bytes <= 0) continue;
    bytes += span.bytes;
    first = Math.min(first, span.firstMs);
    last = Math.max(last, span.lastMs);
  }
  const elapsedMs = bytes > 0 ? Math.max(1, last - first) : 0;
  return { bytes, elapsedMs, mbps: bytesToMbps(bytes, elapsedMs) };
}
