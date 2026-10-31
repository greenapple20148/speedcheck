import type { DiagnosticReport } from "@/lib/diagnostics/types";

const MODEL = process.env.OPENAI_DIAGNOSTICS_MODEL ?? "gpt-4o-mini";

export async function enhanceReportWithAi(
  report: DiagnosticReport,
): Promise<DiagnosticReport> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return report;

  const payload = {
    headline: report.headline,
    metrics: report.metrics,
    findings: report.findings.map((f) => ({
      id: f.id,
      severity: f.severity,
      title: f.title,
      explanation: f.explanation,
    })),
    historyInsights: report.historyInsights,
    recommendations: report.recommendations,
  };

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You explain home internet test results for non-technical users. Use ONLY the JSON facts provided. Do not invent ISP faults, router models, or causes not supported by the data. Do not claim legal or contractual ISP failure. Output JSON: { \"headline\": string, \"summary\": string, \"recommendations\": string[] } with at most 4 recommendations.",
          },
          {
            role: "user",
            content: JSON.stringify(payload),
          },
        ],
      }),
    });

    if (!res.ok) return report;

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return report;

    const parsed = JSON.parse(raw) as {
      headline?: string;
      summary?: string;
      recommendations?: string[];
    };

    return {
      ...report,
      aiEnhanced: true,
      headline: parsed.headline?.slice(0, 200) ?? report.headline,
      summary: parsed.summary?.slice(0, 1200) ?? report.summary,
      recommendations:
        Array.isArray(parsed.recommendations) && parsed.recommendations.length
          ? parsed.recommendations.slice(0, 5)
          : report.recommendations,
    };
  } catch {
    return report;
  }
}
