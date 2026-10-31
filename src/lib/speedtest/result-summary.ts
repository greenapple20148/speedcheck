import type { SpeedMetrics } from "@/types/speedtest";

/** Short neutral summary from measured values only. */
export function buildResultSummary(metrics: SpeedMetrics): string | null {
  const dl = metrics.downloadMbps;
  const ul = metrics.uploadMbps;
  const ping = metrics.pingMs;
  const jitter = metrics.jitterMs;

  if (dl == null || ul == null || ping == null || jitter == null) {
    return null;
  }

  if (dl < 3 || ping > 200) {
    return "Your connection may struggle with most online activities.";
  }

  if (ping > 120 || jitter > 40) {
    return "Your connection may struggle with video calls and real-time apps.";
  }

  if (dl < 10 || ul < 2) {
    return "Your connection is usable for light browsing but may feel slow.";
  }

  if (dl >= 100 && ul >= 20 && ping <= 50) {
    return "Great speeds for streaming, calls, and everyday use.";
  }

  if (dl >= 25 && ping <= 80) {
    return "Your connection is performing well for typical household use.";
  }

  return "Results look moderate — performance varies by Wi‑Fi and server load.";
}
