import { NextRequest, NextResponse } from "next/server";
import { maskIp } from "@/lib/db/store";
import { isPrivateOrLoopbackIp } from "@/lib/network/ip";

type IpLookup = {
  ip?: string;
  org?: string;
  asn?: string;
  city?: string;
  country_name?: string;
};

async function fetchIpLookup(): Promise<IpLookup | null> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 2000);
    const res = await fetch("https://ipapi.co/json/", {
      signal: controller.signal,
      next: { revalidate: 3600 },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return (await res.json()) as IpLookup;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const clientIp = (forwarded?.split(",")[0] || realIp || "").trim() || null;

  const edgeIsp =
    req.headers.get("x-vercel-ip-org") || req.headers.get("cf-isp") || null;
  const city =
    req.headers.get("x-vercel-ip-city") || req.headers.get("cf-ipcity") || null;
  const country =
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    null;

  let isp: string | null = edgeIsp;
  let ispVerified = Boolean(edgeIsp);
  let org: string | null = edgeIsp;
  let asn: string | null = null;
  let enrichedCity = city;
  let enrichedCountry = country;

  let publicIpMasked: string | null = null;
  let publicIpSource: "edge" | "lookup" | "unavailable" = "unavailable";

  if (clientIp && !isPrivateOrLoopbackIp(clientIp)) {
    publicIpMasked = maskIp(clientIp);
    publicIpSource = "edge";
  }

  const needsLookup =
    !publicIpMasked || !isp || isPrivateOrLoopbackIp(clientIp ?? undefined);

  if (needsLookup) {
    const lookup = await fetchIpLookup();
    if (lookup?.ip && !isPrivateOrLoopbackIp(lookup.ip)) {
      if (!publicIpMasked) {
        publicIpMasked = maskIp(lookup.ip);
        publicIpSource = "lookup";
      }
    }
    if (!isp && lookup?.org) {
      isp = lookup.org;
      org = lookup.org;
      ispVerified = false;
    }
    if (lookup?.asn) asn = lookup.asn;
    if (lookup?.city) enrichedCity = lookup.city;
    if (lookup?.country_name) enrichedCountry = lookup.country_name;
  }

  return NextResponse.json({
    publicIpMasked,
    publicIpSource,
    ispVerified,
    isp,
    org,
    city: enrichedCity,
    country: enrichedCountry,
    asn,
  });
}
