import { NextRequest, NextResponse } from "next/server";
import {
  measurementProbeOrigin,
  resolveMeasurementConfig,
} from "@/lib/speedtest/measurement-config";

export const dynamic = "force-dynamic";

async function probeHealth(origin: string): Promise<boolean> {
  try {
    const res = await fetch(`${origin.replace(/\/$/, "")}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(6_000),
    });
    if (!res.ok) return false;
    const body = (await res.json().catch(() => null)) as { healthy?: boolean } | null;
    return body?.healthy !== false;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const siteOrigin = req.nextUrl.origin;
  const config = resolveMeasurementConfig(siteOrigin);
  const probeTarget = measurementProbeOrigin(config, siteOrigin);

  let probeOk: boolean | undefined;
  if (config.ready && probeTarget) {
    probeOk = await probeHealth(probeTarget);
  }

  let message = config.message;
  if (config.ready && probeOk === false) {
    message =
      "Measurement service is not reachable from the web app. Check that the Go service is running, HTTPS is valid, and Vercel env vars point to the correct host.";
  }

  return NextResponse.json({
    ...config,
    probeOk,
    message,
  });
}
