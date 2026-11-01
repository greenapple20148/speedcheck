import type { StoredHistoryEntry } from "@/lib/speedtest/history-store";
import type { BufferbloatGrade } from "@/types/speedtest";

export interface HealthSnapshot {
  id: string;
  testedAt: string;
  source: "speed-test" | "room-test";
  provider: "cloudflare" | "dedicated" | null;
  endpointName: string | null;
  connection: "wifi" | "wired" | null;
  roomId: string | null;
  roomLabel: string | null;
  downloadMbps: number | null;
  uploadMbps: number | null;
  pingMs: number | null;
  jitterMs: number | null;
  idleLatencyMs: number | null;
  loadedDownMs: number | null;
  loadedUpMs: number | null;
  loadedLatencyMs: number | null;
  bufferbloatGrade: BufferbloatGrade | null;
  packetLossPercent: number | null;
}

export function providerLabel(provider: HealthSnapshot["provider"]): string {
  if (provider === "cloudflare") return "Cloudflare";
  if (provider === "dedicated") return "Dedicated measurement server";
  return "Not recorded";
}

export function snapshotFromHistory(entry: StoredHistoryEntry): HealthSnapshot {
  const loaded = loadedLatency(entry.bufferbloatLoadedDownMs, entry.bufferbloatLoadedUpMs);
  return {
    id: entry.id,
    testedAt: entry.createdAt,
    source: "speed-test",
    provider: entry.provider ?? null,
    endpointName: entry.serverName ?? null,
    connection: entry.connectionTag ?? null,
    roomId: null,
    roomLabel: null,
    downloadMbps: entry.downloadMbps,
    uploadMbps: entry.uploadMbps,
    pingMs: entry.pingMs,
    jitterMs: entry.jitterMs,
    idleLatencyMs: entry.bufferbloatIdleMs ?? entry.pingMs,
    loadedDownMs: entry.bufferbloatLoadedDownMs ?? null,
    loadedUpMs: entry.bufferbloatLoadedUpMs ?? null,
    loadedLatencyMs: loaded,
    bufferbloatGrade: entry.bufferbloatGrade ?? null,
    packetLossPercent: entry.packetLossPercent ?? null,
  };
}

export function snapshotFromRoom(input: {
  roomId: string;
  roomLabel: string;
  downloadMbps: number | null;
  uploadMbps: number | null;
  pingMs: number | null;
  jitterMs: number | null;
  testedAt: string;
  endpointName: string | null;
}): HealthSnapshot {
  return {
    id: `room:${input.roomId}:${input.testedAt}`,
    testedAt: input.testedAt,
    source: "room-test",
    provider: null,
    endpointName: input.endpointName,
    connection: "wifi",
    roomId: input.roomId,
    roomLabel: input.roomLabel,
    downloadMbps: input.downloadMbps,
    uploadMbps: input.uploadMbps,
    pingMs: input.pingMs,
    jitterMs: input.jitterMs,
    idleLatencyMs: input.pingMs,
    loadedDownMs: null,
    loadedUpMs: null,
    loadedLatencyMs: null,
    bufferbloatGrade: null,
    packetLossPercent: null,
  };
}

export function latestSnapshot(entries: StoredHistoryEntry[]): HealthSnapshot | null {
  const withTime = entries.filter((entry) => entry.createdAt);
  if (withTime.length === 0) return null;
  const latest = [...withTime].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
  return latest ? snapshotFromHistory(latest) : null;
}

function loadedLatency(down: number | null | undefined, up: number | null | undefined): number | null {
  const values = [down, up].filter((value): value is number => value != null && !Number.isNaN(value));
  if (values.length === 0) return null;
  return Math.max(...values);
}
