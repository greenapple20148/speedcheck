"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Activity, Download, Timer, Upload } from "lucide-react";
import {
  INSIGHT_DISPLAY_LABEL,
  buildConnectionInsights,
  qualityOutcome,
} from "@/lib/speedtest/connection-insights";
import {
  jitterDescriptor,
  pingDescriptor,
} from "@/lib/speedtest/ui-config";
import {
  lockGaugeScale,
  logGaugeProgress,
  type RunView,
  type StageId,
  type StageStatus,
} from "@/lib/speedtest/run-state";
import type {
  ClientNetworkInfo,
  ServerInfo,
  SpeedSample,
  TestPhase,
} from "@/types/speedtest";
import { cn, formatMs, formatSpeedParts } from "@/lib/utils";
import { ModeToggle } from "./mode-toggle";
import { StartTestButton } from "./start-test-button";
import type { TestMode } from "@/types/speedtest";

const STAGES: { id: StageId; label: string }[] = [
  { id: "latency", label: "Latency" },
  { id: "download", label: "Download" },
  { id: "upload", label: "Upload" },
  { id: "complete", label: "Complete" },
];

function stageLabel(phase: TestPhase): string {
  switch (phase) {
    case "preparing":
      return "Preparing session";
    case "ping":
      return "Measuring latency";
    case "download":
      return "Testing download";
    case "upload":
      return "Testing upload";
    case "saving":
      return "Saving results";
    case "complete":
      return "Complete";
    case "error":
      return "Error";
    case "cancelled":
      return "Test cancelled";
    default:
      return "Ready";
  }
}

