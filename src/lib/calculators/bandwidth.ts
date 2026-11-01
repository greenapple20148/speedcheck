import { CALL_REFERENCE_MBPS, STREAMING_REFERENCE_MBPS } from "@/lib/calculators/units";

/**
 * Planning rates for simultaneous household use.
 * These are configurable reference assumptions, not measured throughput.
 */
export const QUANTITY_MIN = 0;
export const QUANTITY_MAX = 50;
export const HEADROOM_FACTOR = 0.25;
export const DEFAULT_PLAN_DOWNLOAD_MBPS = 300;
export const DEFAULT_PLAN_UPLOAD_MBPS = 20;

export const ACTIVITY_IDS = ["browse", "hd", "uhd", "call", "backup"] as const;
export type ActivityId = (typeof ACTIVITY_IDS)[number];

export interface BandwidthActivity {
  id: ActivityId;
  name: string;
  downloadMbps: number;
  uploadMbps: number;
}

export const BANDWIDTH_ACTIVITIES: readonly BandwidthActivity[] = [
  { id: "browse", name: "Web browsing", downloadMbps: 3, uploadMbps: 1 },
  {
    id: "hd",
    name: "HD streaming (1080p)",
    downloadMbps: STREAMING_REFERENCE_MBPS.hd,
    uploadMbps: 0.5,
  },
  {
    id: "uhd",
    name: "4K streaming",
    downloadMbps: STREAMING_REFERENCE_MBPS.uhd4k,
    uploadMbps: 1,
  },
  {
    id: "call",
    name: "Video calls",
    downloadMbps: CALL_REFERENCE_MBPS.zoom.down,
    uploadMbps: CALL_REFERENCE_MBPS.zoom.up,
  },
  { id: "backup", name: "Cloud backup / sync", downloadMbps: 1, uploadMbps: 10 },
];

export type QuantityMap = Record<ActivityId, number>;

export const PRESET_IDS = ["light", "wfh", "family", "gaming", "heavy"] as const;
export type PresetId = (typeof PRESET_IDS)[number];

export interface HouseholdPreset {
  id: PresetId;
  name: string;
  description: string;
  quantities: QuantityMap;
}

export const HOUSEHOLD_PRESETS: readonly HouseholdPreset[] = [
  {
    id: "light",
    name: "Light browsing",
    description: "Two people browsing",
    quantities: { browse: 2, hd: 0, uhd: 0, call: 0, backup: 0 },
  },
  {
    id: "wfh",
    name: "Work from home",
    description: "Browsing, a video call, and cloud sync",
    quantities: { browse: 2, hd: 0, uhd: 0, call: 1, backup: 1 },
  },
  {
    id: "family",
    name: "Family streaming",
    description: "HD and 4K streams together",
    quantities: { browse: 2, hd: 2, uhd: 1, call: 0, backup: 0 },
  },
  {
    id: "gaming",
    name: "Gaming household",
    description: "Browsing, a stream, and a call beside play",
    quantities: { browse: 2, hd: 1, uhd: 0, call: 1, backup: 0 },
  },
  {
    id: "heavy",
    name: "Heavy usage",
    description: "Several streams, calls, and a backup",
    quantities: { browse: 4, hd: 2, uhd: 2, call: 2, backup: 1 },
  },
];

/** Common residential plan sizes. Values already on a tier stay put. */
export const PLAN_TIERS_MBPS = [25, 50, 75, 100, 150, 200, 300, 400, 500, 800, 1000, 1200, 2000, 5000] as const;

export interface ActivityContribution {
  id: string;
  quantity: number;
  downloadMbps: number;
  uploadMbps: number;
}

export interface BandwidthEstimate {
  totalDownloadMbps: number;
  totalUploadMbps: number;
  byActivity: ActivityContribution[];
}

export type UtilizationLevel = "comfortable" | "busy" | "near" | "over";

export const UTILIZATION_LABEL: Record<UtilizationLevel, string> = {
  comfortable: "Within plan",
  busy: "Getting tight",
  near: "Near the limit",
  over: "Above the plan",
};

export type DirectionAdvice = "good" | "tight" | "faster";

export interface BandwidthRecommendation {
  rawDownloadMbps: number;
  rawUploadMbps: number;
  headroomDownloadMbps: number;
  headroomUploadMbps: number;
  tierDownloadMbps: number;
  tierUploadMbps: number;
  downloadAdvice: DirectionAdvice | null;
  uploadAdvice: DirectionAdvice | null;
  summary: string;
}

