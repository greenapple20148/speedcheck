"use client";

import { cn, formatMs, formatSpeedParts } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface MetricTileProps {
  label: string;
  value: number | null;
  unit: "Mbps" | "ms";
  icon?: LucideIcon;
  active?: boolean;
  primary?: boolean;
}

export function MetricTile({
  label,
  value,
  unit,
  icon: Icon,
  active,
  primary,
}: MetricTileProps) {
  const speed = unit === "Mbps" ? formatSpeedParts(value) : null;
  const amount = unit === "Mbps" ? (speed?.amount ?? "—") : formatMs(value);
  const unitLabel = unit === "Mbps" ? (speed?.unit ?? "Mbps") : "ms";

  return (
    <div
      className={cn(
        "flex min-h-[76px] min-w-0 flex-col justify-center rounded-xl bg-muted px-2 py-2 text-center motion-safe:transition-colors",
        active && "ring-1 ring-primary/25",
        primary && "lg:min-h-[80px]",
      )}
    >
      <div className="flex items-center justify-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />}
        <span className="truncate">{label}</span>
      </div>
      <div
        className={cn(
          "mt-1 flex flex-col items-center tabular-nums text-foreground",
          primary ? "gap-0" : "gap-0",
        )}
      >
        <span
          className={cn(
            "font-semibold leading-none",
            primary ? "text-[1.75rem] lg:text-[1.875rem]" : "text-[1.5rem] lg:text-[1.625rem]",
          )}
        >
          {amount}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {unitLabel}
        </span>
      </div>
    </div>
  );
}
