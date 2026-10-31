import { describe, expect, it } from "vitest";
import {
  gaugeScaleMaxMbps,
  speedToRingProgress,
} from "@/lib/speedtest/gauge-scale";

describe("gaugeScaleMaxMbps", () => {
  it("picks the next scale step above the value", () => {
    expect(gaugeScaleMaxMbps(45)).toBe(50);
    expect(gaugeScaleMaxMbps(120)).toBe(250);
  });

  it("returns minimum scale when idle", () => {
    expect(gaugeScaleMaxMbps(null)).toBe(25);
  });
});

describe("speedToRingProgress", () => {
  it("maps speed to 0–1 against scale max", () => {
    expect(speedToRingProgress(50, 100)).toBe(0.5);
    expect(speedToRingProgress(150, 100)).toBe(1);
    expect(speedToRingProgress(null, 100)).toBe(0);
  });
});
