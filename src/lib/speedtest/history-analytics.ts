import type { StoredHistoryEntry } from "@/lib/speedtest/history-store";

export type HistoryRange = "24h" | "7d" | "30d" | "all";

export function filterByRange(
  entries: StoredHistoryEntry[],
  range: HistoryRange,
): StoredHistoryEntry[] {
  if (range === "all") return entries;
  const now = Date.now();
  const ms =
    range === "24h"
      ? 24 * 60 * 60 * 1000
      : range === "7d"
        ? 7 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000;
  return entries.filter((e) => now - new Date(e.createdAt).getTime() <= ms);
}

export function filterByTag(
  entries: StoredHistoryEntry[],
  tag: "all" | "wifi" | "wired",
): StoredHistoryEntry[] {
  if (tag === "all") return entries;
  return entries.filter((e) => e.connectionTag === tag);
}

export interface RangeStats {
  avgDownload: number | null;
  avgUpload: number | null;
  bestDownload: number | null;
  worstDownload: number | null;
  planPercent: number | null;
}

export function computeRangeStats(
  entries: StoredHistoryEntry[],
  planDownloadMbps: number | null,
): RangeStats {
  const dl = entries.map((e) => e.downloadMbps).filter((v): v is number => v != null);
  const ul = entries.map((e) => e.uploadMbps).filter((v): v is number => v != null);
  const avg = (arr: number[]) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  const avgDownload = avg(dl);
  return {
    avgDownload,
    avgUpload: avg(ul),
    bestDownload: dl.length ? Math.max(...dl) : null,
    worstDownload: dl.length ? Math.min(...dl) : null,
    planPercent:
      planDownloadMbps && avgDownload
        ? Math.round((avgDownload / planDownloadMbps) * 100)
        : null,
  };
}

/** Downsample for chart display (oldest → newest). */
export function downsampleSeries<T>(points: T[], maxPoints = 120): T[] {
  if (points.length <= maxPoints) return points;
  const step = points.length / maxPoints;
  const out: T[] = [];
  for (let i = 0; i < maxPoints; i++) {
    out.push(points[Math.floor(i * step)]!);
  }
  return out;
}

export function chartSummarySentence(
  entries: StoredHistoryEntry[],
  stats: RangeStats,
): string {
  if (entries.length === 0) return "No tests in this range.";
  const n = entries.length;
  const avg = stats.avgDownload != null ? `${stats.avgDownload.toFixed(1)} Mbps average download` : "download data unavailable";
  return `${n} tests in range; ${avg}.`;
}
