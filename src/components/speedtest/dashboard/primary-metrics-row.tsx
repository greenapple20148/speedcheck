"use client";

import { ArrowDown, ArrowUp, Activity, Waves } from "lucide-react";
import { pingDescriptor, jitterDescriptor } from "@/lib/speedtest/ui-config";
import { cn, formatMs, formatSpeedParts } from "@/lib/utils";

interface PrimaryMetricsRowProps {
  downloadMbps: number | null;
  uploadMbps: number | null;
  pingMs: number | null;
  jitterMs: number | null;
  activePhase?: "download" | "upload" | "ping" | null;
  showCaptions: boolean;
  uploadCaption?: string | null;
}

function SpeedMetric({
  label,
  icon: Icon,
  valueMbps,
  active,
  prominent,
  caption,
}: {
  label: string;
  icon: typeof ArrowDown;
  valueMbps: number | null;
  active?: boolean;
  prominent?: boolean;
  caption?: string | null;
}) {
  const parts = formatSpeedParts(valueMbps);
  return (
    <div
      className={cn(
        "min-w-0 flex-1 border-r border-[var(--card-border)] px-3 py-2 last:border-r-0 sm:px-4",
        active && "bg-primary/[0.04]",
      )}
    >
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p
        className={cn(
          "speed-value mt-1 font-bold tabular-nums text-foreground",
          prominent ? "text-[1.75rem] sm:text-[2rem]" : "text-xl sm:text-2xl",
        )}
      >
        {parts ? (
          <>
            {parts.amount}
            <span className="ml-1 text-sm font-semibold text-muted-foreground">
              {parts.unit}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </p>
      {caption && (
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{caption}</p>
      )}
    </div>
  );
}

function LatencyMetric({
  label,
  icon: Icon,
  valueMs,
  active,
  caption,
}: {
  label: string;
  icon: typeof Activity;
  valueMs: number | null;
  active?: boolean;
  caption?: string | null;
}) {
  return (
    <div
      className={cn(
        "min-w-0 flex-1 border-r border-[var(--card-border)] px-3 py-2 last:border-r-0 sm:px-4",
        active && "bg-primary/[0.04]",
      )}
    >
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="speed-value mt-1 text-xl font-bold tabular-nums text-foreground sm:text-2xl">
        {valueMs != null ? (
          <>
            {formatMs(valueMs)}
            <span className="ml-1 text-sm font-semibold text-muted-foreground">ms</span>
          </>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </p>
      {caption && (
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{caption}</p>
      )}
    </div>
  );
}

export function PrimaryMetricsRow({
  downloadMbps,
  uploadMbps,
  pingMs,
  jitterMs,
  activePhase,
  showCaptions,
  uploadCaption,
}: PrimaryMetricsRowProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-[var(--card-border)] lg:rounded-xl lg:border lg:border-[var(--card-border)]">
      <SpeedMetric
        label="Download"
        icon={ArrowDown}
        valueMbps={downloadMbps}
        prominent
        active={activePhase === "download"}
      />
      <SpeedMetric
        label="Upload"
        icon={ArrowUp}
        valueMbps={uploadMbps}
        prominent
        active={activePhase === "upload"}
        caption={showCaptions ? uploadCaption : null}
      />
      <LatencyMetric
        label="Ping"
        icon={Activity}
        valueMs={pingMs}
        active={activePhase === "ping"}
        caption={showCaptions ? pingDescriptor(pingMs) : null}
      />
      <LatencyMetric
        label="Jitter"
        icon={Waves}
        valueMs={jitterMs}
        caption={showCaptions ? jitterDescriptor(jitterMs) : null}
      />
    </div>
  );
}
