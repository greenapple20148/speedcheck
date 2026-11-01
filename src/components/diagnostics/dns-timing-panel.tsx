"use client";

import { useState } from "react";
import { domainLookupMs } from "@/lib/network/dns-timing";

export function DnsTimingPanel() {
  const [status, setStatus] = useState<"idle" | "running" | "done">("idle");
  const [lookupMs, setLookupMs] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const run = async () => {
    setStatus("running");
    setLookupMs(null);
    const url = `/api/speedtest/config?dnsProbe=${Date.now()}`;
    try {
      await fetch(url, { cache: "no-store" });
      const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      const match = [...entries].reverse().find((entry) => entry.name.includes("dnsProbe"));
      const ms = match ? domainLookupMs(match) : null;
      setLookupMs(ms);
      setNote(
        ms == null
          ? "The browser did not expose a DNS lookup for this request. Caching, connection reuse, or the timing policy can hide it. The HTTP response time is not shown as DNS time."
          : "This is the Resource Timing domainLookup interval for one same-origin request. It is not a test of an arbitrary resolver.",
      );
    } catch {
      setNote("The timing request failed. No DNS figure is available.");
    } finally {
      setStatus("done");
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-6">
      <button
        type="button"
        onClick={() => void run()}
        disabled={status === "running"}
        className="min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {status === "running" ? "Checking…" : "Check browser DNS timing"}
      </button>
      <p className="mt-4 text-3xl font-semibold tabular-nums text-foreground" aria-live="polite">
        {status !== "done" ? "—" : lookupMs == null ? "Unavailable" : `${lookupMs.toFixed(1)} ms`}
      </p>
      {note && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{note}</p>}
    </section>
  );
}
