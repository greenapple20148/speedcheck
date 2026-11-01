/**
 * Browser HTTP request failure rate.
 * This is not ICMP or UDP packet loss.
 */
export function applicationRequestLossPercent(
  attempted: number,
  failed: number,
): number | null {
  if (!Number.isFinite(attempted) || attempted <= 0) return null;
  if (!Number.isFinite(failed) || failed < 0) return null;
  return (Math.min(failed, attempted) / attempted) * 100;
}

export const REQUEST_LOSS_LABEL = "Application-level request loss";
