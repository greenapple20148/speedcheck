"use client";

import type { TestPhase } from "@/types/speedtest";
import { cn, formatSpeedParts } from "@/lib/utils";

const PHASE_LABEL: Partial<Record<TestPhase, string>> = {
  preparing: "Preparing",
  ping: "Ping",
  download: "Download",
  upload: "Upload",
  saving: "Saving",
};

interface LiveSpeedHeroProps {
  phase: TestPhase;
  progress: number;
  valueMbps: number | null;
  showLive: boolean;
}

export function LiveSpeedHero({
  phase,
  progress,
  valueMbps,
  showLive,
}: LiveSpeedHeroProps) {
  if (!showLive) return null;

  const parts = formatSpeedParts(valueMbps);
  const label = PHASE_LABEL[phase] ?? "Testing";

  return (
    <div className="border-b border-[var(--card-border)] pb-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p
            className="speed-value mt-1 text-[2.5rem] font-bold text-foreground motion-safe:transition-[opacity] motion-safe:duration-200 sm:text-[3rem]"
            aria-live="polite"
          >
            {parts ? (
              <>
                {parts.amount}
                <span className="ml-2 text-lg font-semibold text-muted-foreground">
                  {parts.unit}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </p>
        </div>
        <p className="text-[13px] text-muted-foreground">{Math.round(progress * 100)}%</p>
      </div>
      <div
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--gauge-track)]"
        role="progressbar"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-full bg-primary motion-safe:transition-[width] motion-safe:duration-300",
          )}
          style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
        />
      </div>
    </div>
  );
}
