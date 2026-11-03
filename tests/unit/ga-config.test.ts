import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_GA_MEASUREMENT_ID,
  gaMeasurementId,
} from "@/lib/analytics/config";

describe("gaMeasurementId", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the site measurement id when env is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "");
    expect(gaMeasurementId()).toBe("G-DDDY9B4SBG");
    expect(DEFAULT_GA_MEASUREMENT_ID).toBe("G-DDDY9B4SBG");
  });

  it("prefers a non-empty env override", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-OVERRIDE");
    expect(gaMeasurementId()).toBe("G-OVERRIDE");
  });
});
