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
  if (config.ready && config.mode === "proxy" && config.baseUrl) {
    probeOk = await probeHealth(config.baseUrl);
  } else if (config.ready && probeTarget) {
    probeOk = await probeHealth(probeTarget);
  }

  let message = config.message;
  if (config.ready && probeOk === false) {
    message =
      "Measurement service is not reachable from the web app. Confirm the Go service on your droplet (port 18443) and SPEEDTEST_INTERNAL_URL on Vercel, then redeploy.";
  }

  return NextResponse.json({
    ...config,
    probeOk,
    message,
  });
}
