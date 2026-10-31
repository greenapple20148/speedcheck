"use client";

import dynamic from "next/dynamic";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatBrowserLinkEstimate,
  formatIspDisplay,
  formatPublicIpDisplay,
  formatServerDisplay,
  formatServerLocation,
} from "@/lib/network/display-fields";
import type {
  ClientNetworkInfo,
  ServerInfo,
  SpeedMetrics,
  SpeedSample,
  TestMode,
} from "@/types/speedtest";
import { format } from "date-fns";

const LiveSpeedChart = dynamic(
  () => import("./live-speed-chart").then((m) => m.LiveSpeedChart),
  { ssr: false, loading: () => null },
);

interface DetailedResultsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  panelId: string;
  network: ClientNetworkInfo | null;
  server: ServerInfo | null;
  browserLinkEstimate: string | null;
  testedAt: Date | null;
  samples: SpeedSample[];
  metrics: SpeedMetrics;
  mode: TestMode;
  showChart: boolean;
}

function GridItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[12px] font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate text-[14px] font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function DetailedResultsPanel({
  open,
  onOpenChange,
  panelId,
  network,
  server,
  browserLinkEstimate,
  testedAt,
  samples,
  mode,
  showChart,
}: DetailedResultsPanelProps) {
  return (
    <div className="mt-4 border-t border-[var(--card-border)] pt-0">
      <button
        type="button"
        id={`${panelId}-trigger`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onOpenChange(!open)}
        className="flex min-h-[56px] w-full items-center justify-between gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--surface-subtle)] px-4 text-left text-[15px] font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-teal)] focus-visible:ring-offset-2"
      >
        View detailed results
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-muted-foreground motion-safe:transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={`${panelId}-trigger`}
          className="mt-3 space-y-5 pb-1"
        >
          <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
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
          </dl>
          {showChart && samples.length > 0 && <LiveSpeedChart samples={samples} />}
        </div>
      )}
    </div>
  );
}
