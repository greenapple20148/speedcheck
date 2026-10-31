"use client";

import { buildResultSummaryTier } from "@/lib/speedtest/result-summary";

interface ResultSummaryProps {
  downloadMbps: number | null;
  visible: boolean;
}

export function ResultSummary({ downloadMbps, visible }: ResultSummaryProps) {
  if (!visible) return null;
  const tier = buildResultSummaryTier(downloadMbps);
  if (!tier) return null;

  return (
    <div>
      <h3 className="text-lg font-bold text-foreground">{tier.headline}</h3>
      <p className="mt-1 text-[15px] leading-snug text-muted-foreground">{tier.supporting}</p>
    </div>
  );
}
