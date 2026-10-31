"use client";

import { useMemo, useState } from "react";
import { AlertCircle, AlertTriangle, ChevronDown, Info } from "lucide-react";
import { diagnose } from "@/lib/speedtest/diagnose";
import type { PlanSettings, StoredHistoryEntry } from "@/lib/speedtest/history-store";
import type { SpeedMetrics } from "@/types/speedtest";
import { cn } from "@/lib/utils";

const iconFor = {
  info: Info,
  warning: AlertTriangle,
  problem: AlertCircle,
} as const;

interface DiagnosisCardProps {
  metrics: SpeedMetrics;
  plan: PlanSettings | null;
  history: StoredHistoryEntry[];
  visible: boolean;
}

export function DiagnosisCard({ metrics, plan, history, visible }: DiagnosisCardProps) {
  const [open, setOpen] = useState(false);

  const findings = useMemo(
    () =>
      visible
        ? diagnose(
            {
              downloadMbps: metrics.downloadMbps,
              uploadMbps: metrics.uploadMbps,
              pingMs: metrics.pingMs,
              jitterMs: metrics.jitterMs,
              bufferbloatGrade: metrics.bufferbloatGrade,
            },
            plan,
            history,
          )
        : [],
    [visible, metrics, plan, history],
  );

  if (!visible || findings.length === 0) return null;

  const top = findings.slice(0, 3);
  const rest = findings.slice(3);

  return (
    <section
      className="rounded-xl border border-[var(--card-border)] bg-card px-3.5 py-3"
      aria-labelledby="diagnosis-heading"
    >
      <h3 id="diagnosis-heading" className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        What this means
      </h3>
      <ul className="mt-2.5 space-y-3">
        {top.map((f) => {
          const Icon = iconFor[f.severity];
          return (
            <li key={f.id} className="flex gap-2.5 text-[14px]">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-foreground" aria-hidden />
              <div>
                <p className="font-semibold text-foreground">{f.title}</p>
                <p className="mt-0.5 text-muted-foreground">{f.explanation}</p>
                <p className="mt-1 text-[13px] text-foreground">
                  <span className="sr-only">Suggested action: </span>
                  {f.suggestedAction}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
      {rest.length > 0 && (
        <>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="mt-3 flex min-h-[44px] w-full items-center justify-between rounded-lg border border-[var(--card-border)] px-3 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-teal)]"
          >
            Show all ({findings.length})
            <ChevronDown
              className={cn(
                "h-4 w-4 motion-safe:transition-transform",
                open && "rotate-180",
              )}
              aria-hidden
            />
          </button>
          {open && (
            <ul className="mt-2 space-y-3 border-t border-[var(--card-border)] pt-3">
              {rest.map((f) => {
                const Icon = iconFor[f.severity];
                return (
                  <li key={f.id} className="flex gap-2.5 text-[14px]">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <div>
                      <p className="font-semibold">{f.title}</p>
                      <p className="mt-0.5 text-muted-foreground">{f.explanation}</p>
                      <p className="mt-1 text-[13px]">{f.suggestedAction}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