export interface MeasuredSpeed {
  downloadMbps: number;
  uploadMbps: number;
  createdAt: string;
}

export interface PlanParse {
  value: number | null;
  error: string | null;
}

function toTenths(mbps: number): number {
  return Math.round(mbps * 10);
}

function fromTenths(tenths: number): number {
  return tenths / 10;
}

export function emptyQuantities(): QuantityMap {
  return { browse: 0, hd: 0, uhd: 0, call: 0, backup: 0 };
}

export function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return QUANTITY_MIN;
  const whole = Math.trunc(value);
  if (whole < QUANTITY_MIN) return QUANTITY_MIN;
  if (whole > QUANTITY_MAX) return QUANTITY_MAX;
  return whole;
}

export function stepQuantity(current: number, direction: -1 | 1): number {
  const base = Number.isFinite(current) ? Math.trunc(current) : 0;
  return clampQuantity(base + direction);
}

/** Enabling an idle activity starts at 1. Disabling clears it. */
export function quantityFromToggle(current: number, enabled: boolean): number {
  if (!enabled) return 0;
  const clamped = clampQuantity(current);
  return clamped > 0 ? clamped : 1;
}

export function withQuantity(current: QuantityMap, id: ActivityId, quantity: number): QuantityMap {
  return { ...current, [id]: clampQuantity(quantity) };
}

export function quantitiesFromPreset(id: PresetId): QuantityMap {
  const preset = HOUSEHOLD_PRESETS.find((item) => item.id === id);
  if (!preset) return emptyQuantities();
  return { ...preset.quantities };
}

export function matchingPreset(quantities: QuantityMap): PresetId | null {
  for (const preset of HOUSEHOLD_PRESETS) {
    const same = ACTIVITY_IDS.every((id) => preset.quantities[id] === clampQuantity(quantities[id]));
    if (same) return preset.id;
  }
  return null;
}

export function estimateBandwidth(
  quantities: Partial<Record<string, number>> | null | undefined,
  activities: readonly BandwidthActivity[] = BANDWIDTH_ACTIVITIES,
): BandwidthEstimate {
  let downloadTenths = 0;
  let uploadTenths = 0;
  const byActivity = activities.map((activity) => {
    const quantity = clampQuantity(quantities?.[activity.id] ?? 0);
    const downloadPart = toTenths(activity.downloadMbps) * quantity;
    const uploadPart = toTenths(activity.uploadMbps) * quantity;
    downloadTenths += downloadPart;
    uploadTenths += uploadPart;
    return {
      id: activity.id,
      quantity,
      downloadMbps: fromTenths(downloadPart),
      uploadMbps: fromTenths(uploadPart),
    };
  });
  return {
    totalDownloadMbps: fromTenths(downloadTenths),
    totalUploadMbps: fromTenths(uploadTenths),
    byActivity,
  };
}

export function parsePlanMbps(raw: string): PlanParse {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return { value: null, error: "Enter a speed greater than 0." };
  }
  if (trimmed.length > 12 || !/^\+?(?:\d+\.?\d*|\.\d+)$/.test(trimmed)) {
    return { value: null, error: "Enter a positive number in Mbps." };
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) {
    return { value: null, error: "Enter a speed greater than 0." };
  }
  return { value, error: null };
}

export function formatPlanInput(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  const rounded = Math.round(value * 100) / 100;
  return String(rounded);
}

