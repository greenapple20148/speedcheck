import { describe, expect, it } from "vitest";
import { transferTimeSeconds } from "@/lib/calculators/units";
import {
  LARGE_FILE_WARNING,
  SLOW_UPLOAD_WARNING,
  applyPreset,
  barWidthPercent,
  computeUploadEstimate,
  evaluateUploadFields,
  fieldsFromInputs,
  fileSizeBytes,
  formatUploadDuration,
  latestMeasuredUploadMbps,
  matchingPreset,
  mbpsToRate,
  parseStoredUploadInputs,
  rateToMbps,
  parseUploadSearchParams,
  resetUploadInputs,
  serializeUploadQuery,
  uploadEstimateText,
  uploadSpeedComparisons,
} from "@/lib/calculators/upload-time";

const defaults = resetUploadInputs();

describe("upload time math", () => {
  it("matches the shared calculator for 1 decimal GB at 100 Mbps and 90% efficiency", () => {
    const legacy = transferTimeSeconds(1, "GB", 100, 0.9);
    const estimate = computeUploadEstimate(defaults);
    expect(estimate).not.toBeNull();
    expect(estimate?.idealSeconds).toBe(legacy.seconds);
    expect(estimate?.realisticSeconds).toBe(legacy.adjustedSeconds);
    expect(estimate?.idealSeconds).toBeCloseTo(80);
    expect(estimate?.realisticSeconds).toBeCloseTo(80 / 0.9);
    expect(estimate?.effectiveMbps).toBeCloseTo(90);
    expect(estimate?.fileBytes).toBe(1_000_000_000);
    expect(estimate?.fileBits).toBe(8_000_000_000);
  });

  it("treats decimal GB and binary GiB as different sizes", () => {
    expect(fileSizeBytes(1, "GB")).toBe(1_000_000_000);
    expect(fileSizeBytes(1, "GiB")).toBe(1024 ** 3);
    const decimal = computeUploadEstimate({ ...defaults, efficiencyPercent: 100 });
    const binary = computeUploadEstimate({ ...defaults, unit: "GiB", efficiencyPercent: 100 });
    expect(binary!.idealSeconds).toBeGreaterThan(decimal!.idealSeconds);
    expect(binary!.idealSeconds).toBeCloseTo((1024 ** 3 * 8) / 100_000_000);
    expect(binary!.realisticSeconds).toBe(binary!.idealSeconds);
  });

  it("uses powers of 1000 for decimal units and powers of 1024 for binary units", () => {
    expect(fileSizeBytes(1, "KB")).toBe(1_000);
    expect(fileSizeBytes(1, "MB")).toBe(1_000_000);
    expect(fileSizeBytes(1, "TB")).toBe(1_000_000_000_000);
    expect(fileSizeBytes(1, "KiB")).toBe(1024);
    expect(fileSizeBytes(1, "MiB")).toBe(1024 ** 2);
    expect(fileSizeBytes(1, "TiB")).toBe(1024 ** 4);
    expect(fileSizeBytes(1.5, "MB")).toBe(1_500_000);
  });

  it("divides ideal time by efficiency instead of multiplying", () => {
    const half = computeUploadEstimate({ ...defaults, efficiencyPercent: 50 });
    const full = computeUploadEstimate({ ...defaults, efficiencyPercent: 100 });
    expect(half!.realisticSeconds).toBeCloseTo(full!.idealSeconds / 0.5);
    expect(half!.effectiveMbps).toBeCloseTo(50);
  });

  it("formats durations, including very small and very long estimates", () => {
    expect(formatUploadDuration(80)).toBe("1 min 20 sec");
    expect(formatUploadDuration(80 / 0.9)).toBe("1 min 29 sec");
    expect(formatUploadDuration(0.5)).toBe("0.50 seconds");
    expect(formatUploadDuration(0.00008)).toBe("80 µs");
    expect(formatUploadDuration(200_000)).toBe("2 d 7 hr");
    expect(formatUploadDuration(1e12)).toBe("More than 100 years");
    expect(formatUploadDuration(Number.NaN)).toBe("—");
    expect(formatUploadDuration(Number.POSITIVE_INFINITY)).toBe("—");
    expect(formatUploadDuration(-1)).toBe("—");
  });
});

describe("upload rate unit conversion", () => {
  it("converts Kbps and Gbps into the Mbps the estimator stores", () => {
    expect(rateToMbps(100_000, "Kbps")).toBe(100);
    expect(rateToMbps(0.1, "Gbps")).toBe(100);
    expect(rateToMbps(100, "Mbps")).toBe(100);
    expect(mbpsToRate(100, "Kbps")).toBe(100_000);
    expect(mbpsToRate(100, "Gbps")).toBe(0.1);
    const viaGbps = computeUploadEstimate({ ...defaults, speedMbps: rateToMbps(0.1, "Gbps") });
    expect(viaGbps?.idealSeconds).toBeCloseTo(80);
    expect(viaGbps?.realisticSeconds).toBeCloseTo(80 / 0.9);
    expect(viaGbps?.effectiveMbps).toBeCloseTo(90);
    expect(serializeUploadQuery({ ...defaults, speedMbps: rateToMbps(100_000, "Kbps") })).toContain("speed=100");
  });
});

