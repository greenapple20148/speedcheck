import { describe, expect, it } from "vitest";
import {
  formatCloudflareColoLocation,
  parseCloudflareTraceBody,
} from "@/lib/cloudflare/cdn-cgi-trace";
import { bpsToMbps } from "@/lib/speedtest/cloudflare-measurements";
import { resolveSpeedtestProvider } from "@/lib/speedtest/provider";

describe("parseCloudflareTraceBody", () => {
  it("extracts colo and loc", () => {
    const trace = parseCloudflareTraceBody(
      "fl=1024f5\nh=speed.cloudflare.com\ncolo=EWR\nloc=US\n",
    );
    expect(trace.colo).toBe("EWR");
    expect(trace.loc).toBe("US");
  });
});

describe("formatCloudflareColoLocation", () => {
  it("formats colo with country", () => {
    expect(formatCloudflareColoLocation({ colo: "EWR", loc: "US", ip: null })).toBe(
      "EWR (US)",
    );
  });
});

describe("bpsToMbps", () => {
  it("converts bps to Mbps", () => {
    expect(bpsToMbps(89_200_000)).toBeCloseTo(89.2, 1);
  });
});

describe("resolveSpeedtestProvider", () => {
  it("prefers dedicated when configured and ready", () => {
    expect(
      resolveSpeedtestProvider("https://myspeedguage.com", true),
    ).toBe("dedicated");
  });

  it("falls back to cloudflare when dedicated is not ready", () => {
    expect(
      resolveSpeedtestProvider("https://myspeedguage.com", false),
    ).toBe("cloudflare");
  });
});
