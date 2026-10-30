import { NextRequest, NextResponse } from "next/server";
import { maskIp } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = (forwarded?.split(",")[0] || realIp || "").trim() || null;

  // Prefer Cloudflare / edge headers when present — never store raw IP
  const isp =
    req.headers.get("x-vercel-ip-org") ||
    req.headers.get("cf-isp") ||
    null;
  const city =
    req.headers.get("x-vercel-ip-city") ||
    req.headers.get("cf-ipcity") ||
    null;
  const country =
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    null;

  // Optional external enrichment (blocked gracefully if unavailable)
  let enriched = { isp, city, country, org: isp, asn: null as string | null };
  if (!isp) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 1500);
      const res = await fetch("https://ipapi.co/json/", {
        signal: controller.signal,
        next: { revalidate: 3600 },
      });
      clearTimeout(t);
      if (res.ok) {
        const data = await res.json();
        enriched = {
          isp: data.org || data.asn || null,
          city: data.city || city,
          country: data.country_name || country,
          org: data.org || null,
          asn: data.asn || null,
        };
      }
    } catch {
      // offline / blocked — continue without enrichment
    }
  }

  return NextResponse.json({
    publicIpMasked: maskIp(ip) || (ip ? "hidden" : null),
    isp: enriched.isp,
    org: enriched.org,
    city: enriched.city,
    country: enriched.country,
    asn: enriched.asn,
  });
}
