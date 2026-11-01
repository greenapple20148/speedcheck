import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MetricTile({
  label,
  value,
  hint,
  icon,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 rounded-[20px] border border-border bg-card px-4 py-3 text-card-foreground", className)}>
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-1 font-heading text-2xl font-semibold tabular-nums leading-none text-foreground">{value}</p>
      {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
