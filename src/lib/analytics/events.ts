type EventProps = Record<string, string | number | boolean | null | undefined>;

const MEASUREMENT_KEYS = new Set([
  "downloadMbps",
  "uploadMbps",
  "pingMs",
  "jitterMs",
  "latencyMs",
  "bytes",
]);

function analyticsSafeProps(props: EventProps): EventProps {
  const out: EventProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (MEASUREMENT_KEYS.has(key)) continue;
    out[key] = value;
  }
  return out;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    speedcheckAnalytics?: Array<{ name: string; props?: EventProps; ts: number }>;
  }
}

export function trackEvent(name: string, props: EventProps = {}) {
  if (typeof window === "undefined") return;

  const sanitized = analyticsSafeProps(props);
  window.speedcheckAnalytics = window.speedcheckAnalytics || [];
  window.speedcheckAnalytics.push({ name, props: sanitized, ts: Date.now() });

  if (typeof window.gtag === "function" && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
    window.gtag("event", name, sanitized);
  }

  if (process.env.NEXT_PUBLIC_PRIVACY_ANALYTICS === "true") {
    try {
      const body = JSON.stringify({ name, props: sanitized, ts: Date.now() });
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/analytics/event", body);
      } else {
        void fetch("/api/analytics/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        });
      }
    } catch {
      // ignore
    }
  }
}
