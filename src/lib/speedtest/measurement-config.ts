const LOOPBACK =
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

/** Same-origin path for the Vercel → Go proxy (must match app route). */
export const MEASUREMENT_PROXY_PATH = "/api/speedtest/measure";

export type MeasurementMode = "direct" | "proxy" | "none";

export interface MeasurementConfig {
  baseUrl: string | null;
  mode: MeasurementMode;
  ready: boolean;
  message?: string;
  probeOk?: boolean;
}

export function isLoopbackUrl(url: string): boolean {
  return LOOPBACK.test(url);
}

export function measurementProxyBaseUrl(siteOrigin: string): string {
  return `${siteOrigin.replace(/\/$/, "")}${MEASUREMENT_PROXY_PATH}`;
}

/**
 * How the browser should reach the Go measurement service for this deployment.
 * Called on the server (e.g. /api/speedtest/config) with the public site origin.
 */
export function resolveMeasurementConfig(siteOrigin: string): MeasurementConfig {
  const publicUrl = process.env.NEXT_PUBLIC_SPEEDTEST_URL?.replace(/\/$/, "");
  const internal = process.env.SPEEDTEST_INTERNAL_URL?.replace(/\/$/, "");
  const pageIsLocal = isLoopbackUrl(siteOrigin);
  const proxyBase = measurementProxyBaseUrl(siteOrigin);

  if (publicUrl && !isLoopbackUrl(publicUrl)) {
    const mixedContent =
      siteOrigin.startsWith("https:") && publicUrl.startsWith("http:");
    if (mixedContent) {
      if (internal) {
        return {
          baseUrl: proxyBase,
          mode: "proxy",
          ready: true,
          message:
            "Using same-origin proxy because NEXT_PUBLIC_SPEEDTEST_URL is not HTTPS.",
        };
      }
      return {
        baseUrl: null,
        mode: "none",
        ready: false,
        message:
          "Set NEXT_PUBLIC_SPEEDTEST_URL to an https:// measurement origin, or set SPEEDTEST_INTERNAL_URL for proxy.",
      };
    }
    return { baseUrl: publicUrl, mode: "direct", ready: true };
  }

  if (pageIsLocal) {
    return {
      baseUrl: proxyBase,
      mode: "proxy",
      ready: true,
    };
  }

  if (internal) {
    return {
      baseUrl: proxyBase,
      mode: "proxy",
      ready: true,
      message:
        "Using same-origin proxy. For best accuracy, set NEXT_PUBLIC_SPEEDTEST_URL to your public measurement HTTPS origin.",
    };
  }

  return {
    baseUrl: null,
    mode: "none",
    ready: false,
    message:
      "Speed test is not configured for production. In Vercel, set NEXT_PUBLIC_SPEEDTEST_URL to your measurement API (https://…) and add this site to SPEEDTEST_CORS_ORIGINS on that server—or set SPEEDTEST_INTERNAL_URL to enable the measurement proxy.",
  };
}

/** Probe target origin for /health (direct URL or internal upstream). */
export function measurementProbeOrigin(
  config: MeasurementConfig,
  siteOrigin: string,
): string | null {
  if (config.mode === "direct" && config.baseUrl) {
    return config.baseUrl;
  }
  const internal = process.env.SPEEDTEST_INTERNAL_URL?.replace(/\/$/, "");
  const publicUrl = process.env.NEXT_PUBLIC_SPEEDTEST_URL?.replace(/\/$/, "");
  if (config.mode === "proxy") {
    return (
      internal ||
      (publicUrl && !isLoopbackUrl(publicUrl) ? publicUrl : null) ||
      (isLoopbackUrl(siteOrigin) ? "http://127.0.0.1:18443" : null)
    );
  }
  return null;
}
