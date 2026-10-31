"use client";

import {
  buildConnectionInsights,
  suitabilityLabel,
  type Suitability,
} from "@/lib/speedtest/connection-insights";
import type { SpeedMetrics } from "@/types/speedtest";
import { cn } from "@/lib/utils";
import { Gamepad2, Globe, MonitorPlay, Video } from "lucide-react";

const icons = {
  browsing: Globe,
  streaming: MonitorPlay,
  "video-calls": Video,
  gaming: Gamepad2,
};

const tone: Record<Suitability, string> = {
  excellent: "text-success",
  good: "text-primary",
  fair: "text-warning",
  poor: "text-destructive",
  unknown: "text-muted-foreground",
};

interface ConnectionInsightsProps {
  metrics: SpeedMetrics;
  visible: boolean;
}

export function ConnectionInsights({ metrics, visible }: ConnectionInsightsProps) {
  if (!visible) return null;
  const items = buildConnectionInsights(metrics);
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
          Connection insights
        </p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Based on this test only. Packet loss was not measured.
        </p>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = icons[item.id as keyof typeof icons] ?? Globe;
          return (
            <li
              key={item.id}
              className="rounded-xl bg-muted px-3 py-3"
            >
              <div className="flex gap-2">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-foreground">
                    {item.label}
                    <span className={cn(" ml-2 text-[12px] font-semibold", tone[item.suitability])}>
                      — {suitabilityLabel[item.suitability]}
                    </span>
                  </p>
                  <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
                    {item.explanation}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
