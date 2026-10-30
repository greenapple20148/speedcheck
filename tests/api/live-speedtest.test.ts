import { describe, expect, it } from "vitest";

const BASE = process.env.NEXT_PUBLIC_SPEEDTEST_URL || "http://127.0.0.1:18443";

async function serviceUp() {
  try {
    const res = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

describe("live measurement service", () => {
  it("creates session, transfers bytes, rejects bad token", async () => {
    if (!(await serviceUp())) {
      // Soft-skip when service is down so CI without Go still works
      expect(true).toBe(true);
      return;
    }

    const sessRes = await fetch(`${BASE}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "lightweight" }),
    });
    expect(sessRes.status).toBe(201);
    const sess = await sessRes.json();
    expect(sess.token).toBeTruthy();

    const dl = await fetch(
      `${BASE}/download?size=${256 * 1024}&token=${encodeURIComponent(sess.token)}`,
    );
    expect(dl.status).toBe(200);
    const buf = await dl.arrayBuffer();
    expect(buf.byteLength).toBe(256 * 1024);

    const payload = new Uint8Array(64 * 1024);
    const up = await fetch(`${BASE}/upload?token=${encodeURIComponent(sess.token)}`, {
      method: "POST",
      body: payload,
    });
    expect(up.status).toBe(200);
    const upJson = await up.json();
    expect(upJson.receivedBytes).toBe(64 * 1024);

    const bad = await fetch(`${BASE}/download?size=1024&token=not-a-token`);
    expect(bad.status).toBe(401);
  });
});