function formatTransferred(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${Math.round(bytes / 1_000)} kB`;
  return `${bytes} B`;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);
  return reduced;
}

function useAnimatedMbps(target: number | null, reduced: boolean): number | null {
  const [shown, setShown] = useState<number | null>(target);
  const shownRef = useRef<number | null>(target);

  useEffect(() => {
    if (target == null) {
      shownRef.current = null;
      setShown(null);
      return;
    }
    if (reduced || shownRef.current == null) {
      shownRef.current = target;
      setShown(target);
      return;
    }
    const from = shownRef.current;
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / 320);
      const eased = 1 - (1 - t) ** 3;
      const next = from + (target - from) * eased;
      shownRef.current = next;
      setShown(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, reduced]);

  return shown;
}

function SemiGauge({
  runId,
  mbps,
  phase,
}: {
  runId: string;
  mbps: number | null;
  phase: TestPhase;
}) {
  const reduced = usePrefersReducedMotion();
  const animated = useAnimatedMbps(phase === "idle" ? null : mbps, reduced);
  const gradId = useId().replace(/:/g, "");
  const scaleRef = useRef<{ runId: string; max: number }>({ runId, max: 1000 });
  if (scaleRef.current.runId !== runId) {
    scaleRef.current = { runId, max: lockGaugeScale(null, mbps) };
  } else {
    scaleRef.current.max = lockGaugeScale(scaleRef.current.max, mbps);
  }
  const progress =
    phase === "idle" || phase === "preparing" || phase === "ping" || phase === "cancelled"
      ? 0
      : logGaugeProgress(reduced ? mbps : animated, scaleRef.current.max);
  const cx = 160;
  const cy = 148;
  const r = 112;
  const length = Math.PI * r;
  const d = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const displayMbps = phase === "idle" ? null : reduced ? mbps : animated;
  const parts = formatSpeedParts(displayMbps);
  const label = stageLabel(phase);
  const ready = phase === "idle";
  const aria = parts
    ? `${label}, ${parts.amount} ${parts.unit}`
    : ready
      ? "Ready to test"
      : label;

  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      <svg
        viewBox="0 0 320 168"
        className="mx-auto block h-[132px] w-full sm:h-[148px]"
        role="img"
        aria-label={aria}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#14B8A6" />
            <stop offset="100%" stopColor="#4F7CF3" />
          </linearGradient>
        </defs>
        <path
          d={d}
          fill="none"
          stroke="var(--sd-border)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {progress > 0 && (
          <path
            d={d}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={length}
            strokeDashoffset={length * (1 - progress)}
            className={cn("gauge-arc", phase === "complete" && "is-settled")}
          />
        )}
        {progress > 0 && (
          <g transform={`translate(${cx} ${cy}) rotate(${progress * 180})`}>
            <line
              x1="-28"
              y1="0"
              x2="-10"
              y2="0"
              stroke="var(--sd-text)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle r="4.5" fill="var(--sd-card)" stroke="var(--sd-text)" strokeWidth="2" />
          </g>
        )}
      </svg>
      <div className="pointer-events-none absolute inset-x-0 top-[46%] text-center">
        {ready ? (
          <p className="font-heading text-lg font-medium text-[var(--sd-text)]">Ready to test</p>
        ) : (
          <p className="font-heading text-4xl font-medium leading-none tracking-tight text-[var(--sd-text)] tabular-nums sm:text-5xl">
            {parts?.amount ?? "—"}
          </p>
        )}
      </div>
      <p className="mt-0.5 text-center text-[13px] font-medium text-[var(--sd-muted)]">
        {parts ? (
          <>
            <span className="text-[var(--sd-text)]">{parts.unit}</span>
            <span className="mx-1.5">·</span>
          </>
        ) : null}
        <span className="text-[var(--sd-text)]">{label}</span>
      </p>
    </div>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) {
    return <div className="mt-2 h-6" aria-hidden />;
  }
  const width = 120;
  const height = 24;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 0.001);
  const d = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / span) * (height - 2) - 1;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 h-6 w-full" aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function MetricCard({
  label,
  value,
  unit,
  caption,
  active,
  icon,
  spark,
  sparkColor,
}: {
  label: string;
  value: string;
  unit?: string;
  caption: string;
  active: boolean;
  icon: ReactNode;
  spark?: number[];
  sparkColor?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-2xl border bg-[var(--sd-card)] px-3 py-2.5 shadow-sm",
        active ? "border-[#14B8A6]" : "border-[var(--sd-border)]",
      )}
    >
      <div className="flex items-center gap-1.5 text-[var(--sd-muted)]">
        {icon}
        <h3 className="font-sans text-[13px] font-medium tracking-normal text-[var(--sd-muted)]">
          {label}
        </h3>
      </div>
      <p className="mt-1 font-heading text-[1.45rem] font-medium leading-none tabular-nums text-[var(--sd-text)] sm:text-[1.65rem]">
        {value}
        {unit && value !== "—" ? (
          <span className="ml-1 font-sans text-xs font-medium text-[var(--sd-muted)]">{unit}</span>
        ) : null}
      </p>
      <p className="mt-1 truncate text-[11px] text-[var(--sd-muted)]">{caption}</p>
      {spark && sparkColor ? <Sparkline values={spark} color={sparkColor} /> : <div className="mt-2 h-6" aria-hidden />}
    </div>
  );
}

function statusClass(status: StageStatus, active: boolean): string {
  if (active || status === "active") return "border-transparent bg-[#14B8A6] text-white";
  if (status === "completed") return "border-[#14B8A6]/40 text-[#00866A]";
  if (status === "failed") return "border-red-300 text-red-700";
  return "border-[var(--sd-border)] text-[var(--sd-muted)]";
}

interface SpeedDashboardLayoutProps {
  view: RunView;
  samples: SpeedSample[];
  server: ServerInfo | null;
  network: ClientNetworkInfo | null;
  mode: TestMode;
  showModeToggle: boolean;
  modeDisabled: boolean;
  running: boolean;
  canStart: boolean;
  testedAt: Date | null;
  onModeChange: (mode: TestMode) => void;
  onStart: () => void;
  onCancel: () => void;
}

export function SpeedDashboardLayout({
  view,
  samples,
  server,
  network,
  mode,
  showModeToggle,
  modeDisabled,
  running,
  canStart,
  testedAt,
  onModeChange,
  onStart,
  onCancel,
}: SpeedDashboardLayoutProps) {
  const phase = view.phase;
  const metrics = view.metrics;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running || view.startedAtMs == null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [running, view.startedAtMs]);

  const downloadSamples = samples.filter((sample) => sample.kind === "download").map((sample) => sample.mbps);
  const uploadSamples = samples.filter((sample) => sample.kind === "upload").map((sample) => sample.mbps);
  const downloadParts = formatSpeedParts(metrics.downloadMbps);
  const uploadParts = formatSpeedParts(metrics.uploadMbps);
  const transferred =
    phase === "upload" ? metrics.uploadedBytes : phase === "download" ? metrics.downloadedBytes : 0;
  const elapsedSec =
    view.startedAtMs != null && (running || phase === "complete" || phase === "saving")
      ? Math.max(0, Math.round(((phase === "complete" ? testedAt?.getTime() ?? now : now) - view.startedAtMs) / 1000))
      : null;
  const insights = phase === "complete" ? buildConnectionInsights(metrics) : [];
  const serverName = server?.name ?? null;
  const serverRegion = server?.region && server.region !== "cloudflare-edge" ? server.region : server?.location;
  const isp = network?.isp ?? network?.org ?? null;

  return (
    <div className="speed-dashboard rounded-2xl border border-[var(--sd-border)] bg-[var(--sd-bg)] p-3 shadow-sm sm:p-4">
      <div className="grid items-start gap-3 min-[1100px]:grid-cols-[minmax(0,42%)_minmax(0,58%)] min-[1100px]:gap-5">
        <div className="min-w-0 min-[1100px]:col-start-1 min-[1100px]:row-start-1">
          <SemiGauge runId={view.runId} mbps={view.currentMbps} phase={phase} />
          <ol className="mt-2 flex flex-wrap items-center justify-center gap-1" aria-label="Test phases">
            {STAGES.map((stage) => {
              const status = view.stages[stage.id];
              const active = status === "active";
              return (
                <li key={stage.id}>
                  <span
                    className={cn(
                      "inline-flex min-h-7 items-center rounded-full border px-2 text-[11px] font-medium",
                      statusClass(status, active),
                    )}
                    aria-current={active ? "step" : undefined}
                  >
                    {stage.label}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="mt-1.5 text-center text-[12px] text-[var(--sd-muted)]">
            {elapsedSec != null && elapsedSec > 0 ? <span>{elapsedSec}s elapsed</span> : null}
            {elapsedSec != null && elapsedSec > 0 && transferred > 0 ? <span> · </span> : null}
            {transferred > 0 ? <span>{formatTransferred(transferred)} transferred</span> : null}
            {phase === "complete" && testedAt ? (
              <span>
                {elapsedSec != null && elapsedSec > 0 ? " · " : null}
                {testedAt.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </span>
            ) : null}
          </p>
          {view.phaseProgress != null && (phase === "download" || phase === "upload") && (
            <div className="mx-auto mt-2 max-w-xs">
              <div
                className="h-1.5 overflow-hidden rounded-full bg-[var(--sd-border)]"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(view.phaseProgress * 100)}
                aria-label={phase === "upload" ? "Upload progress" : "Download progress"}
              >
                <div
                  className="h-full rounded-full bg-[#14B8A6] motion-safe:transition-[width] motion-safe:duration-300"
                  style={{ width: `${Math.round(view.phaseProgress * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid min-w-0 grid-cols-2 content-start gap-2 min-[1100px]:col-start-2 min-[1100px]:row-span-2 min-[1100px]:row-start-1">
          <MetricCard
            label="Download"
            value={downloadParts?.amount ?? "—"}
            unit={downloadParts?.unit}
            caption={
              phase === "download"
                ? "Measuring"
                : metrics.downloadMbps != null
                  ? "Measured"
                  : "Waiting"
            }
            active={phase === "download"}
            icon={<Download className="h-3.5 w-3.5" aria-hidden />}
            spark={downloadSamples}
            sparkColor="#14B8A6"
          />
          <MetricCard
            label="Upload"
            value={uploadParts?.amount ?? "—"}
            unit={uploadParts?.unit}
            caption={
              phase === "upload"
                ? "Measuring"
                : metrics.uploadMbps != null
                  ? "Measured"
                  : "Waiting"
            }
            active={phase === "upload"}
            icon={<Upload className="h-3.5 w-3.5" aria-hidden />}
            spark={uploadSamples}
            sparkColor="#4F7CF3"
          />
          <MetricCard
            label="Latency"
            value={formatMs(metrics.pingMs, metrics.pingMs != null && metrics.pingMs < 10 ? 1 : 0)}
            unit={metrics.pingMs != null ? "ms" : undefined}
            caption={metrics.pingMs != null ? (pingDescriptor(metrics.pingMs) ?? "Measured") : "Waiting"}
            active={phase === "ping"}
            icon={<Timer className="h-3.5 w-3.5" aria-hidden />}
          />
          <MetricCard
            label="Jitter"
            value={formatMs(metrics.jitterMs, metrics.jitterMs != null && metrics.jitterMs < 10 ? 1 : 0)}
            unit={metrics.jitterMs != null ? "ms" : undefined}
            caption={
              metrics.jitterMs != null ? (jitterDescriptor(metrics.jitterMs) ?? "Measured") : "Waiting"
            }
            active={false}
            icon={<Activity className="h-3.5 w-3.5" aria-hidden />}
          />
        </div>

        <div className="min-w-0 min-[1100px]:col-start-1 min-[1100px]:row-start-2">
          {showModeToggle && (
            <ModeToggle
              mode={mode}
              disabled={modeDisabled}
              onChange={onModeChange}
              compact
              hint="Lightweight does not measure loaded latency. Standard does. Neither guarantees accuracy."
            />
          )}
          <div className={cn("w-full", showModeToggle && "mt-2")}>
            <StartTestButton
              phase={phase}
              running={running}
              statusLine={stageLabel(phase)}
              disabled={!canStart}
              onStart={onStart}
              onCancel={onCancel}
            />
          </div>
        </div>
      </div>

      <dl className="mt-3 grid gap-2 text-[12px] text-[var(--sd-muted)] sm:grid-cols-2">
        <div className="min-w-0 rounded-xl border border-[var(--sd-border)] bg-[var(--sd-card)] px-3 py-2">
          <dt className="text-[10px] font-medium uppercase tracking-wide">Server</dt>
          <dd className="truncate text-[13px] font-medium text-[var(--sd-text)]">
            {serverName ? `${serverName}${serverRegion ? ` · ${serverRegion}` : ""}` : "Waiting for endpoint"}
          </dd>
        </div>
        <div className="min-w-0 rounded-xl border border-[var(--sd-border)] bg-[var(--sd-card)] px-3 py-2">
          <dt className="text-[10px] font-medium uppercase tracking-wide">Network</dt>
          <dd className="truncate text-[13px] font-medium text-[var(--sd-text)]">
            {isp ?? "Unavailable"}
          </dd>
        </div>
      </dl>

      {phase === "complete" && insights.length > 0 && (
        <section className="mt-3 rounded-2xl border border-[var(--sd-border)] bg-[var(--sd-card)] px-3 py-3" aria-labelledby="connection-quality">
          <h3 id="connection-quality" className="text-sm font-semibold text-[var(--sd-text)]">
            Your Connection Quality
          </h3>
          <p className="mt-1 text-[12px] leading-snug text-[var(--sd-muted)]">
            Compared with this site’s thresholds for download, upload, latency, and jitter. A heuristic, not a guarantee.
          </p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {insights.map((item) => {
              const outcome = qualityOutcome(item.suitability);
              return (
                <li key={item.id} className="min-w-0 text-[13px]">
                  <p className="font-medium text-[var(--sd-text)]">
                    {INSIGHT_DISPLAY_LABEL[item.id] ?? item.label}
                    {outcome ? (
                      <span
                        className={cn(
                          "ml-1.5 font-semibold",
                          outcome === "Needs attention" && "text-red-700",
                          outcome === "May be limited" && "text-amber-700",
                          outcome === "Looks good" && "text-[#00866A]",
                        )}
                      >
                        {outcome}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-[12px] text-[var(--sd-muted)]">{item.explanation}</p>
                </li>
              );
            })}
          </ul>
          <details className="mt-2 text-[12px] text-[var(--sd-muted)]">
            <summary className="cursor-pointer font-medium text-[var(--sd-text)]">How these labels are chosen</summary>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              <li>Web browsing looks good from 10 Mbps download. Below 3 Mbps needs attention.</li>
              <li>HD/4K streaming looks good from 50 Mbps download. Below 25 Mbps needs attention.</li>
              <li>Video calls look good from 5 Mbps upload and 120 ms latency. Below 3 Mbps or above 180 ms needs attention.</li>
              <li>Online gaming looks good at 50 ms latency and 20 ms jitter with 15 Mbps download. Above 90 ms latency or 35 ms jitter needs attention.</li>
            </ul>
          </details>
        </section>
      )}
    </div>
  );
}
