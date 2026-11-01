import type { TestMode } from "@/types/speedtest";

/** Subset of @cloudflare/speedtest measurement config (see library docs). */
export type CfMeasurement =
  | { type: "latency"; numPackets: number }
  | {
      type: "download" | "upload";
      bytes: number;
      count: number;
      bypassMinDuration?: boolean;
    };

/** Lower data use; still uses percentile aggregation inside the library. */
export const CLOUDFLARE_LIGHTWEIGHT_MEASUREMENTS: CfMeasurement[] = [
  { type: "latency", numPackets: 1 },
  { type: "download", bytes: 1e5, count: 1, bypassMinDuration: true },
  { type: "latency", numPackets: 12 },
  { type: "download", bytes: 1e5, count: 5 },
  { type: "upload", bytes: 1e5, count: 4 },
  { type: "download", bytes: 1e6, count: 4 },
  { type: "upload", bytes: 1e6, count: 3 },
  { type: "download", bytes: 1e7, count: 2 },
  { type: "upload", bytes: 1e7, count: 2 },
];

/** Standard profile: library default ramp-up (omit to use package defaults). */
export function cloudflareEngineOptions(mode: TestMode) {
  const lightweight = mode === "lightweight";
  return {
    autoStart: false as const,
    downloadApiUrl: "https://speed.cloudflare.com/__down",
    uploadApiUrl: "https://speed.cloudflare.com/__up",
    measureDownloadLoadedLatency: !lightweight,
    measureUploadLoadedLatency: !lightweight,
    bandwidthFinishRequestDuration: lightweight ? 800 : 1000,
    bandwidthAbortRequestDuration: lightweight ? 12_000 : 0,
    latencyPercentile: 0.5,
    bandwidthPercentile: 0.9,
    bandwidthMinRequestDuration: 10,
    ...(lightweight
      ? { measurements: CLOUDFLARE_LIGHTWEIGHT_MEASUREMENTS }
      : {}),
  };
}

export function bpsToMbps(bps: number | undefined): number | null {
  if (bps == null || !Number.isFinite(bps) || bps <= 0) return null;
  return bps / 1_000_000;
}
