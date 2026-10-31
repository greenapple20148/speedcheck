export interface ResultSummaryTier {
  headline: string;
  supporting: string;
}

/** Tiered headline + supporting copy from download speed (Mbps) only. */
export function buildResultSummaryTier(
  downloadMbps: number | null,
): ResultSummaryTier | null {
  if (downloadMbps == null || Number.isNaN(downloadMbps)) return null;

  if (downloadMbps >= 1000) {
    return {
      headline: "Gigabit-class connection",
      supporting:
        "Plenty for several 4K streams, large downloads, and cloud backups at the same time.",
    };
  }
  if (downloadMbps >= 100) {
    return {
      headline: "Fast connection",
      supporting:
        "Strong for HD and 4K streaming, video calls, and quick file transfers on multiple devices.",
    };
  }
  if (downloadMbps >= 25) {
    return {
      headline: "Good for everyday use",
      supporting:
        "Fine for browsing, HD streaming on one screen, and typical video calls.",
    };
  }
  return {
    headline: "Limited speed",
    supporting:
      "May struggle with HD video, large downloads, or several users online at once.",
  };
}

/** @deprecated Use buildResultSummaryTier for UI */
export function buildResultSummary(metrics: {
  downloadMbps: number | null;
}): string | null {
  const tier = buildResultSummaryTier(metrics.downloadMbps);
  return tier ? `${tier.headline}. ${tier.supporting}` : null;
}
