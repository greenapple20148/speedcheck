import { describe, expect, it, vi, afterEach } from "vitest";
import { resolveSpeedtestBaseUrl } from "@/lib/speedtest/base-url";

describe("resolveSpeedtestBaseUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses same-origin proxy for local page", () => {
    vi.stubEnv("NEXT_PUBLIC_SPEEDTEST_URL", "http://127.0.0.1:18443");
    vi.stubGlobal("window", {
      location: { origin: "http://127.0.0.1:43123" },
    } as Window);
    expect(resolveSpeedtestBaseUrl()).toBe(
      "http://127.0.0.1:43123/api/measurement",
    );
  });

  it("returns empty when production has no measurement env", () => {
    vi.stubEnv("NEXT_PUBLIC_SPEEDTEST_URL", "http://127.0.0.1:18443");
    vi.stubGlobal("window", {
      location: { origin: "https://myspeedgauge.example" },
    } as Window);
    expect(resolveSpeedtestBaseUrl()).toBe("");
  });

  it("uses public measurement URL when configured", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_SPEEDTEST_URL",
      "https://measure.example.com",
    );
    vi.stubGlobal("window", {
      location: { origin: "https://myspeedgauge.example" },
    } as Window);
    expect(resolveSpeedtestBaseUrl()).toBe("https://measure.example.com");
  });
});
