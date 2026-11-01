"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { buildConnectionInsights } from "@/lib/speedtest/connection-insights";
import { readHistory, readPlan, type PlanSettings, type StoredHistoryEntry } from "@/lib/speedtest/history-store";
import { BUFFERBLOAT_GRADE_LABEL } from "@/lib/speedtest/bufferbloat-config";
import { loadPlan } from "@/lib/mesh/store";
import type { MeshPlan } from "@/lib/mesh/types";
import { buildHealthRecommendations } from "@/lib/network-health/recommendations";
import { latestSnapshot, providerLabel, snapshotFromHistory, type HealthSnapshot } from "@/lib/network-health/snapshot";
import type { SpeedMetrics } from "@/types/speedtest";

const SpeedTestDashboard = dynamic(
  () => import("@/components/speedtest/dashboard/speed-test-dashboard").then((mod) => mod.SpeedTestDashboard),
  { ssr: false, loading: () => <p className="text-sm text-muted-foreground">Loading the speed test…</p> },
);

export function NetworkHealthDashboard() {
  const params = useSearchParams();
  const focusRoom = params.get("room");
  const [session, setSession] = useState<HealthSnapshot | null>(null);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [history, setHistory] = useState<StoredHistoryEntry[]>([]);
  const [plan, setPlan] = useState<MeshPlan | null>(null);
  const [ispPlan, setIspPlan] = useState<PlanSettings | null>(null);
  useEffect(() => {
    try {
      setHistory(readHistory());
      setPlan(loadPlan());
      setIspPlan(readPlan());
      setError(null);
    } catch {
      setError("Saved results could not be read on this device.");
    } finally {
      setReady(true);
    }
  }, [session]);
  const saved = latestSnapshot(history);
  const current = session ?? saved;
  const rooms = (plan?.floors ?? []).flatMap((floor) => floor.rooms.map((room) => {
    const measurement = plan?.measurements.find((row) => row.roomId === room.id) ?? null;
    return { room, floorName: floor.name, measurement };
  }));
  const recommendations = buildHealthRecommendations({
    snapshot: current,
    rooms: rooms.flatMap((row) => row.measurement ? [{ name: row.room.name, downloadMbps: row.measurement.downloadMbps }] : []),
    plan: ispPlan,
  });
  const insights = current ? buildConnectionInsights({
    downloadMbps: current.downloadMbps,
    uploadMbps: current.uploadMbps,
    pingMs: current.pingMs,
    jitterMs: current.jitterMs,
  }) : [];
  const chartPoints = history
    .filter((entry) => entry.downloadMbps != null)
    .slice(0, 6);

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Numbers appear only after a completed test. Missing fields stay blank.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground" onClick={() => { setError(null); setTesting(true); }}>
            Run speed test
          </button>
          <Link href="/network-health/compare" className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-medium">
            Compare before and after
          </Link>
        </div>
      </div>
      {!ready && <p className="text-sm text-muted-foreground">Loading saved results…</p>}
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      {testing && (
        <div className="rounded-2xl border border-border p-3">
          <p className="mb-2 text-sm text-muted-foreground">Nothing runs until you press Start. This uses the standard test so loaded latency can be measured.</p>
          <SpeedTestDashboard
            defaultMode="standard"
            onComplete={(result) => {
              try {
                setSession(snapshotFromLive(result));
                setTesting(false);
              } catch {
                setError("The test finished, and this page could not read the result.");
              }
            }}
          />
        </div>
      )}
      {ready && !current ? (
        <section aria-label="Latest measurements" className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">No saved test</h2>
          <p className="mt-1 text-sm text-muted-foreground">Download, upload, latency, jitter, and bufferbloat appear here after a completed test. A missing field stays blank.</p>
          <Link href="/connection-stability-test" className="mt-3 inline-flex text-sm font-medium text-primary">Open the stability test</Link>
        </section>
      ) : current ? (
      <section aria-label="Latest measurements" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Download" value={current.downloadMbps} unit="Mbps" />
        <MetricCard label="Upload" value={current.uploadMbps} unit="Mbps" />
        <MetricCard label="Idle latency" value={current.idleLatencyMs} unit="ms" />
        <MetricCard label="Jitter" value={current.jitterMs} unit="ms" />
        <MetricCard label="Loaded latency" value={current.loadedLatencyMs} unit="ms" />
        <article className="rounded-2xl border border-border bg-card p-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bufferbloat</h2>
          <p className="mt-2 text-2xl font-semibold text-foreground">{current.bufferbloatGrade ?? "Not measured"}</p>
          <p className="mt-1 text-xs text-muted-foreground">{current.bufferbloatGrade ? BUFFERBLOAT_GRADE_LABEL[current.bufferbloatGrade] : "The standard test records this grade."}</p>
        </article>
        <article className="rounded-2xl border border-border bg-card p-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Connection stability</h2>
          <p className="mt-2 text-lg font-semibold text-foreground">Not measured</p>
          <p className="mt-1 text-xs text-muted-foreground">The speed test does not save a stability score.</p>
          <Link href="/connection-stability-test" className="mt-2 inline-flex text-sm font-medium text-primary">Open the stability test</Link>
        </article>
        <article className="rounded-2xl border border-border bg-card p-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">When and where</h2>
          <p className="mt-2 text-sm text-foreground">{formatWhen(current.testedAt)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Provider: {providerLabel(current.provider)}</p>
          <p className="text-xs text-muted-foreground">Server: {current.endpointName ?? "Not recorded"}</p>
        </article>
      </section>
      ) : null}
      <section aria-label="Readiness assessments">
        <h2 className="text-sm font-semibold text-foreground">Readiness from this speed test</h2>
        <p className="mt-1 text-xs text-muted-foreground">These labels are assessments of the measured speed, latency, and jitter. They are not separate test results.</p>
        {insights.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">A complete download, upload, latency, and jitter result is required before readiness can be assessed.</p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-3">
            {insights.filter((item) => item.id === "gaming" || item.id === "video-calls" || item.id === "streaming").map((item) => (
              <li key={item.id} className="rounded-2xl border border-border p-3">
                <p className="text-sm font-semibold">{item.id === "video-calls" ? "Video call readiness" : item.id === "gaming" ? "Gaming readiness" : "Streaming readiness"}</p>
                <p className="mt-1 text-lg capitalize text-foreground">{item.suitability}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.explanation}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
      {chartPoints.length >= 2 && <RecentChart points={chartPoints.map((entry) => ({ id: entry.id, testedAt: entry.createdAt, downloadMbps: entry.downloadMbps }))} />}
      <section aria-label="Recommendations">
        <h2 className="text-sm font-semibold text-foreground">Recommendations</h2>
        {recommendations.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No recommendation yet. The rules wait for a measured problem.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {recommendations.map((item) => (
              <li key={item.id} className="rounded-2xl border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.confidence} confidence</p>
                </div>
                <p className="mt-2 text-sm text-foreground">{item.evidence}</p>
                <p className="mt-2 text-sm text-muted-foreground">Action: {item.action}</p>
                <p className="mt-1 text-sm text-muted-foreground">Check again: {item.verification}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-label="Measured rooms">
        <h2 className="text-sm font-semibold text-foreground">Measured rooms</h2>
        <p className="mt-1 text-xs text-muted-foreground">These are saved speed tests for a room. The planner’s colors remain an estimate.</p>
        {rooms.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No rooms are saved in the mesh planner.</p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {rooms.map(({ room, floorName, measurement }) => (
              <li key={room.id} id={`room-${room.id}`} className={`rounded-2xl border p-3 ${focusRoom === room.id ? "border-primary" : "border-border"}`}>
                <h3 className="text-sm font-semibold">{room.name}</h3>
                <p className="text-xs text-muted-foreground">{floorName}</p>
                {measurement ? (
                  <>
                    <p className="mt-2 text-sm">Download {formatOptional(measurement.downloadMbps, "Mbps")}</p>
                    <p className="text-sm">Upload {formatOptional(measurement.uploadMbps, "Mbps")}</p>
                    <p className="text-sm">Latency {formatOptional(measurement.pingMs, "ms")} · Jitter {formatOptional(measurement.jitterMs, "ms")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatWhen(measurement.testedAt)} · Server {measurement.endpointName ?? "Not recorded"}</p>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">Not measured</p>
                )}
                <Link href="/mesh-wifi/planner" className="mt-2 inline-flex text-sm font-medium text-primary">Open the floor planner</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function snapshotFromLive(result: { metrics: SpeedMetrics; serverName: string | null; testedAt: string; provider: "cloudflare" | "dedicated" }): HealthSnapshot {
  return snapshotFromHistory({
    id: `session-${result.testedAt}`,
    downloadMbps: result.metrics.downloadMbps,
    uploadMbps: result.metrics.uploadMbps,
    pingMs: result.metrics.pingMs,
    jitterMs: result.metrics.jitterMs,
    mode: "standard",
    serverName: result.serverName ?? undefined,
    createdAt: result.testedAt,
    bufferbloatIdleMs: result.metrics.bufferbloatIdleMs,
    bufferbloatLoadedDownMs: result.metrics.bufferbloatLoadedDownMs,
    bufferbloatLoadedUpMs: result.metrics.bufferbloatLoadedUpMs,
    bufferbloatGrade: result.metrics.bufferbloatGrade,
    provider: result.provider,
    packetLossPercent: result.metrics.packetLossPercent ?? null,
  });
}

function MetricCard({ label, value, unit }: { label: string; value: number | null | undefined; unit: string }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</h2>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value == null ? "Not measured" : `${Math.round(value * 10) / 10}`}</p>
      {value != null && <p className="text-xs text-muted-foreground">{unit}</p>}
    </article>
  );
}

function RecentChart({ points }: { points: Array<{ id: string; testedAt: string; downloadMbps: number | null }> }) {
  const max = Math.max(...points.map((point) => point.downloadMbps ?? 0), 1);
  return (
    <section aria-label="Recent saved download speeds">
      <h2 className="text-sm font-semibold">Recent saved download speeds</h2>
      <ul className="mt-3 space-y-2">
        {points.map((point) => (
          <li key={point.id} className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)_4.5rem] items-center gap-2 text-xs">
            <span>{formatWhen(point.testedAt)}</span>
            <span className="h-2 rounded-full bg-[var(--surface-subtle)]" aria-hidden>
              <span className="block h-2 rounded-full bg-primary" style={{ width: `${Math.max(4, ((point.downloadMbps ?? 0) / max) * 100)}%` }} />
            </span>
            <span className="text-right">{point.downloadMbps == null ? "—" : `${Math.round(point.downloadMbps)} Mbps`}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function formatOptional(value: number | null, unit: string): string {
  return value == null ? "Not measured" : `${Math.round(value * 10) / 10} ${unit}`;
}

function formatWhen(value: string): string {
  const time = Date.parse(value);
  if (Number.isNaN(time)) return "Time not recorded";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(time);
}
