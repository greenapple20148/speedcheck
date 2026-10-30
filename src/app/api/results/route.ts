import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveResult } from "@/lib/db/store";

const schema = z.object({
  downloadMbps: z.number().min(0).max(100000),
  uploadMbps: z.number().min(0).max(100000),
  pingMs: z.number().min(0).max(100000),
  jitterMs: z.number().min(0).max(100000),
  mode: z.enum(["lightweight", "standard"]),
  serverId: z.string().min(1).max(64),
  serverName: z.string().min(1).max(128),
  isp: z.string().max(128).nullable().optional(),
  city: z.string().max(128).nullable().optional(),
  country: z.string().max(64).nullable().optional(),
  isPublic: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid result payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const saved = await saveResult(parsed.data);
    return NextResponse.json({
      id: saved.id,
      shareId: saved.shareId,
      createdAt: saved.createdAt,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to save result" }, { status: 500 });
  }
}
