import { describe, expect, it, vi, afterEach } from "vitest";
import { resolveMeasurementConfig } from "@/lib/speedtest/measurement-config";

describe("resolveMeasurementConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("disables tests when the kill switch is false", () => {
    vi.stubEnv("MEASUREMENT_TESTS_ENABLED", "false");
    vi.stubEnv("NEXT_PUBLIC_SPEEDTEST_URL", "https://measure.example.com");
    const cfg = resolveMeasurementConfig("https://myspeedgauge.com");
    expect(cfg.ready).toBe(false);
    expect(cfg.baseUrl).toBeNull();
    expect(cfg.mode).toBe("none");
  });

  it("uses direct public HTTPS URL in production", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_SPEEDTEST_URL",
      "https://measure.example.com",
    );
    const cfg = resolveMeasurementConfig("https://myspeedgauge.com");
    expect(cfg.mode).toBe("direct");
    expect(cfg.baseUrl).toBe("https://measure.example.com");
    expect(cfg.ready).toBe(true);
  });

  it("enables Cloudflare when dedicated URL is loopback-only on production", () => {
    vi.stubEnv("NEXT_PUBLIC_SPEEDTEST_URL", "http://127.0.0.1:18443");
    const cfg = resolveMeasurementConfig("https://myspeedgauge.com");
    expect(cfg.provider).toBe("cloudflare");
    expect(cfg.ready).toBe(true);
    expect(cfg.baseUrl).toBeNull();
  });

  it("forces dedicated when provider is dedicated and URL is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SPEEDTEST_PROVIDER", "dedicated");
    vi.stubEnv("NEXT_PUBLIC_SPEEDTEST_URL", "");
    const cfg = resolveMeasurementConfig("https://myspeedgauge.com");
    expect(cfg.provider).toBe("dedicated");
    expect(cfg.ready).toBe(false);
  });

  it("enables proxy when internal URL is set on Vercel", () => {
    vi.stubEnv("SPEEDTEST_INTERNAL_URL", "https://measure.example.com");
    const cfg = resolveMeasurementConfig("https://myspeedgauge.com");
    expect(cfg.mode).toBe("proxy");
    expect(cfg.baseUrl).toBe("https://myspeedgauge.com/api/speedtest/measure");
    expect(cfg.ready).toBe(true);
  });
});
