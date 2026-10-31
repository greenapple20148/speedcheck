/** Map activity chip labels to a 0–5 star score (Cloudflare-style network quality). */

const STATUS_STARS: Record<string, number> = {
  Good: 5,
  Fair: 3,
  Unstable: 2,
  Limited: 2,
  Poor: 1,
};

export function statusToStars(status: string): number {
  return STATUS_STARS[status] ?? 0;
}

export interface QualityScoreRow {
  id: string;
  label: string;
  stars: number;
  maxStars: number;
}

export function buildNetworkQualityScores(
  activities: Array<{ id: string; label: string; status: string }>,
): QualityScoreRow[] {
  const order = ["streaming", "gaming", "video-calls"] as const;
  const labels: Record<string, string> = {
    streaming: "Streaming",
    gaming: "Gaming",
    "video-calls": "Video calls",
  };
  const byId = new Map(activities.map((a) => [a.id, a]));
  return order.map((id) => {
    const a = byId.get(id);
    return {
      id,
      label: labels[id] ?? a?.label ?? id,
      stars: a ? statusToStars(a.status) : 0,
      maxStars: 5,
    };
  });
}
