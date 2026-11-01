"use client";

import dynamic from "next/dynamic";
import { useId, type ReactNode } from "react";
import { Loader2, Pause, RotateCcw } from "lucide-react";
import type { ConnectionAssessment } from "@/lib/speedtest/connection-assessment";
import { buildNetworkQualityScores } from "@/lib/speedtest/network-quality-score";
import {
  gaugeScaleMaxMbps,
  jitterDescriptor,
  pingDescriptor,
  speedToArcProgress,
} from "@/lib/speedtest/ui-config";
import type {
  ClientNetworkInfo,
  ProgressState,
  ServerInfo,
  SpeedSample,
  TestPhase,
} from "@/types/speedtest";
import { cn, formatMs, formatSpeedParts } from "@/lib/utils";
import { ConnectionQualitySummary } from "./connection-quality-summary";
import { CloudflareServerPanel } from "./cloudflare-server-panel";
import { NetworkQualityStars } from "./network-quality-stars";

const CloudflareSpeedChart = dynamic(
  () =>
    import("./cloudflare-speed-chart").then((m) => m.CloudflareSpeedChart),
  { ssr: false, loading: () => <div className="h-9" /> },
);

const TILES = {
  download: "var(--spark-download)",
  upload: "var(--spark-upload)",
  latency: "var(--spark-latency)",
  jitter: "var(--spark-jitter)",
} as const;

