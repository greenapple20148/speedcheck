import {
  OVERALL_DOWNLOAD_TIERS_MBPS,
  SEVERE_LATENCY_INCREASE_MS,
  SEVERE_LOADED_LATENCY_MS,
  VIDEO_CALLS_UNSTABLE_JITTER_MS,
} from "@/lib/speedtest/assessment-config";
import {
  BUFFERBLOAT_GRADE_LABEL,
  BUFFERBLOAT_GRADE_SUMMARY,
  type BufferbloatGrade,
} from "@/lib/speedtest/bufferbloat-config";
import {
  buildConnectionInsights,
  type InsightItem,
  type Suitability,
} from "@/lib/speedtest/connection-insights";
import type { TestMode } from "@/types/speedtest";

export type QualityLevel = "excellent" | "good" | "fair" | "limited" | "poor";

export interface AssessmentInput {
  downloadMbps: number | null;
  uploadMbps: number | null;
  pingMs: number | null;
  jitterMs: number | null;
  bufferbloatIdleMs?: number | null;
  bufferbloatLoadedDownMs?: number | null;
  bufferbloatLoadedUpMs?: number | null;
  bufferbloatGrade?: BufferbloatGrade | null;
  mode?: TestMode;
}

export interface UnderLoadAssessment {
  grade: BufferbloatGrade | null;
  headline: string;
  description: string;
  idleMs: number | null;
  loadedDownMs: number | null;
  loadedUpMs: number | null;
}

export interface ActivityAssessment {
  id: string;
  label: string;
  status: string;
  suitability: Suitability;
}

export interface ConnectionAssessment {
  overallHeadline: string;
  overallDescription: string;
  qualityLevel: QualityLevel;
  activities: ActivityAssessment[];
  underLoad: UnderLoadAssessment | null;
}

export function maxLoadedLatencyMs(input: AssessmentInput): number | null {
  const values = [
    input.bufferbloatLoadedDownMs,
    input.bufferbloatLoadedUpMs,
  ].filter((v): v is number => v != null && !Number.isNaN(v));
  if (values.length === 0) return null;
  return Math.max(...values);
}

export function worstLatencyIncreaseMs(input: AssessmentInput): number | null {
  const idle = input.bufferbloatIdleMs ?? input.pingMs;
  const loaded = maxLoadedLatencyMs(input);
  if (idle == null || loaded == null) return null;
  return Math.max(0, loaded - idle);
}

function downgradeSuitability(s: Suitability): Suitability {
  if (s === "excellent") return "good";
  if (s === "good") return "fair";
  if (s === "fair") return "poor";
  return "poor";
}

function effectiveInsightMetrics(input: AssessmentInput): AssessmentInput {
  const ping = input.pingMs;
  const jitter = input.jitterMs;
  const loaded = maxLoadedLatencyMs(input);
  if (ping == null || jitter == null) return input;

  let effectivePing = ping;
  if (loaded != null && loaded > ping) {
    effectivePing = loaded;
  }

  let effectiveJitter = jitter;
  const increase = worstLatencyIncreaseMs(input);
  if (increase != null && increase > 30) {
    effectiveJitter = Math.max(jitter, Math.min(increase / 2, 120));
  }

  return {
    ...input,
    pingMs: effectivePing,
    jitterMs: effectiveJitter,
  };
}

function underLoadIsSevere(input: AssessmentInput): boolean {
  const grade = input.bufferbloatGrade;
  if (grade === "F" || grade === "D") return true;
  const loaded = maxLoadedLatencyMs(input);
  if (loaded != null && loaded >= SEVERE_LOADED_LATENCY_MS) return true;
  const increase = worstLatencyIncreaseMs(input);
  if (increase != null && increase >= SEVERE_LATENCY_INCREASE_MS) return true;
  return false;
}

/** Headline + copy for responsiveness under load; never positive when severity triggers. */
export function buildUnderLoadAssessment(
  input: AssessmentInput,
): UnderLoadAssessment | null {
  const grade = input.bufferbloatGrade ?? null;
  const idleMs = input.bufferbloatIdleMs ?? input.pingMs ?? null;
  const loadedDownMs = input.bufferbloatLoadedDownMs ?? null;
  const loadedUpMs = input.bufferbloatLoadedUpMs ?? null;

  if (input.mode === "lightweight" && grade == null) {
    return null;
  }

  if (grade) {
    return {
      grade,
      headline: BUFFERBLOAT_GRADE_LABEL[grade],
      description: BUFFERBLOAT_GRADE_SUMMARY[grade],
      idleMs,
      loadedDownMs,
      loadedUpMs,
    };
  }

  if (underLoadIsSevere(input)) {
    return {
      grade: null,
      headline: "Very poor under load",
      description:
        "Measured latency under transfer is extremely high. Video calls and gaming will lag when the line is busy.",
      idleMs,
      loadedDownMs,
      loadedUpMs,
    };
  }

  return null;
}

/** Ensures marketing-style positive under-load copy only appears for grade A. */
export function underLoadHeadlineIsConsistent(input: AssessmentInput): boolean {
  const under = buildUnderLoadAssessment(input);
  if (!under) return true;
  const positive = /stays responsive under load/i.test(under.description);
  if (positive && under.grade !== "A") return false;
  if (underLoadIsSevere(input) && positive) return false;
  return true;
}

