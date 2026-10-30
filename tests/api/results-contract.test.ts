import { describe, expect, it } from "vitest";
import { z } from "zod";

const schema = z.object({
  downloadMbps: z.number().min(0).max(100000),
  uploadMbps: z.number().min(0).max(100000),
  pingMs: z.number().min(0).max(100000),
  jitterMs: z.number().min(0).max(100000),
  mode: z.enum(["lightweight", "standard"]),
  serverId: z.string().min(1).max(64),
  serverName: z.string().min(1).max(128),
  isPublic: z.boolean().optional().default(false),
});

describe("results API contract", () => {
  it("accepts valid payload", () => {
    const parsed = schema.safeParse({
      downloadMbps: 120.5,
      uploadMbps: 20.1,
      pingMs: 14,
      jitterMs: 2.5,
      mode: "standard",
      serverId: "local-1",
      serverName: "Local Dev",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects negative speeds", () => {
    const parsed = schema.safeParse({
      downloadMbps: -1,
      uploadMbps: 1,
      pingMs: 1,
      jitterMs: 1,
      mode: "standard",
      serverId: "x",
      serverName: "y",
    });
    expect(parsed.success).toBe(false);
  });
});
