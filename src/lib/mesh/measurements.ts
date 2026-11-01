export type ThroughputBand = "fast" | "mid" | "slow" | "unmeasured";

/** Compare a room's download with the best saved room. This is throughput, not signal strength. */
export function throughputBand(downloadMbps: number | null | undefined, bestMbps: number | null): ThroughputBand {
  if (downloadMbps == null || bestMbps == null || bestMbps <= 0) return "unmeasured";
  const ratio = downloadMbps / bestMbps;
  if (ratio >= 0.75) return "fast";
  if (ratio >= 0.4) return "mid";
  return "slow";
}

export function bestDownloadMbps(samples: Array<{ downloadMbps: number | null }>): number | null {
  const values = samples.map((sample) => sample.downloadMbps).filter((value): value is number => value != null && value > 0);
  if (values.length === 0) return null;
  return Math.max(...values);
}
