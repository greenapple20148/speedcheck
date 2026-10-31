"use client";

import { Info } from "lucide-react";
import type { ClientNetworkInfo, ServerInfo } from "@/types/speedtest";
import { formatPublicIpDisplay } from "@/lib/network/display-fields";
import { ServerLocationMap } from "./server-location-map";

interface CloudflareServerPanelProps {
  server: ServerInfo | null;
  network: ClientNetworkInfo | null;
}

export function CloudflareServerPanel({
  server,
  network,
}: CloudflareServerPanelProps) {
  const isp = network?.isp ?? network?.org ?? "—";
  const ip = formatPublicIpDisplay(network);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
        Server location
        <Info className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      </div>
      <ServerLocationMap server={server} />
      <dl className="space-y-2 text-[12px]">
        <div>
          <dt className="text-muted-foreground">Server</dt>
          <dd className="font-medium text-foreground">{server?.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Network</dt>
          <dd className="font-medium text-foreground">{isp}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Your IP</dt>
          <dd className="font-mono text-[11px] font-medium text-foreground">{ip}</dd>
        </div>
      </dl>
    </div>
  );
}
