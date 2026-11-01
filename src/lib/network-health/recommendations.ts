import { DIAGNOSIS_THRESHOLDS } from "@/lib/speedtest/diagnosis-config";
import { worstLatencyIncreaseMs } from "@/lib/speedtest/connection-assessment";
import type { PlanSettings } from "@/lib/speedtest/history-store";
import type { HealthSnapshot } from "@/lib/network-health/snapshot";

export type Confidence = "high" | "medium" | "low";

export interface HealthRecommendation {
  id: string;
  title: string;
  evidence: string;
  confidence: Confidence;
  action: string;
  verification: string;
}

export interface RoomReading {
  name: string;
  downloadMbps: number | null;
}

export function buildHealthRecommendations(input: {
  snapshot: HealthSnapshot | null;
  rooms: RoomReading[];
  plan: PlanSettings | null;
}): HealthRecommendation[] {
  const snapshot = input.snapshot;
  if (!snapshot) return [];
  const findings: HealthRecommendation[] = [];
  const thresholds = DIAGNOSIS_THRESHOLDS;

  const increase = worstLatencyIncreaseMs({
    downloadMbps: snapshot.downloadMbps,
    uploadMbps: snapshot.uploadMbps,
    pingMs: snapshot.pingMs,
    jitterMs: snapshot.jitterMs,
    bufferbloatIdleMs: snapshot.idleLatencyMs,
    bufferbloatLoadedDownMs: snapshot.loadedDownMs,
    bufferbloatLoadedUpMs: snapshot.loadedUpMs,
    bufferbloatGrade: snapshot.bufferbloatGrade,
  });
  const grade = snapshot.bufferbloatGrade;
  if (grade === "D" || grade === "F" || (increase != null && increase >= 60)) {
    const gradeText = grade ? `Grade ${grade}. ` : "";
    const latencyText = snapshot.loadedLatencyMs != null && snapshot.idleLatencyMs != null
      ? `Loaded latency ${formatMs(snapshot.loadedLatencyMs)} versus idle ${formatMs(snapshot.idleLatencyMs)}.`
      : "Loaded latency was recorded without a complete idle comparison.";
    findings.push({
      id: "loaded-latency",
      title: "Loaded latency is high",
      evidence: `${gradeText}${latencyText}`.trim(),
      confidence: grade === "D" || grade === "F" ? "high" : "medium",
      action: "Look for congestion on the link. If the router offers SQM or QoS, try that and retest while the rest of the household is quiet.",
      verification: "Run the standard speed test again and compare loaded latency with this result.",
    });
  }

  const measuredRooms = input.rooms.filter((room) => room.downloadMbps != null && room.downloadMbps > 0);
  if (measuredRooms.length >= 2) {
    const best = Math.max(...measuredRooms.map((room) => room.downloadMbps ?? 0));
    const worst = measuredRooms.reduce((slow, room) => ((room.downloadMbps ?? 0) < (slow.downloadMbps ?? 0) ? room : slow));
    if (best > 0 && worst.downloadMbps != null && worst.downloadMbps / best < 0.4) {
      findings.push({
        id: "room-gap",
        title: "A room is much slower than another saved room",
        evidence: `${worst.name} measured ${formatMbps(worst.downloadMbps)}. The fastest saved room measured ${formatMbps(best)}.`,
        confidence: "high",
        action: "Compare that room on Wi-Fi and on Ethernet, then compare it with a nearby room before moving hardware.",
        verification: "Repeat the room test in the slow room and in the fastest room.",
      });
    }
  }

  if (snapshot.jitterMs != null && snapshot.jitterMs > thresholds.highJitterMs) {
    findings.push({
      id: "jitter",
      title: "Jitter is high",
      evidence: `Jitter measured ${formatMs(snapshot.jitterMs)}.${snapshot.downloadMbps != null ? ` Download measured ${formatMbps(snapshot.downloadMbps)}.` : ""}`,
      confidence: snapshot.downloadMbps != null && snapshot.downloadMbps >= thresholds.goodDownloadMbps ? "high" : "medium",
      action: "Run a stability test and pause competing downloads or uploads while it runs.",
      verification: "Open the stability test, then repeat this speed test.",
    });
  }

  const download = snapshot.downloadMbps;
  const upload = snapshot.uploadMbps;
  if (input.plan && download != null && upload != null && input.plan.uploadMbps > 0) {
    const uploadRatio = upload / input.plan.uploadMbps;
    const downloadRatio = download / Math.max(input.plan.downloadMbps, 1);
    if (uploadRatio < thresholds.planDeliveredWarningRatio && downloadRatio >= thresholds.planDeliveredWarningRatio * 0.9) {
      findings.push({
        id: "slow-upload",
        title: "Upload is well below the saved plan",
        evidence: `Upload measured ${formatMbps(upload)} against a saved plan of ${formatMbps(input.plan.uploadMbps)}. Download measured ${formatMbps(download)}.`,
        confidence: "high",
        action: "Pause background uploads and check whether the ISP plan’s upload rate is the limit.",
        verification: "Retest upload with other devices idle, on Ethernet if you can.",
      });
    }
  } else if (download != null && upload != null && download >= thresholds.goodDownloadMbps && upload < 5) {
    findings.push({
      id: "slow-upload",
      title: "Upload is low",
      evidence: `Upload measured ${formatMbps(upload)} while download measured ${formatMbps(download)}. No ISP plan speed is saved, so this is only the measured uplink.`,
      confidence: "medium",
      action: "Pause background uploads and compare the result with the upload rate on your ISP plan.",
      verification: "Retest upload with other devices idle.",
    });
  }

  return findings;
}

function formatMbps(value: number): string {
  return `${Math.round(value * 10) / 10} Mbps`;
}

function formatMs(value: number): string {
  return `${Math.round(value)} ms`;
}