export function buildOverallAssessment(
  input: AssessmentInput,
): Pick<ConnectionAssessment, "overallHeadline" | "overallDescription" | "qualityLevel"> {
  const dl = input.downloadMbps;
  if (dl == null || Number.isNaN(dl)) {
    return {
      overallHeadline: "Results pending",
      overallDescription: "Run a test to measure your connection.",
      qualityLevel: "fair",
    };
  }

  let headline: string;
  let description: string;
  let qualityLevel: QualityLevel;

  if (dl >= OVERALL_DOWNLOAD_TIERS_MBPS.gigabit) {
    headline = "Gigabit-class connection";
    description =
      "Strong download for many 4K streams, large files, and cloud backups at once.";
    qualityLevel = "excellent";
  } else if (dl >= OVERALL_DOWNLOAD_TIERS_MBPS.fast) {
    headline = "Fast connection";
    description =
      "Solid for HD and 4K streaming, video calls, and quick transfers on multiple devices.";
    qualityLevel = "good";
  } else if (dl >= OVERALL_DOWNLOAD_TIERS_MBPS.everyday) {
    headline = "Good for everyday use";
    description =
      "Fine for browsing, HD streaming on one screen, and typical video calls.";
    qualityLevel = "good";
  } else {
    headline = "Limited connection";
    description =
      "Your internet may struggle with HD streaming, large downloads, and multiple connected devices.";
    qualityLevel = "limited";
  }

  if (underLoadIsSevere(input)) {
    if (qualityLevel === "excellent" || qualityLevel === "good") {
      qualityLevel = "limited";
    }
    if (!description.includes("busy")) {
      description =
        `${description} Latency spikes sharply when the line is busy.`;
    }
  }

  const ping = input.pingMs;
  const jitter = input.jitterMs;
  if (ping != null && ping > 100 && qualityLevel !== "limited") {
    qualityLevel = "fair";
  }
  if (jitter != null && jitter > 40 && qualityLevel === "good") {
    qualityLevel = "fair";
  }

  return { overallHeadline: headline, overallDescription: description, qualityLevel };
}

const ACTIVITY_LABELS: Record<string, string> = {
  browsing: "Browsing",
  "video-calls": "Video calls",
  streaming: "4K streaming",
  gaming: "Online gaming",
};

function activityStatusLabel(
  item: InsightItem,
  input: AssessmentInput,
): string {
  let s = item.suitability;
  if (underLoadIsSevere(input)) {
    s = downgradeSuitability(s);
    if (item.id === "gaming" || item.id === "video-calls") {
      s = downgradeSuitability(s);
    }
  }

  if (item.id === "gaming") {
    if (s === "poor") return "Poor";
    if (s === "fair") return "Limited";
    if (s === "good") return "Fair";
    return "Good";
  }

  if (item.id === "video-calls") {
    const jitter = input.jitterMs;
    if (s === "poor") return "Poor";
    if (
      jitter != null &&
      jitter >= VIDEO_CALLS_UNSTABLE_JITTER_MS &&
      s !== "excellent"
    ) {
      return "Unstable";
    }
    if (s === "fair") return "Unstable";
    if (s === "good") return "Fair";
    return "Good";
  }

  if (item.id === "streaming") {
    if (s === "poor" || s === "fair") return "Limited";
    if (s === "good") return "Fair";
    return "Good";
  }

  if (item.id === "browsing") {
    if (s === "poor" || s === "fair") return "Limited";
    if (s === "good") return "Fair";
    return "Good";
  }

  return "—";
}

/** Keep activity chips aligned with overall download tier (no “Good” browsing on <25 Mbps). */
function alignActivitiesWithOverall(
  activities: ActivityAssessment[],
  qualityLevel: QualityLevel,
  downloadMbps: number | null,
): ActivityAssessment[] {
  const lowDownload =
    downloadMbps != null &&
    downloadMbps < OVERALL_DOWNLOAD_TIERS_MBPS.everyday;

  return activities.map((a) => {
    let status = a.status;
    if (lowDownload && (a.id === "browsing" || a.id === "streaming")) {
      if (status === "Good" || status === "Fair") status = "Limited";
    }
    if (
      (qualityLevel === "limited" || qualityLevel === "poor") &&
      a.id === "gaming" &&
      status === "Good"
    ) {
      status = "Fair";
    }
    return { ...a, status };
  });
}

export function buildConnectionAssessment(
  input: AssessmentInput,
): ConnectionAssessment {
  const overall = buildOverallAssessment(input);
  const effective = effectiveInsightMetrics(input);
  const insights = buildConnectionInsights(effective);

  let activities: ActivityAssessment[] = insights.map((item) => ({
    id: item.id,
    label: ACTIVITY_LABELS[item.id] ?? item.label,
    status: activityStatusLabel(item, input),
    suitability: item.suitability,
  }));

  activities = alignActivitiesWithOverall(
    activities,
    overall.qualityLevel,
    input.downloadMbps,
  );

  const underLoad = buildUnderLoadAssessment(input);

  return {
    ...overall,
    activities,
    underLoad,
  };
}
