import {
  computeRangeStats,
  filterByRange,
} from "@/lib/speedtest/history-analytics";
import type { StoredHistoryEntry } from "@/lib/speedtest/history-store";
import type { HistoryInsight } from "@/lib/diagnostics/types";

export function buildHistoryInsights(
  history: StoredHistoryEntry[],
  planDownloadMbps: number | null,
): HistoryInsight[] {
  const insights: HistoryInsight[] = [];
  const last7 = filterByRange(history, "7d");
  if (last7.length < 3) return insights;

  const stats = computeRangeStats(last7, planDownloadMbps);

  if (
    stats.bestDownload != null &&
    stats.worstDownload != null &&
    stats.bestDownload > 0 &&
    stats.worstDownload / stats.bestDownload < 0.55
  ) {
    insights.push({
      id: "variance",
      title: "Speed varied a lot this week",
      detail: `Download ranged from about ${stats.worstDownload.toFixed(0)} to ${stats.bestDownload.toFixed(0)} Mbps across ${last7.length} tests. Congestion, Wi‑Fi, or time of day may explain the spread.`,
    });
  }

  if (stats.planPercent != null && stats.planPercent < 70) {
    insights.push({
      id: "plan-avg",
      title: "Recent average is below your plan",
      detail: `Your 7-day average download is about ${stats.planPercent}% of the speed in your plan settings. One test cannot prove an ISP issue — compare wired vs Wi‑Fi and test at different times.`,
    });
  }

  const byHour = bucketByHour(last7);
  const peak = worstHour(byHour);
  const off = bestHour(byHour);
  if (peak && off && peak.avg < off.avg * 0.75 && last7.length >= 5) {
    insights.push({
      id: "time-of-day",
      title: "Evening tests look slower on average",
      detail: `Tests around ${peak.label} averaged lower download than around ${off.label}. Try comparing peak vs off-peak before contacting your ISP.`,
    });
  }

  return insights;
}

function bucketByHour(entries: StoredHistoryEntry[]): Map<number, number[]> {
  const map = new Map<number, number[]>();
  for (const e of entries) {
    if (e.downloadMbps == null) continue;
    const h = new Date(e.createdAt).getHours();
    const list = map.get(h) ?? [];
    list.push(e.downloadMbps);
    map.set(h, list);
  }
  return map;
}

function avg(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function worstHour(map: Map<number, number[]>) {
  let worst: { hour: number; avg: number } | null = null;
  for (const [hour, vals] of map) {
    if (vals.length < 2) continue;
    const a = avg(vals);
    if (!worst || a < worst.avg) worst = { hour, avg: a };
  }
  return worst ? { label: formatHour(worst.hour), avg: worst.avg } : null;
}

function bestHour(map: Map<number, number[]>) {
  let best: { hour: number; avg: number } | null = null;
  for (const [hour, vals] of map) {
    if (vals.length < 2) continue;
    const a = avg(vals);
    if (!best || a > best.avg) best = { hour, avg: a };
  }
  return best ? { label: formatHour(best.hour), avg: best.avg } : null;
}

function formatHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}
