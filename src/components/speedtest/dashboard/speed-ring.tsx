"use client";

import { Check } from "lucide-react";
import { gaugeScaleMaxMbps, speedToRingProgress } from "@/lib/speedtest/gauge-scale";
import { formatSpeedParts } from "@/lib/utils";
import type { TestPhase } from "@/types/speedtest";

interface SpeedRingProps {
  valueMbps: number | null;
  phase: TestPhase;
  showSpeed: boolean;
  compact?: boolean;
}

const VIEW = 240;
const STROKE = 10;
const R = (VIEW - STROKE) / 2;
const C = 2 * Math.PI * R;

function phaseLabel(phase: TestPhase): string | null {
  if (phase === "upload") return "UPLOAD";
  if (phase === "download") return "DOWNLOAD";
  if (phase === "complete") return "DOWNLOAD";
  return null;
}

export function SpeedRing({ valueMbps, phase, showSpeed, compact }: SpeedRingProps) {
  const idle = phase === "idle";
  const complete = phase === "complete";
  const liveSpeed = phase === "download" || phase === "upload";
  const scaleMax = gaugeScaleMaxMbps(liveSpeed ? valueMbps : null);
  const speedProgress = liveSpeed ? speedToRingProgress(valueMbps, scaleMax) : 0;
  const activeOffset = C - C * speedProgress;
  const ringOffset = complete ? 0 : activeOffset;
  const ringStroke = complete ? "var(--gauge-track)" : "var(--accent-teal)";
  const parts = showSpeed ? formatSpeedParts(valueMbps) : null;
  const label = phaseLabel(phase);

  return (
    <div className="flex max-w-full flex-col items-center">
      <div
        className={
          compact
            ? "relative h-[190px] w-[190px] max-w-full lg:h-[210px] lg:w-[210px]"
            : "relative h-[200px] w-[200px] max-w-full sm:h-[220px] sm:w-[220px]"
        }
        role="img"
        aria-label={
          idle
            ? "Ready to test"
            : complete && parts
              ? `Test complete. Download ${parts.amount} ${parts.unit}`
              : parts
                ? `${label ?? "Speed"} ${parts.amount} ${parts.unit}`
                : "Speed test in progress"
        }
      >
        <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="h-full w-full -rotate-90">
          <circle
            cx={VIEW / 2}
            cy={VIEW / 2}
            r={R}
            fill="none"
            stroke="var(--gauge-track)"
            strokeWidth={STROKE}
          />
          <circle
            cx={VIEW / 2}
            cy={VIEW / 2}
            r={R}
            fill="none"
            stroke={ringStroke}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={idle || (!liveSpeed && !complete) ? C : ringOffset}
            className="motion-safe:transition-[stroke-dashoffset,stroke] motion-safe:duration-500 motion-safe:ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
          {idle ? (
            <p className="text-[14px] font-medium text-muted-foreground">
              Ready to test
            </p>
          ) : (
            <>
              {label && (
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  {label}
                </span>
              )}
              {!label && (phase === "ping" || phase === "preparing" || phase === "saving") && (
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  {phase === "ping" ? "LATENCY" : "CONNECTING"}
                </span>
              )}
              <span className="speed-value mt-0.5 text-[3rem] font-semibold leading-none tracking-tight text-foreground lg:text-[3.25rem]">
                {parts?.amount ?? "—"}
              </span>
              {showSpeed && parts && (
                <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {parts.unit}
                </span>
              )}
            </>
          )}
        </div>
      </div>
      {complete && (
        <div
          className="mt-1 flex items-center gap-1 text-[11px] font-medium text-muted-foreground"
          aria-label="Test finished. Neutral ring marks completion; center shows download speed."
        >
          <Check className="h-3.5 w-3.5 text-primary" aria-hidden />
          Test complete
        </div>
      )}
      {liveSpeed && scaleMax > 0 && (
        <p className="mt-1 max-w-[200px] text-center text-[10px] leading-snug text-muted-foreground">
          Live speed · 0–{scaleMax >= 1000 ? `${scaleMax / 1000} Gbps` : `${scaleMax} Mbps`} scale
        </p>
      )}
    </div>
  );
}
