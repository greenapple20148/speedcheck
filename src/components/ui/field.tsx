import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const fieldControlClass =
  "mt-1.5 h-11 w-full min-w-0 rounded-xl border border-border bg-[var(--input-bg)] px-3 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: ReactNode;
  hint?: string;
  error?: string | null;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block min-w-0 text-sm font-medium text-foreground", className)}>
      <span className="inline-flex items-center gap-1.5">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs font-normal text-destructive" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1 block text-xs font-normal leading-4 text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}
