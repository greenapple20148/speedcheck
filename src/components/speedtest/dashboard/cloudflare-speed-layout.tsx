"use client";

import dynamic from "next/dynamic";
import { Loader2, Pause, RotateCcw } from "lucide-react";
import type { ConnectionAssessment } from "@/lib/speedtest/connection-assessment";
import { buildNetworkQualityScores } from "@/lib/speedtest/network-quality-score";
import { pingDescriptor, jitterDescriptor } from "@/lib/speedtest/ui-config";
import type {
  ClientNetworkInfo,
  ProgressState,
  ServerInfo,
  SpeedSample,
} from "@/types/speedtest";
import { cn, formatMs, formatSpeedParts } from "@/lib/utils";
import { CloudflareServerPanel } from "./cloudflare-server-panel";
import { NetworkQualityStars } from "./network-quality-stars";

const CloudflareSpeedChart = dynamic(
  () =>
    import("./cloudflare-speed-chart").then((m) => m.CloudflareSpeedChart),
  { ssr: false, loading: () => <div className="h-[100px]" /> },
);

const DOWNLOAD_COLOR = "#f38020";
const UPLOAD_COLOR = "#a855f7";

function formatTransferred(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${Math.round(bytes / 1_000)} kB`;
  return `${bytes} B`;
}

function MetricBlock({
  label,
  valueMbps,
  active,
  color,
  samples,
  kind,
}: {
  label: string;
  valueMbps: number | null;
  active: boolean;
  color: string;
  samples: SpeedSample[];
  kind: "download" | "upload";
}) {
  const parts = formatSpeedParts(valueMbps);
  return (
    <div className={cn("min-w-0 flex-1", active && "opacity-100")}>
      <div className="flex items-baseline gap-2">
        <h3 className="text-[13px] font-medium text-muted-foreground">{label}</h3>
      </div>
      <p
        className="mt-1 text-[2rem] font-light tabular-nums leading-none text-foreground sm:text-[2.25rem]"
        style={{ color: active ? color : undefined }}
      >
        {parts ? (
          <>
            {parts.amount}
            <span className="ml-1.5 text-lg text-muted-foreground">{parts.unit}</span>
          </>
        ) : (
          <span className="text-muted-foreground/50">—</span>
        )}
      </p>
      <div className="mt-2">
        <CloudflareSpeedChart samples={samples} kind={kind} color={color} />
      </div>
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
  onStart,
  onCancel,
}: CloudflareSpeedLayoutProps) {
  const phase = state.phase;
  const m = state.metrics;

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
    assessment != null
      ? buildNetworkQualityScores(assessment.activities)
      : [];

  const showQuality = complete && qualityRows.length > 0;

  return (
    <div className="speed-test-card rounded-2xl border border-border bg-card text-card-foreground shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-5">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
          Your internet speed
        </h2>
        <div className="flex items-center gap-1">
          {running ? (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Cancel test"
            >
              <Pause className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onStart}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={complete ? "Test again" : "Start test"}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_minmax(200px,280px)] lg:gap-6">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-col gap-6 sm:flex-row sm:gap-4">
            <MetricBlock
              label="Download"
              valueMbps={
                phase === "download"
                  ? (state.currentMbps ?? m.downloadMbps)
                  : m.downloadMbps
              }
              active={phase === "download"}
              color={DOWNLOAD_COLOR}
              samples={samples}
              kind="download"
            />
            <MetricBlock
              label="Upload"
              valueMbps={
                phase === "upload"
                  ? (state.currentMbps ?? m.uploadMbps)
                  : m.uploadMbps
              }
              active={phase === "upload"}
              color={UPLOAD_COLOR}
              samples={samples}
              kind="upload"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-border pt-4 text-center sm:text-left">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Latency
              </p>
              <p className="mt-0.5 text-lg font-medium tabular-nums text-foreground">
                {formatMs(m.pingMs) ?? "—"}
              </p>
              {m.pingMs != null && (
                <p className="text-[10px] text-muted-foreground">
                  {pingDescriptor(m.pingMs)}
                </p>
              )}
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Jitter
              </p>
              <p className="mt-0.5 text-lg font-medium tabular-nums text-foreground">
                {formatMs(m.jitterMs) ?? "—"}
              </p>
              {m.jitterMs != null && (
                <p className="text-[10px] text-muted-foreground">
                  {jitterDescriptor(m.jitterMs)}
                </p>
              )}
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Packet loss
              </p>
              <p className="mt-0.5 text-lg font-medium text-foreground">—</p>
              <p className="text-[10px] text-muted-foreground">Not measured</p>
            </div>
          </div>

          {running && measuringLabel() && (
            <div
              className="flex items-center gap-2 text-[13px] font-medium"
              style={{ color: phase === "upload" ? UPLOAD_COLOR : DOWNLOAD_COLOR }}
              role="status"
            >
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {measuringLabel()}
            </div>
          )}

          {running && phase !== "idle" && (
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-[width] duration-300 ease-out"
                style={{
                  width: `${Math.round(state.progress * 100)}%`,
                  backgroundColor:
                    phase === "upload" ? UPLOAD_COLOR : DOWNLOAD_COLOR,
                }}
              />
            </div>
          )}

          {showQuality && (
            <div className="border-t border-border pt-4">
              <p className="mb-3 text-[13px] font-semibold text-foreground">
                Network quality score
              </p>
              <NetworkQualityStars rows={qualityRows} />
            </div>
          )}

          {complete && assessment && (
            <div className="rounded-lg border border-border bg-muted/80 px-3 py-2.5">
              <p className="text-[14px] font-semibold text-foreground">
                {assessment.overallHeadline}
              </p>
              <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
                {assessment.overallDescription}
              </p>
            </div>
          )}
        </div>

        <aside className="lg:border-l lg:border-border lg:pl-5">
          <CloudflareServerPanel server={server} network={network} />
        </aside>
      </div>

      {!running && phase === "idle" && (
        <p className="border-t border-border px-4 py-2 text-center text-[12px] text-muted-foreground sm:px-5">
          {statusLine === "Testing…" ? "Press refresh to start" : statusLine}
        </p>
      )}
    </div>
  );
}
