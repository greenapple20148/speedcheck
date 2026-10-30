import { NextRequest, NextResponse } from "next/server";
import { getResult, makeResultPublic } from "@/lib/db/store";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const result = await getResult(id);
  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Private results are only fetchable by exact id (owner link), not shareId
  return NextResponse.json(result);
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  if (body?.makePublic === true) {
    const updated = await makeResultPublic(id);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  }
  return NextResponse.json({ error: "Unsupported patch" }, { status: 400 });
}
