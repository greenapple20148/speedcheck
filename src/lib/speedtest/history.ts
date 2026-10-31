import { readHistory } from "@/lib/speedtest/history-store";

/** Previous test upload (Mbps) from browser history, if any. */
export function getPreviousUploadMbps(): number | null {
  const list = readHistory();
  if (list.length < 2) return null;
  const prev = list[1]?.uploadMbps;
  return typeof prev === "number" && !Number.isNaN(prev) ? prev : null;
}
