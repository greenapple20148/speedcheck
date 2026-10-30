import { cn, formatMbps, formatMs } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: number | null;
  unit: "Mbps" | "ms";
  icon: LucideIcon;
  className?: string;
}

export function MetricCard({
  label,
  value,
  unit,
  icon: Icon,
  className,
}: MetricCardProps) {
  const display =
    unit === "Mbps" ? formatMbps(value) : formatMs(value);
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card px-4 py-4 shadow-soft",
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-heading text-2xl font-bold tabular-nums text-foreground md:text-3xl">
          {display}
        </span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}
