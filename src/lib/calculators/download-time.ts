import { formatDuration, transferTimeSeconds, type ByteUnit } from "@/lib/calculators/units";

export const DOWNLOAD_SIZE_UNITS = ["KB", "MB", "GB", "TB", "KiB", "MiB", "GiB", "TiB"] as const;

export type DownloadSizeUnit = (typeof DOWNLOAD_SIZE_UNITS)[number];

export const DOWNLOAD_SPEED_UNITS = ["Kbps", "Mbps", "Gbps"] as const;

export type DownloadSpeedUnit = (typeof DOWNLOAD_SPEED_UNITS)[number];

const MAX_SIZE = 1e15;
const MAX_MBPS = 1e9;
const DAY_SECONDS = 86_400;
const LONG_SECONDS = 48 * 60 * 60;
const CENTURY_SECONDS = 100 * 365.25 * DAY_SECONDS;

export interface DownloadInputs {
  size: number;
  unit: DownloadSizeUnit;
  speed: number;
  speedUnit: DownloadSpeedUnit;
  efficiencyPercent: number;
}

export interface DownloadFields {
  size: string;
  unit: string;
  speed: string;
  speedUnit: string;
  efficiency: string;
}

export interface DownloadFieldErrors {
  size: string | null;
  unit: string | null;
  speed: string | null;
  speedUnit: string | null;
  efficiency: string | null;
}

export interface DownloadEstimate {
  theoreticalSeconds: number;
  estimatedSeconds: number;
  effectiveMbps: number;
  speedMbps: number;
}

export interface DownloadEvaluation {
  errors: DownloadFieldErrors;
  inputs: DownloadInputs | null;
  estimate: DownloadEstimate | null;
}

export interface DownloadPreset {
  id: string;
  label: string;
  detail: string;
  size: number;
  unit: DownloadSizeUnit;
  speed: number;
  speedUnit: DownloadSpeedUnit;
}

export const DOWNLOAD_PRESETS: DownloadPreset[] = [
  { id: "100mb", label: "100 MB at 100 Mbps", detail: "A short video or a stack of photos", size: 100, unit: "MB", speed: 100, speedUnit: "Mbps" },
  { id: "1gb", label: "1 GB at 100 Mbps", detail: "A large app or a short movie", size: 1, unit: "GB", speed: 100, speedUnit: "Mbps" },
  { id: "10gb", label: "10 GB at 300 Mbps", detail: "A game update on a fast plan", size: 10, unit: "GB", speed: 300, speedUnit: "Mbps" },
  { id: "50gb", label: "50 GB at 500 Mbps", detail: "A large game or backup", size: 50, unit: "GB", speed: 500, speedUnit: "Mbps" },
];

export const DOWNLOAD_SCENARIOS: DownloadPreset[] = [
  { id: "podcast", label: "Podcast episode", detail: "100 MB at 10 Mbps", size: 100, unit: "MB", speed: 10, speedUnit: "Mbps" },
  { id: "photos", label: "Photo library", detail: "2 GB at 50 Mbps", size: 2, unit: "GB", speed: 50, speedUnit: "Mbps" },
  { id: "movie", label: "HD movie", detail: "4 GB at 100 Mbps", size: 4, unit: "GB", speed: 100, speedUnit: "Mbps" },
  { id: "4k", label: "4K movie", detail: "15 GB at 200 Mbps", size: 15, unit: "GB", speed: 200, speedUnit: "Mbps" },
  { id: "game", label: "Game install", detail: "80 GB at 300 Mbps", size: 80, unit: "GB", speed: 300, speedUnit: "Mbps" },
  { id: "backup", label: "Disk backup", detail: "1 TB at 1 Gbps", size: 1, unit: "TB", speed: 1, speedUnit: "Gbps" },
];

export function isDownloadSizeUnit(value: string): value is DownloadSizeUnit {
  return (DOWNLOAD_SIZE_UNITS as readonly string[]).includes(value);
}

export function isDownloadSpeedUnit(value: string): value is DownloadSpeedUnit {
  return (DOWNLOAD_SPEED_UNITS as readonly string[]).includes(value);
}

export function defaultDownloadInputs(): DownloadInputs {
  return { size: 1, unit: "GB", speed: 100, speedUnit: "Mbps", efficiencyPercent: 90 };
}

export function toMbps(speed: number, unit: DownloadSpeedUnit): number {
  if (unit === "Kbps") return speed / 1_000;
  if (unit === "Gbps") return speed * 1_000;
  return speed;
}

export function formatDownloadDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  if (seconds >= CENTURY_SECONDS) return "More than 100 years";
  if (seconds >= LONG_SECONDS) {
    const days = Math.floor(seconds / DAY_SECONDS);
    const hours = Math.floor((seconds % DAY_SECONDS) / 3600);
    return hours > 0 ? `${days.toLocaleString("en-US")} days ${hours} hr` : `${days.toLocaleString("en-US")} days`;
  }
  return formatDuration(seconds);
}

