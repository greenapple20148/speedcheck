import { jitterFromSamples } from "@/lib/network/jitter";
import { median, percentile } from "@/lib/network/latency";

export interface StabilitySummary {
  medianMs: number | null;
  p95Ms: number | null;
  minMs: number | null;
  maxMs: number | null;
  jitterMs: number | null;
  failurePercent: number | null;
  sampleCount: number;
}

export function summarizeStability(samples: Array<number | null>): StabilitySummary {
  const valid = samples.filter((n): n is number => n != null && Number.isFinite(n));
  if (samples.length === 0) {
    return {
      medianMs: null,
      p95Ms: null,
      minMs: null,
      maxMs: null,
      jitterMs: null,
      failurePercent: null,
      sampleCount: 0,
    };
  }
  return {
    medianMs: median(valid),
    p95Ms: percentile(valid, 95),
    minMs: valid.length ? Math.min(...valid) : null,
    maxMs: valid.length ? Math.max(...valid) : null,
    jitterMs: jitterFromSamples(valid),
    failurePercent: ((samples.length - valid.length) / samples.length) * 100,
    sampleCount: samples.length,
  };
}
