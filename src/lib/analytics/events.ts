type EventProps = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    speedcheckAnalytics?: Array<{ name: string; props?: EventProps; ts: number }>;
  }
}

export function trackEvent(name: string, props: EventProps = {}) {
  if (typeof window === "undefined") return;

  window.speedcheckAnalytics = window.speedcheckAnalytics || [];
  window.speedcheckAnalytics.push({ name, props, ts: Date.now() });

  // Mirror to GA4 when configured
  if (typeof window.gtag === "function" && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
    window.gtag("event", name, props);
  }

  // Optional privacy-conscious beacon to our API (no PII)
  if (process.env.NEXT_PUBLIC_PRIVACY_ANALYTICS === "true") {
    try {
      const body = JSON.stringify({ name, props, ts: Date.now() });
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
