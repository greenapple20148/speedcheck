"use client";

import {
  buildConnectionInsights,
  suitabilityLabel,
  type Suitability,
} from "@/lib/speedtest/connection-insights";
import type { SpeedMetrics } from "@/types/speedtest";
import { cn } from "@/lib/utils";

const tone: Record<Suitability, string> = {
  excellent: "text-success",
  good: "text-primary",
  fair: "text-warning",
  poor: "text-destructive",
  unknown: "text-muted-foreground",
};

const dot: Record<Suitability, string> = {
  excellent: "bg-success",
  good: "bg-primary",
  fair: "bg-warning",
  poor: "bg-destructive",
  unknown: "bg-muted-foreground",
};

interface ConnectionQualitySummaryProps {
  metrics: SpeedMetrics;
  visible: boolean;
}

export function ConnectionQualitySummary({
  metrics,
  visible,
}: ConnectionQualitySummaryProps) {
  if (!visible) return null;
  const items = buildConnectionInsights(metrics);
  if (items.length === 0) return null;

  return (
    <div className="rounded-xl bg-muted px-3.5 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Connection quality
      </p>
      <ul className="mt-2.5 grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex min-w-0 items-start gap-2 text-[13px] leading-snug"
          >
            <span
              className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", dot[item.suitability])}
              aria-hidden
            />
            <span className="min-w-0">
              <span className="font-medium text-foreground">{item.label}</span>
              <span className={cn(" ml-1.5 font-semibold", tone[item.suitability])}>
                {suitabilityLabel[item.suitability]}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
