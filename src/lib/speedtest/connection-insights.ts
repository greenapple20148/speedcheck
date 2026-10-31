export type Suitability = "excellent" | "good" | "fair" | "poor" | "unknown";

export interface InsightItem {
  id: string;
  label: string;
  detail: string;
  explanation: string;
  suitability: Suitability;
}

export interface InsightInput {
  downloadMbps: number | null;
  uploadMbps: number | null;
  pingMs: number | null;
  jitterMs: number | null;
}

function tier(
  okExcellent: boolean,
  okGood: boolean,
  okFair: boolean,
): Suitability {
  if (okExcellent) return "excellent";
  if (okGood) return "good";
  if (okFair) return "fair";
  return "poor";
}

/**
 * Heuristic suitability from this test's download/upload/ping/jitter.
 * Does not measure packet loss; not a guarantee of real-world performance.
 */
export function buildConnectionInsights(metrics: InsightInput): InsightItem[] {
  const { downloadMbps: dl, uploadMbps: ul, pingMs: ping, jitterMs: jitter } =
    metrics;

  if (dl == null || ul == null || ping == null || jitter == null) {
    return [];
  }

  const browsing = tier(dl >= 25, dl >= 10, dl >= 3);
  const streaming = tier(dl >= 100, dl >= 50, dl >= 25);
  const video = tier(
    ul >= 10 && ping <= 80,
    ul >= 5 && ping <= 120,
    ul >= 3 && ping <= 180,
  );
  const gaming = tier(
    ping <= 30 && jitter <= 10 && dl >= 25,
    ping <= 50 && jitter <= 20 && dl >= 15,
    ping <= 90 && jitter <= 35,
  );

  return [
    {
      id: "browsing",
      label: "Browsing",
      detail: "Web, email, light apps",
      suitability: browsing,
      explanation:
        browsing === "excellent"
          ? "High measured download for pages and apps."
          : browsing === "poor"
            ? "Low download may feel sluggish on media-heavy sites."
            : "Adequate for basic browsing; heavy sites may load slowly.",
    },
    {
      id: "streaming",
      label: "HD / 4K Streaming",
      detail: "Video on one or more screens",
      suitability: streaming,
      explanation:
        streaming === "excellent"
          ? "Download headroom for HD/4K on multiple devices."
          : streaming === "poor"
            ? "May buffer on HD unless only one stream is active."
            : "Fine for HD; 4K may need more sustained download.",
    },
    {
      id: "video-calls",
      label: "Video Calls",
      detail: "Two-way audio and video",
      suitability: video,
      explanation:
        video === "excellent"
          ? "Upload and latency look strong for stable calls."
          : video === "poor"
            ? "Upload or latency may cause drops or poor quality."
            : "Usable for calls; quality depends on Wi‑Fi and platform.",
    },
    {
      id: "gaming",
      label: "Online Gaming",
      detail: "Latency-sensitive play",
      suitability: gaming,
      explanation:
        gaming === "excellent"
          ? "Low measured latency. Actual gaming still varies by game server."
          : gaming === "poor"
            ? "Higher latency or jitter may affect responsiveness."
            : "Playable for many titles; competitive play may feel less crisp.",
    },
  ];
}

export const suitabilityLabel: Record<Suitability, string> = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  poor: "Limited",
  unknown: "—",
};
