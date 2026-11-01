import { describe, expect, it } from "vitest";
import {
  aggregateThroughput,
  bytesToMbps,
  throughputConnectionCount,
} from "@/lib/network/throughput";
import { jitterFromSamples } from "@/lib/network/jitter";
import { summarizeRtt } from "@/lib/network/latency";
import { latencyIncreaseMs } from "@/lib/network/loaded-latency";
import { applicationRequestLossPercent } from "@/lib/network/packet-loss";
import { domainLookupMs } from "@/lib/network/dns-timing";
import { troubleshoot } from "@/lib/network/diagnosis";
import { mbpsToDecimalMBps, transferTimeSeconds } from "@/lib/calculators/units";

describe("throughput", () => {
  it("uses the SI megabit formula", () => {
    expect(bytesToMbps(1_000_000, 1000)).toBeCloseTo(8);
  });

  it("aggregates overlapping windows by total bytes over the union", () => {
    const result = aggregateThroughput([
      { bytes: 1_000_000, firstMs: 100, lastMs: 1100 },
      { bytes: 1_000_000, firstMs: 200, lastMs: 1200 },
    ]);
    expect(result.bytes).toBe(2_000_000);
    expect(result.elapsedMs).toBe(1100);
    expect(result.mbps).toBeGreaterThan(14);
  });

  it("leaves an HTTP/1.1 slot free while loaded latency is sampled", () => {
    expect(throughputConnectionCount(8, true)).toBe(4);
    expect(throughputConnectionCount(8, false)).toBe(6);
    expect(throughputConnectionCount(1, true)).toBe(1);
  });
});

describe("latency stats", () => {
  it("computes jitter as the mean absolute successive difference", () => {
    expect(jitterFromSamples([10, 12, 11])).toBeCloseTo(1.5);
  });

  it("reports failure percentage without inventing a median when every probe fails", () => {
    const summary = summarizeRtt([null, null]);
    expect(summary.medianMs).toBeNull();
    expect(summary.failurePercent).toBe(100);
  });

  it("returns null loaded-latency increase when either side is missing", () => {
    expect(latencyIncreaseMs(20, null)).toBeNull();
    expect(latencyIncreaseMs(20, 50)).toBe(30);
  });
});

describe("request loss and dns", () => {
  it("does not treat an empty run as zero loss", () => {
    expect(applicationRequestLossPercent(0, 0)).toBeNull();
    expect(applicationRequestLossPercent(10, 2)).toBe(20);
  });

  it("hides a zero lookup instead of calling it a 0 ms DNS time", () => {
    expect(domainLookupMs({ domainLookupStart: 0, domainLookupEnd: 0 })).toBeNull();
    expect(domainLookupMs({ domainLookupStart: 5, domainLookupEnd: 8 })).toBe(3);
  });
});

describe("troubleshooting", () => {
  it("describes queueing when download is fine and latency rises under load", () => {
    const result = troubleshoot(
      {
        symptoms: ["slow"],
        link: "ethernet",
        device: "computer",
        advertisedDownloadMbps: null,
        connectedDevices: null,
        affectsMultipleDevices: null,
        pattern: "continuous",
      },
      {
        downloadMbps: 200,
        uploadMbps: 20,
        pingMs: 18,
        jitterMs: 3,
        loadedLatencyIncreaseMs: 80,
        endpointId: "measure.example",
      },
    );
    expect(result.diagnosis.toLowerCase()).toContain("queue");
    expect(result.recommendations.some((item) => item.id === "sqm")).toBe(true);
    expect(result.diagnosis.toLowerCase()).not.toContain("modem is");
  });

  it("asks for a symptom before advising", () => {
    const result = troubleshoot(
      {
        symptoms: [],
        link: "unknown",
        device: "unknown",
        advertisedDownloadMbps: null,
        connectedDevices: null,
        affectsMultipleDevices: null,
        pattern: "unknown",
      },
      null,
    );
    expect(result.recommendations).toHaveLength(0);
  });
});

describe("calculators", () => {
  it("converts 100 Mbps to 12.5 MB/s", () => {
    expect(mbpsToDecimalMBps(100)).toBeCloseTo(12.5);
  });

  it("computes an 80 second theoretical download for 1 decimal GB at 100 Mbps", () => {
    const result = transferTimeSeconds(1, "GB", 100, null);
    expect(result.error).toBeNull();
    expect(result.seconds).toBeCloseTo(80);
  });

  it("rejects a zero rate", () => {
    expect(transferTimeSeconds(1, "MB", 0, null).error).toBeTruthy();
  });
});
