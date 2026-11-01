/**
 * Browser DNS timing from the Performance Resource Timing API.
 *
 * dnsDuration = domainLookupEnd - domainLookupStart only when that interval
 * is finite, positive, and belongs to the test request. A zero-length
 * interval is not measured DNS latency. HTTP, TTFB, and connect time are
 * never substituted for it.
 *
 * The probe id correlates one same-origin request with its Resource Timing
 * entry. no-store and a unique id do not force a fresh DNS lookup. Stub
 * caches and connection reuse can still hide the interval.
 *
 * A server-side resolver benchmark is not implemented. This repo has no
 * approved resolver-probe pattern. Timing the server resolver, or a third
 * party, would not measure the visitor's local DNS and could issue
 * unbounded queries. No resolver timings are invented here.
 */

export const DNS_PROBE_PATH = "/api/diagnostics/dns-probe";
export const DNS_PROBE_TIMEOUT_MS = 8_000;

/** UUID v4. The probe id is a correlation key, not a cache-busting claim. */
export const DNS_PROBE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const DNS_NOT_EXPOSED_HEADING = "DNS timing not exposed";
export const DNS_NOT_EXPOSED_EXPLANATION =
  "Your browser did not report a separate DNS lookup for this request. This commonly happens when DNS information is cached or an existing connection is reused.";
export const DNS_MEASURED_NOTE =
  "This is the browser Resource Timing lookup for this request. It is not a resolver benchmark. Cache and connection reuse can hide the lookup on another run.";
export const DNS_FAILURE_MESSAGE = "The timing request failed. No DNS time is shown.";
export const DNS_TIMEOUT_MESSAGE = "The timing request timed out. No DNS time is shown.";
export const DNS_MISSING_ENTRY_MESSAGE =
  "The test request finished, but the browser did not provide a Resource Timing entry for it. No DNS time is shown.";

const ENTRY_RETRY_DELAYS_MS = [0, 16, 32, 48];

export type DnsPhaseId = "dns" | "tcp" | "tls" | "request" | "response";

export const DNS_PHASE_DEFINITIONS: ReadonlyArray<{ id: DnsPhaseId; label: string }> = [
  { id: "dns", label: "DNS lookup" },
  { id: "tcp", label: "TCP connection" },
  { id: "tls", label: "TLS handshake" },
  { id: "request", label: "Request to first byte" },
  { id: "response", label: "Response transfer" },
];

export interface TimingPhase {
  id: DnsPhaseId;
  label: string;
  /** Null when the browser did not expose a positive interval. Never zero-as-measured. */
  durationMs: number | null;
  startMs: number | null;
  endMs: number | null;
}

export interface ResourceTimingFields {
  name: string;
  initiatorType?: string;
  nextHopProtocol?: string;
  fetchStart: number;
  domainLookupStart: number;
  domainLookupEnd: number;
  connectStart: number;
  connectEnd: number;
  secureConnectionStart: number;
  requestStart: number;
  responseStart: number;
  responseEnd: number;
  /** Present and 0 means the timing is opaque. Undefined means the field was not provided. */
  responseStatus?: number;
}

export type ConnectionReuse = "confirmed" | "possible" | "not-observed";

export interface DnsDiagnostics {
  origin: string | null;
  initiatorType: string | null;
  protocol: string | null;
  domainLookupStart: number | null;
  domainLookupEnd: number | null;
  connectStart: number | null;
  connectEnd: number | null;
  tlsStart: number | null;
  responseStart: number | null;
  responseEnd: number | null;
  validDnsInterval: boolean;
}

export interface DnsTimingAnalysis {
  dnsMs: number | null;
  phases: TimingPhase[];
  connectionReuse: ConnectionReuse;
  diagnostics: DnsDiagnostics;
  phasesOverlap: boolean;
}

export type DnsTestStatus =
  "measured" | "unexposed" | "missing-entry" | "failed" | "timeout" | "cancelled";

