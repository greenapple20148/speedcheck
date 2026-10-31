"use client";

import { cn, formatMs, formatSpeedParts } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: number | null;
  unit: "speed" | "ms";
  caption?: string | null;
  active?: boolean;
}

export function MetricCard({ label, value, unit, caption, active }: MetricCardProps) {
  const speed = unit === "speed" ? formatSpeedParts(value) : null;
  const amount = unit === "speed" ? (speed?.amount ?? "—") : formatMs(value);
  const unitLabel = unit === "speed" ? (speed?.unit ?? "Mbps") : "ms";

  return (
    <article
      className={cn(
        "flex min-h-[88px] min-w-0 flex-col justify-center rounded-xl border border-[var(--card-border)] bg-[var(--surface-subtle)] px-3 py-2.5",
        active && "ring-1 ring-[var(--accent-teal)]/30",
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-[2.125rem] font-bold leading-none tabular-nums text-foreground">
        {amount}
        <span className="ml-1.5 text-sm font-medium text-muted-foreground">{unitLabel}</span>
      </p>
      {caption && (
        <p className="mt-1.5 truncate text-[12px] text-muted-foreground">{caption}</p>
      )}
    </article>
  );
}
