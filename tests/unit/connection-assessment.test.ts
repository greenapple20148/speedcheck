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

  it("aligns ~90 Mbps + stable latency with Fast headline and Good activities", () => {
    const a = buildConnectionAssessment({
      downloadMbps: 91,
      uploadMbps: 89,
      pingMs: 35,
      jitterMs: 6,
      bufferbloatGrade: "B",
      bufferbloatIdleMs: 35,
      bufferbloatLoadedDownMs: 48,
      bufferbloatLoadedUpMs: 42,
      mode: "standard",
    });
    expect(a.overallHeadline).toBe("Fast connection");
    expect(a.overallDescription).not.toMatch(/spikes sharply/i);
    expect(a.activities.find((x) => x.id === "browsing")?.status).toBe("Good");
    expect(a.activities.find((x) => x.id === "streaming")?.status).toBe("Good");
    expect(a.activities.find((x) => x.id === "video-calls")?.status).toBe("Good");
    expect(a.activities.find((x) => x.id === "gaming")?.status).toBe("Good");
  });

  it("keeps Fast + green-tier summary when idle is stable but bufferbloat grade is F from the test", () => {
    const a = buildConnectionAssessment({
      downloadMbps: 91,
      uploadMbps: 89,
      pingMs: 35,
      jitterMs: 6,
      bufferbloatGrade: "F",
      bufferbloatIdleMs: 35,
      bufferbloatLoadedDownMs: 800,
      bufferbloatLoadedUpMs: 600,
      mode: "standard",
    });
    expect(a.overallHeadline).toBe("Fast connection");
    expect(a.qualityLevel).toBe("good");
    expect(a.overallDescription).not.toMatch(/spikes sharply/i);
    expect(a.activities.find((x) => x.id === "gaming")?.status).toBe("Good");
    expect(a.underLoad?.grade).toBe("F");
  });
});
