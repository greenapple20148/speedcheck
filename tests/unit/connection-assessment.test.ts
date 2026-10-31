import { describe, expect, it } from "vitest";
import {
  buildConnectionAssessment,
  buildUnderLoadAssessment,
  underLoadHeadlineIsConsistent,
} from "@/lib/speedtest/connection-assessment";

describe("connection-assessment", () => {
  it("classifies low download as limited connection", () => {
    const a = buildConnectionAssessment({
      downloadMbps: 0.8,
      uploadMbps: 6.9,
      pingMs: 104,
      jitterMs: 81,
      bufferbloatGrade: "F",
      bufferbloatIdleMs: 103.8,
      bufferbloatLoadedDownMs: 3531.6,
      bufferbloatLoadedUpMs: 394,
      mode: "standard",
    });
    expect(a.overallHeadline).toBe("Limited connection");
    expect(a.activities.find((x) => x.id === "gaming")?.status).toBe("Poor");
    expect(a.activities.find((x) => x.id === "browsing")?.status).toBe("Limited");
    expect(a.activities.find((x) => x.id === "streaming")?.status).toBe("Limited");
  });

  it("never shows positive under-load copy for grade F or extreme loaded latency", () => {
    const input = {
      downloadMbps: 100,
      uploadMbps: 20,
      pingMs: 20,
      jitterMs: 5,
      bufferbloatGrade: "F" as const,
      bufferbloatIdleMs: 103.8,
      bufferbloatLoadedDownMs: 3531.6,
      bufferbloatLoadedUpMs: 394,
      mode: "standard" as const,
    };
    expect(underLoadHeadlineIsConsistent(input)).toBe(true);
    const under = buildUnderLoadAssessment(input);
    expect(under?.description).not.toMatch(/stays responsive under load/i);
    expect(under?.description).toMatch(/Heavy lag|suffer/i);
  });

  it("allows responsive under-load copy only for grade A", () => {
    const a = buildUnderLoadAssessment({
      downloadMbps: 200,
      uploadMbps: 50,
      pingMs: 12,
      jitterMs: 2,
      bufferbloatGrade: "A",
      bufferbloatIdleMs: 12,
      bufferbloatLoadedDownMs: 14,
      bufferbloatLoadedUpMs: 13,
      mode: "standard",
    });
    expect(a?.description).toMatch(/stays responsive under load/i);
    expect(
      underLoadHeadlineIsConsistent({
        downloadMbps: 200,
        uploadMbps: 50,
        pingMs: 12,
        jitterMs: 2,
        bufferbloatGrade: "A",
        mode: "standard",
      }),
    ).toBe(true);
  });

  it("flags inconsistent positive copy for grade F", () => {
    expect(
      underLoadHeadlineIsConsistent({
        downloadMbps: 100,
        uploadMbps: 20,
        pingMs: 20,
        jitterMs: 5,
        bufferbloatGrade: "F",
        mode: "standard",
      }),
    ).toBe(true);
  });
});
