import type { ClientNetworkInfo, ServerInfo } from "@/types/speedtest";

export function formatPublicIpDisplay(network: ClientNetworkInfo | null): string {
  if (!network?.publicIpMasked) return "Unavailable";
  return network.publicIpMasked;
}

export function formatIspDisplay(network: ClientNetworkInfo | null): string {
  if (!network?.isp) return "Unavailable";
  return network.ispVerified ? network.isp : `${network.isp} (estimated)`;
}

export function formatServerDisplay(server: ServerInfo | null): string {
  if (!server?.name) return "Unavailable";
  if (server.region === "local" || server.id.startsWith("local")) {
    return `${server.name} (development)`;
  }
  return server.name;
}

export function formatServerLocation(server: ServerInfo | null): string {
  if (!server) return "Unavailable";
  if (
    server.region === "local" ||
    /development/i.test(server.location) ||
    server.id.startsWith("local")
  ) {
    return "Unavailable — not a production measurement node";
  }
  return server.location;
}

/** Browser Network Information API — not a verified radio access type. */
export function formatBrowserLinkEstimate(raw: string | null | undefined): string {
  if (!raw) return "Unavailable";
  return `${raw} (browser estimate)`;
}
