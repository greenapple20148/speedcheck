/** Client-safe feature gates (build-time public env). */

export const featureFlags = {
  aiDiagnostics:
    process.env.NEXT_PUBLIC_FEATURE_AI_DIAGNOSTICS !== "false",
  ispReport: process.env.NEXT_PUBLIC_FEATURE_ISP_REPORT === "true",
  gamingDiagnostics:
    process.env.NEXT_PUBLIC_FEATURE_GAMING_DIAGNOSTICS === "true",
  wifiCompare: process.env.NEXT_PUBLIC_FEATURE_WIFI_COMPARE === "true",
} as const;

export function isAiDiagnosticsServerEnabled(): boolean {
  return (
    process.env.DIAGNOSTICS_AI_ENABLED !== "false" &&
    Boolean(process.env.OPENAI_API_KEY?.trim())
  );
}
