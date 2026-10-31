import type { NextRequest } from "next/server";
import {
  measurementProxyGET,
  measurementProxyOPTIONS,
  measurementProxyPOST,
  measurementProxyPUT,
} from "@/lib/speedtest/measurement-proxy-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Ctx = { params: Promise<{ path: string[] }> };

export const GET = (req: NextRequest, ctx: Ctx) => measurementProxyGET(req, ctx);
export const POST = (req: NextRequest, ctx: Ctx) => measurementProxyPOST(req, ctx);
export const PUT = (req: NextRequest, ctx: Ctx) => measurementProxyPUT(req, ctx);
export const OPTIONS = (req: NextRequest, ctx: Ctx) =>
  measurementProxyOPTIONS(req, ctx);
