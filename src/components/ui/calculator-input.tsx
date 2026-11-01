import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const calculatorControlClass =
  "mt-1.5 h-11 w-full min-w-0 rounded-xl border border-[#E2E8E5] bg-white px-3 text-sm text-[#10231F] outline-none focus-visible:border-[#006B53] focus-visible:ring-2 focus-visible:ring-[#006B53]/30 [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-[var(--input-bg)] [[data-theme=dark]_&]:text-foreground";

export function CalculatorInput({
  id,
  label,
  error,
  hint,
  children,
  className,
  labelExtra,
}: {
  id: string;
  label: ReactNode;
  error?: string | null;
  hint?: string;
  children: ReactNode;
  className?: string;
  labelExtra?: ReactNode;
}) {
  const errorId = `${id}-error`;
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-center gap-1.5">
        <label htmlFor={id} className="text-sm font-medium text-[#10231F] [[data-theme=dark]_&]:text-foreground">
          {label}
        </label>
        {labelExtra}
      </div>
      {children}
      {error ? (
        <p id={errorId} className="mt-1 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs leading-4 text-[#64748B] [[data-theme=dark]_&]:text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
