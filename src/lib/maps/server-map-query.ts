import { formatServerLocation } from "@/lib/network/display-fields";
import type { ServerInfo } from "@/types/speedtest";

export type ServerMapQuery =
  | { kind: "coordinates"; lat: number; lng: number }
  | { kind: "place"; query: string };

export function resolveServerMapQuery(server: ServerInfo | null): ServerMapQuery | null {
  if (!server) return null;

  if (
    typeof server.latitude === "number" &&
    typeof server.longitude === "number" &&
    Number.isFinite(server.latitude) &&
    Number.isFinite(server.longitude)
  ) {
    return { kind: "coordinates", lat: server.latitude, lng: server.longitude };
  }

  const place = formatServerLocation(server);
  if (/unavailable/i.test(place)) return null;
  return { kind: "place", query: place };
}

export function buildGoogleMapsEmbedUrl(
  mapQuery: ServerMapQuery,
  apiKey: string,
): string {
  const key = encodeURIComponent(apiKey);
  if (mapQuery.kind === "coordinates") {
    const center = encodeURIComponent(`${mapQuery.lat},${mapQuery.lng}`);
    return `https://www.google.com/maps/embed/v1/view?key=${key}&center=${center}&zoom=9&maptype=roadmap`;
  }
  const q = encodeURIComponent(mapQuery.query);
  return `https://www.google.com/maps/embed/v1/place?key=${key}&q=${q}&maptype=roadmap`;
}
