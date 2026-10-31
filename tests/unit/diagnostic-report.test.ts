import { describe, expect, it } from "vitest";
import { buildDiagnosticReport } from "@/lib/diagnostics/build-report";
import { buildHistoryInsights } from "@/lib/diagnostics/history-insights";

describe("buildDiagnosticReport", () => {
  it("returns findings and recommendations for fast link with bufferbloat", () => {
    const report = buildDiagnosticReport({
      metrics: {
        downloadMbps: 93,
        uploadMbps: 92,
        pingMs: 11,
        jitterMs: 8,
        bufferbloatGrade: "D",
      },
      plan: null,
      history: [],
    });
    expect(report.findings.length).toBeGreaterThan(0);
    expect(report.recommendations.length).toBeGreaterThan(0);
    expect(report.disclaimer).toMatch(/not a guarantee/i);
  });
});

describe("buildHistoryInsights", () => {
  it("detects large weekly variance", () => {
    const now = Date.now();
    const history = Array.from({ length: 6 }, (_, i) => ({
      id: String(i),
      downloadMbps: i % 2 === 0 ? 90 : 30,
      uploadMbps: 40,
      pingMs: 20,
      jitterMs: 5,
      mode: "standard" as const,
      serverName: "Test",
      createdAt: new Date(now - i * 86400000).toISOString(),
    }));
    const insights = buildHistoryInsights(history, 300);
    expect(insights.some((x) => x.id === "variance")).toBe(true);
  });
});
