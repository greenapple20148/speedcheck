import { diagnose } from "@/lib/speedtest/diagnose";
import type { PlanSettings, StoredHistoryEntry } from "@/lib/speedtest/history-store";
import { buildHistoryInsights } from "@/lib/diagnostics/history-insights";
import type {
  DiagnosticMetricsSnapshot,
  DiagnosticReport,
} from "@/lib/diagnostics/types";
import { DIAGNOSTIC_DISCLAIMER } from "@/lib/diagnostics/types";

export function buildDiagnosticReport(input: {
  metrics: DiagnosticMetricsSnapshot;
  plan: PlanSettings | null;
  history: StoredHistoryEntry[];
}): DiagnosticReport {
  const { metrics, plan, history } = input;

  const findings = diagnose(
    {
      downloadMbps: metrics.downloadMbps,
      uploadMbps: metrics.uploadMbps,
      pingMs: metrics.pingMs,
      jitterMs: metrics.jitterMs,
      bufferbloatGrade: metrics.bufferbloatGrade,
    },
    plan,
    history,
  );

  const historyInsights = buildHistoryInsights(
    history,
    plan?.downloadMbps ?? null,
  );

  const recommendations = uniqueActions(findings, historyInsights);

  const headline = pickHeadline(findings, metrics);
  const summary = buildRuleSummary(metrics, findings);

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    headline,
    summary,
    findings,
    historyInsights,
    recommendations,
    metrics,
    aiEnhanced: false,
    disclaimer: DIAGNOSTIC_DISCLAIMER,
  };
}

function uniqueActions(
  findings: ReturnType<typeof diagnose>,
  historyInsights: { detail: string }[],
): string[] {
  const fromFindings = findings.map((f) => f.suggestedAction);
  const extra: string[] = [];
  if (historyInsights.length > 0) {
    extra.push("Run tests at different times of day and label Wi‑Fi vs wired when comparing.");
  }
  return [...new Set([...fromFindings, ...extra])].slice(0, 6);
}

function pickHeadline(
  findings: ReturnType<typeof diagnose>,
  metrics: DiagnosticMetricsSnapshot,
): string {
  const top = findings[0];
  if (top?.severity === "problem") return top.title;
  const dl = metrics.downloadMbps;
  if (dl != null && dl >= 75) {
    if (findings.some((f) => f.id === "bufferbloat" || f.id === "jitter-wifi")) {
      return "Fast bandwidth, but stability may affect real-time apps";
    }
    return "Your connection looks fast for everyday use";
  }
  if (top) return top.title;
  return "Connection diagnostic summary";
}

function buildRuleSummary(
  metrics: DiagnosticMetricsSnapshot,
  findings: ReturnType<typeof diagnose>,
): string {
  const parts: string[] = [];
  if (metrics.downloadMbps != null) {
    parts.push(`Download measured about ${metrics.downloadMbps.toFixed(1)} Mbps`);
  }
  if (metrics.uploadMbps != null) {
    parts.push(`upload about ${metrics.uploadMbps.toFixed(1)} Mbps`);
  }
  if (metrics.pingMs != null) {
    parts.push(`idle latency about ${metrics.pingMs.toFixed(0)} ms`);
  }
  const intro =
    parts.length > 0
      ? `${parts.slice(0, 2).join("; ")}${parts.length > 2 ? `; ${parts[2]}` : ""}.`
      : "Measurements from your latest test.";

  const topExplain =
    findings.find((f) => f.severity !== "info")?.explanation ??
    findings[0]?.explanation ??
    "";

  return `${intro} ${topExplain}`.trim();
}
