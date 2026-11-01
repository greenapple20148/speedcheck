"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  Cable,
  ChevronDown,
  Clock,
  Loader2,
  Lock,
  Play,
  RotateCcw,
  Search,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DNS_FAILURE_MESSAGE,
  DNS_MEASURED_NOTE,
  DNS_MISSING_ENTRY_MESSAGE,
  DNS_NOT_EXPOSED_EXPLANATION,
  DNS_NOT_EXPOSED_HEADING,
  DNS_TIMEOUT_MESSAGE,
  blankTimingPhases,
  connectionReuseLabel,
  emptyDnsTestResult,
  formatDnsHero,
  formatMeasuredDuration,
  formatNavigationTimestamp,
  phaseWaterfall,
  requestTimingDetail,
  runDnsTimingTest,
  shouldCommitDnsResult,
  type DnsDiagnostics,
  type DnsPhaseId,
  type DnsTestResult,
  type ResourceTimingFields,
  type TimingPhase,
} from "@/lib/network/dns-timing";
import { cn } from "@/lib/utils";

const PHASE_ICONS: Record<DnsPhaseId, LucideIcon> = {
  dns: Search,
  tcp: Cable,
  tls: Lock,
  request: Timer,
  response: ArrowDownToLine,
};

function readResourceEntries(): ResourceTimingFields[] {
  if (
    typeof performance === "undefined" ||
    typeof performance.getEntriesByType !== "function"
  ) {
    return [];
  }
  return performance.getEntriesByType("resource").map((entry) => {
    const timing = entry as PerformanceResourceTiming;
    const extra = timing as PerformanceResourceTiming & {
      nextHopProtocol?: string;
      responseStatus?: number;
    };
    return {
      name: timing.name,
      initiatorType: timing.initiatorType,
      nextHopProtocol:
        typeof extra.nextHopProtocol === "string" ? extra.nextHopProtocol : undefined,
      responseStatus:
        typeof extra.responseStatus === "number" ? extra.responseStatus : undefined,
      fetchStart: timing.fetchStart,
      domainLookupStart: timing.domainLookupStart,
      domainLookupEnd: timing.domainLookupEnd,
      connectStart: timing.connectStart,
      connectEnd: timing.connectEnd,
      secureConnectionStart: timing.secureConnectionStart,
      requestStart: timing.requestStart,
      responseStart: timing.responseStart,
      responseEnd: timing.responseEnd,
    };
  });
}

