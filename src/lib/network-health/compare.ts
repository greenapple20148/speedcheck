import type { HealthSnapshot } from "@/lib/network-health/snapshot";

export type ChangeKind = "mesh-move" | "router-move" | "ethernet-vs-wifi" | "router-setting" | "different-room";

export const CHANGE_LABELS: Record<ChangeKind, string> = {
  "mesh-move": "Mesh node relocation",
  "router-move": "Router relocation",
  "ethernet-vs-wifi": "Ethernet vs Wi-Fi",
  "router-setting": "Router setting change",
  "different-room": "Different rooms",
};

export type CompareDirection = "improved" | "regressed" | "unchanged" | "incomplete";

export interface MetricComparison {
  id: string;
  label: string;
  before: number | null;
  after: number | null;
  unit: string;
  lowerIsBetter: boolean;
  percent: number | null;
  direction: CompareDirection;
}

const NOISE_PERCENT = 3;

export function percentChange(before: number | null, after: number | null): number | null {
  if (before == null || after == null || !Number.isFinite(before) || !Number.isFinite(after) || before === 0) return null;
  return ((after - before) / Math.abs(before)) * 100;
}

export function compareSnapshots(before: HealthSnapshot, after: HealthSnapshot): { metrics: MetricComparison[]; warnings: string[] } {
  const metrics: MetricComparison[] = [
    metric("download", "Download", before.downloadMbps, after.downloadMbps, "Mbps", false),
    metric("upload", "Upload", before.uploadMbps, after.uploadMbps, "Mbps", false),
    metric("idle", "Idle latency", before.idleLatencyMs, after.idleLatencyMs, "ms", true),
    metric("jitter", "Jitter", before.jitterMs, after.jitterMs, "ms", true),
    metric("loaded", "Loaded latency", before.loadedLatencyMs, after.loadedLatencyMs, "ms", true),
  ];
  return { metrics, warnings: comparisonWarnings(before, after) };
}

export function comparisonWarnings(before: HealthSnapshot, after: HealthSnapshot): string[] {
  const warnings: string[] = [];
  const left = before.endpointName?.trim() || null;
  const right = after.endpointName?.trim() || null;
  if (!left || !right) warnings.push("One or both tests did not record the measurement server.");
  else if (left.toLowerCase() !== right.toLowerCase()) warnings.push(`The tests used different servers: ${left} and ${right}.`);
  if (before.connection && after.connection && before.connection !== after.connection) {
    warnings.push("One test is tagged Wi-Fi and the other is tagged Ethernet.");
  }
  if (before.source !== after.source) warnings.push("These results came from different kinds of tests.");
  if (before.provider && after.provider && before.provider !== after.provider) {
    warnings.push("The tests used different measurement providers.");
  }
  return warnings;
}

export function noteError(note: string): string | null {
  const trimmed = note.trim();
  if (trimmed.length > 160) return "Keep the note under 160 characters.";
  if (/password|passwd|secret|credential/i.test(trimmed)) return "Leave passwords out of this note.";
  if (/\b(?:\d{1,3}\.){3}\d{1,3}\b/.test(trimmed)) return "Leave IP addresses out of this note.";
  if (trimmed.includes("@")) return "Leave account details out of this note.";
  return null;
}

function metric(
  id: string,
  label: string,
  before: number | null,
  after: number | null,
  unit: string,
  lowerIsBetter: boolean,
): MetricComparison {
  const percent = percentChange(before, after);
  return { id, label, before, after, unit, lowerIsBetter, percent, direction: directionFor(percent, lowerIsBetter) };
}

function directionFor(percent: number | null, lowerIsBetter: boolean): CompareDirection {
  if (percent == null || !Number.isFinite(percent)) return "incomplete";
  if (Math.abs(percent) < NOISE_PERCENT) return "unchanged";
  const improved = lowerIsBetter ? percent < 0 : percent > 0;
  return improved ? "improved" : "regressed";
}