export interface DnsTestResult {
  status: DnsTestStatus;
  probeId: string;
  dnsMs: number | null;
  phases: TimingPhase[];
  connectionReuse: ConnectionReuse | null;
  diagnostics: DnsDiagnostics | null;
  phasesOverlap: boolean;
}

export interface DnsProbeResponse {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
}

export interface DnsTimingDependencies {
  fetchImpl: (
    url: string,
    init: {
      method: "GET";
      cache: "no-store";
      credentials: "same-origin";
      signal: AbortSignal;
      headers: Record<string, string>;
    },
  ) => Promise<DnsProbeResponse>;
  readEntries: () => ResourceTimingFields[];
  origin: string;
  createProbeId?: () => string;
  timeoutMs?: number;
  sleep?: (ms: number) => Promise<void>;
  signal?: AbortSignal;
}

interface PhaseInterval {
  durationMs: number;
  startMs: number;
  endMs: number;
}

export function isDnsProbeId(value: string): boolean {
  return DNS_PROBE_ID_PATTERN.test(value);
}

export function dnsProbeRequestPath(probeId: string): string {
  return `${DNS_PROBE_PATH}?probe=${encodeURIComponent(probeId)}`;
}

/** Origin only. Path, query, userinfo, and fragment are discarded. */
export function originOnly(value: string): string | null {
  try {
    const url = new URL(value);
    if (!url.origin || url.origin === "null") return null;
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Resource Timing DNS duration, only when the browser actually exposed a lookup.
 * A zero or missing interval is unavailable (cache, connection reuse, or an IP
 * literal), not a 0 ms DNS lookup.
 */
export function domainLookupMs(
  entry: Pick<ResourceTimingFields, "domainLookupStart" | "domainLookupEnd">,
): number | null {
  const start = entry.domainLookupStart;
  const end = entry.domainLookupEnd;
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (start <= 0 || end <= 0 || end < start) return null;
  const ms = end - start;
  if (ms <= 0) return null;
  return ms;
}

export function blankTimingPhases(): TimingPhase[] {
  return DNS_PHASE_DEFINITIONS.map((phase) => ({
    id: phase.id,
    label: phase.label,
    durationMs: null,
    startMs: null,
    endMs: null,
  }));
}

export function formatDurationMs(ms: number | null): string | null {
  if (ms == null || !Number.isFinite(ms) || ms <= 0) return null;
  const digits = ms >= 1 ? 1 : 3;
  const text = ms.toFixed(digits);
  if (!Number.isFinite(Number(text)) || Number(text) <= 0) {
    return `${ms.toExponential(2)} ms`;
  }
  return `${text} ms`;
}

export function formatMeasuredDuration(ms: number | null): string {
  return formatDurationMs(ms) ?? "Not measured";
}

/** Hero text for a real lookup. Refuses a rounded zero. */
export function formatDnsHero(ms: number | null): string | null {
  const text = formatDurationMs(ms);
  if (!text || /^0(\.0+)? ms$/.test(text)) return null;
  return text;
}

export function formatNavigationTimestamp(value: number | null): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return "Not exposed";
  const digits = value >= 1 ? 1 : 3;
  const text = value.toFixed(digits);
  if (Number(text) <= 0) return "Not exposed";
  return `${text} ms from navigation start`;
}

export function connectionReuseLabel(value: ConnectionReuse | null): string {
  if (value === "confirmed") return "Confirmed";
  if (value === "not-observed") return "Not observed";
  return "Possible";
}

export function requestTimingDetail(
  phases: TimingPhase[],
): "Available separately" | "Not measured" {
  const available = phases.some(
    (phase) => phase.id !== "dns" && phase.durationMs != null && phase.durationMs > 0,
  );
  return available ? "Available separately" : "Not measured";
}

export function shouldCommitDnsResult(
  runId: number,
  latestRunId: number,
  status: DnsTestStatus,
): boolean {
  return runId === latestRunId && status !== "cancelled";
}

export function resourceEntryMatchesProbe(
  entryName: string,
  probeId: string,
  pageOrigin: string,
): boolean {
  if (!isDnsProbeId(probeId)) return false;
  const expectedOrigin = originOnly(pageOrigin);
  if (!expectedOrigin) return false;
  let url: URL;
  try {
    url = new URL(entryName);
  } catch {
    return false;
  }
  if (url.origin !== expectedOrigin) return false;
  if (url.pathname !== DNS_PROBE_PATH) return false;
  if (url.searchParams.get("probe") !== probeId) return false;
  const keys = [...url.searchParams.keys()];
  return keys.length === 1 && keys[0] === "probe";
}

export function timingPhasesOverlap(phases: TimingPhase[]): boolean {
  const spans = phases.filter(
    (phase) =>
      phase.durationMs != null &&
      phase.durationMs > 0 &&
      phase.startMs != null &&
      phase.endMs != null &&
      phase.endMs > phase.startMs,
  );
  for (let i = 0; i < spans.length; i++) {
    for (let j = i + 1; j < spans.length; j++) {
      const a = spans[i];
      const b = spans[j];
      if (a.startMs! < b.endMs! && b.startMs! < a.endMs!) return true;
    }
  }
  return false;
}

export function phaseWaterfall(
  phases: TimingPhase[],
): Array<{ id: DnsPhaseId; leftPct: number; widthPct: number }> {
  const measured = phases.filter(
    (phase) =>
      phase.durationMs != null &&
      phase.durationMs > 0 &&
      phase.startMs != null &&
      phase.endMs != null &&
      phase.endMs > phase.startMs,
  );
  if (measured.length === 0) return [];
  const min = Math.min(...measured.map((phase) => phase.startMs!));
  const max = Math.max(...measured.map((phase) => phase.endMs!));
  const span = max - min;
  if (!(span > 0)) return [];
  return measured.map((phase) => ({
    id: phase.id,
    leftPct: ((phase.startMs! - min) / span) * 100,
    widthPct: ((phase.endMs! - phase.startMs!) / span) * 100,
  }));
}

export function analyzeResourceTiming(
  entry: ResourceTimingFields,
  requestOrigin: string,
): DnsTimingAnalysis {
  const opaque = entry.responseStatus === 0;
  const dnsInterval = opaque ? null : guardedDns(entry);
  const connection = opaque ? { tcp: null, tls: null } : connectPhases(entry);
  const request = opaque
    ? null
    : positiveInterval(entry.requestStart, entry.responseStart, entry.fetchStart);
  const response = opaque
    ? null
    : positiveInterval(entry.responseStart, entry.responseEnd, entry.fetchStart);

  const phases = phasesFrom(
    dnsInterval,
    connection.tcp,
    connection.tls,
    request,
    response,
  );
  const dnsMs = dnsInterval?.durationMs ?? null;

  return {
    dnsMs,
    phases,
    connectionReuse: opaque
      ? "possible"
      : classifyConnectionReuse(
          entry,
          dnsMs != null,
          connection.tcp,
          connection.tls,
          request,
          response,
        ),
    diagnostics: diagnosticsFrom(entry, requestOrigin, dnsMs != null),
    phasesOverlap: timingPhasesOverlap(phases),
  };
}

export function emptyDnsTestResult(status: DnsTestStatus, probeId = ""): DnsTestResult {
  return {
    status,
    probeId,
    dnsMs: null,
    phases: blankTimingPhases(),
    connectionReuse: null,
    diagnostics: null,
    phasesOverlap: false,
  };
}

export async function runDnsTimingTest(
  deps: DnsTimingDependencies,
): Promise<DnsTestResult> {
  const probeId = deps.createProbeId?.() ?? crypto.randomUUID();
  if (!isDnsProbeId(probeId) || !originOnly(deps.origin)) {
    return emptyDnsTestResult("failed", probeId);
  }
  if (deps.signal?.aborted) {
    return emptyDnsTestResult("cancelled", probeId);
  }

  const timeoutMs = deps.timeoutMs ?? DNS_PROBE_TIMEOUT_MS;
  const sleep = deps.sleep ?? defaultSleep;
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const abortFromCaller = () => {
    if (!timedOut) controller.abort();
  };
  deps.signal?.addEventListener("abort", abortFromCaller);

  try {
    const response = await deps.fetchImpl(dnsProbeRequestPath(probeId), {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });
    await response.text().catch(() => "");
    if (deps.signal?.aborted && !timedOut)
      return emptyDnsTestResult("cancelled", probeId);
    if (!response.ok) return emptyDnsTestResult("failed", probeId);

    let match = selectMatchingEntry(deps.readEntries(), probeId, deps.origin);
    if (!match) {
      for (const delay of ENTRY_RETRY_DELAYS_MS) {
        await sleep(delay);
        if (deps.signal?.aborted && !timedOut)
          return emptyDnsTestResult("cancelled", probeId);
        match = selectMatchingEntry(deps.readEntries(), probeId, deps.origin);
        if (match) break;
      }
    }
    if (!match) return emptyDnsTestResult("missing-entry", probeId);

    const analysis = analyzeResourceTiming(match, deps.origin);
    return {
      status: analysis.dnsMs == null ? "unexposed" : "measured",
      probeId,
      dnsMs: analysis.dnsMs,
      phases: analysis.phases,
      connectionReuse: analysis.connectionReuse,
      diagnostics: analysis.diagnostics,
      phasesOverlap: analysis.phasesOverlap,
    };
  } catch (error) {
    if (timedOut) return emptyDnsTestResult("timeout", probeId);
    if (isAbortError(error) || deps.signal?.aborted)
      return emptyDnsTestResult("cancelled", probeId);
    return emptyDnsTestResult("failed", probeId);
  } finally {
    clearTimeout(timer);
    deps.signal?.removeEventListener("abort", abortFromCaller);
  }
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function selectMatchingEntry(
  entries: ResourceTimingFields[],
  probeId: string,
  origin: string,
): ResourceTimingFields | undefined {
  const matches = entries.filter((entry) =>
    resourceEntryMatchesProbe(entry.name, probeId, origin),
  );
  return matches[matches.length - 1];
}

function guardedDns(entry: ResourceTimingFields): PhaseInterval | null {
  const durationMs = domainLookupMs(entry);
  if (durationMs == null) return null;
  if (entry.fetchStart > 0 && entry.domainLookupStart < entry.fetchStart) return null;
  if (entry.responseEnd > 0 && entry.domainLookupEnd > entry.responseEnd) return null;
  return {
    durationMs,
    startMs: entry.domainLookupStart,
    endMs: entry.domainLookupEnd,
  };
}

function positiveInterval(
  start: number,
  end: number,
  fetchStart: number,
): PhaseInterval | null {
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (!(start > 0) || !(end > start)) return null;
  if (Number.isFinite(fetchStart) && fetchStart > 0 && start < fetchStart) return null;
  return { durationMs: end - start, startMs: start, endMs: end };
}

/**
 * TCP and TLS split the connect window so neither contains the other.
 * A zero-length side is omitted rather than reported as 0 ms.
 */
function connectPhases(entry: ResourceTimingFields): {
  tcp: PhaseInterval | null;
  tls: PhaseInterval | null;
} {
  const { connectStart, connectEnd, secureConnectionStart, fetchStart } = entry;
  if (
    !Number.isFinite(connectStart) ||
    !Number.isFinite(connectEnd) ||
    !Number.isFinite(secureConnectionStart)
  ) {
    return { tcp: null, tls: null };
  }

  if (
    secureConnectionStart > connectStart &&
    secureConnectionStart < connectEnd &&
    secureConnectionStart > 0
  ) {
    return {
      tcp: positiveInterval(connectStart, secureConnectionStart, fetchStart),
      tls: positiveInterval(secureConnectionStart, connectEnd, fetchStart),
    };
  }

  if (
    secureConnectionStart > 0 &&
    secureConnectionStart === connectStart &&
    connectEnd > connectStart
  ) {
    return {
      tcp: null,
      tls: positiveInterval(connectStart, connectEnd, fetchStart),
    };
  }

  if (
    secureConnectionStart > 0 &&
    secureConnectionStart === connectEnd &&
    connectEnd > connectStart
  ) {
    return {
      tcp: positiveInterval(connectStart, connectEnd, fetchStart),
      tls: null,
    };
  }

  if (secureConnectionStart > 0) return { tcp: null, tls: null };

  return {
    tcp: positiveInterval(connectStart, connectEnd, fetchStart),
    tls: null,
  };
}

function phasesFrom(
  dns: PhaseInterval | null,
  tcp: PhaseInterval | null,
  tls: PhaseInterval | null,
  request: PhaseInterval | null,
  response: PhaseInterval | null,
): TimingPhase[] {
  const byId: Record<DnsPhaseId, PhaseInterval | null> = {
    dns,
    tcp,
    tls,
    request,
    response,
  };
  return DNS_PHASE_DEFINITIONS.map((phase) => {
    const interval = byId[phase.id];
    return {
      id: phase.id,
      label: phase.label,
      durationMs: interval?.durationMs ?? null,
      startMs: interval?.startMs ?? null,
      endMs: interval?.endMs ?? null,
    };
  });
}

function classifyConnectionReuse(
  entry: ResourceTimingFields,
  dnsMeasured: boolean,
  tcp: PhaseInterval | null,
  tls: PhaseInterval | null,
  request: PhaseInterval | null,
  response: PhaseInterval | null,
): ConnectionReuse {
  if (dnsMeasured || tcp || tls) return "not-observed";

  const lookupCollapsed =
    Number.isFinite(entry.domainLookupStart) &&
    Number.isFinite(entry.domainLookupEnd) &&
    entry.domainLookupStart === entry.domainLookupEnd;
  const connectCollapsed =
    Number.isFinite(entry.connectStart) &&
    Number.isFinite(entry.connectEnd) &&
    entry.connectStart === entry.connectEnd;
  const transferMeasured = request != null || response != null;
  if (!lookupCollapsed || !connectCollapsed || !transferMeasured) return "possible";

  const fetchStart = entry.fetchStart;
  const specReuse =
    fetchStart > 0 &&
    entry.domainLookupStart === fetchStart &&
    entry.domainLookupEnd === fetchStart &&
    entry.connectStart === fetchStart &&
    entry.connectEnd === fetchStart &&
    (entry.secureConnectionStart === 0 || entry.secureConnectionStart === fetchStart);
  const chromiumReuse =
    entry.domainLookupStart === 0 &&
    entry.domainLookupEnd === 0 &&
    entry.connectStart === 0 &&
    entry.connectEnd === 0 &&
    entry.secureConnectionStart === 0;

  if (specReuse || chromiumReuse) return "confirmed";
  return "possible";
}

function diagnosticsFrom(
  entry: ResourceTimingFields,
  requestOrigin: string,
  validDnsInterval: boolean,
): DnsDiagnostics {
  return {
    origin: originOnly(requestOrigin),
    initiatorType: sanitizeToken(entry.initiatorType, /^[a-z]{1,32}$/i),
    protocol: sanitizeToken(entry.nextHopProtocol, /^[a-z0-9./]{1,32}$/i),
    domainLookupStart: exposedTimestamp(entry.domainLookupStart),
    domainLookupEnd: exposedTimestamp(entry.domainLookupEnd),
    connectStart: exposedTimestamp(entry.connectStart),
    connectEnd: exposedTimestamp(entry.connectEnd),
    tlsStart: exposedTimestamp(entry.secureConnectionStart),
    responseStart: exposedTimestamp(entry.responseStart),
    responseEnd: exposedTimestamp(entry.responseEnd),
    validDnsInterval,
  };
}

function exposedTimestamp(value: number): number | null {
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

function sanitizeToken(value: string | undefined, pattern: RegExp): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!pattern.test(trimmed)) return null;
  return trimmed;
}

function isAbortError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("name" in error)) return false;
  return (error as { name?: unknown }).name === "AbortError";
}
