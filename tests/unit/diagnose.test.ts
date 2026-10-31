import { describe, expect, it } from "vitest";
import { diagnose } from "@/lib/speedtest/diagnose";

describe("diagnose", () => {
  it("returns healthy finding when metrics look good", () => {
    const findings = diagnose({
      downloadMbps: 200,
      uploadMbps: 50,
      pingMs: 15,
      jitterMs: 3,
      bufferbloatGrade: "A",
    });
    expect(findings[0]?.id).toBe("healthy");
  });

  it("warns when below plan download", () => {
    const findings = diagnose(
      { downloadMbps: 50, uploadMbps: 10, pingMs: 20, jitterMs: 5 },
      { downloadMbps: 200, uploadMbps: 20 },
    );
    expect(findings.some((f) => f.id === "below-plan")).toBe(true);
  });

  it("warns on high jitter with good download", () => {
    const findings = diagnose({
      downloadMbps: 100,
      uploadMbps: 20,
      pingMs: 25,
      jitterMs: 25,
    });
    expect(findings.some((f) => f.id === "jitter-wifi")).toBe(true);
  });

  it("flags poor bufferbloat grades", () => {
    const findings = diagnose({
      downloadMbps: 100,
      uploadMbps: 20,
      pingMs: 20,
      jitterMs: 5,
      bufferbloatGrade: "D",
    });
    expect(findings.some((f) => f.id === "bufferbloat")).toBe(true);
  });

  it("notes high idle ping", () => {
    const findings = diagnose({
      downloadMbps: 100,
      uploadMbps: 20,
      pingMs: 80,
      jitterMs: 5,
    });
    expect(findings.some((f) => f.id === "high-ping")).toBe(true);
  });
});