function formatTransferred(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${Math.round(bytes / 1_000)} kB`;
  return `${bytes} B`;
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden fill="none">
      <path d="M12 4v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 11l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 19h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden fill="none">
      <path d="M12 20V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 13l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 5h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function LatencyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden fill="none">
      <circle cx="12" cy="12" r="2.2" fill="currentColor" />
      <path d="M12 5v2.5M12 16.5V19M5 12h2.5M16.5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function JitterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden fill="none">
      <path d="M3 14h3l2-6 3 10 2-6h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SemiGauge({
  mbps,
  phase,
  settled,
}: {
  mbps: number | null;
  phase: TestPhase;
  settled: boolean;
}) {
  const gradId = useId().replace(/:/g, "");
  const scaleMax = gaugeScaleMaxMbps(mbps);
  const progress =
    phase === "idle" || phase === "preparing" || phase === "ping"
      ? 0
      : speedToArcProgress(mbps, scaleMax);
  const cx = 180;
  const cy = 176;
  const r = 148;
  const length = Math.PI * r;
  // Sweep-flag 1 draws clockwise through the top of the circle (SVG y grows downward).
  const d = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const parts = formatSpeedParts(mbps);
  const phaseLabel =
    phase === "upload"
      ? "Upload"
      : phase === "download"
        ? "Download"
        : phase === "ping" || phase === "preparing"
          ? "Latency"
          : phase === "complete"
            ? "Download"
            : "Ready";

  const ariaLabel = parts
    ? `${phaseLabel} ${parts.amount} ${parts.unit}`
    : phase === "idle"
      ? "Ready to test"
      : `${phaseLabel} in progress`;

  return (
    <div className="relative mx-auto w-full min-w-0 max-w-[320px]">
      <svg viewBox="-12 -8 384 216" className="block h-auto w-full" role="img" aria-label={ariaLabel}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#14C8B4" />
            <stop offset="100%" stopColor="#5B6CFF" />
          </linearGradient>
        </defs>
        <path
          d={d}
          fill="none"
          stroke="var(--border)"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d={d}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={length}
          strokeDashoffset={length * (1 - progress)}
          className={cn("gauge-arc", settled && "is-settled")}
        />
        {/* SVG transform stays in user units. CSS rotate() on a scaled SVG
            uses CSS pixels and lifts the needle off the hub. */}
        <g transform={`translate(${cx} ${cy}) rotate(${progress * 180})`}>
          <line
            x1="-38"
            y1="0"
            x2="-12"
            y2="0"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className="text-foreground"
          />
          <circle r="5.5" fill="var(--card)" stroke="currentColor" strokeWidth="2.5" className="text-foreground" />
        </g>
      </svg>
      <div className="pointer-events-none absolute inset-x-0 top-[30%] text-center">
        <p className="font-heading text-[3rem] font-medium leading-none tracking-tight text-foreground tabular-nums">
          {parts?.amount ?? "—"}
        </p>
      </div>
      <p className="mt-1 text-center text-sm font-medium text-muted-foreground">
        {parts ? parts.unit : "Mbps"}
        <span className="mx-2 text-[var(--text-ghost)]">·</span>
        <span className="text-foreground">{phaseLabel}</span>
      </p>
    </div>
  );
}

function stepState(
  phase: TestPhase,
  id: "ping" | "download" | "upload",
): "idle" | "active" | "done" {
  const rank: Record<string, number> = {
    idle: 0,
    error: 0,
    cancelled: 0,
    preparing: 1,
    ping: 1,
    download: 2,
    upload: 3,
    saving: 4,
    complete: 4,
  };
  const need = id === "ping" ? 1 : id === "download" ? 2 : 3;
  const current = rank[phase] ?? 0;
  if (current > need) return "done";
  if (current === need) return "active";
  return "idle";
}

function StepPills({ phase }: { phase: TestPhase }) {
  const steps = [
    { id: "ping" as const, label: "Latency" },
    { id: "download" as const, label: "Download" },
    { id: "upload" as const, label: "Upload" },
  ];
  return (
    <ol className="flex flex-wrap items-center justify-center gap-2" aria-label="Test phases">
      {steps.map((step) => {
        const state = stepState(phase, step.id);
        return (
          <li key={step.id}>
            <span
              className={cn(
                "inline-flex min-h-8 items-center rounded-full border px-3 text-xs font-medium",
                state === "active" &&
                  "border-transparent bg-primary text-primary-foreground",
                state === "done" &&
                  "border-[var(--accent-text)] bg-transparent text-[var(--accent-text)]",
                state === "idle" &&
                  "border-border bg-transparent text-muted-foreground",
              )}
              aria-current={state === "active" ? "step" : undefined}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function LoadedLatencySummary({ metrics }: { metrics: ProgressState["metrics"] }) {
  const idle = metrics.bufferbloatIdleMs ?? metrics.pingMs;
  const down = metrics.bufferbloatLoadedDownMs;
  const up = metrics.bufferbloatLoadedUpMs;
  const measured = down != null || up != null;
  const msLabel = (value: number | null | undefined) => {
    const text = formatMs(value, 1);
    return text === "—" ? "—" : `${text} ms`;
  };
  const increase = (loaded: number | null | undefined) =>
    loaded == null || idle == null ? null : Math.max(0, loaded - idle);

  return (
    <section className="rounded-2xl border border-border bg-[var(--surface-subtle)] px-4 py-3" aria-label="Latency under load">
      <h3 className="text-[13px] font-semibold text-foreground">Latency under load</h3>
      {measured ? (
        <>
          <dl className="mt-2 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Idle</dt>
              <dd className="font-medium tabular-nums">{msLabel(idle)}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Download</dt>
              <dd className="font-medium tabular-nums">{msLabel(down)}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Upload</dt>
              <dd className="font-medium tabular-nums">{msLabel(up)}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Grade</dt>
              <dd className="font-medium">{metrics.bufferbloatGrade ?? "—"}</dd>
            </div>
          </dl>
          <p className="mt-2 text-[13px] leading-snug text-muted-foreground">
            Increase while downloading: {msLabel(increase(down))}. Increase while uploading:{" "}
            {msLabel(increase(up))}. These are HTTP round trips to this endpoint during the transfer.
            The letter compares that increase with this site’s thresholds. It is not a certification.
          </p>
        </>
      ) : (
        <p className="mt-2 text-[13px] leading-snug text-muted-foreground">
          Loaded latency was not measured on this run. Use Standard mode to probe latency while data is moving.
        </p>
      )}
    </section>
  );
}

function MetricBlock({
  label,
  value,
  unit,
  caption,
  active,
  color,
  icon,
  samples,
  kind,
  filled,
}: {
  label: string;
  value: string;
  unit?: string;
  caption?: string | null;
  active: boolean;
  color: string;
  icon: ReactNode;
  samples?: SpeedSample[];
  kind?: "download" | "upload";
  filled: boolean;
}) {
  return (
    <div
      className={cn(
        "panel min-w-0 px-4 py-3",
        active && "ring-1 ring-primary/50",
        filled && "motion-safe:animate-fade-up",
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground" style={{ color }}>
        {icon}
        <h3 className="font-sans text-[13px] font-medium tracking-normal text-muted-foreground">
          {label}
        </h3>
      </div>
      <p className="mt-2 font-heading text-[1.65rem] font-medium tabular-nums leading-none text-foreground">
        {value}
        {unit && value !== "—" && (
          <span className="ml-1 text-sm font-sans font-medium text-muted-foreground">{unit}</span>
        )}
      </p>
      {caption && <p className="mt-1 text-[11px] text-muted-foreground">{caption}</p>}
      {kind && (
        <div className="mt-2">
          <CloudflareSpeedChart samples={samples ?? []} kind={kind} color={color} height={36} sparkline />
        </div>
      )}
    </div>
  );
}

interface CloudflareSpeedLayoutProps {
  state: ProgressState;
  samples: SpeedSample[];
  server: ServerInfo | null;
  network: ClientNetworkInfo | null;
  assessment: ConnectionAssessment | null;
  running: boolean;
  complete: boolean;
  statusLine: string;
  canStart: boolean;
  controls?: ReactNode;
  onStart: () => void;
  onCancel: () => void;
}

export function CloudflareSpeedLayout({
  state,
  samples,
  server,
  network,
  assessment,
  running,
  complete,
  statusLine,
  canStart,
  controls,
  onStart,
  onCancel,
}: CloudflareSpeedLayoutProps) {
  const phase = state.phase;
  const m = state.metrics;
  const settled = !running;

  const measuringLabel = (): string | null => {
    if (phase === "download") {
      return `Measuring download • ${formatTransferred(m.downloadedBytes)}`;
    }
    if (phase === "upload") {
      return `Measuring upload • ${formatTransferred(m.uploadedBytes)}`;
    }
    if (phase === "ping") return "Measuring latency…";
    if (phase === "preparing") return "Preparing…";
    return null;
  };

  const qualityRows =
    assessment != null ? buildNetworkQualityScores(assessment.activities) : [];
  const showQuality = complete && qualityRows.length > 0;

  const liveDownload =
    phase === "download" ? (state.currentMbps ?? m.downloadMbps) : m.downloadMbps;
  const liveUpload = phase === "upload" ? (state.currentMbps ?? m.uploadMbps) : m.uploadMbps;
  const gaugeMbps =
    phase === "upload"
      ? liveUpload
      : phase === "download" || complete
        ? (state.currentMbps ?? m.downloadMbps)
        : null;

  const downloadParts = formatSpeedParts(liveDownload);
  const uploadParts = formatSpeedParts(liveUpload);

  return (
    <div className="panel text-card-foreground">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-5">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
          Your internet speed
        </h2>
        <div className="flex items-center gap-1">
          {running ? (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Cancel test"
            >
              <Pause className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onStart}
              disabled={!canStart}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
              aria-label={complete ? "Test again" : "Start test"}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-6">
        <div className="grid items-center gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:gap-6">
          <div className="min-w-0 space-y-3">
            <SemiGauge mbps={gaugeMbps} phase={phase} settled={settled} />
            <StepPills phase={phase} />
            {controls}

            {running && measuringLabel() && (
              <div
                className="flex items-center justify-center gap-2 text-[13px] font-medium text-foreground"
                role="status"
              >
                <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden />
                {measuringLabel()}
              </div>
            )}

            {running && phase !== "idle" && (
              <div
                className="mx-auto h-1.5 max-w-md overflow-hidden rounded-full bg-muted"
                aria-hidden
              >
                <div
                  className="h-full rounded-full motion-safe:transition-[width] motion-safe:duration-300 motion-safe:ease-out"
                  style={{
                    width: `${Math.round(state.progress * 100)}%`,
                    backgroundImage: "var(--gold-gradient)",
                  }}
                />
              </div>
            )}
          </div>

          <div className="grid min-w-0 grid-cols-2 content-center gap-3 self-center">
          <MetricBlock
            label="Download"
            value={downloadParts?.amount ?? "—"}
            unit={downloadParts?.unit}
            active={phase === "download"}
            color={TILES.download}
            icon={<DownloadIcon />}
            samples={samples}
            kind="download"
            filled={downloadParts != null}
          />
          <MetricBlock
            label="Upload"
            value={uploadParts?.amount ?? "—"}
            unit={uploadParts?.unit}
            active={phase === "upload"}
            color={TILES.upload}
            icon={<UploadIcon />}
            samples={samples}
            kind="upload"
            filled={uploadParts != null}
          />
          <MetricBlock
            label="Latency"
            value={formatMs(m.pingMs) ?? "—"}
            unit="ms"
            caption={m.pingMs != null ? pingDescriptor(m.pingMs) : null}
            active={phase === "ping"}
            color={TILES.latency}
            icon={<LatencyIcon />}
            filled={m.pingMs != null}
          />
          <MetricBlock
            label="Jitter"
            value={formatMs(m.jitterMs) ?? "—"}
            unit="ms"
            caption={m.jitterMs != null ? jitterDescriptor(m.jitterMs) : null}
            active={false}
            color={TILES.jitter}
            icon={<JitterIcon />}
            filled={m.jitterMs != null}
          />
          </div>
        </div>

        {complete && <ConnectionQualitySummary metrics={m} visible />}
        {complete && <LoadedLatencySummary metrics={m} />}

        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-lg border border-border px-3 py-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Packet loss
          </p>
          <p className="font-heading text-lg font-medium tabular-nums text-foreground">
            {m.packetLossPercent != null ? `${m.packetLossPercent.toFixed(1)}%` : "—"}
          </p>
          <p className="w-full text-[11px] text-muted-foreground">
            {m.packetLossPercent != null
              ? "Measured during this test."
              : "Not measured on this run. Use the request-loss tool for a separate check."}
          </p>
        </div>

        {showQuality && (
          <div className="border-t border-border pt-5">
            <p className="mb-3 text-[13px] font-semibold text-foreground">
              Network quality score
            </p>
            <NetworkQualityStars rows={qualityRows} />
          </div>
        )}

        {complete && assessment && (
          <div className="rounded-2xl border border-border bg-[var(--surface-subtle)] px-4 py-3">
            <p className="text-[15px] font-semibold text-foreground">
              {assessment.overallHeadline}
            </p>
            <p className="mt-1 text-[13px] leading-snug text-muted-foreground">
              {assessment.overallDescription}
            </p>
          </div>
        )}

        <CloudflareServerPanel server={server} network={network} />
      </div>

      {!running && phase !== "idle" && statusLine && phase !== "complete" && (
        <p className="border-t border-border px-4 py-2 text-center text-[12px] text-muted-foreground sm:px-5">
          {statusLine}
        </p>
      )}
    </div>
  );
}
