import { resolveMeasurementConfig } from "@/lib/speedtest/measurement-config";

const DEFAULT_MEASUREMENT = "http://127.0.0.1:18443";

/** Server-side default (proxy target). */
export function serverMeasurementOrigin(): string {
  return (
    process.env.SPEEDTEST_INTERNAL_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SPEEDTEST_URL?.replace(/\/$/, "") ||
    DEFAULT_MEASUREMENT
  );
}

/**
 * Browser fallback when /api/speedtest/config has not loaded yet.
 * Prefer passing `baseUrl` from the config API into runSpeedTest().
 */
export function resolveSpeedtestBaseUrl(): string {
  if (typeof window === "undefined") {
    return (
      process.env.NEXT_PUBLIC_SPEEDTEST_URL?.replace(/\/$/, "") ||
      DEFAULT_MEASUREMENT
    );
  }

  const config = resolveMeasurementConfig(window.location.origin);
  return config.baseUrl ?? "";
}
