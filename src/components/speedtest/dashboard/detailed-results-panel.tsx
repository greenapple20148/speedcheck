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
import { ConnectionInsights } from "./connection-insights";
import { format } from "date-fns";

const LiveSpeedChart = dynamic(
  () => import("./live-speed-chart").then((m) => m.LiveSpeedChart),
  { ssr: false, loading: () => null },
);

interface DetailedResultsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  network: ClientNetworkInfo | null;
  server: ServerInfo | null;
  browserLinkEstimate: string | null;
  testedAt: Date | null;
  samples: SpeedSample[];
  metrics: SpeedMetrics;
  mode: TestMode;
  showInsights: boolean;
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
  network,
  server,
  browserLinkEstimate,
  testedAt,
  samples,
  metrics,
  mode,
  showInsights,
  showChart,
}: DetailedResultsPanelProps) {
  return (
    <div className="mx-auto mt-3 max-w-[960px] border-t border-[#E3EBE8] px-4 pt-3">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="flex w-full items-center justify-between gap-2 rounded-md py-1.5 text-left text-[14px] font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#218C77]"
        aria-expanded={open}
      >
        View detailed results
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground motion-safe:transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open && (
        <div className="mt-4 space-y-5 pb-1">
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
          {showInsights && <ConnectionInsights metrics={metrics} visible />}
        </div>
      )}
    </div>
  );
}
