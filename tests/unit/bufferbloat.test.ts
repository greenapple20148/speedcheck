import { describe, expect, it } from "vitest";
import { computeBufferbloat, median } from "@/lib/speedtest/bufferbloat";
import { gradeFromLatencyIncrease } from "@/lib/speedtest/bufferbloat-config";

describe("median", () => {
  it("returns middle value", () => {
    expect(median([10, 20, 100])).toBe(20);
  });
});

describe("gradeFromLatencyIncrease", () => {
  it("maps thresholds", () => {
    expect(gradeFromLatencyIncrease(3)).toBe("A");
    expect(gradeFromLatencyIncrease(10)).toBe("B");
    expect(gradeFromLatencyIncrease(45)).toBe("C");
    expect(gradeFromLatencyIncrease(100)).toBe("D");
    expect(gradeFromLatencyIncrease(250)).toBe("F");
  });
});

describe("computeBufferbloat", () => {
  it("uses worse direction for grade", () => {
    const r = computeBufferbloat(10, [12, 14], [50, 55]);
    expect(r?.grade).toBe("C");
    expect(r?.loadedDownMs).toBe(13);
    expect(r?.loadedUpMs).toBe(52.5);
  });

  it("returns null without loaded samples", () => {
    expect(computeBufferbloat(10, [], [])).toBeNull();
  });
});
