import { median } from "@/lib/network/latency";
import type { RoomMeasurement } from "@/lib/mesh/types";
import type { SpeedMetrics } from "@/types/speedtest";

const SAMPLES_PER_ROOM = 8;
const STORED_SAMPLES = 80;

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

export interface RoomSummary {
  roomId: string;
  sampleCount: number;
  downloadMbps: number | null;
  uploadMbps: number | null;
  pingMs: number | null;
  jitterMs: number | null;
  loadedLatencyMs: number | null;
  testedAt: string;
  endpointName: string | null;
  provider: RoomMeasurement["provider"];
  mixedProvider: boolean;
}

function finite(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value);
}

function medianOf(samples: RoomMeasurement[], key: "downloadMbps" | "uploadMbps" | "pingMs" | "jitterMs" | "loadedLatencyMs"): number | null {
  return median(samples.map((sample) => sample[key]).filter(finite));
}

export function roomSamples(measurements: RoomMeasurement[], roomId: string): RoomMeasurement[] {
  return measurements.filter((sample) => sample.roomId === roomId);
}

/** Median of the saved samples for one room. Null when that room has no test. */
export function summarizeRoom(measurements: RoomMeasurement[], roomId: string): RoomSummary | null {
  const samples = roomSamples(measurements, roomId);
  if (samples.length === 0) return null;
  const latest = [...samples].sort((a, b) => Date.parse(b.testedAt) - Date.parse(a.testedAt))[0] ?? samples[0];
  const providers = new Set(samples.map((sample) => sample.provider ?? null));
  return {
    roomId,
    sampleCount: samples.length,
    downloadMbps: medianOf(samples, "downloadMbps"),
    uploadMbps: medianOf(samples, "uploadMbps"),
    pingMs: medianOf(samples, "pingMs"),
    jitterMs: medianOf(samples, "jitterMs"),
    loadedLatencyMs: medianOf(samples, "loadedLatencyMs"),
    testedAt: latest.testedAt,
    endpointName: latest.endpointName,
    provider: providers.size === 1 ? latest.provider ?? null : null,
    mixedProvider: providers.size > 1,
  };
}

export function bestRoomDownload(measurements: RoomMeasurement[]): number | null {
  const ids = [...new Set(measurements.map((sample) => sample.roomId))];
  return bestDownloadMbps(ids.map((roomId) => ({ downloadMbps: summarizeRoom(measurements, roomId)?.downloadMbps ?? null })));
}

export function loadedLatencyMs(down: number | null | undefined, up: number | null | undefined): number | null {
  const values = [down, up].filter(finite);
  if (values.length === 0) return null;
  return Math.max(...values);
}

export function roomSampleFromResult(roomId: string, result: {
  metrics: SpeedMetrics;
  serverName: string | null;
  testedAt: string;
  provider: "cloudflare" | "dedicated";
}): RoomMeasurement {
  return {
    roomId,
    downloadMbps: result.metrics.downloadMbps,
    uploadMbps: result.metrics.uploadMbps,
    pingMs: result.metrics.pingMs,
    jitterMs: result.metrics.jitterMs,
    testedAt: result.testedAt,
    endpointName: result.serverName,
    loadedLatencyMs: loadedLatencyMs(result.metrics.bufferbloatLoadedDownMs, result.metrics.bufferbloatLoadedUpMs),
    provider: result.provider,
  };
}

/** Keep the newest samples, with a cap per room and for the whole plan. */
export function appendRoomSample(measurements: RoomMeasurement[], sample: RoomMeasurement): RoomMeasurement[] {
  const counts = new Map<string, number>();
  const kept: RoomMeasurement[] = [];
  for (const row of [sample, ...measurements]) {
    const count = counts.get(row.roomId) ?? 0;
    if (count >= SAMPLES_PER_ROOM) continue;
    counts.set(row.roomId, count + 1);
    kept.push(row);
    if (kept.length >= STORED_SAMPLES) break;
  }
  return kept;
}
