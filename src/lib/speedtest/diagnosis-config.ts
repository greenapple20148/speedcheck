export type DiagnosisSeverity = "info" | "warning" | "problem";

export const DIAGNOSIS_THRESHOLDS = {
  planDeliveredWarningRatio: 0.7,
  highJitterMs: 20,
  goodDownloadMbps: 25,
  bufferbloatPoorGrades: ["C", "D", "F"] as const,
  uploadVsDownloadRatio: 0.35,
  highIdlePingMs: 60,
} as const;
