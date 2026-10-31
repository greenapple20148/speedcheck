export function normalizeSpeedtestError(err: unknown, baseUrl: string): Error {
  if (err instanceof DOMException && err.name === "AbortError") {
    return err;
  }

  if (!baseUrl) {
    return new Error(
      "Speed test server is not configured for this site. Set NEXT_PUBLIC_SPEEDTEST_URL to your public measurement API.",
    );
  }

  if (err instanceof Error) {
    const msg = err.message;
    if (
      msg === "Failed to fetch" ||
      /networkerror|load failed|fetch failed/i.test(msg) ||
      err.name === "TypeError"
    ) {
      const prod =
        typeof window !== "undefined" &&
        !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(
          window.location.origin,
        );
      if (prod) {
        return new Error(
          "Cannot reach the measurement service. Ensure NEXT_PUBLIC_SPEEDTEST_URL is a public https:// API, add this website to SPEEDTEST_CORS_ORIGINS on the measurement server, and redeploy—or set SPEEDTEST_INTERNAL_URL on Vercel to use the /api/measurement proxy.",
        );
      }
      return new Error(
        "Cannot reach the measurement service. Run npm run dev:speedtest in a second terminal (port 18443), then retry.",
      );
    }
    return err;
  }

  return new Error("Speed test failed");
}
