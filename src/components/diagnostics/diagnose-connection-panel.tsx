"use client";

import { useCallback, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import type { DiagnosticReport } from "@/lib/diagnostics/types";
import type { PlanSettings, StoredHistoryEntry } from "@/lib/speedtest/history-store";
import type { ServerInfo, SpeedMetrics, TestMode } from "@/types/speedtest";
import { featureFlags } from "@/lib/feature-flags";
import { cn } from "@/lib/utils";

interface DiagnoseConnectionPanelProps {
  metrics: SpeedMetrics;
  mode: TestMode;
  server: ServerInfo | null;
  plan: PlanSettings | null;
  history: StoredHistoryEntry[];
  className?: string;
}

export function DiagnoseConnectionPanel({
  metrics,
  mode,
  server,
  plan,
  history,
  className,
}: DiagnoseConnectionPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<DiagnosticReport | null>(null);

  const runDiagnosis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/diagnostics/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metrics: {
            downloadMbps: metrics.downloadMbps,
            uploadMbps: metrics.uploadMbps,
            pingMs: metrics.pingMs,
            jitterMs: metrics.jitterMs,
            bufferbloatGrade: metrics.bufferbloatGrade,
            bufferbloatIdleMs: metrics.bufferbloatIdleMs,
            bufferbloatLoadedDownMs: metrics.bufferbloatLoadedDownMs,
            bufferbloatLoadedUpMs: metrics.bufferbloatLoadedUpMs,
            mode,
            serverName: server?.name ?? null,
            serverLocation: server?.location ?? null,
          },
          plan,
          history: history.slice(0, 100),
          useAi: featureFlags.aiDiagnostics,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Diagnosis failed (${res.status})`);
      }
      const data = (await res.json()) as { report: DiagnosticReport };
      setReport(data.report);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Diagnosis failed");
    } finally {
      setLoading(false);
    }
  }, [metrics, mode, server, plan, history]);

  return (
    <section
      className={cn(
        "rounded-xl border border-[var(--card-border)] bg-card px-4 py-4",
        className,
      )}
      aria-labelledby="diagnose-heading"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3
            id="diagnose-heading"
            className="text-[15px] font-semibold text-foreground"
          >
            Connection health
          </h3>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Rule-based analysis
            {featureFlags.aiDiagnostics ? " with optional AI explanation" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void runDiagnosis()}
          disabled={loading}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="h-4 w-4" aria-hidden />
          )}
          Diagnose my connection
        </button>
      </div>

      {error && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {report && (
        <div className="mt-4 space-y-4 border-t border-[var(--card-border)] pt-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {report.aiEnhanced ? "AI analysis" : "Analysis"}
            </p>
            <p className="mt-1 text-[16px] font-semibold text-foreground">
              {report.headline}
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
              {report.summary}
            </p>
          </div>

          {report.recommendations.length > 0 && (
            <div>
              <p className="text-[13px] font-semibold text-foreground">
                Recommended actions
              </p>
              <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[13px] text-muted-foreground">
                {report.recommendations.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ol>
            </div>
          )}

          {report.historyInsights.length > 0 && (
            <div>
              <p className="text-[13px] font-semibold text-foreground">
                From your history
              </p>
              <ul className="mt-2 space-y-2">
                {report.historyInsights.map((h) => (
                  <li key={h.id} className="text-[13px] text-muted-foreground">
                    <span className="font-medium text-foreground">{h.title}</span>
                    {" — "}
                    {h.detail}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[11px] leading-snug text-muted-foreground">
            {report.disclaimer}
          </p>
        </div>
      )}
    </section>
  );
}