function formatTestedAt(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function statusFor(
  runState: "idle" | "running",
  result: DnsTestResult | null,
): { label: string; dot: string } {
  if (runState === "running") return { label: "Measuring", dot: "bg-primary" };
  if (!result) return { label: "Ready", dot: "bg-muted-foreground" };
  switch (result.status) {
    case "measured":
      return { label: "DNS lookup measured", dot: "bg-success" };
    case "unexposed":
      return { label: "Not exposed", dot: "bg-warning" };
    case "missing-entry":
      return { label: "Timing entry missing", dot: "bg-destructive" };
    case "failed":
      return { label: "Request failed", dot: "bg-destructive" };
    case "timeout":
      return { label: "Timed out", dot: "bg-destructive" };
    default:
      return { label: "Ready", dot: "bg-muted-foreground" };
  }
}

export function DnsTimingPanel() {
  const [runState, setRunState] = useState<"idle" | "running">("idle");
  const [result, setResult] = useState<DnsTestResult | null>(null);
  const [testedAt, setTestedAt] = useState<Date | null>(null);
  const runSeq = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      runSeq.current += 1;
      abortRef.current?.abort();
    };
  }, []);

  const run = () => {
    const seq = ++runSeq.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setRunState("running");

    void (async () => {
      try {
        const next = await runDnsTimingTest({
          origin: window.location.origin,
          signal: controller.signal,
          readEntries: readResourceEntries,
          fetchImpl: async (url, init) => {
            const response = await fetch(url, init);
            return {
              ok: response.ok,
              status: response.status,
              text: () => response.text(),
            };
          },
        });
        if (!shouldCommitDnsResult(seq, runSeq.current, next.status)) return;
        setResult(next);
        setTestedAt(new Date());
      } catch {
        if (seq !== runSeq.current) return;
        setResult(emptyDnsTestResult("failed"));
        setTestedAt(new Date());
      } finally {
        if (seq === runSeq.current) setRunState("idle");
      }
    })();
  };

  const showing = runState === "idle" ? result : null;
  const hero = showing?.status === "measured" ? formatDnsHero(showing.dnsMs) : null;
  const phases = showing?.phases ?? blankTimingPhases();
  const bars = phaseWaterfall(phases);
  const barById = new Map(bars.map((bar) => [bar.id, bar]));
  const status = statusFor(runState, showing);

  return (
    <div className="grid min-w-0 gap-3 lg:grid-cols-2 lg:items-start">
      <section
        aria-labelledby="browser-dns-heading"
        aria-busy={runState === "running"}
        className="min-w-0 rounded-2xl border border-border bg-card p-3 shadow-soft sm:p-4"
      >
        <h2
          id="browser-dns-heading"
          className="font-heading text-base font-semibold text-foreground"
        >
          Browser DNS Timing
        </h2>
        <p
          id="browser-dns-subtitle"
          className="mt-1 text-sm leading-5 text-muted-foreground"
        >
          Measure DNS lookup timing when exposed by your browser.
        </p>
        <Button
          type="button"
          onClick={run}
          disabled={runState === "running"}
          aria-describedby="browser-dns-subtitle"
          className="mt-3 h-11 px-4"
        >
          {runState === "running" ? (
            <>
              <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden />
              Running…
            </>
          ) : result ? (
            <>
              <RotateCcw className="h-4 w-4" aria-hidden />
              Run Again
            </>
          ) : (
            <>
              <Play className="h-4 w-4" aria-hidden />
              Run DNS Test
            </>
          )}
        </Button>

        <div aria-live="polite" className="mt-3">
          <p
            className="flex items-center gap-2 text-xs font-medium text-foreground"
            role="status"
          >
            <span
              className={cn("h-1.5 w-1.5 shrink-0 rounded-full", status.dot)}
              aria-hidden
            />
            {status.label}
          </p>

          {hero && (
            <>
              <p className="speed-value mt-2 text-4xl font-medium text-foreground sm:text-5xl">
                <span className="sr-only">DNS lookup </span>
                {hero}
              </p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {DNS_MEASURED_NOTE}
              </p>
            </>
          )}

          {showing?.status === "unexposed" && (
            <div className="mt-2">
              <h3 className="text-sm font-semibold text-foreground">
                {DNS_NOT_EXPOSED_HEADING}
              </h3>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                {DNS_NOT_EXPOSED_EXPLANATION}
              </p>
              <dl className="mt-2 space-y-0.5 text-xs leading-5">
                <div className="flex flex-wrap gap-x-1.5">
                  <dt className="text-muted-foreground">DNS lookup:</dt>
                  <dd className="font-medium text-foreground">Not measured</dd>
                </div>
                <div className="flex flex-wrap gap-x-1.5">
                  <dt className="text-muted-foreground">Connection reuse:</dt>
                  <dd className="font-medium text-foreground">
                    {connectionReuseLabel(showing.connectionReuse)}
                  </dd>
                </div>
                <div className="flex flex-wrap gap-x-1.5">
                  <dt className="text-muted-foreground">Request timing:</dt>
                  <dd className="font-medium text-foreground">
                    {requestTimingDetail(showing.phases)}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {showing?.status === "missing-entry" && (
            <p className="mt-2 text-sm leading-5 text-muted-foreground">
              {DNS_MISSING_ENTRY_MESSAGE}
            </p>
          )}
          {showing?.status === "failed" && (
            <p className="mt-2 text-sm leading-5 text-muted-foreground">
              {DNS_FAILURE_MESSAGE}
            </p>
          )}
          {showing?.status === "timeout" && (
            <p className="mt-2 text-sm leading-5 text-muted-foreground">
              {DNS_TIMEOUT_MESSAGE}
            </p>
          )}
          {runState === "running" && (
            <p className="mt-2 text-sm leading-5 text-muted-foreground">
              Reading the Resource Timing entry for this request.
            </p>
          )}

          {testedAt && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>Last test {formatTestedAt(testedAt)}</span>
            </p>
          )}
        </div>
      </section>

      <section
        aria-labelledby="timing-breakdown-heading"
        className="min-w-0 rounded-2xl border border-border bg-card p-3 shadow-soft sm:p-4"
      >
        <h2
          id="timing-breakdown-heading"
          className="font-heading text-base font-semibold text-foreground"
        >
          Request Timing Breakdown
        </h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {runState === "running"
            ? "Waiting for this attempt."
            : "Only phases with a positive browser interval are marked measured."}
        </p>
        <ul className="mt-3 space-y-2.5">
          {phases.map((phase) => (
            <PhaseRow key={phase.id} phase={phase} bar={barById.get(phase.id)} />
          ))}
        </ul>
        {showing && bars.length > 0 && (
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            {showing.phasesOverlap
              ? "Bars sit on one timeline. Overlapping intervals are not added together."
              : "Bars are separate phases on one timeline. They are not added together."}
          </p>
        )}

        <details className="group mt-3 border-t border-border pt-1">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
            Advanced diagnostics
            <ChevronDown
              className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"
              aria-hidden
            />
          </summary>
          {showing?.diagnostics ? (
            <DiagnosticsList diagnostics={showing.diagnostics} />
          ) : (
            <p className="pb-2 text-xs leading-5 text-muted-foreground">
              {runState === "running"
                ? "Diagnostics appear when this attempt finishes."
                : "Run a test to see request metadata. URLs, query strings, and tokens are not shown."}
            </p>
          )}
        </details>
      </section>
    </div>
  );
}

