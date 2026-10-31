import type { ClientNetworkInfo, ServerInfo } from "@/types/speedtest";

export function formatPublicIpDisplay(network: ClientNetworkInfo | null): string {
  if (!network?.publicIpMasked) return "Unavailable";
  return network.publicIpMasked;
}

export function formatIspDisplay(network: ClientNetworkInfo | null): string {
  if (!network?.isp) return "Unavailable";
  return network.ispVerified ? network.isp : `${network.isp} (estimated)`;
}

export function isDevMeasurementServer(server: ServerInfo | null): boolean {
  if (!server) return false;
  return (
    server.region === "local" ||
    server.id.startsWith("local") ||
    /development/i.test(server.location)
  );
}

export function formatServerDisplay(server: ServerInfo | null): string {
  if (!server?.name) return "Unavailable";
  if (isDevMeasurementServer(server)) {
    return server.name;
  }
  return server.name;
}

export function formatServerLocation(server: ServerInfo | null): string {
  if (!server) return "Unavailable";
  if (isDevMeasurementServer(server)) {
    return "Set SPEEDTEST_SERVER_NAME and SPEEDTEST_SERVER_LOCATION on your measurement host (e.g. DigitalOcean droplet).";
  }
  return server.location;
}

/** Browser Network Information API — not a verified radio access type. */
export function formatBrowserLinkEstimate(raw: string | null | undefined): string {
  if (!raw) return "Unavailable";
  return `${raw} (browser estimate)`;
}
