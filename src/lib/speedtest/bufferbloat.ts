import {
  gradeFromLatencyIncrease,
  type BufferbloatGrade,
} from "@/lib/speedtest/bufferbloat-config";

export interface BufferbloatResult {
  idleMs: number;
  loadedDownMs: number | null;
  loadedUpMs: number | null;
  grade: BufferbloatGrade;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/** Worse direction (max latency increase) determines grade. */
export function computeBufferbloat(
  idleMs: number,
  loadedDownSamples: number[],
  loadedUpSamples: number[],
): BufferbloatResult | null {
  const loadedDownMs = median(loadedDownSamples);
  const loadedUpMs = median(loadedUpSamples);
  if (loadedDownMs == null && loadedUpMs == null) return null;

  const incDown =
    loadedDownMs != null ? Math.max(0, loadedDownMs - idleMs) : 0;
  const incUp = loadedUpMs != null ? Math.max(0, loadedUpMs - idleMs) : 0;
  const worst = Math.max(incDown, incUp);
  return {
    idleMs,
    loadedDownMs,
    loadedUpMs,
    grade: gradeFromLatencyIncrease(worst),
  };
}
