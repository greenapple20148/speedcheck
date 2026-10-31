import { describe, expect, it } from "vitest";
import {
  gaugeScaleMaxMbps,
  speedToRingProgress,
} from "@/lib/speedtest/gauge-scale";

describe("gaugeScaleMaxMbps", () => {
  it("picks 1/2/5/10 Gbps scale steps", () => {
    expect(gaugeScaleMaxMbps(800)).toBe(1000);
    expect(gaugeScaleMaxMbps(1500)).toBe(2000);
    expect(gaugeScaleMaxMbps(4500)).toBe(5000);
  });

  it("defaults to 2 Gbps scale when idle", () => {
    expect(gaugeScaleMaxMbps(null)).toBe(2000);
  });
});

describe("speedToRingProgress", () => {
  it("maps speed to 0–1 against scale max", () => {
    expect(speedToRingProgress(1000, 2000)).toBe(0.5);
    expect(speedToRingProgress(2500, 2000)).toBe(1);
    expect(speedToRingProgress(null, 2000)).toBe(0);
  });
});
