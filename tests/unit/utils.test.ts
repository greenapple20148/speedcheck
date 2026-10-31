import { describe, expect, it } from "vitest";
import { formatMbps, formatMs, formatSpeedParts, slugify } from "@/lib/utils";

describe("formatMbps", () => {
  it("formats normal speeds", () => {
    expect(formatMbps(123.456)).toBe("123.5");
  });
  it("formats gigabit", () => {
    expect(formatMbps(1500)).toBe("1.50 Gbps");
  });

  it("formatSpeedParts splits amount and unit", () => {
    const parts = formatSpeedParts(1300);
    expect(parts?.amount).toBe("1.30");
    expect(parts?.unit).toBe("Gbps");
  });
  it("handles null", () => {
    expect(formatMbps(null)).toBe("—");
  });
});

describe("formatMs", () => {
  it("formats latency", () => {
    expect(formatMs(12.4)).toBe("12");
  });
});

describe("slugify", () => {
  it("creates url-safe slugs", () => {
    expect(slugify("New York City")).toBe("new-york-city");
  });
});
