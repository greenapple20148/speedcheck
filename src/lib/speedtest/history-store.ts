import type {
  BufferbloatGrade,
  ConnectionTag,
  TestMode,
} from "@/types/speedtest";

export const HISTORY_KEY = "speedcheck_history";
export const PLAN_KEY = "speedcheck_plan";
const MAX_ENTRIES = 500;

export interface PlanSettings {
  downloadMbps: number;
  uploadMbps: number;
}

export interface StoredHistoryEntry {
  id: string;
  downloadMbps: number | null;
  uploadMbps: number | null;
  pingMs: number | null;
  jitterMs: number | null;
  mode: TestMode | string;
  serverName?: string;
  createdAt: string;
  bufferbloatIdleMs?: number | null;
  bufferbloatLoadedDownMs?: number | null;
  bufferbloatLoadedUpMs?: number | null;
  bufferbloatGrade?: BufferbloatGrade | null;
  connectionTag?: ConnectionTag | null;
  /** True when this browser also stored the row on the results API. */
  persisted?: boolean;
}

function normalizeEntry(raw: unknown): StoredHistoryEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : crypto.randomUUID();
  const createdAt =
    typeof o.createdAt === "string" ? o.createdAt : new Date().toISOString();
  return {
    id,
    downloadMbps: numOrNull(o.downloadMbps),
    uploadMbps: numOrNull(o.uploadMbps),
    pingMs: numOrNull(o.pingMs),
    jitterMs: numOrNull(o.jitterMs),
    mode: typeof o.mode === "string" ? o.mode : "standard",
    serverName: typeof o.serverName === "string" ? o.serverName : undefined,
    createdAt,
    bufferbloatIdleMs: numOrNull(o.bufferbloatIdleMs),
    bufferbloatLoadedDownMs: numOrNull(o.bufferbloatLoadedDownMs),
    bufferbloatLoadedUpMs: numOrNull(o.bufferbloatLoadedUpMs),
    bufferbloatGrade:
      typeof o.bufferbloatGrade === "string"
        ? (o.bufferbloatGrade as BufferbloatGrade)
        : null,
    connectionTag:
      o.connectionTag === "wifi" || o.connectionTag === "wired"
        ? o.connectionTag
        : null,
    persisted: o.persisted === true,
  };
}

function numOrNull(v: unknown): number | null {
  return typeof v === "number" && !Number.isNaN(v) ? v : null;
}

export function readHistory(): StoredHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeEntry)
      .filter((e): e is StoredHistoryEntry => e != null);
  } catch {
    return [];
  }
}

export function writeHistory(entries: StoredHistoryEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(entries.slice(0, MAX_ENTRIES)),
  );
}

export function appendHistory(entry: StoredHistoryEntry): void {
  const prev = readHistory();
  writeHistory([entry, ...prev.filter((e) => e.id !== entry.id)]);
}

export function deleteHistoryEntry(id: string): void {
  writeHistory(readHistory().filter((e) => e.id !== id));
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HISTORY_KEY);
}

export function readPlan(): PlanSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Record<string, unknown>;
    const downloadMbps = numOrNull(o.downloadMbps);
    const uploadMbps = numOrNull(o.uploadMbps);
    if (downloadMbps == null || uploadMbps == null || downloadMbps <= 0) {
      return null;
    }
    return { downloadMbps, uploadMbps: uploadMbps > 0 ? uploadMbps : downloadMbps };
  } catch {
    return null;
  }
}

export function writePlan(plan: PlanSettings | null): void {
  if (typeof window === "undefined") return;
  if (!plan) {
    localStorage.removeItem(PLAN_KEY);
    return;
  }
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
}

export const PREFS_KEY = "speedcheck_prefs";

export interface LocalPreferences {
  /** When true, completed tests are written to this browser and the results API. */
  saveHistory: boolean;
  units: "decimal" | "binary";
  stabilityDurationSec: 30 | 60 | 300;
}

const DEFAULT_PREFS: LocalPreferences = {
  saveHistory: false,
  units: "decimal",
  stabilityDurationSec: 30,
};

export function readPrefs(): LocalPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const o = JSON.parse(raw) as Record<string, unknown>;
    const duration = o.stabilityDurationSec;
    return {
      saveHistory: o.saveHistory === true,
      units: o.units === "binary" ? "binary" : "decimal",
      stabilityDurationSec:
        duration === 60 || duration === 300 || duration === 30 ? duration : 30,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function writePrefs(prefs: LocalPreferences): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}
