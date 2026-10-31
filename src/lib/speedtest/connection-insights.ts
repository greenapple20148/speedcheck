import {
  CONNECTION_QUALITY_THRESHOLDS,
  rateFromThresholds,
} from "@/lib/speedtest/ui-config";

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
  return rateFromThresholds({ excellent: okExcellent, good: okGood, fair: okFair });
}

export function buildConnectionInsights(metrics: InsightInput): InsightItem[] {
  const { downloadMbps: dl, uploadMbps: ul, pingMs: ping, jitterMs: jitter } =
    metrics;

  if (dl == null || ul == null || ping == null || jitter == null) {
    return [];
  }

  const t = CONNECTION_QUALITY_THRESHOLDS;
  const browsing = tier(
    t.browsing.excellent(dl),
    t.browsing.good(dl),
    t.browsing.fair(dl),
  );
  const streaming = tier(
    t.streaming.excellent(dl),
    t.streaming.good(dl),
    t.streaming.fair(dl),
  );
  const video = tier(
    t.videoCalls.excellent(ul, ping),
    t.videoCalls.good(ul, ping),
    t.videoCalls.fair(ul, ping),
  );
  const gaming = tier(
    t.gaming.excellent(ping, jitter, dl),
    t.gaming.good(ping, jitter, dl),
    t.gaming.fair(ping, jitter, dl),
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
      label: "4K streaming",
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
      label: "Video calls",
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
      label: "Gaming",
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
