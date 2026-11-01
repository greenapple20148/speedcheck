import { formatDuration } from "@/lib/calculators/units";

export const UPLOAD_SIZE_UNITS = ["KB", "MB", "GB", "TB", "KiB", "MiB", "GiB", "TiB"] as const;

export type UploadSizeUnit = (typeof UPLOAD_SIZE_UNITS)[number];

export const COMPARISON_SPEEDS_MBPS = [10, 25, 50, 100, 500, 1000] as const;

export const UPLOAD_CALCULATOR_STORAGE_KEY = "speedcheck_upload_calculator";

export const SLOW_UPLOAD_WARNING =
  "This upload speed is under 5 Mbps. Large files will take a long time at a steady rate. This is an estimate, not a live upload.";

export const LARGE_FILE_WARNING =
  "This file is very large. The estimate assumes the upload rate stays constant until the transfer finishes.";

const BYTE_FACTOR: Record<UploadSizeUnit, number> = {
  KB: 1_000,
  MB: 1_000_000,
  GB: 1_000_000_000,
  TB: 1_000_000_000_000,
  KiB: 1024,
  MiB: 1024 ** 2,
  GiB: 1024 ** 3,
  TiB: 1024 ** 4,
};

const MAX_SIZE = 1e15;
const MAX_MBPS = 1e9;
const SLOW_MBPS = 5;
const LARGE_BYTES = 100 * 1_000_000_000;
const LONG_SECONDS = 6 * 60 * 60;
const CENTURY_SECONDS = 100 * 365.25 * 24 * 60 * 60;
const QUERY_KEYS = ["size", "unit", "speed", "efficiency"] as const;

export interface UploadInputs {
  size: number;
  unit: UploadSizeUnit;
  speedMbps: number;
  efficiencyPercent: number;
}

export interface UploadFields {
  size: string;
  unit: string;
  speed: string;
  efficiency: string;
}

export interface UploadFieldErrors {
  size: string | null;
  unit: string | null;
  speed: string | null;
  efficiency: string | null;
}

export interface UploadEstimate {
  fileBytes: number;
  fileBits: number;
  idealSeconds: number;
  realisticSeconds: number;
  effectiveMbps: number;
  warnings: string[];
}

export interface UploadEvaluation {
  errors: UploadFieldErrors;
  inputs: UploadInputs | null;
  estimate: UploadEstimate | null;
}

export interface SpeedComparison {
  speedMbps: number;
  label: string;
  seconds: number | null;
  highlighted: boolean;
}

export const UPLOAD_PRESETS = [
  { id: "photos", label: "Photos", detail: "500 MB", size: 500, unit: "MB" },
  { id: "hd-video", label: "HD video", detail: "2 GB", size: 2, unit: "GB" },
  { id: "4k-video", label: "4K video", detail: "20 GB", size: 20, unit: "GB" },
  { id: "backup", label: "Large backup", detail: "100 GB", size: 100, unit: "GB" },
] as const;

export type UploadPresetId = (typeof UPLOAD_PRESETS)[number]["id"] | "custom";

export function isUploadSizeUnit(value: string): value is UploadSizeUnit {
  return (UPLOAD_SIZE_UNITS as readonly string[]).includes(value);
}

export function fileSizeBytes(size: number, unit: UploadSizeUnit): number {
  if (!Number.isFinite(size)) return Number.NaN;
  return size * BYTE_FACTOR[unit];
}

export function resetUploadInputs(): UploadInputs {
  return { size: 1, unit: "GB", speedMbps: 100, efficiencyPercent: 90 };
}

export function matchingPreset(size: number, unit: UploadSizeUnit): UploadPresetId {
  const match = UPLOAD_PRESETS.find((preset) => preset.size === size && preset.unit === unit);
  return match?.id ?? "custom";
}

export function applyPreset(id: Exclude<UploadPresetId, "custom">): { size: number; unit: UploadSizeUnit } {
  const preset = UPLOAD_PRESETS.find((item) => item.id === id);
  if (!preset) return { size: 1, unit: "GB" };
  return { size: preset.size, unit: preset.unit };
}

export function formatInputNumber(value: number): string {
  if (!Number.isFinite(value)) return "";
  const rounded = Math.round(value * 1_000_000) / 1_000_000;
  return String(rounded);
}

