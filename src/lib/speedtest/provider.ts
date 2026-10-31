import type { SpeedtestProvider } from "@/types/speedtest";

export type { SpeedtestProvider };

const PROVIDER_ENV = "NEXT_PUBLIC_SPEEDTEST_PROVIDER";

/** Server-side provider resolution (config API). */
export function resolveSpeedtestProvider(
  siteOrigin: string,
  dedicatedReady: boolean,
): SpeedtestProvider {
  const raw = process.env[PROVIDER_ENV]?.trim().toLowerCase();
  if (raw === "cloudflare" || raw === "cf") return "cloudflare";
  if (raw === "dedicated" || raw === "myspeedgauge" || raw === "go") {
    return "dedicated";
  }
  if (raw === "auto" || !raw) {
    return dedicatedReady ? "dedicated" : "cloudflare";
  }
  return dedicatedReady ? "dedicated" : "cloudflare";
}

/** Client-side; prefers value from config API when passed. */
export function resolveClientSpeedtestProvider(
  override?: SpeedtestProvider | null,
): SpeedtestProvider {
  if (override) return override;
  const raw =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_SPEEDTEST_PROVIDER?.trim().toLowerCase()
      : undefined;
  if (raw === "cloudflare" || raw === "cf") return "cloudflare";
  if (raw === "dedicated" || raw === "myspeedgauge" || raw === "go") {
    return "dedicated";
  }
  return "dedicated";
}

export function providerUsesDedicatedBaseUrl(provider: SpeedtestProvider): boolean {
  return provider === "dedicated";
}
