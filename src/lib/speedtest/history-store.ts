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