describe("upload speed comparisons", () => {
  it("highlights an entered speed that is not one of the preset rates", () => {
    const rows = uploadSpeedComparisons({ ...defaults, speedMbps: 75 });
    expect(rows.map((row) => row.speedMbps)).toEqual([10, 25, 50, 75, 100, 500, 1000]);
    expect(rows.find((row) => row.highlighted)?.speedMbps).toBe(75);
    expect(rows.filter((row) => row.highlighted)).toHaveLength(1);
    const times = rows.map((row) => row.seconds ?? 0);
    expect(times.every((seconds, index) => index === 0 || seconds < times[index - 1]!)).toBe(true);
    expect(rows.find((row) => row.speedMbps === 1000)?.label).toBe("1 Gbps");
  });

  it("does not duplicate a preset speed the user typed", () => {
    const rows = uploadSpeedComparisons(defaults);
    expect(rows).toHaveLength(6);
    expect(rows.find((row) => row.speedMbps === 100)?.highlighted).toBe(true);
    expect(rows.find((row) => row.speedMbps === 10)?.seconds).toBeCloseTo(800 / 0.9);
  });

  it("scales bars from the longest estimate", () => {
    expect(barWidthPercent(50, 100)).toBe(50);
    expect(barWidthPercent(1, 100)).toBe(2);
    expect(barWidthPercent(0, 100)).toBe(0);
    expect(barWidthPercent(10, 0)).toBe(0);
  });
});

describe("invalid upload inputs", () => {
  it("rejects zero, negative, blank, and non-finite field values without estimating", () => {
    for (const size of ["0", "-1", "", "abc", "NaN", "Infinity", "1e99"]) {
      const result = evaluateUploadFields({ size, unit: "GB", speed: "100", efficiency: "90" });
      expect(result.estimate).toBeNull();
      expect(result.errors.size).toBeTruthy();
    }
    for (const speed of ["0", "-5", "", "nope", "Infinity"]) {
      const result = evaluateUploadFields({ size: "1", unit: "GB", speed, efficiency: "90" });
      expect(result.estimate).toBeNull();
      expect(result.errors.speed).toBeTruthy();
    }
    const efficiency = evaluateUploadFields({ size: "1", unit: "GB", speed: "100", efficiency: "0.9" });
    expect(efficiency.estimate).toBeNull();
    expect(efficiency.errors.efficiency).toMatch(/50%/);
  });

  it("returns null for extremely large or non-finite direct calculations", () => {
    expect(() =>
      computeUploadEstimate({ size: 1e308, unit: "TB", speedMbps: 1, efficiencyPercent: 90 }),
    ).not.toThrow();
    expect(computeUploadEstimate({ size: 1e308, unit: "TB", speedMbps: 1, efficiencyPercent: 90 })).toBeNull();
    expect(computeUploadEstimate({ ...defaults, speedMbps: 0 })).toBeNull();
    expect(computeUploadEstimate({ ...defaults, speedMbps: Number.POSITIVE_INFINITY })).toBeNull();
    expect(computeUploadEstimate({ ...defaults, size: Number.NaN })).toBeNull();
    expect(computeUploadEstimate({ ...defaults, efficiencyPercent: 0 })).toBeNull();
  });

  it("warns on very slow speeds and very large files", () => {
    const slow = computeUploadEstimate({ ...defaults, speedMbps: 1 });
    expect(slow?.warnings).toContain(SLOW_UPLOAD_WARNING);
    expect(slow?.warnings).not.toContain(LARGE_FILE_WARNING);

    const large = computeUploadEstimate({ ...defaults, size: 100 });
    expect(large?.warnings).toContain(LARGE_FILE_WARNING);
    expect(large?.warnings).not.toContain(SLOW_UPLOAD_WARNING);

    const both = computeUploadEstimate({ ...defaults, size: 100, speedMbps: 1 });
    expect(both?.warnings).toEqual([SLOW_UPLOAD_WARNING, LARGE_FILE_WARNING]);
  });
});

describe("presets and reset", () => {
  it("selects a preset only when both size and unit match", () => {
    expect(matchingPreset(500, "MB")).toBe("photos");
    expect(matchingPreset(2, "GB")).toBe("hd-video");
    expect(matchingPreset(20, "GB")).toBe("4k-video");
    expect(matchingPreset(100, "GB")).toBe("backup");
    expect(matchingPreset(1, "GB")).toBe("custom");
    expect(matchingPreset(500, "GB")).toBe("custom");
    expect(applyPreset("photos")).toEqual({ size: 500, unit: "MB" });
    expect(applyPreset("4k-video")).toEqual({ size: 20, unit: "GB" });
  });

  it("resets to 1 GB, 100 Mbps, and 90% efficiency", () => {
    const first = resetUploadInputs();
    first.size = 9;
    expect(resetUploadInputs()).toEqual({ size: 1, unit: "GB", speedMbps: 100, efficiencyPercent: 90 });
    expect(fieldsFromInputs(resetUploadInputs())).toEqual({
      size: "1",
      unit: "GB",
      speed: "100",
      efficiency: "90",
    });
  });
});

