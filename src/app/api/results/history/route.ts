import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Optional account-based history.
 * Requires Authorization: Bearer <supabase user JWT> and SUPABASE_* env.
 * Anonymous local history remains in the browser (localStorage).
 */
export async function GET(req: NextRequest) {
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  const auth = req.headers.get("authorization");
  if (!url || !anon) {
    return NextResponse.json(
      {
        error: "Account history unavailable",
        hint: "Configure SUPABASE_URL and SUPABASE_ANON_KEY, or use local browser history.",
      },
      { status: 501 },
    );
  }
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(url, anon, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("test_results")
    .select(
      "id, download_mbps, upload_mbps, ping_ms, jitter_ms, mode, server_name, created_at, is_public, share_id",
    )
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ results: data ?? [] });
}
