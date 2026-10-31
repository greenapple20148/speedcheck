"use client";

import dynamic from "next/dynamic";
import { ChevronDown } from "lucide-react";
import { DiagnosisCard } from "@/components/speedtest/dashboard/diagnosis-card";
import { ConnectionTagToggle } from "@/components/speedtest/dashboard/connection-tag-toggle";
import { ResultFooter } from "@/components/speedtest/dashboard/result-footer";
import {
  formatBrowserLinkEstimate,
  formatIspDisplay,
  formatPublicIpDisplay,
  formatServerDisplay,
  formatServerLocation,
} from "@/lib/network/display-fields";
import type { ConnectionAssessment } from "@/lib/speedtest/connection-assessment";
import type { PlanSettings, StoredHistoryEntry } from "@/lib/speedtest/history-store";
import type {
  ClientNetworkInfo,
  ConnectionTag,
  ServerInfo,
  SpeedMetrics,
  SpeedSample,
  TestMode,
} from "@/types/speedtest";
import { cn, formatMs } from "@/lib/utils";
import { format } from "date-fns";

const LiveSpeedChart = dynamic(
  () => import("./live-speed-chart").then((m) => m.LiveSpeedChart),
  { ssr: false, loading: () => null },
);

interface AdvancedDiagnosticsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  panelId: string;
  /** When false, parent renders the expand control (e.g. beside Test Again). */
  showToggle?: boolean;
  assessment: ConnectionAssessment;
  metrics: SpeedMetrics;
  mode: TestMode;
  network: ClientNetworkInfo | null;
  server: ServerInfo | null;
  browserLinkEstimate: string | null;
  testedAt: Date | null;
  samples: SpeedSample[];
  plan: PlanSettings | null;
  history: StoredHistoryEntry[];
  shareUrl: string | null;
  connectionTag: ConnectionTag;
  onConnectionTagChange: (tag: ConnectionTag) => void;
}

function GridItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[12px] font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate text-[14px] font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function AdvancedDiagnosticsPanel({
  open,
  onOpenChange,
  panelId,
  assessment,
  metrics,
  mode,
  network,
  server,
  browserLinkEstimate,
  testedAt,
  samples,
  plan,
  history,
  shareUrl,
  connectionTag,
  onConnectionTagChange,
  showToggle = true,
}: AdvancedDiagnosticsPanelProps) {
  const under = assessment.underLoad;

  if (!open && !showToggle) return null;

  return (
    <div className={cn(showToggle && "border-t border-[var(--card-border)] pt-4")}>
      {showToggle && (
        <button
          type="button"
          id={`${panelId}-trigger`}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => onOpenChange(!open)}
          className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border border-[var(--card-border)] bg-card px-3.5 text-left text-[14px] font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:px-4"
        >
          View detailed diagnostics
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground motion-safe:transition-transform",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>
      )}
      {open && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={`${panelId}-trigger`}
          className={cn("space-y-4", showToggle ? "mt-3" : "mt-4 border-t border-[var(--card-border)] pt-4")}
        >
          <section className="rounded-xl border border-[var(--card-border)] bg-card p-3.5">
            <h3 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Latency breakdown
            </h3>
            <dl className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <GridItem
                label="Idle ping"
                value={
                  metrics.pingMs != null
                    ? `${formatMs(metrics.pingMs, 1)} ms`
                    : "—"
                }
              />
              <GridItem
                label="Download-loaded ping"
                value={
                  metrics.bufferbloatLoadedDownMs != null
                    ? `${formatMs(metrics.bufferbloatLoadedDownMs, 1)} ms`
                    : mode === "lightweight"
                      ? "Not measured (Lightweight)"
                      : "—"
                }
              />
              <GridItem
                label="Upload-loaded ping"
                value={
                  metrics.bufferbloatLoadedUpMs != null
                    ? `${formatMs(metrics.bufferbloatLoadedUpMs, 1)} ms`
                    : mode === "lightweight"
                      ? "Not measured (Lightweight)"
                      : "—"
                }
              />
              <GridItem
                label="Jitter"
                value={
                  metrics.jitterMs != null
                    ? `${formatMs(metrics.jitterMs, 1)} ms`
                    : "—"
                }
              />
              <GridItem
                label="Bufferbloat grade"
                value={
                  under?.grade
                    ? `${under.grade} — ${under.headline}`
                    : mode === "lightweight"
                      ? "Not measured (Lightweight)"
                      : "—"
                }
              />
              {under && (
                <GridItem label="Under load" value={under.description} />
              )}
            </dl>
          </section>

          <DiagnosisCard metrics={metrics} plan={plan} history={history} visible />

          <ConnectionTagToggle
            visible
            value={connectionTag}
            onChange={onConnectionTagChange}
          />

          <dl className="grid grid-cols-1 gap-x-4 gap-y-3 rounded-xl border border-[var(--card-border)] bg-card p-3.5 sm:grid-cols-2 lg:grid-cols-3">
            <GridItem label="ISP" value={formatIspDisplay(network)} />
            <GridItem label="Public IP" value={formatPublicIpDisplay(network)} />
            <GridItem label="Test server" value={formatServerDisplay(server)} />
            <GridItem label="Server location" value={formatServerLocation(server)} />
            <GridItem
              label="Browser link estimate"
              value={formatBrowserLinkEstimate(browserLinkEstimate)}
            />
            <GridItem
              label="Test time"
              value={testedAt ? format(testedAt, "MMM d, yyyy · h:mm a") : "Unavailable"}
            />
            <GridItem label="Test mode" value={mode} />
            <GridItem
              label="Duration"
              value={
                metrics.durationMs > 0
                  ? `${(metrics.durationMs / 1000).toFixed(1)} s`
                  : "—"
              }
            />
          </dl>

          {samples.length > 0 && <LiveSpeedChart samples={samples} />}

          <ResultFooter
            shareUrl={shareUrl}
            network={network}
            server={server}
            visible
          />
        </div>
      )}
    </div>
  );
}
