import { jitterFromSamples } from "@/lib/network/jitter";

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/** Nearest-rank percentile. p is 0–100. */
export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[rank];
}

export interface RttSummary {
  medianMs: number | null;
  p95Ms: number | null;
  jitterMs: number | null;
  failurePercent: number | null;
  sampleCount: number;
  validCount: number;
}

/** Summarize HTTP RTT samples. Null entries are failed requests. */
export function summarizeRtt(samples: Array<number | null>): RttSummary {
  const valid = samples.filter((n): n is number => n != null && Number.isFinite(n));
  const sampleCount = samples.length;
  if (sampleCount === 0) {
    return {
      medianMs: null,
      p95Ms: null,
      jitterMs: null,
      failurePercent: null,
      sampleCount: 0,
      validCount: 0,
    };
  }
  return {
    medianMs: median(valid),
    p95Ms: percentile(valid, 95),
    jitterMs: jitterFromSamples(valid),
    failurePercent: ((sampleCount - valid.length) / sampleCount) * 100,
    sampleCount,
    validCount: valid.length,
  };
}
