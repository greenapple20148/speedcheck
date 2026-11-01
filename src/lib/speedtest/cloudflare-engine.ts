import {
  fetchCloudflareEdgeTrace,
  formatCloudflareColoLocation,
} from "@/lib/cloudflare/cdn-cgi-trace";
import { computeBufferbloat } from "@/lib/speedtest/bufferbloat";
import {
  bpsToMbps,
  cloudflareEngineOptions,
} from "@/lib/speedtest/cloudflare-measurements";
import type {
  SessionConfig,
  SpeedMetrics,
  SpeedTestOptions,
  TestPhase,
} from "@/types/speedtest";

type CfSpeedTestEngine = import("@cloudflare/speedtest").default;

let activeEngine: CfSpeedTestEngine | null = null;

function emptyMetrics(): SpeedMetrics {
  return {
    downloadMbps: null,
    uploadMbps: null,
    pingMs: null,
    jitterMs: null,
    downloadedBytes: 0,
    uploadedBytes: 0,
    durationMs: 0,
    packetLossPercent: null,
  };
}

function sumTransferBytes(
  points: Array<{ transferSize?: number; bytes?: number }> | undefined,
): number {
  if (!points?.length) return 0;
  return points.reduce(
    (acc, p) => acc + (p.transferSize ?? p.bytes ?? 0),
    0,
  );
}

function phaseProgress(phase: TestPhase, engine: CfSpeedTestEngine): number {
  if (phase === "complete") return 1;
  if (phase === "preparing") return 0.05;
  if (phase === "ping") return 0.12;
  if (phase === "download") return 0.25 + Math.min(0.4, engine.isRunning ? 0.2 : 0);
  if (phase === "upload") return 0.7;
  if (phase === "saving") return 0.95;
  return 0;
}

function mapResultsToMetrics(
  engine: CfSpeedTestEngine,
  mode: NonNullable<SpeedTestOptions["mode"]>,
): SpeedMetrics {
  const results = engine.results;
  const summary = results.getSummary() as {
    download?: number;
    upload?: number;
    latency?: number;
    jitter?: number;
    packetLoss?: number;
    downLoadedLatency?: number;
    upLoadedLatency?: number;
  };

  const metrics = emptyMetrics();
  metrics.downloadMbps = bpsToMbps(summary.download);
  metrics.uploadMbps = bpsToMbps(summary.upload);
  metrics.pingMs =
    summary.latency != null && Number.isFinite(summary.latency)
      ? summary.latency
      : null;
  metrics.jitterMs =
    summary.jitter != null && Number.isFinite(summary.jitter)
      ? summary.jitter
      : null;

  const packetLossStarted = Boolean(
    (engine.results.raw as { packetLoss?: { started?: boolean } }).packetLoss
      ?.started,
  );
  if (
    packetLossStarted &&
    summary.packetLoss != null &&
    Number.isFinite(summary.packetLoss)
  ) {
    metrics.packetLossPercent = Math.round(summary.packetLoss * 1000) / 10;
  }

  const downPoints = results.getDownloadBandwidthPoints?.() ?? [];
  const upPoints = results.getUploadBandwidthPoints?.() ?? [];
  metrics.downloadedBytes = sumTransferBytes(downPoints);
  metrics.uploadedBytes = sumTransferBytes(upPoints);
  metrics.durationMs = results.getTotalDurationMs?.() ?? 0;

  if (mode === "standard" && metrics.pingMs != null) {
    const idle = metrics.pingMs;
    const loadedDown = summary.downLoadedLatency ?? null;
    const loadedUp = summary.upLoadedLatency ?? null;
    const bb = computeBufferbloat(
      idle,
      loadedDown != null ? [loadedDown] : [],
      loadedUp != null ? [loadedUp] : [],
    );
    if (bb) {
      metrics.bufferbloatIdleMs = bb.idleMs;
      metrics.bufferbloatLoadedDownMs = bb.loadedDownMs;
      metrics.bufferbloatLoadedUpMs = bb.loadedUpMs;
      metrics.bufferbloatGrade = bb.grade;
    }
  }

  return metrics;
}

