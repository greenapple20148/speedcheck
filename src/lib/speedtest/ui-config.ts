import type { Suitability } from "@/lib/speedtest/connection-insights";

/** Gauge display max steps in Mbps (1 / 2 / 5 / 10 Gbps). Not the user's plan. */
export const GAUGE_SCALE_MAX_MBPS = [1000, 2000, 5000, 10000] as const;

export function gaugeScaleMaxMbps(mbps: number | null | undefined): number {
  const value = Math.max(mbps ?? 0, 0);
  if (value <= 0) return GAUGE_SCALE_MAX_MBPS[1]; // default 2 Gbps scale
  for (const step of GAUGE_SCALE_MAX_MBPS) {
    if (value <= step * 0.92) return step;
  }
  return GAUGE_SCALE_MAX_MBPS[GAUGE_SCALE_MAX_MBPS.length - 1];
}

export function speedToArcProgress(mbps: number | null, scaleMaxMbps: number): number {
  if (mbps == null || scaleMaxMbps <= 0) return 0;
  return Math.min(Math.max(mbps / scaleMaxMbps, 0), 1);
}

export function formatGaugeScaleLabel(maxMbps: number): string {
  if (maxMbps >= 1000) return `${maxMbps / 1000} Gbps`;
  return `${maxMbps} Mbps`;
}

export const CONNECTION_QUALITY_THRESHOLDS = {
  browsing: {
    excellent: (dl: number) => dl >= 25,
    good: (dl: number) => dl >= 10,
    fair: (dl: number) => dl >= 3,
  },
  streaming: {
    excellent: (dl: number) => dl >= 100,
    good: (dl: number) => dl >= 50,
    fair: (dl: number) => dl >= 25,
  },
  videoCalls: {
    excellent: (ul: number, ping: number) => ul >= 10 && ping <= 80,
    good: (ul: number, ping: number) => ul >= 5 && ping <= 120,
    fair: (ul: number, ping: number) => ul >= 3 && ping <= 180,
  },
  gaming: {
    excellent: (ping: number, jitter: number, dl: number) =>
      ping <= 30 && jitter <= 10 && dl >= 25,
    good: (ping: number, jitter: number, dl: number) =>
      ping <= 50 && jitter <= 20 && dl >= 15,
    fair: (ping: number, jitter: number, dl: number) =>
      ping <= 90 && jitter <= 35,
  },
} as const;

export function rateFromThresholds(
  checks: { excellent: boolean; good: boolean; fair: boolean },
): Suitability {
  if (checks.excellent) return "excellent";
  if (checks.good) return "good";
  if (checks.fair) return "fair";
  return "poor";
}

export function pingDescriptor(pingMs: number | null): string | null {
  if (pingMs == null) return null;
  if (pingMs <= 20) return "Very low latency";
  if (pingMs <= 50) return "Low latency";
  if (pingMs <= 100) return "Moderate latency";
  return "High latency";
}

export function jitterDescriptor(jitterMs: number | null): string | null {
  if (jitterMs == null) return null;
  if (jitterMs <= 5) return "Very stable";
  if (jitterMs <= 15) return "Stable";
  if (jitterMs <= 30) return "Some variation";
  return "Unstable";
}

export function uploadDeltaCaption(
  currentUpload: number | null,
  previousUpload: number | null,
): string | null {
  if (currentUpload == null || previousUpload == null || previousUpload <= 0) {
    return null;
  }
  const pct = ((currentUpload - previousUpload) / previousUpload) * 100;
  if (Math.abs(pct) < 1) return "About the same vs. last test";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)}% vs. last test`;
}
