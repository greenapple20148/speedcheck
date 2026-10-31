/** Visual gauge scale steps (Mbps). Not the user's ISP plan — display only. */
export const GAUGE_SCALE_STEPS_MBPS = [
  25, 50, 100, 250, 500, 1000, 2000, 5000,
] as const;

export function gaugeScaleMaxMbps(mbps: number | null | undefined): number {
  const value = Math.max(mbps ?? 0, 0);
  if (value <= 0) return GAUGE_SCALE_STEPS_MBPS[0];
  for (const step of GAUGE_SCALE_STEPS_MBPS) {
    if (value <= step * 0.92) return step;
  }
  return GAUGE_SCALE_STEPS_MBPS[GAUGE_SCALE_STEPS_MBPS.length - 1];
}

export function speedToRingProgress(mbps: number | null, scaleMax: number): number {
  if (mbps == null || scaleMax <= 0) return 0;
  return Math.min(Math.max(mbps / scaleMax, 0), 1);
}