function syntheticSession(
  coloLabel: string,
  mode: NonNullable<SpeedTestOptions["mode"]>,
): SessionConfig {
  const slug = coloLabel.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase() || "edge";
  return {
    sessionId: `cf-${Date.now()}`,
    token: "",
    mode,
    expiresAt: Date.now() + 60_000,
    maxBytes: 0,
    maxDurationMs: 0,
    downloadConnections: 1,
    uploadConnections: 1,
    chunkSize: 0,
    server: {
      id: `cloudflare-${slug}`,
      name: "Cloudflare",
      region: "cloudflare-edge",
      location: coloLabel,
      url: "https://speed.cloudflare.com",
      healthy: true,
    },
  };
}

function measurementTypeToPhase(type: string | undefined): TestPhase {
  switch (type) {
    case "latency":
      return "ping";
    case "download":
      return "download";
    case "upload":
      return "upload";
    default:
      return "preparing";
  }
}

export function cancelCloudflareSpeedTest(): void {
  try {
    activeEngine?.pause();
  } catch {
    /* ignore */
  }
  activeEngine = null;
}

export async function runCloudflareSpeedTest(
  options: SpeedTestOptions = {},
): Promise<{ metrics: SpeedMetrics; session: SessionConfig }> {
  const mode = options.mode ?? "standard";
  const signal = options.signal;
  const onProgress = options.onProgress;

  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  cancelCloudflareSpeedTest();

  const { default: SpeedTest } = await import("@cloudflare/speedtest");

  const tracePromise = fetchCloudflareEdgeTrace(signal);
  const coloLabelPromise = tracePromise.then((t) =>
    formatCloudflareColoLocation(t),
  );

  const engine = new SpeedTest(cloudflareEngineOptions(mode));
  activeEngine = engine;

  let phase: TestPhase = "preparing";
  const started = performance.now();

  const emit = (nextPhase: TestPhase, progress: number, currentMbps: number | null) => {
    phase = nextPhase;
    const metrics = mapResultsToMetrics(engine, mode);
    onProgress?.({
      phase,
      progress,
      phaseProgress: null,
      currentMbps,
      metrics: { ...metrics, durationMs: performance.now() - started },
    });
  };

  emit("preparing", 0.02, null);

  const abortListener = () => {
    cancelCloudflareSpeedTest();
  };
  signal?.addEventListener("abort", abortListener);

  try {
    await new Promise<void>((resolve, reject) => {
      engine.onError = (message: string) => {
        reject(new Error(message || "Cloudflare speed test failed"));
      };

      engine.onResultsChange = ({ type }: { type?: string }) => {
        if (signal?.aborted) {
          reject(new DOMException("Aborted", "AbortError"));
          return;
        }
        const nextPhase = measurementTypeToPhase(type);
        const summary = engine.results.getSummary() as {
          download?: number;
          upload?: number;
        };
        let live: number | null = null;
        if (nextPhase === "download") live = bpsToMbps(summary.download);
        if (nextPhase === "upload") live = bpsToMbps(summary.upload);
        emit(nextPhase, phaseProgress(nextPhase, engine), live);
      };

      engine.onFinish = () => resolve();

      engine.play();
    });

    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    const coloLabel = await coloLabelPromise;
    const metrics = mapResultsToMetrics(engine, mode);
    emit("complete", 1, null);
    onProgress?.({
      phase: "complete",
      progress: 1,
      phaseProgress: null,
      currentMbps: null,
      metrics,
    });

    return {
      metrics,
      session: syntheticSession(coloLabel, mode),
    };
  } finally {
    signal?.removeEventListener("abort", abortListener);
    activeEngine = null;
  }
}
