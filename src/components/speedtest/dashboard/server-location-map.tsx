"use client";

import {
  buildGoogleMapsEmbedUrl,
  resolveServerMapQuery,
} from "@/lib/maps/server-map-query";
import { formatServerLocation } from "@/lib/network/display-fields";
import type { ServerInfo } from "@/types/speedtest";
import { StylizedServerMap } from "./stylized-server-map";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface ServerLocationMapProps {
  server: ServerInfo | null;
}

export function ServerLocationMap({ server }: ServerLocationMapProps) {
  const label = server ? formatServerLocation(server) : "Selecting server…";
  const mapQuery = resolveServerMapQuery(server);

  if (!MAPS_KEY || !mapQuery) {
    return <StylizedServerMap label={label} />;
  }

  const src = buildGoogleMapsEmbedUrl(mapQuery, MAPS_KEY);

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-[var(--speed-map-bg)]">
      <iframe
        title={`Map: ${label}`}
        src={src}
        className="absolute inset-0 h-full w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      <p className="pointer-events-none absolute bottom-0 left-0 right-0 truncate bg-gradient-to-t from-[var(--speed-map-bg)] via-[var(--speed-map-bg)]/90 to-transparent px-2 pb-2 pt-6 text-[11px] font-medium text-foreground">
        {label}
      </p>
    </div>
  );
}