export function formatMbpsValue(mbps: number): string {
  if (!Number.isFinite(mbps)) return "—";
  const rounded = Math.round(mbps * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(2).replace(/0$/, "");
}

export function formatEfficiencyPercent(percent: number): string {
  if (!Number.isFinite(percent)) return "—";
  const rounded = Math.round(percent * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${text}%`;
}

export function speedLabel(mbps: number): string {
  if (mbps === 1000) return "1 Gbps";
  return `${formatMbpsValue(mbps)} Mbps`;
}

export function uploadContextLine(inputs: UploadInputs): string {
  return `At ${formatMbpsValue(inputs.speedMbps)} Mbps upload speed with ${formatEfficiencyPercent(inputs.efficiencyPercent)} efficiency.`;
}

/** Realistic duration is the primary figure. Sub-minute values follow the shared formatter. */
export function formatUploadDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  if (seconds >= CENTURY_SECONDS) return "More than 100 years";
  if (seconds < 0.05) {
    const milliseconds = seconds * 1000;
    if (milliseconds < 1) return `${(seconds * 1_000_000).toFixed(0)} µs`;
    return `${milliseconds < 10 ? milliseconds.toFixed(1) : milliseconds.toFixed(0)} ms`;
  }
  if (seconds >= 48 * 60 * 60) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return hours > 0 ? `${days.toLocaleString("en-US")} d ${hours} hr` : `${days.toLocaleString("en-US")} d`;
  }
  return formatDuration(seconds);
}

export function computeUploadEstimate(inputs: UploadInputs): UploadEstimate | null {
  if (!isUploadSizeUnit(inputs.unit)) return null;
  if (!Number.isFinite(inputs.size) || !(inputs.size > 0) || inputs.size > MAX_SIZE) return null;
  if (!Number.isFinite(inputs.speedMbps) || !(inputs.speedMbps > 0) || inputs.speedMbps > MAX_MBPS) return null;
  if (
    !Number.isFinite(inputs.efficiencyPercent) ||
    inputs.efficiencyPercent < 50 ||
    inputs.efficiencyPercent > 100
  ) {
    return null;
  }

  const fileBytes = fileSizeBytes(inputs.size, inputs.unit);
  const fileBits = fileBytes * 8;
  const idealSeconds = fileBits / (inputs.speedMbps * 1_000_000);
  const efficiency = inputs.efficiencyPercent / 100;
  const realisticSeconds = idealSeconds / efficiency;
  const effectiveMbps = inputs.speedMbps * efficiency;
  const figures = [fileBytes, fileBits, idealSeconds, realisticSeconds, effectiveMbps];
  if (!figures.every((value) => Number.isFinite(value) && value >= 0)) return null;
  if (!(fileBytes > 0)) return null;

  return {
    fileBytes,
    fileBits,
    idealSeconds,
    realisticSeconds,
    effectiveMbps,
    warnings: uploadWarnings(inputs.speedMbps, fileBytes, realisticSeconds),
  };
}

export function evaluateUploadFields(fields: UploadFields): UploadEvaluation {
  const errors: UploadFieldErrors = { size: null, unit: null, speed: null, efficiency: null };

  let unit: UploadSizeUnit | null = null;
  if (!isUploadSizeUnit(fields.unit)) errors.unit = "Choose a size unit.";
  else unit = fields.unit;

  const size = parsePositiveDecimal(fields.size);
  if (fields.size.trim() === "") errors.size = "Enter a file size.";
  else if (size == null) errors.size = "Enter a file size greater than 0.";
  else if (size > MAX_SIZE) errors.size = "That file is too large to estimate.";

  const speed = parsePositiveDecimal(fields.speed);
  if (fields.speed.trim() === "") errors.speed = "Enter an upload speed.";
  else if (speed == null) errors.speed = "Enter an upload speed greater than 0.";
  else if (speed > MAX_MBPS) errors.speed = "Enter an upload speed of 1,000,000,000 Mbps or less.";

  const efficiency = parsePositiveDecimal(fields.efficiency);
  if (fields.efficiency.trim() === "") errors.efficiency = "Set a transfer efficiency.";
  else if (efficiency == null || efficiency < 50 || efficiency > 100) {
    errors.efficiency = "Transfer efficiency must be between 50% and 100%.";
  }

  if (errors.size || errors.unit || errors.speed || errors.efficiency || size == null || unit == null || speed == null || efficiency == null) {
    return { errors, inputs: null, estimate: null };
  }

  const inputs: UploadInputs = { size, unit, speedMbps: speed, efficiencyPercent: efficiency };
  const estimate = computeUploadEstimate(inputs);
  if (!estimate) {
    return {
      errors: { ...errors, size: "That file is too large to estimate at this speed." },
      inputs: null,
      estimate: null,
    };
  }
  return { errors, inputs, estimate };
}

export function uploadSpeedComparisons(inputs: UploadInputs): SpeedComparison[] {
  const speeds = new Set<number>(COMPARISON_SPEEDS_MBPS);
  if (Number.isFinite(inputs.speedMbps) && inputs.speedMbps > 0) speeds.add(inputs.speedMbps);
  return [...speeds]
    .sort((a, b) => a - b)
    .map((speedMbps) => {
      const estimate = computeUploadEstimate({ ...inputs, speedMbps });
      return {
        speedMbps,
        label: speedLabel(speedMbps),
        seconds: estimate?.realisticSeconds ?? null,
        highlighted: speedMbps === inputs.speedMbps,
      };
    });
}

export function barWidthPercent(seconds: number, longest: number): number {
  if (!Number.isFinite(seconds) || !Number.isFinite(longest) || longest <= 0 || seconds <= 0) return 0;
  return Math.min(100, Math.max(2, (seconds / longest) * 100));
}

export function uploadEstimateText(inputs: UploadInputs, estimate: UploadEstimate, pageUrl: string): string {
  return [
    `Estimated upload time: ${formatUploadDuration(estimate.realisticSeconds)}`,
    uploadContextLine(inputs),
    `Ideal transfer: ${formatUploadDuration(estimate.idealSeconds)}. Effective upload speed: ${formatMbpsValue(estimate.effectiveMbps)} Mbps.`,
    `File size: ${formatInputNumber(inputs.size)} ${inputs.unit}.`,
    "Estimate, not a live upload.",
    pageUrl,
  ].join("\n");
}

export function serializeUploadQuery(inputs: UploadInputs): string {
  const params = new URLSearchParams();
  params.set("size", formatInputNumber(inputs.size));
  params.set("unit", inputs.unit);
  params.set("speed", formatInputNumber(inputs.speedMbps));
  params.set("efficiency", formatInputNumber(inputs.efficiencyPercent));
  return params.toString();
}

export function parseUploadSearchParams(params: { get(name: string): string | null }): {
  status: "empty" | "invalid" | "ok";
  inputs: UploadInputs | null;
} {
  const present = QUERY_KEYS.some((key) => params.get(key) != null);
  if (!present) return { status: "empty", inputs: null };

  const defaults = resetUploadInputs();
  let size = defaults.size;
  let unit = defaults.unit;
  let speedMbps = defaults.speedMbps;
  let efficiencyPercent = defaults.efficiencyPercent;

  const sizeRaw = params.get("size");
  if (sizeRaw != null) {
    const parsed = parsePositiveDecimal(sizeRaw);
    if (parsed == null || parsed > MAX_SIZE) return { status: "invalid", inputs: null };
    size = parsed;
  }

  const unitRaw = params.get("unit");
  if (unitRaw != null) {
    if (!isUploadSizeUnit(unitRaw)) return { status: "invalid", inputs: null };
    unit = unitRaw;
  }

  const speedRaw = params.get("speed");
  if (speedRaw != null) {
    const parsed = parsePositiveDecimal(speedRaw);
    if (parsed == null || parsed > MAX_MBPS) return { status: "invalid", inputs: null };
    speedMbps = parsed;
  }

  const efficiencyRaw = params.get("efficiency");
  if (efficiencyRaw != null) {
    const parsed = parsePositiveDecimal(efficiencyRaw);
    if (parsed == null || parsed < 50 || parsed > 100) return { status: "invalid", inputs: null };
    efficiencyPercent = parsed;
  }

  const inputs = { size, unit, speedMbps, efficiencyPercent };
  if (!computeUploadEstimate(inputs)) return { status: "invalid", inputs: null };
  return { status: "ok", inputs };
}

export function parseStoredUploadInputs(raw: string): UploadInputs | null {
  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    if (typeof record.size !== "number" || !Number.isFinite(record.size)) return null;
    if (typeof record.unit !== "string") return null;
    if (typeof record.speed !== "number" || !Number.isFinite(record.speed)) return null;
    if (typeof record.efficiency !== "number" || !Number.isFinite(record.efficiency)) return null;
    const params = new URLSearchParams();
    params.set("size", String(record.size));
    params.set("unit", record.unit);
    params.set("speed", String(record.speed));
    params.set("efficiency", String(record.efficiency));
    const parsed = parseUploadSearchParams(params);
    return parsed.status === "ok" ? parsed.inputs : null;
  } catch {
    return null;
  }
}

export function fieldsFromInputs(inputs: UploadInputs): UploadFields {
  return {
    size: formatInputNumber(inputs.size),
    unit: inputs.unit,
    speed: formatInputNumber(inputs.speedMbps),
    efficiency: formatInputNumber(inputs.efficiencyPercent),
  };
}

/**
 * Newest saved upload measurement. Download speed is not read.
 * Non-positive, non-finite, and absurd rates are ignored.
 */
export function latestMeasuredUploadMbps(
  entries: ReadonlyArray<{ uploadMbps?: number | null; createdAt?: string | null }>,
): number | null {
  const valid = entries.filter((entry) => {
    const speed = entry.uploadMbps;
    return typeof speed === "number" && Number.isFinite(speed) && speed > 0 && speed <= MAX_MBPS;
  });
  if (valid.length === 0) return null;
  const ranked = [...valid].sort((a, b) => createdAtValue(b.createdAt) - createdAtValue(a.createdAt));
  const speed = ranked[0]?.uploadMbps;
  return typeof speed === "number" ? Math.round(speed * 100) / 100 : null;
}

export function parsePositiveDecimal(raw: string): number | null {
  const text = raw.trim();
  if (!/^(?:\d+\.?\d*|\.\d+)$/.test(text)) return null;
  const value = Number(text);
  if (!Number.isFinite(value) || !(value > 0)) return null;
  return value;
}

function uploadWarnings(speedMbps: number, fileBytes: number, realisticSeconds: number): string[] {
  const warnings: string[] = [];
  if (speedMbps < SLOW_MBPS) warnings.push(SLOW_UPLOAD_WARNING);
  if (fileBytes >= LARGE_BYTES || realisticSeconds >= LONG_SECONDS) warnings.push(LARGE_FILE_WARNING);
  return warnings;
}

function createdAtValue(value: string | null | undefined): number {
  if (!value) return Number.NEGATIVE_INFINITY;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
}