export function formatRateMbps(mbps: number): string {
  if (!Number.isFinite(mbps)) return "—";
  const rounded = Math.round(mbps * 100) / 100;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0$/, "");
  return `${text} Mbps`;
}

/** Estimated time uses the shared transfer formula. Efficiency is an allowance, not a measurement. */
export function computeDownloadEstimate(inputs: DownloadInputs): DownloadEstimate | null {
  if (!isDownloadSizeUnit(inputs.unit) || !isDownloadSpeedUnit(inputs.speedUnit)) return null;
  if (!Number.isFinite(inputs.size) || !(inputs.size > 0) || inputs.size > MAX_SIZE) return null;
  if (!Number.isFinite(inputs.speed) || !(inputs.speed > 0)) return null;
  if (!Number.isFinite(inputs.efficiencyPercent) || inputs.efficiencyPercent < 1 || inputs.efficiencyPercent > 100) return null;

  const speedMbps = toMbps(inputs.speed, inputs.speedUnit);
  const result = transferTimeSeconds(inputs.size, inputs.unit as ByteUnit, speedMbps, inputs.efficiencyPercent / 100);
  if (result.error || result.seconds == null || result.adjustedSeconds == null) return null;
  if (!Number.isFinite(result.adjustedSeconds)) return null;

  return {
    theoreticalSeconds: result.seconds,
    estimatedSeconds: result.adjustedSeconds,
    effectiveMbps: speedMbps * (inputs.efficiencyPercent / 100),
    speedMbps,
  };
}

export function presetEstimate(preset: DownloadPreset, efficiencyPercent: number): DownloadEstimate | null {
  return computeDownloadEstimate({
    size: preset.size,
    unit: preset.unit,
    speed: preset.speed,
    speedUnit: preset.speedUnit,
    efficiencyPercent,
  });
}

export function evaluateDownloadFields(fields: DownloadFields): DownloadEvaluation {
  const errors: DownloadFieldErrors = { size: null, unit: null, speed: null, speedUnit: null, efficiency: null };

  let unit: DownloadSizeUnit | null = null;
  if (!isDownloadSizeUnit(fields.unit)) errors.unit = "Choose a file size unit.";
  else unit = fields.unit;

  const size = parseDecimal(fields.size);
  if (fields.size.trim() === "") errors.size = "Enter a file size.";
  else if (size == null) errors.size = "Enter a file size greater than 0.";
  else if (size > MAX_SIZE) errors.size = "That file is too large to estimate.";

  let speedUnit: DownloadSpeedUnit | null = null;
  if (!isDownloadSpeedUnit(fields.speedUnit)) errors.speedUnit = "Choose a speed unit.";
  else speedUnit = fields.speedUnit;

  const speed = parseDecimal(fields.speed);
  if (fields.speed.trim() === "") errors.speed = "Enter a download speed.";
  else if (speed == null) errors.speed = "Enter a download speed greater than 0.";
  else if (speedUnit && toMbps(speed, speedUnit) > MAX_MBPS) errors.speed = "Enter a download speed of 1,000,000,000 Mbps or less.";

  const efficiency = parseDecimal(fields.efficiency);
  if (fields.efficiency.trim() === "") errors.efficiency = "Set a network efficiency.";
  else if (efficiency == null || efficiency < 1 || efficiency > 100) {
    errors.efficiency = "Network efficiency must be between 1% and 100%.";
  }

  if (errors.size || errors.unit || errors.speed || errors.speedUnit || errors.efficiency || size == null || unit == null || speed == null || speedUnit == null || efficiency == null) {
    return { errors, inputs: null, estimate: null };
  }

  const inputs: DownloadInputs = { size, unit, speed, speedUnit, efficiencyPercent: efficiency };
  const estimate = computeDownloadEstimate(inputs);
  if (!estimate) {
    return {
      errors: { ...errors, size: "That combination is too large to estimate." },
      inputs: null,
      estimate: null,
    };
  }
  return { errors, inputs, estimate };
}

export function fieldsFromInputs(inputs: DownloadInputs): DownloadFields {
  return {
    size: formatFieldNumber(inputs.size),
    unit: inputs.unit,
    speed: formatFieldNumber(inputs.speed),
    speedUnit: inputs.speedUnit,
    efficiency: formatFieldNumber(inputs.efficiencyPercent),
  };
}

function parseDecimal(raw: string): number | null {
  const text = raw.trim();
  if (!/^(?:\d+\.?\d*|\.\d+)$/.test(text)) return null;
  const value = Number(text);
  if (!Number.isFinite(value) || !(value > 0)) return null;
  return value;
}

function formatFieldNumber(value: number): string {
  if (!Number.isFinite(value)) return "";
  return String(Math.round(value * 1_000_000) / 1_000_000);
}
