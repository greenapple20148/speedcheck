/** Documented thresholds for connection assessment (estimates, not guarantees). */

/** Loaded latency above this (ms) is treated as severely degraded under load. */
export const SEVERE_LOADED_LATENCY_MS = 500;

/** Increase (loaded − idle) above this forces poor under-load messaging. */
export const SEVERE_LATENCY_INCREASE_MS = 200;

/** Jitter above this (ms) maps video calls to “Unstable” when not already poor. */
export const VIDEO_CALLS_UNSTABLE_JITTER_MS = 20;

export const OVERALL_DOWNLOAD_TIERS_MBPS = {
  gigabit: 1000,
  /** ~100 Mbps consumer plans often measure in the 75–99 range to a single server. */
  fast: 75,
  everyday: 25,
} as const;

/** Below this download (Mbps), activity chips may be capped regardless of ping. */
export const HIGH_DOWNLOAD_ACTIVITY_FLOOR_MBPS = 50;
