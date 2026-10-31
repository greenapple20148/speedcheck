import { describe, expect, it, vi, afterEach } from "vitest";
import {
  isServerlessRuntime,
  resolveResultsStorePath,
} from "@/lib/db/results-store-path";

describe("results-store-path", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses /tmp on Vercel when RESULTS_STORE_PATH unset", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("RESULTS_STORE_PATH", "");
    expect(isServerlessRuntime()).toBe(true);
    expect(resolveResultsStorePath()).toBe("/tmp/speedcheck/results.json");
  });

  it("respects RESULTS_STORE_PATH override", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("RESULTS_STORE_PATH", "/custom/results.json");
    expect(resolveResultsStorePath()).toBe("/custom/results.json");
  });

  it("uses .data locally", () => {
    vi.stubEnv("VERCEL", "");
    delete process.env.VERCEL;
    vi.stubEnv("RESULTS_STORE_PATH", "");
    const p = resolveResultsStorePath();
    expect(p.endsWith(".data/results.json")).toBe(true);
  });
});
