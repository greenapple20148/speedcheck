import {
  gradeFromLatencyIncrease,
  type BufferbloatGrade,
} from "@/lib/speedtest/bufferbloat-config";
import { median } from "@/lib/network/latency";

export { median };

export interface BufferbloatResult {
  idleMs: number;
  loadedDownMs: number | null;
  loadedUpMs: number | null;
  grade: BufferbloatGrade;
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
