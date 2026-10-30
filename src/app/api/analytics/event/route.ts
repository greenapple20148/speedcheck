import { NextRequest, NextResponse } from "next/server";
import { recordAnalyticsEvent } from "@/lib/db/store";

const ALLOWED = new Set([
  "speed_test_started",
  "speed_test_completed",
  "speed_test_failed",
  "speed_test_cancelled",
  "speed_test_shared",
  "affiliate_clicked",
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body?.name || "");
    if (!ALLOWED.has(name)) {
      return NextResponse.json({ error: "Unknown event" }, { status: 400 });
    }
    const props =
      body?.props && typeof body.props === "object" ? body.props : {};
    // Strip potential PII keys
    const safe: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(props)) {
      if (/ip|email|user|phone|address/i.test(k)) continue;
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        safe[k] = v;
      }
    }
    await recordAnalyticsEvent(name, safe);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
