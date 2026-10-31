import { describe, expect, it } from "vitest";
import { buildConnectionInsights } from "@/lib/speedtest/connection-insights";

describe("buildConnectionInsights", () => {
  it("returns empty when metrics incomplete", () => {
    expect(buildConnectionInsights({ downloadMbps: 100, uploadMbps: null, pingMs: 20, jitterMs: 2 })).toEqual([]);
  });

  it("rates fast low-latency connection highly", () => {
    const items = buildConnectionInsights({
      downloadMbps: 150,
      uploadMbps: 50,
      pingMs: 15,
      jitterMs: 3,
    });
    expect(items.find((i) => i.id === "gaming")?.suitability).toBe("excellent");
  });
});
