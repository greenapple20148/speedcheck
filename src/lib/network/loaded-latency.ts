/** Increase from idle median RTT to loaded median RTT. Null when either side is missing. */
export function latencyIncreaseMs(
  idleMs: number | null,
  loadedMs: number | null,
): number | null {
  if (idleMs == null || loadedMs == null) return null;
  if (!Number.isFinite(idleMs) || !Number.isFinite(loadedMs)) return null;
  return Math.max(0, loadedMs - idleMs);
}
