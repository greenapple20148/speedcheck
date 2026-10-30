import { NextRequest, NextResponse } from "next/server";
import { getAnalyticsSummary } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = process.env.ADMIN_DASHBOARD_TOKEN || "change-me-admin";
  if (auth !== `Bearer ${token}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const summary = await getAnalyticsSummary();

  let speedtestMetrics = null;
  try {
    const base = process.env.NEXT_PUBLIC_SPEEDTEST_URL || "http://127.0.0.1:18443";
    const admin = process.env.SPEEDTEST_ADMIN_TOKEN || "dev-admin-token";
    const res = await fetch(`${base}/admin/metrics`, {
      headers: { Authorization: `Bearer ${admin}` },
      cache: "no-store",
    });
    if (res.ok) speedtestMetrics = await res.json();
  } catch {
    // measurement service may be offline in some environments
  }

  return NextResponse.json({ ...summary, speedtestMetrics });
}
