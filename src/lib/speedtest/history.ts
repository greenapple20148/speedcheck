export interface HistoryEntry {
  uploadMbps?: number | null;
}

const KEY = "speedcheck_history";

/** Previous test upload (Mbps) from browser history, if any. */
export function getPreviousUploadMbps(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    const list = JSON.parse(raw || "[]") as HistoryEntry[];
    if (!Array.isArray(list) || list.length < 2) return null;
    const prev = list[1]?.uploadMbps;
    return typeof prev === "number" && !Number.isNaN(prev) ? prev : null;
  } catch {
    return null;
  }
}
