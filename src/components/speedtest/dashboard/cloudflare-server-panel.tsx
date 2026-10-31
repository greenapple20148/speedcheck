"use client";

import { Info } from "lucide-react";
import type { ClientNetworkInfo, ServerInfo } from "@/types/speedtest";
import { formatPublicIpDisplay, formatServerLocation } from "@/lib/network/display-fields";

interface CloudflareServerPanelProps {
  server: ServerInfo | null;
  network: ClientNetworkInfo | null;
}

/** Stylized east-coast map with server pin (Cloudflare-inspired, not a live map tile). */
function ServerMap({ label }: { label: string }) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-[#0d1117]">
      <svg
        viewBox="0 0 400 280"
        className="h-full w-full text-white/20"
        aria-hidden
      >
        <path
          fill="currentColor"
          d="M40 40h320v200H40z"
          opacity={0.15}
        />
        <path
          fill="currentColor"
          d="M80 60c40-20 120-25 180-10 50 12 80 40 90 80 5 25-10 50-40 65-35 18-95 20-140 5-45-15-75-50-90-90-8-22-5-45 0-50z"
          opacity={0.35}
        />
        <circle cx="268" cy="118" r="6" fill="#f38020" opacity={0.9} />
        <circle cx="268" cy="118" r="14" fill="none" stroke="#f38020" strokeWidth={2} opacity={0.5} />
      </svg>
      <p className="absolute bottom-2 left-2 right-2 truncate text-[11px] font-medium text-white/70">
        {label}
      </p>
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
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-1.5 text-[13px] font-semibold text-white/90">
        Server location
        <Info className="h-3.5 w-3.5 text-white/40" aria-hidden />
      </div>
      <ServerMap label={location} />
      <dl className="space-y-2 text-[12px]">
        <div>
          <dt className="text-white/45">Server</dt>
          <dd className="font-medium text-white/85">{server?.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-white/45">Network</dt>
          <dd className="font-medium text-white/85">{isp}</dd>
        </div>
        <div>
          <dt className="text-white/45">Your IP</dt>
          <dd className="font-mono text-[11px] font-medium text-white/85">{ip}</dd>
        </div>
      </dl>
    </div>
  );
}
