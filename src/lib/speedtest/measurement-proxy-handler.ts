import { NextRequest, NextResponse } from "next/server";
import { serverMeasurementOrigin } from "@/lib/speedtest/base-url";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
]);

function proxyEnabled(): boolean {
  if (process.env.SPEEDTEST_INTERNAL_URL) return true;
  return process.env.NODE_ENV === "development";
}

async function forward(req: NextRequest, pathSegments: string[]) {
  if (!proxyEnabled()) {
    return NextResponse.json(
      {
        error:
          "Measurement proxy disabled. Set SPEEDTEST_INTERNAL_URL on Vercel to your Go service (e.g. http://YOUR_DROPLET_IP:18443).",
      },
      { status: 503 },
    );
  }

  const upstream = serverMeasurementOrigin();
  const subpath = pathSegments.join("/");
  const target = `${upstream}/${subpath}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower)) return;
    headers.set(key, value);
  });

  const hasBody = req.method !== "GET" && req.method !== "HEAD";

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(target, {
      method: req.method,
      headers,
      cache: "no-store",
      body: hasBody ? req.body : undefined,
      ...(hasBody ? { duplex: "half" as const } : {}),
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Measurement service unavailable. Check the Go service on your droplet and SPEEDTEST_INTERNAL_URL.",
      },
      { status: 503 },
    );
  }

  const outHeaders = new Headers();
  upstreamRes.headers.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return;
    outHeaders.set(key, value);
  });

  return new NextResponse(upstreamRes.body, {
    status: upstreamRes.status,
    headers: outHeaders,
  });
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function measurementProxyGET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(req, path);
}

export async function measurementProxyPOST(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(req, path);
}

export async function measurementProxyPUT(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(req, path);
}

export async function measurementProxyOPTIONS(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
