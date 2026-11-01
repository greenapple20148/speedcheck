import type { SpeedMetrics, TestPhase } from "@/types/speedtest";

export type StageId = "latency" | "download" | "upload" | "complete";
export type StageStatus = "pending" | "active" | "completed" | "failed" | "skipped";

export interface StageView {
  id: StageId;
  status: StageStatus;
}

export interface RunView {
  runId: string;
  phase: TestPhase;
  /** Null unless the engine reported a real 0–1 phase fraction. */
  phaseProgress: number | null;
  currentMbps: number | null;
  metrics: SpeedMetrics;
  stages: Record<StageId, StageStatus>;
  startedAtMs: number | null;
  error?: string;
}

export interface RunProgressEvent {
  runId: string;
  phase: TestPhase;
  phaseProgress: number | null;
  currentMbps: number | null;
  metrics: SpeedMetrics;
  error?: string;
}

const RANK: Record<TestPhase, number> = {
  idle: 0,
  preparing: 1,
  ping: 2,
  download: 3,
  upload: 4,
  saving: 5,
  complete: 6,
  error: 7,
  cancelled: 7,
};

export function emptyRunMetrics(): SpeedMetrics {
  return {
    downloadMbps: null,
    uploadMbps: null,
    pingMs: null,
    jitterMs: null,
    downloadedBytes: 0,
    uploadedBytes: 0,
    durationMs: 0,
    packetLossPercent: null,
    bufferbloatIdleMs: null,
    bufferbloatLoadedDownMs: null,
    bufferbloatLoadedUpMs: null,
    bufferbloatGrade: null,
  };
}

export function createIdleRun(): RunView {
  return {
    runId: "idle",
    phase: "idle",
    phaseProgress: null,
    currentMbps: null,
    metrics: emptyRunMetrics(),
    stages: {
      latency: "pending",
      download: "pending",
      upload: "pending",
      complete: "pending",
    },
    startedAtMs: null,
  };
}

export function beginRun(runId: string, startedAtMs = Date.now()): RunView {
  return {
    ...createIdleRun(),
    runId,
    phase: "preparing",
    startedAtMs,
  };
}

function positiveMbps(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  return value;
}

/** Latency of 0 ms is not a completed HTTP round trip. */
function measuredLatency(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  return value;
}

/** Jitter of 0 ms is a real result when two identical samples were compared. */
function measuredJitter(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value) || value < 0) return null;
  return value;
}

function knownProgress(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  if (value < 0 || value > 1) return null;
  return value;
}

function advancePhase(current: TestPhase, incoming: TestPhase): TestPhase {
  if (current === "cancelled" || current === "error" || current === "complete") {
    return current;
  }
  if (incoming === "error" || incoming === "cancelled" || incoming === "complete") {
    return incoming;
  }
  if (RANK[incoming] >= RANK[current]) return incoming;
  return current;
}

function keepNumber(
  open: boolean,
  incoming: number | null,
  previous: number | null,
): number | null {
  if (!open) return null;
  return incoming ?? previous;
}

function stageStatus(
  phase: TestPhase,
  stageAt: number,
  hasValue: boolean,
): StageStatus {
  if (phase === "idle" || phase === "preparing") return "pending";
  if (phase === "complete") {
    if (stageAt === RANK.complete) return "completed";
    return hasValue ? "completed" : "skipped";
  }
  const current = RANK[phase];
  if (current === stageAt) return "active";
  if (current > stageAt) return hasValue ? "completed" : "skipped";
  return "pending";
}

function settleStopped(
  stages: Record<StageId, StageStatus>,
  activeBecomes: "failed" | "skipped",
): Record<StageId, StageStatus> {
  const next = { ...stages };
  (Object.keys(next) as StageId[]).forEach((id) => {
    if (next[id] === "active") next[id] = activeBecomes;
    else if (next[id] === "pending") next[id] = "skipped";
  });
  return next;
}

function stagesFor(phase: TestPhase, metrics: SpeedMetrics): Record<StageId, StageStatus> {
  return {
    latency: stageStatus(phase, RANK.ping, metrics.pingMs != null),
    download: stageStatus(phase, RANK.download, metrics.downloadMbps != null),
    upload: stageStatus(phase, RANK.upload, metrics.uploadMbps != null),
    complete: stageStatus(phase, RANK.complete, phase === "complete"),
  };
}

