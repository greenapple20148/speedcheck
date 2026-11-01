import { describe, expect, it } from "vitest";
import {
  DOWNLOAD_PRESETS,
  computeDownloadEstimate,
  defaultDownloadInputs,
  evaluateDownloadFields,
  formatDownloadDuration,
  presetEstimate,
  toMbps,
} from "@/lib/calculators/download-time";
import { transferTimeSeconds } from "@/lib/calculators/units";

describe("download time calculator", () => {
  it("keeps the shared 80 second theoretical time for 1 decimal GB at 100 Mbps", () => {
    const legacy = transferTimeSeconds(1, "GB", 100, 0.9);
    const estimate = computeDownloadEstimate(defaultDownloadInputs());
    expect(legacy.seconds).toBeCloseTo(80);
    expect(estimate?.theoreticalSeconds).toBeCloseTo(80);
    expect(estimate?.estimatedSeconds).toBeCloseTo(80 / 0.9);
    expect(formatDownloadDuration(estimate!.theoreticalSeconds)).toBe("1 min 20 sec");
    expect(formatDownloadDuration(estimate!.estimatedSeconds)).toBe("1 min 29 sec");
    expect(estimate?.effectiveMbps).toBeCloseTo(90);
  });

  it("treats decimal and binary units differently", () => {
    const decimal = computeDownloadEstimate({ ...defaultDownloadInputs(), efficiencyPercent: 100 });
    const binary = computeDownloadEstimate({ ...defaultDownloadInputs(), unit: "GiB", efficiencyPercent: 100 });
    const tebibyte = computeDownloadEstimate({ ...defaultDownloadInputs(), size: 1, unit: "TiB", efficiencyPercent: 100 });
    const terabyte = computeDownloadEstimate({ ...defaultDownloadInputs(), size: 1, unit: "TB", efficiencyPercent: 100 });
    expect(binary!.theoreticalSeconds).toBeGreaterThan(decimal!.theoreticalSeconds);
    expect(tebibyte!.theoreticalSeconds).toBeGreaterThan(terabyte!.theoreticalSeconds);
  });

  it("converts Kbps and Gbps into the shared megabit rate", () => {
    expect(toMbps(1000, "Kbps")).toBe(1);
    expect(toMbps(1, "Gbps")).toBe(1000);
    const fromKbps = computeDownloadEstimate({ ...defaultDownloadInputs(), speed: 100_000, speedUnit: "Kbps" });
    const fromMbps = computeDownloadEstimate(defaultDownloadInputs());
    const fromGbps = computeDownloadEstimate({ ...defaultDownloadInputs(), size: 10, speed: 1, speedUnit: "Gbps" });
    expect(fromKbps?.theoreticalSeconds).toBeCloseTo(fromMbps!.theoreticalSeconds);
    expect(fromGbps?.theoreticalSeconds).toBeCloseTo(80);
  });

  it("divides theoretical time by efficiency", () => {
    const half = computeDownloadEstimate({ ...defaultDownloadInputs(), efficiencyPercent: 50 });
    const full = computeDownloadEstimate({ ...defaultDownloadInputs(), efficiencyPercent: 100 });
    expect(half!.estimatedSeconds).toBeCloseTo(full!.estimatedSeconds * 2);
  });

  it("rejects empty, zero, and out-of-range values", () => {
    expect(evaluateDownloadFields({ size: "", unit: "GB", speed: "100", speedUnit: "Mbps", efficiency: "90" }).estimate).toBeNull();
    expect(evaluateDownloadFields({ size: "0", unit: "GB", speed: "100", speedUnit: "Mbps", efficiency: "90" }).errors.size).toMatch(/greater than 0/);
    expect(evaluateDownloadFields({ size: "-1", unit: "GB", speed: "100", speedUnit: "Mbps", efficiency: "90" }).estimate).toBeNull();
    expect(evaluateDownloadFields({ size: "1", unit: "GB", speed: "0", speedUnit: "Mbps", efficiency: "90" }).errors.speed).toMatch(/greater than 0/);
    expect(evaluateDownloadFields({ size: "1", unit: "GB", speed: "100", speedUnit: "Mbps", efficiency: "0" }).errors.efficiency).toMatch(/1%/);
    expect(evaluateDownloadFields({ size: "1", unit: "GB", speed: "100", speedUnit: "Mbps", efficiency: "101" }).estimate).toBeNull();
    expect(evaluateDownloadFields({ size: "1", unit: "nope", speed: "100", speedUnit: "Mbps", efficiency: "90" }).errors.unit).toBeTruthy();
  });

  it("formats multi-day estimates and refuses a non-finite result", () => {
    const days = computeDownloadEstimate({ size: 1, unit: "TB", speed: 10, speedUnit: "Mbps", efficiencyPercent: 100 });
    expect(formatDownloadDuration(days!.theoreticalSeconds)).toMatch(/days/);
    expect(computeDownloadEstimate({ size: 1e308, unit: "TB", speed: 1, speedUnit: "Mbps", efficiencyPercent: 90 })).toBeNull();
  });

  it("builds example durations from the shared estimate", () => {
    for (const preset of DOWNLOAD_PRESETS) {
      const shown = presetEstimate(preset, 90);
      const direct = computeDownloadEstimate({
        size: preset.size,
        unit: preset.unit,
        speed: preset.speed,
        speedUnit: preset.speedUnit,
        efficiencyPercent: 90,
      });
      expect(shown?.estimatedSeconds).toBe(direct?.estimatedSeconds);
      expect(shown?.estimatedSeconds).toBeGreaterThan(0);
    }
    expect(formatDownloadDuration(presetEstimate(DOWNLOAD_PRESETS[1], 90)!.theoreticalSeconds)).toBe("1 min 20 sec");
  });
});
