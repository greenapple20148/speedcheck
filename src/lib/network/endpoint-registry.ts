/**
 * The browser uses one configured measurement service per test.
 * Results from a different host are not merged into that result.
 */
export interface MeasurementEndpoint {
  id: string;
  label: string;
  role: "throughput" | "rtt";
}

export function endpointIdFromBaseUrl(baseUrl: string | null): string {
  if (!baseUrl) return "unconfigured";
  try {
    const url = new URL(baseUrl);
    if (url.pathname.includes("/api/speedtest/measure")) {
      return "same-origin-proxy";
    }
    return url.host;
  } catch {
    return "unconfigured";
  }
}

export function describeEndpoint(baseUrl: string | null): MeasurementEndpoint {
  const id = endpointIdFromBaseUrl(baseUrl);
  if (id === "unconfigured") {
    return {
      id,
      label: "Measurement endpoint is not configured",
      role: "throughput",
    };
  }
  if (id === "same-origin-proxy") {
    return {
      id,
      label: "Same-origin measurement proxy",
      role: "throughput",
    };
  }
  return { id, label: id, role: "throughput" };
}
