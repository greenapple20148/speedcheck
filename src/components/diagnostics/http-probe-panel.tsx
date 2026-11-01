"use client";

import { useEffect, useRef, useState } from "react";
import { describeEndpoint } from "@/lib/network/endpoint-registry";
import { summarizeRtt } from "@/lib/network/latency";
import { REQUEST_LOSS_LABEL } from "@/lib/network/packet-loss";
import { summarizeStability } from "@/lib/network/stability";
import { readPrefs, writePrefs } from "@/lib/speedtest/history-store";
import { trackEvent } from "@/lib/analytics/events";

type ProbeMode = "ping" | "jitter" | "loss" | "stability";

const DURATIONS = [
  { sec: 30 as const, label: "30 seconds" },
  { sec: 60 as const, label: "60 seconds" },
  { sec: 300 as const, label: "5 minutes" },
];

async function pingOnce(baseUrl: string, signal: AbortSignal): Promise<number | null> {
  const started = performance.now();
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/ping?_=${Date.now()}`, {
      method: "GET",
      cache: "no-store",
      signal,
      headers: { "Cache-Control": "no-cache" },
    });
    if (!res.ok && res.status !== 204) return null;
    return performance.now() - started;
  } catch {
    return null;
  }
}

function formatMs(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(1)} ms`;
}

export function HttpProbePanel({ mode }: { mode: ProbeMode }) {
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [samples, setSamples] = useState<Array<number | null>>([]);
  const [duration, setDuration] = useState<30 | 60 | 300>(30);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setDuration(readPrefs().stabilityDurationSec);
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/speedtest/config", { cache: "no-store" });
        const data = (await res.json()) as { baseUrl?: string | null; ready?: boolean; message?: string };
        if (cancelled) return;
        if (data.ready && data.baseUrl) setBaseUrl(data.baseUrl);
        else setNotice(data.message ?? "This measurement is unavailable until an endpoint is configured.");
      } catch {
        if (!cancelled) setNotice("Could not load measurement configuration.");
      }
    })();
    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, []);

  const endpoint = describeEndpoint(baseUrl);

  const start = async () => {
    if (!baseUrl || running) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setSamples([]);
    setRunning(true);
    const event =
      mode === "loss"
        ? "packet_loss_test_completed"
        : mode === "stability"
          ? "stability_test_completed"
          : "ping_test_completed";
    const targetSamples = mode === "loss" ? 30 : mode === "stability" ? 0 : 21;
    const gapMs = mode === "stability" ? 1000 : 80;
    const collected: Array<number | null> = [];
    const deadline = mode === "stability" ? performance.now() + duration * 1000 : 0;
    try {
      let i = 0;
      while (!controller.signal.aborted) {
        if (mode === "stability") {
          if (performance.now() >= deadline) break;
        } else if (i >= targetSamples) break;
        const sample = await pingOnce(baseUrl, controller.signal);
        if (controller.signal.aborted) break;
        collected.push(sample);
        setSamples([...collected]);
        i += 1;
        const wait =
          mode === "stability"
            ? Math.min(gapMs, Math.max(0, deadline - performance.now()))
            : gapMs;
        if (mode !== "stability" && i >= targetSamples) break;
        if (mode === "stability" && performance.now() >= deadline) break;
        if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      }
      if (!controller.signal.aborted) trackEvent(event, { endpoint: endpoint.id, samples: collected.length });
    } finally {
      setRunning(false);
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
    setRunning(false);
  };

  const usable =
    mode === "ping" || mode === "jitter" ? samples.slice(1) : samples;
  const summary = mode === "stability" ? summarizeStability(usable) : summarizeRtt(usable);
  const spark = samples.filter((n): n is number => n != null);
  const max = spark.length ? Math.max(...spark) : 1;

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-6" aria-label="HTTP latency probe">
      <p className="text-sm text-muted-foreground">
        Endpoint: {endpoint.label}. These are HTTP round trips, not ICMP ping.
      </p>
      {notice && !baseUrl && (
        <p className="mt-4 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm" role="status">
          {notice} No result is shown in place of a measurement.
        </p>
      )}
      {mode === "stability" && (
        <fieldset className="mt-4">
          <legend className="text-sm font-medium text-foreground">Duration</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {DURATIONS.map((item) => (
              <button
                key={item.sec}
                type="button"
                aria-pressed={duration === item.sec}
                disabled={running}
                onClick={() => {
                  setDuration(item.sec);
                  writePrefs({ ...readPrefs(), stabilityDurationSec: item.sec });
                }}
                className={`min-h-11 rounded-full px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  duration === item.sec
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-background"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void start()}
          disabled={!baseUrl || running}
          className="min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {running ? "Running…" : "Start test"}
        </button>
        {running && (
          <button type="button" onClick={cancel} className="min-h-11 rounded-xl border border-border px-5 text-sm font-semibold">
            Cancel
          </button>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {running ? `Sample ${samples.length}` : samples.length ? "Test finished" : ""}
      </p>
      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={mode === "loss" ? REQUEST_LOSS_LABEL : "Median RTT"} value={mode === "loss" ? (summary.failurePercent == null ? "—" : `${summary.failurePercent.toFixed(1)}%`) : formatMs(summary.medianMs)} />
        <Stat label="p95 RTT" value={formatMs("p95Ms" in summary ? summary.p95Ms : null)} />
        <Stat label="Jitter" value={formatMs(summary.jitterMs)} />
        <Stat label="Failed requests" value={summary.failurePercent == null ? "—" : `${summary.failurePercent.toFixed(1)}%`} />
      </dl>
      {mode === "loss" && samples.length > 0 && (
        <p className="mt-3 text-sm text-muted-foreground">
          {REQUEST_LOSS_LABEL} counts HTTP requests that failed. It is not network packet loss.
        </p>
      )}
      {spark.length > 1 && (
        <svg viewBox="0 0 200 48" className="mt-4 h-12 w-full" role="img" aria-label="Latency samples">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-primary"
            points={spark
              .map((value, index) => {
                const x = (index / (spark.length - 1)) * 200;
                const y = 46 - (value / max) * 40;
                return `${x},${y}`;
              })
              .join(" ")}
          />
        </svg>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted px-3 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-xl font-semibold tabular-nums text-foreground">{value}</dd>
    </div>
  );
}
