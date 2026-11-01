"use client";

import type { ClientNetworkInfo, ServerInfo } from "@/types/speedtest";
import { formatPublicIpDisplay, formatServerLocation } from "@/lib/network/display-fields";
import { ServerLocationMap } from "./server-location-map";

interface CloudflareServerPanelProps {
  server: ServerInfo | null;
  network: ClientNetworkInfo | null;
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-[var(--surface-subtle)] px-3 py-2.5">
      <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 truncate text-[13px] font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function CloudflareServerPanel({
  server,
  network,
}: CloudflareServerPanelProps) {
  const location = server ? formatServerLocation(server) : "Selecting server…";
  const isp = network?.isp ?? network?.org ?? "—";
  const ip = formatPublicIpDisplay(network);

  return (
    <div className="space-y-3">
      <h3 className="font-sans text-[13px] font-semibold tracking-normal text-foreground">
        Server location
      </h3>
      <ServerLocationMap server={server} />
      <p className="text-[13px] text-muted-foreground">{location}</p>
      <dl className="grid gap-2 sm:grid-cols-3">
        <InfoBox label="Server" value={server?.name ?? "—"} />
        <InfoBox label="Network" value={isp} />
        <InfoBox label="Your IP" value={ip} />
      </dl>
    </div>
  );
}