function PhaseRow({
  phase,
  bar,
}: {
  phase: TimingPhase;
  bar?: { leftPct: number; widthPct: number };
}) {
  const Icon = PHASE_ICONS[phase.id];
  const value = formatMeasuredDuration(phase.durationMs);
  const measured = phase.durationMs != null && phase.durationMs > 0;
  return (
    <li className="min-w-0" aria-label={`${phase.label}: ${value}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-foreground">
          <Icon className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          <span className="truncate">{phase.label}</span>
        </span>
        <span
          className={cn(
            "shrink-0 text-xs tabular-nums",
            measured ? "font-medium text-foreground" : "text-muted-foreground",
          )}
        >
          {value}
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
        {measured && bar && (
          <div
            className={cn(
              "h-full rounded-full bg-primary",
              phase.id === "dns" ? "opacity-100" : "opacity-70",
            )}
            style={{
              marginLeft: `${bar.leftPct}%`,
              width: `${bar.widthPct}%`,
              minWidth: "2px",
            }}
          />
        )}
      </div>
    </li>
  );
}

function DiagnosticsList({ diagnostics }: { diagnostics: DnsDiagnostics }) {
  const rows = [
    ["Request origin", diagnostics.origin ?? "Not exposed"],
    ["Initiator type", diagnostics.initiatorType ?? "Not exposed"],
    ["Protocol", diagnostics.protocol ?? "Not exposed"],
    ["DNS start", formatNavigationTimestamp(diagnostics.domainLookupStart)],
    ["DNS end", formatNavigationTimestamp(diagnostics.domainLookupEnd)],
    ["Connect start", formatNavigationTimestamp(diagnostics.connectStart)],
    ["Connect end", formatNavigationTimestamp(diagnostics.connectEnd)],
    ["TLS start", formatNavigationTimestamp(diagnostics.tlsStart)],
    ["Response start", formatNavigationTimestamp(diagnostics.responseStart)],
    ["Response end", formatNavigationTimestamp(diagnostics.responseEnd)],
    ["Valid DNS interval", diagnostics.validDnsInterval ? "Yes" : "No"],
  ] as const;

  return (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-2 pb-2 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="break-words text-xs font-medium text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
