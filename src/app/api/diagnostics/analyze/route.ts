import { NextResponse } from "next/server";
import { z } from "zod";
import { buildDiagnosticReport } from "@/lib/diagnostics/build-report";
import { enhanceReportWithAi } from "@/lib/diagnostics/ai-narrative";
import { checkDiagnosticsRateLimit } from "@/lib/diagnostics/rate-limit";
import { isAiDiagnosticsServerEnabled } from "@/lib/feature-flags";

const bodySchema = z.object({
  metrics: z.object({
    downloadMbps: z.number().nullable(),
    uploadMbps: z.number().nullable(),
    pingMs: z.number().nullable(),
    jitterMs: z.number().nullable(),
    bufferbloatGrade: z.enum(["A", "B", "C", "D", "F"]).nullable().optional(),
    bufferbloatIdleMs: z.number().nullable().optional(),
    bufferbloatLoadedDownMs: z.number().nullable().optional(),
    bufferbloatLoadedUpMs: z.number().nullable().optional(),
    mode: z.enum(["lightweight", "standard"]).optional(),
    serverName: z.string().nullable().optional(),
    serverLocation: z.string().nullable().optional(),
  }),
  plan: z
    .object({
      downloadMbps: z.number(),
      uploadMbps: z.number(),
      ispName: z.string().optional(),
    })
    .nullable()
    .optional(),
  history: z
    .array(
      z.object({
        id: z.string(),
        downloadMbps: z.number().nullable(),
        uploadMbps: z.number().nullable(),
        pingMs: z.number().nullable(),
        jitterMs: z.number().nullable(),
        mode: z.enum(["lightweight", "standard"]),
        serverName: z.string().optional(),
        createdAt: z.string(),
        connectionTag: z.enum(["wifi", "wired"]).optional(),
      }),
    )
    .max(200)
    .optional(),
  useAi: z.boolean().optional(),
});

function clientKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  return ip;
}

export async function POST(req: Request) {
  const limit = checkDiagnosticsRateLimit(clientKey(req));
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many diagnostic requests. Try again later." },
      {
        status: 429,
        headers: limit.retryAfterSec
          ? { "Retry-After": String(limit.retryAfterSec) }
          : undefined,
      },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid diagnostic payload" },
      { status: 400 },
    );
  }

  const { metrics, plan, history, useAi } = parsed.data;

  let report = buildDiagnosticReport({
    metrics,
    plan: plan ?? null,
    history: (history ?? []).map((h) => ({
      ...h,
      serverName: h.serverName ?? "Unknown",
    })),
  });

  const wantAi = useAi !== false && isAiDiagnosticsServerEnabled();
  if (wantAi) {
    report = await enhanceReportWithAi(report);
  }

  return NextResponse.json({
    report,
    aiAvailable: isAiDiagnosticsServerEnabled(),
  });
}

export async function GET() {
  return NextResponse.json({
    aiAvailable: isAiDiagnosticsServerEnabled(),
  });
}