export function formatEstimateMbps(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  if (rounded === 0) return "0";
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(2).replace(/0$/, "");
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const rounded = Math.round(value * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${text}%`;
}

export function utilizationPercent(requiredMbps: number, planMbps: number | null): number | null {
  if (planMbps == null || !Number.isFinite(planMbps) || planMbps <= 0) return null;
  if (!Number.isFinite(requiredMbps) || requiredMbps < 0) return null;
  return (requiredMbps / planMbps) * 100;
}

export function utilizationLevel(percent: number): UtilizationLevel {
  if (percent > 100) return "over";
  if (percent >= 90) return "near";
  if (percent >= 70) return "busy";
  return "comfortable";
}

/** Bar width stops at the track. The label still shows the real percentage. */
export function utilizationBarWidth(percent: number): number {
  if (!Number.isFinite(percent) || percent <= 0) return 0;
  return Math.min(100, percent);
}

export function recommendedMbps(totalMbps: number, headroom = HEADROOM_FACTOR): number {
  if (!Number.isFinite(totalMbps) || totalMbps <= 0) return 0;
  return (toTenths(totalMbps) * (1 + headroom)) / 10;
}

export function roundUpToPlanTier(mbps: number, tiers: readonly number[] = PLAN_TIERS_MBPS): number {
  if (!Number.isFinite(mbps) || mbps <= 0) return 0;
  for (const tier of tiers) {
    if (tier + 1e-9 >= mbps) return tier;
  }
  const step = 1000;
  return Math.ceil(mbps / step) * step;
}

export function directionAdvice(requiredMbps: number, planMbps: number | null): DirectionAdvice | null {
  const percent = utilizationPercent(requiredMbps, planMbps);
  if (percent == null) return null;
  if (requiredMbps <= 0) return "good";
  if (percent > 100) return "faster";
  if (percent >= 70) return "tight";
  return "good";
}

function adviceSentence(direction: "download" | "upload", advice: DirectionAdvice): string | null {
  if (advice === "good") return null;
  if (advice === "tight") {
    return direction === "download" ? "Download is getting tight." : "Upload is getting tight.";
  }
  return direction === "download" ? "Consider a faster download plan." : "Consider a faster upload plan.";
}

export function recommendationTone(
  downloadAdvice: DirectionAdvice | null,
  uploadAdvice: DirectionAdvice | null,
): "good" | "tight" | "faster" | "incomplete" {
  if (downloadAdvice == null || uploadAdvice == null) return "incomplete";
  if (downloadAdvice === "faster" || uploadAdvice === "faster") return "faster";
  return downloadAdvice === "tight" || uploadAdvice === "tight" ? "tight" : "good";
}

export function buildRecommendation(
  totalDownloadMbps: number,
  totalUploadMbps: number,
  planDownloadMbps: number | null,
  planUploadMbps: number | null,
  headroom = HEADROOM_FACTOR,
): BandwidthRecommendation {
  const headroomDownloadMbps = recommendedMbps(totalDownloadMbps, headroom);
  const headroomUploadMbps = recommendedMbps(totalUploadMbps, headroom);
  const downloadAdvice = directionAdvice(totalDownloadMbps, planDownloadMbps);
  const uploadAdvice = directionAdvice(totalUploadMbps, planUploadMbps);
  return {
    rawDownloadMbps: totalDownloadMbps,
    rawUploadMbps: totalUploadMbps,
    headroomDownloadMbps,
    headroomUploadMbps,
    tierDownloadMbps: roundUpToPlanTier(headroomDownloadMbps),
    tierUploadMbps: roundUpToPlanTier(headroomUploadMbps),
    downloadAdvice,
    uploadAdvice,
    summary: recommendationSummary(downloadAdvice, uploadAdvice, totalDownloadMbps, totalUploadMbps),
  };
}

function recommendationSummary(
  downloadAdvice: DirectionAdvice | null,
  uploadAdvice: DirectionAdvice | null,
  totalDownloadMbps: number,
  totalUploadMbps: number,
): string {
  if (downloadAdvice == null || uploadAdvice == null) {
    return "Enter download and upload speeds greater than 0 to compare this estimate with a plan.";
  }
  const sentences = [
    adviceSentence("download", downloadAdvice),
    adviceSentence("upload", uploadAdvice),
  ].filter((sentence): sentence is string => sentence != null);
  if (sentences.length === 0) {
    if (totalDownloadMbps <= 0 && totalUploadMbps <= 0) {
      return "Your plan looks good for these activities. Nothing is selected, so the estimated load is 0 Mbps.";
    }
    return "Your plan looks good for these activities.";
  }
  return sentences.join(" ");
}

export function latestMeasuredSpeed(
  entries: ReadonlyArray<{
    downloadMbps: number | null;
    uploadMbps: number | null;
    createdAt: string;
  }>,
): MeasuredSpeed | null {
  let best: MeasuredSpeed | null = null;
  for (const entry of entries) {
    const downloadMbps = entry.downloadMbps;
    const uploadMbps = entry.uploadMbps;
    if (downloadMbps == null || uploadMbps == null) continue;
    if (!Number.isFinite(downloadMbps) || !Number.isFinite(uploadMbps)) continue;
    if (downloadMbps <= 0 || uploadMbps <= 0) continue;
    if (!best || entry.createdAt > best.createdAt) {
      best = { downloadMbps, uploadMbps, createdAt: entry.createdAt };
    }
  }
  return best;
}

export function headroomPercentLabel(headroom = HEADROOM_FACTOR): number {
  return Math.round(headroom * 100);
}
