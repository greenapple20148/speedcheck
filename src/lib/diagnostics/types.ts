import type { DiagnosisFinding } from "@/lib/speedtest/diagnose";
import type { BufferbloatGrade, TestMode } from "@/types/speedtest";

export interface DiagnosticMetricsSnapshot {
  downloadMbps: number | null;
  uploadMbps: number | null;
  pingMs: number | null;
  jitterMs: number | null;
  bufferbloatGrade?: BufferbloatGrade | null;
  bufferbloatIdleMs?: number | null;
  bufferbloatLoadedDownMs?: number | null;
  bufferbloatLoadedUpMs?: number | null;
  mode?: TestMode;
  serverName?: string | null;
  serverLocation?: string | null;
}

export interface HistoryInsight {
  id: string;
  title: string;
  detail: string;
}

export interface DiagnosticReport {
  version: 1;
  generatedAt: string;
  headline: string;
  summary: string;
  findings: DiagnosisFinding[];
  historyInsights: HistoryInsight[];
  recommendations: string[];
  metrics: DiagnosticMetricsSnapshot;
  aiEnhanced: boolean;
  disclaimer: string;
}

export const DIAGNOSTIC_DISCLAIMER =
  "This analysis is based on one manual test and optional browser history. It is not a guarantee of ISP performance, does not diagnose hardware faults, and cannot see your home network beyond what the test measures.";
