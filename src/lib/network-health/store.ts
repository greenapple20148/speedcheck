import { noteError, type ChangeKind } from "@/lib/network-health/compare";
import type { HealthSnapshot } from "@/lib/network-health/snapshot";

export const HEALTH_STORAGE_KEY = "myspeedgauge_network_health_v1";

export interface SavedComparison {
  id: string;
  savedAt: string;
  changeKind: ChangeKind;
  note: string;
  baseline: HealthSnapshot;
  followUp: HealthSnapshot | null;
}

interface HealthFile {
  schemaVersion: 1;
  comparisons: SavedComparison[];
}

export function readComparisons(): SavedComparison[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HEALTH_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HealthFile;
    if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.comparisons)) return [];
    return parsed.comparisons.filter(isComparison);
  } catch {
    return [];
  }
}

export function saveComparison(input: Omit<SavedComparison, "id" | "savedAt">): { ok: true; comparison: SavedComparison } | { ok: false; error: string } {
  const note = input.note.trim();
  const error = noteError(note);
  if (error) return { ok: false, error };
  const comparison: SavedComparison = {
    ...input,
    note,
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    baseline: sanitizeSnapshot(input.baseline),
    followUp: input.followUp ? sanitizeSnapshot(input.followUp) : null,
  };
  try {
    const next = [comparison, ...readComparisons()].slice(0, 30);
    window.localStorage.setItem(HEALTH_STORAGE_KEY, JSON.stringify({ schemaVersion: 1, comparisons: next } satisfies HealthFile));
    return { ok: true, comparison };
  } catch {
    return { ok: false, error: "This browser could not save the comparison." };
  }
}

export function exportComparison(comparison: SavedComparison): string {
  return JSON.stringify({
    schemaVersion: 1,
    changeKind: comparison.changeKind,
    note: comparison.note,
    savedAt: comparison.savedAt,
    baseline: sanitizeSnapshot(comparison.baseline),
    followUp: comparison.followUp ? sanitizeSnapshot(comparison.followUp) : null,
  }, null, 2);
}

function sanitizeSnapshot(snapshot: HealthSnapshot): HealthSnapshot {
  return { ...snapshot, roomLabel: snapshot.roomLabel?.slice(0, 80) ?? null };
}

function isComparison(value: unknown): value is SavedComparison {
  if (!value || typeof value !== "object") return false;
  const row = value as SavedComparison;
  return typeof row.id === "string" && typeof row.savedAt === "string" && row.baseline != null;
}
