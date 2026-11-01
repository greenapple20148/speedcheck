import { buildConnectionAssessment } from "@/lib/speedtest/connection-assessment";
import type { AssessmentInput } from "@/lib/speedtest/connection-assessment";
import { latencyIncreaseMs } from "@/lib/network/loaded-latency";

export interface QualityExplanation {
  /** Present because a test produced them. */
  measured: string[];
  /** Suitability language derived from thresholds, not a certification. */
  estimated: string[];
  missing: string[];
  summary: string;
}

function has(n: number | null | undefined): n is number {
  return n != null && Number.isFinite(n);
}

/** Explain quality without hiding a weak metric behind one opaque score. */
export function explainQuality(input: AssessmentInput): QualityExplanation {
  const measured: string[] = [];
  const missing: string[] = [];

  if (has(input.downloadMbps)) measured.push(`Download ${input.downloadMbps.toFixed(1)} Mbps`);
  else missing.push("Download speed");

  if (has(input.uploadMbps)) measured.push(`Upload ${input.uploadMbps.toFixed(1)} Mbps`);
  else missing.push("Upload speed");

  if (has(input.pingMs)) measured.push(`Idle HTTP RTT ${input.pingMs.toFixed(0)} ms`);
  else missing.push("Idle latency");

  if (has(input.jitterMs)) measured.push(`Jitter ${input.jitterMs.toFixed(1)} ms`);
  else missing.push("Jitter");

  const increase = latencyIncreaseMs(
    input.bufferbloatIdleMs ?? input.pingMs,
    input.bufferbloatLoadedDownMs != null || input.bufferbloatLoadedUpMs != null
      ? Math.max(
          input.bufferbloatLoadedDownMs ?? 0,
          input.bufferbloatLoadedUpMs ?? 0,
        )
      : null,
  );
  if (increase != null && (input.bufferbloatLoadedDownMs != null || input.bufferbloatLoadedUpMs != null)) {
    measured.push(`Latency increase under load ${increase.toFixed(0)} ms`);
  } else {
    missing.push("Latency under load");
  }

  const assessment = buildConnectionAssessment(input);
  const estimated = assessment.activities.map(
    (activity) => `${activity.label}: ${activity.status} (estimated suitability)`,
  );

  return {
    measured,
    estimated,
    missing,
    summary: assessment.overallDescription,
  };
}
