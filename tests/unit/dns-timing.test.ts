import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/diagnostics/dns-probe/route";
import {
  DNS_PROBE_RATE_LIMIT,
  DNS_PROBE_RATE_WINDOW_MS,
  checkDnsProbeRateLimit,
} from "@/lib/network/dns-probe-rate-limit";
import {
  DNS_FAILURE_MESSAGE,
  DNS_MISSING_ENTRY_MESSAGE,
  DNS_NOT_EXPOSED_EXPLANATION,
  DNS_NOT_EXPOSED_HEADING,
  DNS_TIMEOUT_MESSAGE,
  analyzeResourceTiming,
  domainLookupMs,
  formatDnsHero,
  formatMeasuredDuration,
  originOnly,
  phaseWaterfall,
  requestTimingDetail,
  resourceEntryMatchesProbe,
  runDnsTimingTest,
  shouldCommitDnsResult,
  type DnsTimingDependencies,
  type ResourceTimingFields,
} from "@/lib/network/dns-timing";

const PROBE = "11111111-1111-4111-8111-111111111111";
const ORIGIN = "http://127.0.0.1:43123";
const PROBE_URL = `${ORIGIN}/api/diagnostics/dns-probe?probe=${PROBE}`;

function entry(overrides: Partial<ResourceTimingFields> = {}): ResourceTimingFields {
  return {
    name: PROBE_URL,
    initiatorType: "fetch",
    nextHopProtocol: "http/1.1",
    fetchStart: 100,
    domainLookupStart: 100,
    domainLookupEnd: 112,
    connectStart: 112,
    connectEnd: 140,
    secureConnectionStart: 120,
    requestStart: 140,
    responseStart: 155,
    responseEnd: 170,
    ...overrides,
  };
}

function deps(
  overrides: Partial<DnsTimingDependencies> &
    Pick<DnsTimingDependencies, "fetchImpl" | "readEntries">,
): DnsTimingDependencies {
  return {
    origin: ORIGIN,
    createProbeId: () => PROBE,
    sleep: async () => {},
    timeoutMs: 1_000,
    ...overrides,
  };
}

describe("domain lookup interval", () => {
  it("accepts a positive DNS interval", () => {
    expect(domainLookupMs({ domainLookupStart: 5, domainLookupEnd: 8 })).toBe(3);
    const analysis = analyzeResourceTiming(entry(), ORIGIN);
    expect(analysis.dnsMs).toBe(12);
    expect(analysis.phases.find((phase) => phase.id === "dns")?.durationMs).toBe(12);
  });

  it("rejects a zero-length interval", () => {
    expect(domainLookupMs({ domainLookupStart: 0, domainLookupEnd: 0 })).toBeNull();
    expect(domainLookupMs({ domainLookupStart: 15, domainLookupEnd: 15 })).toBeNull();
    expect(formatMeasuredDuration(0)).toBe("Not measured");
    expect(formatDnsHero(0)).toBeNull();
    expect(formatDnsHero(0.04)).toBe("0.040 ms");
    expect(formatDnsHero(0.04)).not.toMatch(/^0(\.0+)? ms$/);
  });

  it("rejects non-finite timings", () => {
    expect(
      domainLookupMs({ domainLookupStart: Number.NaN, domainLookupEnd: 8 }),
    ).toBeNull();
    expect(
      domainLookupMs({ domainLookupStart: 5, domainLookupEnd: Number.POSITIVE_INFINITY }),
    ).toBeNull();
    const analysis = analyzeResourceTiming(
      entry({
        domainLookupStart: Number.NaN,
        domainLookupEnd: Number.NaN,
        secureConnectionStart: 0,
      }),
      ORIGIN,
    );
    expect(analysis.dnsMs).toBeNull();
    expect(analysis.diagnostics.validDnsInterval).toBe(false);
  });
});

