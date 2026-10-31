"use client";

import {
  buildConnectionInsights,
  suitabilityLabel,
  type Suitability,
} from "@/lib/speedtest/connection-insights";
import type { SpeedMetrics } from "@/types/speedtest";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, MinusCircle, XCircle } from "lucide-react";

const iconFor: Record<Suitability, typeof CheckCircle2> = {
  excellent: CheckCircle2,
  good: MinusCircle,
  fair: AlertCircle,
  poor: XCircle,
  unknown: MinusCircle,
};

interface ConnectionQualityProps {
  metrics: SpeedMetrics;
  visible: boolean;
}

export function ConnectionQuality({ metrics, visible }: ConnectionQualityProps) {
  if (!visible) return null;
  const items = buildConnectionInsights(metrics);
  if (items.length === 0) return null;

  const ping = metrics.pingMs;

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--surface-subtle)] px-3.5 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Connection quality
      </p>
      <ul className="mt-2.5 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2">
        {items.map((item) => {
          const Icon = iconFor[item.suitability];
          const label =
            item.id === "gaming" && ping != null
              ? `${item.label} · ${formatMs(ping)} ms`
              : item.label;
          return (
            <li key={item.id} className="flex min-w-0 items-center gap-2 text-[14px]">
              <Icon className="h-4 w-4 shrink-0 text-foreground" aria-hidden />
              <span className="min-w-0 truncate font-medium text-foreground">{label}</span>
              <span
                className={cn(
                  "ml-auto shrink-0 text-[12px] font-semibold",
                  item.suitability === "excellent" && "text-[var(--success-text)]",
                  item.suitability === "good" && "text-[var(--accent-teal)]",
                  item.suitability === "fair" && "text-warning",
                  item.suitability === "poor" && "text-destructive",
                )}
              >
                <span className="sr-only">{item.suitability} </span>
                {suitabilityLabel[item.suitability]}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function formatMs(v: number): string {
  return v.toFixed(v < 10 ? 1 : 0);
}
