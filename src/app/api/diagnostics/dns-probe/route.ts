import { NextRequest, NextResponse } from "next/server";
import { checkDnsProbeRateLimit } from "@/lib/network/dns-probe-rate-limit";
import { isDnsProbeId } from "@/lib/network/dns-timing";

export const dynamic = "force-dynamic";

/**
 * Lightweight same-origin body for a Resource Timing read.
 *
 * Cache-Control: no-store stops the HTTP cache from replaying this URL.
 * The probe id exists so the page can find this request's timing entry.
 * Neither one forces a DNS lookup. This route does not query a resolver.
 */
const NO_STORE = {
  "Cache-Control": "no-store",
  Pragma: "no-cache",
} as const;

function clientKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIp?.trim() || "unknown";
  return `dns-probe:${ip}`;
}

export async function GET(req: NextRequest) {
  const limit = checkDnsProbeRateLimit(clientKey(req));
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false },
      {
        status: 429,
        headers: {
          ...NO_STORE,
          ...(limit.retryAfterSec ? { "Retry-After": String(limit.retryAfterSec) } : {}),
        },
      },
    );
  }

  const probe = req.nextUrl.searchParams.get("probe") ?? "";
  if (!isDnsProbeId(probe)) {
    return NextResponse.json({ ok: false }, { status: 400, headers: NO_STORE });
  }

  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