describe("upload URL and stored inputs", () => {
  it("accepts a valid share link and round-trips it", () => {
    const parsed = parseUploadSearchParams(new URLSearchParams("size=1.5&unit=GiB&speed=75&efficiency=80"));
    expect(parsed.status).toBe("ok");
    expect(parsed.inputs).toEqual({ size: 1.5, unit: "GiB", speedMbps: 75, efficiencyPercent: 80 });
    const again = parseUploadSearchParams(new URLSearchParams(serializeUploadQuery(parsed.inputs!)));
    expect(again.inputs).toEqual(parsed.inputs);
  });

  it("fills missing params from the defaults when the provided ones are valid", () => {
    const parsed = parseUploadSearchParams(new URLSearchParams("size=2&unit=MB"));
    expect(parsed.status).toBe("ok");
    expect(parsed.inputs).toEqual({ size: 2, unit: "MB", speedMbps: 100, efficiencyPercent: 90 });
  });

  it("rejects NaN, Infinity, unknown units, out-of-range efficiency, and non-positive values", () => {
    expect(parseUploadSearchParams(new URLSearchParams()).status).toBe("empty");
    for (const query of [
      "size=NaN&unit=GB&speed=100&efficiency=90",
      "size=Infinity&unit=GB&speed=100&efficiency=90",
      "size=1&unit=gb&speed=100&efficiency=90",
      "size=1&unit=bytes&speed=100&efficiency=90",
      "size=1&unit=GB&speed=100&efficiency=0.9",
      "size=1&unit=GB&speed=100&efficiency=49",
      "size=1&unit=GB&speed=100&efficiency=101",
      "size=1&unit=GB&speed=100&efficiency=Infinity",
      "size=0&unit=GB&speed=100&efficiency=90",
      "size=-2&unit=GB&speed=100&efficiency=90",
      "size=1&unit=GB&speed=0&efficiency=90",
      "size=1&unit=GB&speed=-10&efficiency=90",
      "size=2&speed=0",
    ]) {
      const parsed = parseUploadSearchParams(new URLSearchParams(query));
      expect(parsed.status, query).toBe("invalid");
      expect(parsed.inputs).toBeNull();
    }
  });

  it("accepts only stored objects that would also be valid in the URL", () => {
    expect(parseStoredUploadInputs(JSON.stringify({ size: 2, unit: "MB", speed: 50, efficiency: 70 }))).toEqual({
      size: 2,
      unit: "MB",
      speedMbps: 50,
      efficiencyPercent: 70,
    });
    expect(parseStoredUploadInputs("{")).toBeNull();
    expect(parseStoredUploadInputs(JSON.stringify({ size: 1, unit: "GB", speed: 100, efficiency: 0.9 }))).toBeNull();
    expect(parseStoredUploadInputs(JSON.stringify({ size: 0, unit: "GB", speed: 100, efficiency: 90 }))).toBeNull();
    expect(parseStoredUploadInputs(JSON.stringify({ size: 1, unit: "nope", speed: 100, efficiency: 90 }))).toBeNull();
  });
});

describe("latest measured upload", () => {
  it("uses the newest finite upload measurement and ignores missing or unusable rates", () => {
    expect(
      latestMeasuredUploadMbps([
        { uploadMbps: null, createdAt: "2026-11-02T00:00:00.000Z" },
        { uploadMbps: 12.345, createdAt: "2026-11-01T00:00:00.000Z" },
      ]),
    ).toBe(12.35);
    expect(
      latestMeasuredUploadMbps([
        { uploadMbps: 10, createdAt: "2026-11-01T00:00:00.000Z" },
        { uploadMbps: 40, createdAt: "2026-11-02T00:00:00.000Z" },
      ]),
    ).toBe(40);
    expect(latestMeasuredUploadMbps([{ uploadMbps: 0, createdAt: "2026-11-02T00:00:00.000Z" }])).toBeNull();
    expect(latestMeasuredUploadMbps([{ uploadMbps: Number.POSITIVE_INFINITY, createdAt: "2026-11-02T00:00:00.000Z" }])).toBeNull();
    expect(latestMeasuredUploadMbps([{ uploadMbps: null, createdAt: "2026-11-02T00:00:00.000Z" }])).toBeNull();
  });
});

describe("estimate copy", () => {
  it("names the realistic duration and says the figure is an estimate", () => {
    const estimate = computeUploadEstimate(defaults);
    const text = uploadEstimateText(defaults, estimate!, "https://example.com/upload-time-calculator?size=1&unit=GB");
    expect(text).toContain("Estimated upload time: 1 min 29 sec");
    expect(text).toContain("At 100 Mbps upload speed with 90% efficiency.");
    expect(text).toContain("Ideal transfer: 1 min 20 sec");
    expect(text).toContain("Effective upload speed: 90 Mbps");
    expect(text).toContain("Estimate, not a live upload.");
  });
});
