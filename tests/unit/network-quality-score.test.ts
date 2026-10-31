import { describe, expect, it } from "vitest";
import {
  buildNetworkQualityScores,
  statusToStars,
} from "@/lib/speedtest/network-quality-score";

describe("network-quality-score", () => {
  it("maps Good to 5 stars", () => {
    expect(statusToStars("Good")).toBe(5);
    expect(statusToStars("Poor")).toBe(1);
  });

  it("builds streaming, gaming, video rows", () => {
    const rows = buildNetworkQualityScores([
      { id: "streaming", label: "4K streaming", status: "Good" },
      { id: "gaming", label: "Online gaming", status: "Fair" },
      { id: "video-calls", label: "Video calls", status: "Good" },
    ]);
    expect(rows).toHaveLength(3);
    expect(rows[0]?.stars).toBe(5);
    expect(rows[1]?.stars).toBe(3);
  });
});
