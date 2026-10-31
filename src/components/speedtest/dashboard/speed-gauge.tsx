"use client";

import {
  formatGaugeScaleLabel,
  gaugeScaleMaxMbps,
  speedToArcProgress,
} from "@/lib/speedtest/ui-config";
import { formatSpeedParts } from "@/lib/utils";
import type { TestPhase } from "@/types/speedtest";

interface SpeedGaugeProps {
  valueMbps: number | null;
  phase: TestPhase;
  showSpeed: boolean;
}

const R = 100;
const STROKE = 16;
const CX = 120;
const CY = 120;
const C = 2 * Math.PI * R;
const ARC_LEN = (270 / 360) * C;

function centerLabel(phase: TestPhase): string {
  if (phase === "upload") return "UPLOAD";
  return "DOWNLOAD";
}

export function SpeedGauge({ valueMbps, phase, showSpeed }: SpeedGaugeProps) {
  const idle = phase === "idle";
  const live = phase === "download" || phase === "upload";
  const scaleMax = gaugeScaleMaxMbps(showSpeed ? valueMbps : null);
  const progress = live || phase === "complete" ? speedToArcProgress(valueMbps, scaleMax) : 0;
  const offset = ARC_LEN * (1 - progress);
  const parts = showSpeed ? formatSpeedParts(valueMbps) : null;
  const label = centerLabel(phase);
  const maxLabel = formatGaugeScaleLabel(scaleMax);

  const ariaLabel =
    idle
      ? "Ready to test download speed"
      : parts
        ? `${label === "UPLOAD" ? "Upload" : "Download"} speed ${parts.amount} ${parts.unit} on a 0 to ${maxLabel} scale`
        : "Speed test in progress";

  return (
    <div className="flex w-full max-w-[280px] flex-col items-center">
      <div className="relative w-full" style={{ aspectRatio: "1 / 0.88" }}>
        <svg
          viewBox="0 0 240 220"
          className="h-full w-full"
          role="img"
          aria-label={ariaLabel}
        >
          <g transform={`rotate(135 ${CX} ${CY})`}>
            <circle
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke="var(--gauge-track)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${ARC_LEN} ${C}`}
              aria-hidden
            />
            {!idle && (
              <circle
                cx={CX}
                cy={CY}
                r={R}
                fill="none"
                stroke="var(--accent-teal)"
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={`${ARC_LEN} ${C}`}
                strokeDashoffset={offset}
                className="motion-safe:transition-[stroke-dashoffset] motion-safe:duration-500 motion-safe:ease-out"
                aria-hidden
              />
            )}
          </g>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2 text-center">
          {idle ? (
            <p className="text-[15px] font-medium text-muted-foreground">Ready to test</p>
          ) : (
            <>
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {label}
              </span>
              <span className="speed-value mt-1 text-[4rem] font-bold leading-none tracking-tight text-foreground">
                {parts?.amount ?? "—"}
              </span>
              {parts && (
                <span className="mt-1 text-sm font-medium text-muted-foreground">
                  {parts.unit}
                </span>
              )}
            </>
          )}
        </div>
        {!idle && (
          <>
            <span
              className="absolute bottom-1 left-[18%] text-[11px] font-medium text-muted-foreground"
              aria-hidden
            >
              0
            </span>
            <span
              className="absolute bottom-1 right-[12%] text-[11px] font-medium text-muted-foreground"
              aria-hidden
            >
              {maxLabel}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
