"use client";

import { cn, formatMbps } from "@/lib/utils";

interface SpeedometerProps {
  value: number | null;
  label?: string;
  progress?: number;
  active?: boolean;
  className?: string;
}

export function Speedometer({
  value,
  label = "Mbps",
  progress = 0,
  active = false,
  className,
}: SpeedometerProps) {
  const capped = Math.min(Math.max(value ?? 0, 0), 1000);
  const angle = (capped / 1000) * 220 - 110;
  const arcProgress = Math.min(Math.max(progress, 0), 1);

  return (
    <div className={cn("relative mx-auto w-full max-w-[320px]", className)}>
      {active && (
        <div
          aria-hidden
          className="animate-pulse-ring absolute inset-6 rounded-full bg-primary/15"
        />
      )}
      <svg viewBox="0 0 240 180" className="relative z-10 h-auto w-full">
        <defs>
          <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#A7E8D5" />
            <stop offset="50%" stopColor="#087F6D" />
            <stop offset="100%" stopColor="#066756" />
          </linearGradient>
        </defs>
        <path
          d="M30 150 A90 90 0 1 1 210 150"
          fill="none"
          stroke="#E3EAE6"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M30 150 A90 90 0 1 1 210 150"
          fill="none"
          stroke="url(#arcGrad)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray="283"
          strokeDashoffset={283 - 283 * Math.max(arcProgress, value ? capped / 1000 : 0)}
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
        <g transform={`rotate(${angle} 120 120)`}>
          <line
            x1="120"
            y1="120"
            x2="120"
            y2="48"
            stroke="#087F6D"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="120" cy="120" r="7" fill="#087F6D" />
        </g>
      </svg>
      <div className="absolute inset-x-0 bottom-2 text-center">
        <div className="speed-value text-foreground tabular-nums">
          {formatMbps(value)}
        </div>
        <div className="mt-1 text-sm font-medium text-muted-foreground">
          {label}
        </div>
      </div>
    </div>
  );
}