describe("cached and unrelated timings", () => {
  it("treats a cached or unexposed lookup as not measured", async () => {
    const cached = entry({
      fetchStart: 50,
      domainLookupStart: 0,
      domainLookupEnd: 0,
      connectStart: 0,
      connectEnd: 0,
      secureConnectionStart: 0,
      requestStart: 51,
      responseStart: 70,
      responseEnd: 80,
    });
    const result = await runDnsTimingTest(
      deps({
        fetchImpl: async () => ({
          ok: true,
          status: 200,
          text: async () => '{"ok":true}',
        }),
        readEntries: () => [cached],
      }),
    );
    expect(result.status).toBe("unexposed");
    expect(result.dnsMs).toBeNull();
    expect(result.dnsMs).not.toBe(0);
    expect(result.connectionReuse).toBe("confirmed");
    expect(requestTimingDetail(result.phases)).toBe("Available separately");
    expect(result.phases.find((phase) => phase.id === "response")?.durationMs).toBe(10);
    expect(JSON.stringify(result)).not.toMatch(/"dnsMs":0/);
  });

  it("does not substitute response time or connect time for DNS", () => {
    const analysis = analyzeResourceTiming(
      entry({
        domainLookupStart: 0,
        domainLookupEnd: 0,
        connectStart: 10,
        connectEnd: 40,
        secureConnectionStart: 0,
        fetchStart: 10,
        requestStart: 40,
        responseStart: 40,
        responseEnd: 110,
      }),
      ORIGIN,
    );
    expect(analysis.dnsMs).toBeNull();
    expect(analysis.phases.find((phase) => phase.id === "tcp")?.durationMs).toBe(30);
    expect(analysis.phases.find((phase) => phase.id === "response")?.durationMs).toBe(70);
    expect(analysis.connectionReuse).toBe("not-observed");
    expect(analysis.dnsMs).not.toBe(30);
    expect(analysis.dnsMs).not.toBe(70);
  });

  it("does not sum overlapping phases into DNS", () => {
    const sample = entry({
      fetchStart: 100,
      domainLookupStart: 100,
      domainLookupEnd: 130,
      connectStart: 110,
      secureConnectionStart: 125,
      connectEnd: 160,
      requestStart: 125,
      responseStart: 180,
      responseEnd: 200,
    });
    const analysis = analyzeResourceTiming(sample, ORIGIN);
    const tcp = analysis.phases.find((phase) => phase.id === "tcp")?.durationMs;
    const tls = analysis.phases.find((phase) => phase.id === "tls")?.durationMs;
    const phaseSum = analysis.phases.reduce(
      (sum, phase) => sum + (phase.durationMs ?? 0),
      0,
    );
    const connectWindow = sample.connectEnd - sample.connectStart;

    expect(analysis.dnsMs).toBe(30);
    expect(tcp).toBe(15);
    expect(tls).toBe(35);
    expect(tcp! + tls!).toBe(connectWindow);
    expect(tcp).toBeLessThan(connectWindow);
    expect(analysis.dnsMs).not.toBe(phaseSum);
    expect(analysis.dnsMs).not.toBe(connectWindow + tls!);
    expect(analysis.phasesOverlap).toBe(true);

    const bars = phaseWaterfall(analysis.phases);
    const dnsBar = bars.find((bar) => bar.id === "dns");
    const tcpBar = bars.find((bar) => bar.id === "tcp");
    expect(dnsBar).toBeTruthy();
    expect(tcpBar).toBeTruthy();
    expect(tcpBar!.leftPct).toBeLessThan(dnsBar!.leftPct + dnsBar!.widthPct);
    expect(tcpBar!.leftPct).not.toBeCloseTo(dnsBar!.leftPct + dnsBar!.widthPct);
  });
});

describe("request correlation", () => {
  it("returns a measured lookup only for the matching probe entry", async () => {
    let requested = "";
    const result = await runDnsTimingTest(
      deps({
        fetchImpl: async (url, init) => {
          requested = url;
          expect(init.cache).toBe("no-store");
          return { ok: true, status: 200, text: async () => '{"ok":true}' };
        },
        readEntries: () => [entry()],
      }),
    );
    expect(requested).toBe(`/api/diagnostics/dns-probe?probe=${PROBE}`);
    expect(result.status).toBe("measured");
    expect(result.dnsMs).toBe(12);
    expect(formatDnsHero(result.dnsMs)).toBe("12.0 ms");
  });

  it("ignores an entry that does not match the test request", async () => {
    const foreign = entry({
      name: `${ORIGIN}/api/speedtest/config?dnsProbe=${PROBE}&token=secret`,
      domainLookupStart: 10,
      domainLookupEnd: 99,
    });
    expect(resourceEntryMatchesProbe(foreign.name, PROBE, ORIGIN)).toBe(false);
    const result = await runDnsTimingTest(
      deps({
        fetchImpl: async () => ({
          ok: true,
          status: 200,
          text: async () => '{"ok":true}',
        }),
        readEntries: () => [foreign],
      }),
    );
    expect(result.status).toBe("missing-entry");
    expect(result.dnsMs).toBeNull();
    expect(JSON.stringify(result)).not.toContain("secret");
    expect(JSON.stringify(result)).not.toContain("99");
  });

  it("reports a missing Resource Timing entry without a duration", async () => {
    const result = await runDnsTimingTest(
      deps({
        fetchImpl: async () => ({
          ok: true,
          status: 200,
          text: async () => '{"ok":true}',
        }),
        readEntries: () => [],
      }),
    );
    expect(result.status).toBe("missing-entry");
    expect(result.dnsMs).toBeNull();
  });

  it("drops DNS when the probe response fails", async () => {
    const result = await runDnsTimingTest(
      deps({
        fetchImpl: async () => ({ ok: false, status: 503, text: async () => "" }),
        readEntries: () => [entry()],
      }),
    );
    expect(result.status).toBe("failed");
    expect(result.dnsMs).toBeNull();
  });
});

