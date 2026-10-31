import { describe, expect, it } from "vitest";

function bytesToMbps(bytes: number, ms: number): number {
  return (bytes * 8) / (ms / 1000) / 1_000_000;
}

describe("throughput math", () => {
  it("computes 100 Mbps for 12.5 MB in 1s", () => {
    const bytes = 12.5 * 1024 * 1024;
    // Using decimal megabit definition (SI): 12.5 * 1024^2 bytes * 8 / 1e6 ≈ 104.857 Mbps
    const mbps = bytesToMbps(bytes, 1000);
    expect(mbps).toBeGreaterThan(100);
    expect(mbps).toBeLessThan(110);
  });

  it("avoids divide by zero with min duration", () => {
    const mbps = bytesToMbps(1_000_000, 1);
    expect(Number.isFinite(mbps)).toBe(true);
  });

  it("aggregate Mbps sums parallel streams (8×12 Mbps streams ≈ 96 Mbps)", () => {
    const streamMbps = 12;
    const streams = 8;
    const phaseMs = 1000;
    const bytesPerStream = (streamMbps * 1_000_000 * (phaseMs / 1000)) / 8;
    const totalBytes = bytesPerStream * streams;
    const aggregate = bytesToMbps(totalBytes, phaseMs);
    expect(aggregate).toBeGreaterThan(90);
    expect(aggregate).toBeLessThan(102);
    const wrongMeanStream = streamMbps;
    expect(aggregate).toBeGreaterThan(wrongMeanStream * 5);
  });
});