function mergeMetrics(phase: TestPhase, previous: SpeedMetrics, incoming: SpeedMetrics): SpeedMetrics {
  const rank = RANK[phase];
  const latencyOpen = phase === "complete" || phase === "cancelled" || phase === "error" || rank >= RANK.ping;
  const downloadOpen = phase === "complete" || phase === "cancelled" || phase === "error" || rank >= RANK.download;
  const uploadOpen = phase === "complete" || phase === "cancelled" || phase === "error" || rank >= RANK.upload;

  const pingMs = keepNumber(latencyOpen, measuredLatency(incoming.pingMs), measuredLatency(previous.pingMs));
  const jitterMs = keepNumber(
    latencyOpen,
    measuredJitter(incoming.jitterMs),
    measuredJitter(previous.jitterMs),
  );
  const downloadMbps = keepNumber(
    downloadOpen,
    positiveMbps(incoming.downloadMbps),
    positiveMbps(previous.downloadMbps),
  );
  const uploadMbps = keepNumber(
    uploadOpen,
    positiveMbps(incoming.uploadMbps),
    positiveMbps(previous.uploadMbps),
  );

  const packetLoss =
    incoming.packetLossPercent != null && Number.isFinite(incoming.packetLossPercent)
      ? incoming.packetLossPercent
      : (previous.packetLossPercent ?? null);

  return {
    downloadMbps,
    uploadMbps,
    pingMs,
    jitterMs,
    downloadedBytes: downloadOpen
      ? Math.max(previous.downloadedBytes || 0, incoming.downloadedBytes || 0)
      : 0,
    uploadedBytes: uploadOpen
      ? Math.max(previous.uploadedBytes || 0, incoming.uploadedBytes || 0)
      : 0,
    durationMs:
      incoming.durationMs > 0 ? incoming.durationMs : previous.durationMs,
    packetLossPercent: packetLoss,
    bufferbloatIdleMs: keepNumber(
      latencyOpen,
      measuredLatency(incoming.bufferbloatIdleMs),
      measuredLatency(previous.bufferbloatIdleMs),
    ),
    bufferbloatLoadedDownMs: keepNumber(
      downloadOpen,
      measuredLatency(incoming.bufferbloatLoadedDownMs),
      measuredLatency(previous.bufferbloatLoadedDownMs),
    ),
    bufferbloatLoadedUpMs: keepNumber(
      uploadOpen,
      measuredLatency(incoming.bufferbloatLoadedUpMs),
      measuredLatency(previous.bufferbloatLoadedUpMs),
    ),
    bufferbloatGrade:
      (uploadOpen || downloadOpen) && (incoming.bufferbloatGrade || previous.bufferbloatGrade)
        ? (incoming.bufferbloatGrade ?? previous.bufferbloatGrade ?? null)
        : null,
  };
}

function liveMbps(phase: TestPhase, metrics: SpeedMetrics): number | null {
  if (phase === "upload") return metrics.uploadMbps;
  if (phase === "download" || phase === "complete") return metrics.downloadMbps;
  return null;
}

function finalize(view: Omit<RunView, "stages" | "currentMbps"> & { currentMbps?: number | null }): RunView {
  const metrics = view.metrics;
  return {
    ...view,
    metrics,
    currentMbps: liveMbps(view.phase, metrics),
    stages: stagesFor(view.phase, metrics),
  };
}

export function applyRunEvent(current: RunView, event: RunProgressEvent): RunView {
  if (event.runId !== current.runId) return current;
  if (current.phase === "cancelled" || current.phase === "error" || current.phase === "complete") {
    return current;
  }
  if (event.phase === "cancelled") return markCancelled(current);
  if (event.phase === "error") return markFailed(current, event.error ?? "Speed test failed");

  const phase = advancePhase(current.phase, event.phase);
  const metrics = mergeMetrics(phase, current.metrics, event.metrics);
  const phaseProgress = phase === event.phase ? knownProgress(event.phaseProgress) : null;

  return finalize({
    runId: current.runId,
    phase,
    phaseProgress,
    metrics,
    startedAtMs: current.startedAtMs,
    error: event.error ?? current.error,
  });
}

export function markCancelled(view: RunView): RunView {
  if (
    view.phase === "idle" ||
    view.phase === "complete" ||
    view.phase === "cancelled" ||
    view.phase === "error"
  ) {
    return view;
  }
  return {
    ...view,
    phase: "cancelled",
    phaseProgress: null,
    currentMbps: null,
    stages: settleStopped(view.stages, "skipped"),
  };
}

export function markFailed(view: RunView, error: string): RunView {
  if (
    view.runId === "idle" ||
    view.phase === "complete" ||
    view.phase === "cancelled" ||
    view.phase === "error"
  ) {
    return view;
  }
  return {
    ...view,
    phase: "error",
    phaseProgress: null,
    currentMbps: null,
    error,
    stages: settleStopped(view.stages, "failed"),
  };
}

/** Locked scale for one run. Expands only when a sample no longer fits. */
export function lockGaugeScale(lockedMax: number | null, mbps: number | null): number {
  const steps = [1000, 2000, 5000, 10000];
  const base = lockedMax ?? steps[0];
  if (mbps == null || mbps <= base * 0.92) return base;
  for (const step of steps) {
    if (mbps <= step * 0.92) return Math.max(base, step);
  }
  return Math.max(base, steps[steps.length - 1]);
}

/** Log arc so a few megabits and a gigabit share one scale. */
export function logGaugeProgress(mbps: number | null, scaleMax: number): number {
  if (mbps == null || mbps <= 0 || scaleMax <= 0) return 0;
  const log = (n: number) => Math.log10(1 + n);
  return Math.min(1, Math.max(0, log(mbps) / log(scaleMax)));
}

export interface ShareSummaryInput {
  downloadMbps: number | null;
  uploadMbps: number | null;
  pingMs: number | null;
  jitterMs: number | null;
  mode: string;
  testedAt: Date | null;
  serverName: string | null;
}

function metricLine(label: string, value: number | null, unit: string, digits = 1): string {
  if (value == null) return `${label}: not measured`;
  return `${label}: ${value.toFixed(digits)} ${unit}`;
}

/** Plain-text result. Never includes an IP address. */
export function buildShareSummary(input: ShareSummaryInput): string {
  const when = input.testedAt
    ? input.testedAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : "Unknown time";
  return [
    "MySpeedGauge speed test",
    metricLine("Download", input.downloadMbps, "Mbps"),
    metricLine("Upload", input.uploadMbps, "Mbps"),
    metricLine("Latency", input.pingMs, "ms"),
    metricLine("Jitter", input.jitterMs, "ms"),
    `Mode: ${input.mode}`,
    `Server: ${input.serverName ?? "Not named"}`,
    `Date: ${when}`,
  ].join("\n");
}

export function historyDeltaPercent(current: number | null, previous: number | null): number | null {
  if (current == null || previous == null || previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}