describe("timeout, failure, and stale runs", () => {
  it("times out without reporting a DNS duration", async () => {
    const result = await runDnsTimingTest(
      deps({
        timeoutMs: 20,
        readEntries: () => [entry()],
        fetchImpl: (_url, init) =>
          new Promise((_resolve, reject) => {
            const abort = () => {
              const error = new Error("The operation was aborted");
              error.name = "AbortError";
              reject(error);
            };
            if (init.signal.aborted) {
              abort();
              return;
            }
            init.signal.addEventListener("abort", abort);
          }),
      }),
    );
    expect(result.status).toBe("timeout");
    expect(result.dnsMs).toBeNull();
  });

  it("records a network failure without a DNS duration", async () => {
    const result = await runDnsTimingTest(
      deps({
        readEntries: () => [entry()],
        fetchImpl: async () => {
          throw new TypeError("Failed to fetch");
        },
      }),
    );
    expect(result.status).toBe("failed");
    expect(result.dnsMs).toBeNull();
  });

  it("cancels a stale attempt instead of publishing its duration", async () => {
    const controller = new AbortController();
    const pending = runDnsTimingTest(
      deps({
        signal: controller.signal,
        timeoutMs: 5_000,
        readEntries: () => [entry()],
        fetchImpl: (_url, init) =>
          new Promise((_resolve, reject) => {
            const abort = () => {
              const error = new Error("aborted");
              error.name = "AbortError";
              reject(error);
            };
            if (init.signal.aborted) {
              abort();
              return;
            }
            init.signal.addEventListener("abort", abort);
          }),
      }),
    );
    controller.abort();
    const result = await pending;
    expect(result.status).toBe("cancelled");
    expect(result.dnsMs).toBeNull();
    expect(shouldCommitDnsResult(1, 2, "measured")).toBe(false);
    expect(shouldCommitDnsResult(2, 2, "cancelled")).toBe(false);
    expect(shouldCommitDnsResult(2, 2, "measured")).toBe(true);
  });
});

describe("safe display", () => {
  it("keeps the unexposed explanation exact and free of a zero measurement", () => {
    expect(DNS_NOT_EXPOSED_HEADING).toBe("DNS timing not exposed");
    expect(DNS_NOT_EXPOSED_EXPLANATION).toBe(
      "Your browser did not report a separate DNS lookup for this request. This commonly happens when DNS information is cached or an existing connection is reused.",
    );
    for (const message of [
      DNS_NOT_EXPOSED_EXPLANATION,
      DNS_FAILURE_MESSAGE,
      DNS_TIMEOUT_MESSAGE,
      DNS_MISSING_ENTRY_MESSAGE,
    ]) {
      expect(message).not.toMatch(/0(\.0+)?\s*ms/);
    }
  });

  it("keeps diagnostics to an origin and drops query tokens", () => {
    expect(originOnly(`${PROBE_URL}&token=secret`)).toBe(ORIGIN);
    const analysis = analyzeResourceTiming(
      entry({
        initiatorType: "https://evil.test/?token=secret",
        nextHopProtocol: "h2",
      }),
      `${ORIGIN}/api/diagnostics/dns-probe?probe=${PROBE}&token=secret`,
    );
    expect(analysis.diagnostics.origin).toBe(ORIGIN);
    expect(analysis.diagnostics.initiatorType).toBeNull();
    expect(analysis.diagnostics.protocol).toBe("h2");
    expect(analysis.diagnostics.validDnsInterval).toBe(true);
    expect(JSON.stringify(analysis.diagnostics)).not.toContain("token");
    expect(JSON.stringify(analysis.diagnostics)).not.toContain(PROBE);
  });
});

describe("dns probe endpoint", () => {
  it("answers with no-store and does not echo the probe id", async () => {
    const response = await GET(
      new NextRequest(`http://127.0.0.1/api/diagnostics/dns-probe?probe=${PROBE}`),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    const body = await response.json();
    expect(body).toEqual({ ok: true });
    expect(JSON.stringify(body)).not.toContain(PROBE);
  });

  it("rejects a probe id without copying it back", async () => {
    const response = await GET(
      new NextRequest("http://127.0.0.1/api/diagnostics/dns-probe?probe=token-secret"),
    );
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(JSON.stringify(await response.json())).not.toContain("token-secret");
  });

  it("rate limits a single client key", () => {
    const key = `unit-${PROBE}`;
    const now = 1_700_000_000_000;
    for (let i = 0; i < DNS_PROBE_RATE_LIMIT; i++) {
      expect(checkDnsProbeRateLimit(key, now).ok).toBe(true);
    }
    expect(checkDnsProbeRateLimit(key, now).ok).toBe(false);
    expect(checkDnsProbeRateLimit(key, now + DNS_PROBE_RATE_WINDOW_MS + 1).ok).toBe(true);
  });
});
