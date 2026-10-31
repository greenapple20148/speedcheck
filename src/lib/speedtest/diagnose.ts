import { DIAGNOSIS_THRESHOLDS, type DiagnosisSeverity } from "@/lib/speedtest/diagnosis-config";
import type { PlanSettings, StoredHistoryEntry } from "@/lib/speedtest/history-store";
import type { BufferbloatGrade } from "@/types/speedtest";

export interface DiagnosisFinding {
  id: string;
  severity: DiagnosisSeverity;
  title: string;
  explanation: string;
  suggestedAction: string;
}

export interface DiagnosisInput {
  downloadMbps: number | null;
  uploadMbps: number | null;
  pingMs: number | null;
  jitterMs: number | null;
  bufferbloatGrade?: BufferbloatGrade | null;
}

const severityRank: Record<DiagnosisSeverity, number> = {
  problem: 0,
  warning: 1,
  info: 2,
};

export function diagnose(
  result: DiagnosisInput,
  plan?: PlanSettings | null,
  _history?: StoredHistoryEntry[],
): DiagnosisFinding[] {
  const findings: DiagnosisFinding[] = [];
  const dl = result.downloadMbps;
  const ul = result.uploadMbps;
  const ping = result.pingMs;
  const jitter = result.jitterMs;
  const grade = result.bufferbloatGrade;
  const t = DIAGNOSIS_THRESHOLDS;

  if (plan && dl != null && plan.downloadMbps > 0) {
    const pct = Math.round((dl / plan.downloadMbps) * 100);
    if (dl < plan.downloadMbps * t.planDeliveredWarningRatio) {
      findings.push({
        id: "below-plan",
        severity: "warning",
        title: `You're getting about ${pct}% of your plan download speed`,
        explanation:
          "Your measured download is well below the speed you pay for. This may be normal at peak times or may point to Wi‑Fi or equipment limits.",
        suggestedAction:
          "Try a wired connection, reboot your router, or contact your ISP if speeds stay low.",
      });
    }
  }

  if (
    jitter != null &&
    jitter > t.highJitterMs &&
    dl != null &&
    dl >= t.goodDownloadMbps
  ) {
    findings.push({
      id: "jitter-wifi",
      severity: "warning",
      title: "Speed looks good, but latency varies",
      explanation:
        "High jitter with decent download often means Wi‑Fi interference or local network congestion.",
      suggestedAction:
        "Try 5 GHz Wi‑Fi, move closer to the router, reduce active devices, or use a wired connection.",
    });
  }

  if (
    grade &&
    (t.bufferbloatPoorGrades as readonly string[]).includes(grade)
  ) {
    findings.push({
      id: "bufferbloat",
      severity: grade === "F" || grade === "D" ? "problem" : "warning",
      title: "Latency may spike when the line is busy",
      explanation:
        "Under load, your ping rose enough that video calls and games may lag when someone else downloads or streams.",
      suggestedAction:
        "Enable SQM or QoS on your router, or ask your ISP about bufferbloat-friendly equipment.",
    });
  }

  if (plan && dl != null && ul != null && plan.uploadMbps > 0) {
    const uploadPlanRatio = ul / plan.uploadMbps;
    const downloadPlanRatio = dl / Math.max(plan.downloadMbps, 1);
    if (
      uploadPlanRatio < t.planDeliveredWarningRatio &&
      downloadPlanRatio >= t.planDeliveredWarningRatio * 0.9
    ) {
      findings.push({
        id: "upload-bottleneck",
        severity: "warning",
        title: "Upload may be the bottleneck",
        explanation:
          "Download is closer to your plan than upload, which may affect video calls and cloud backups.",
        suggestedAction:
          "Close upload-heavy apps during calls, or ask your ISP about upload upgrades.",
      });
    } else if (dl > 0 && ul / dl < t.uploadVsDownloadRatio) {
      findings.push({
        id: "upload-asymmetry",
        severity: "info",
        title: "Upload is much lower than download",
        explanation:
          "Many home plans are asymmetric; heavy upload tasks may feel slower than downloads.",
        suggestedAction:
          "Schedule large backups off-peak or use wired Ethernet for important calls.",
      });
    }
  }

  if (ping != null && ping > t.highIdlePingMs) {
    findings.push({
      id: "high-ping",
      severity: "info",
      title: "Idle latency is on the high side",
      explanation:
        "Higher ping may come from distance to the test server, VPN use, or ISP routing.",
      suggestedAction:
        "Disable VPN for a retest, try again later, or compare results on a wired connection.",
    });
  }

  if (findings.length === 0) {
    findings.push({
      id: "healthy",
      severity: "info",
      title: "Your connection looks healthy",
      explanation:
        "Download, latency, and stability look good for everyday streaming, calls, and browsing.",
      suggestedAction: "Run tests at different times of day to see how your network varies.",
    });
  }

  return findings.sort(
    (a, b) => severityRank[a.severity] - severityRank[b.severity],
  );
}
