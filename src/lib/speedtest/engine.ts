import type {
  SessionConfig,
  SpeedMetrics,
  SpeedTestOptions,
  TestMode,
  TestPhase,
} from "@/types/speedtest";
import { withTimeout } from "@/lib/speedtest/fetch-timeout";

const DEFAULT_BASE =
  process.env.NEXT_PUBLIC_SPEEDTEST_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:18443";

const REQUEST_TIMEOUT_MS = 20_000;

function nowMs(): number {
  if (typeof performance !== "undefined" && performance.now) {
    return performance.now();
  }
  return Date.now();
}

function emptyMetrics(): SpeedMetrics {
  return {
    downloadMbps: null,
    uploadMbps: null,
    pingMs: null,
    jitterMs: null,
    downloadedBytes: 0,
    uploadedBytes: 0,
    durationMs: 0,
  };
}

async function createSession(
  baseUrl: string,
  mode: TestMode,
  signal?: AbortSignal,
): Promise<SessionConfig> {
  const { signal: timed, cleanup } = withTimeout(signal, REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${baseUrl}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
      signal: timed,
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Failed to create session (${res.status})`);
    }
    return res.json();
  } finally {
    cleanup();
  }
}

async function measurePing(
  baseUrl: string,
  samples = 8,
  signal?: AbortSignal,
): Promise<{ pingMs: number; jitterMs: number }> {
  const latencies: number[] = [];
  for (let i = 0; i < samples; i++) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const t0 = nowMs();
    const res = await fetch(`${baseUrl}/ping?_=${Date.now()}-${i}`, {
      method: "GET",
      cache: "no-store",
      signal,
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });
    if (!res.ok && res.status !== 204) {
      throw new Error("Ping failed");
    }
    latencies.push(nowMs() - t0);
    await new Promise((r) => setTimeout(r, 40));
  }
  // Drop first sample (warmup)
  const usable = latencies.slice(1);
  const pingMs = usable.reduce((a, b) => a + b, 0) / usable.length;
  let jitter = 0;
  for (let i = 1; i < usable.length; i++) {
    jitter += Math.abs(usable[i] - usable[i - 1]);
  }
  return { pingMs, jitterMs: jitter / Math.max(1, usable.length - 1) };
}

async function downloadOnce(
  baseUrl: string,
  token: string,
  size: number,
  signal?: AbortSignal,
): Promise<{ bytes: number; ms: number }> {
  const { signal: timed, cleanup } = withTimeout(signal, REQUEST_TIMEOUT_MS);
  const t0 = nowMs();
  try {
    const res = await fetch(
      `${baseUrl}/download?size=${size}&token=${encodeURIComponent(token)}&_=${Date.now()}`,
      {
        method: "GET",
        cache: "no-store",
        signal: timed,
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      },
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Download failed (${res.status})`);
    }
    const reader = res.body?.getReader();
    if (!reader) {
      const buf = await res.arrayBuffer();
      return { bytes: buf.byteLength, ms: Math.max(1, nowMs() - t0) };
    }
    let bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
    }
    return { bytes, ms: Math.max(1, nowMs() - t0) };
  } finally {
    cleanup();
  }
}

/** Chromium caps crypto.getRandomValues at 65536 bytes per call. */
function randomPayload(size: number): Uint8Array {
  const payload = new Uint8Array(size);
  const maxChunk = 65536;
  for (let offset = 0; offset < size; offset += maxChunk) {
    const end = Math.min(offset + maxChunk, size);
    crypto.getRandomValues(payload.subarray(offset, end));
  }
  return payload;
}

async function uploadOnce(
  baseUrl: string,
  token: string,
  size: number,
  signal?: AbortSignal,
): Promise<{ bytes: number; ms: number }> {
  const payload = randomPayload(size);
  const { signal: timed, cleanup } = withTimeout(signal, REQUEST_TIMEOUT_MS);
  const t0 = nowMs();
  try {
    const res = await fetch(
      `${baseUrl}/upload?token=${encodeURIComponent(token)}&_=${Date.now()}`,
      {
        method: "POST",
        body: payload.buffer.slice(
          payload.byteOffset,
          payload.byteOffset + payload.byteLength,
        ) as ArrayBuffer,
        signal: timed,
        cache: "no-store",
        headers: {
          "Content-Type": "application/octet-stream",
          "Cache-Control": "no-cache",
        },
      },
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Upload failed (${res.status})`);
    }
    const json = await res.json();
    const bytes = Number(json.receivedBytes ?? size);
    return { bytes, ms: Math.max(1, nowMs() - t0) };
  } finally {
    cleanup();
  }
}

function bytesToMbps(bytes: number, ms: number): number {
  return (bytes * 8) / (ms / 1000) / 1_000_000;
}

function isBudgetExhausted(err: unknown): boolean {
  return err instanceof Error && /budget|402|Payment Required/i.test(err.message);
}

async function measureThroughput(
  kind: "download" | "upload",
  session: SessionConfig,
  baseUrl: string,
  signal: AbortSignal | undefined,
  onSample: (mbps: number, bytes: number, progress: number) => void,
): Promise<{ mbps: number; bytes: number }> {
  const connections =
    kind === "download"
      ? session.downloadConnections
      : session.uploadConnections;
  const deadline = nowMs() + session.maxDurationMs;
  // Keep client phase budget under half of the signed session so concurrent
  // workers cannot overshoot server-side quotas on ultra-fast links.
  const phaseBudget = Math.floor(session.maxBytes * 0.4);
  let transferred = 0;
  let reserved = 0;
  const rates: number[] = [];

  const reserve = (wanted: number): number => {
    const remaining = phaseBudget - reserved;
    if (remaining <= 0) return 0;
    const size = Math.min(wanted, remaining);
    reserved += size;
    return size;
  };

  const worker = async () => {
    while (!signal?.aborted && nowMs() < deadline) {
      const size = reserve(Math.min(session.chunkSize, 256 * 1024));
      if (size <= 0) break;
      try {
        const result =
          kind === "download"
            ? await downloadOnce(baseUrl, session.token, size, signal)
            : await uploadOnce(baseUrl, session.token, size, signal);
        transferred += result.bytes;
        const mbps = bytesToMbps(result.bytes, result.ms);
        rates.push(mbps);
        onSample(mbps, transferred, Math.min(1, transferred / phaseBudget));
      } catch (err) {
        if (isBudgetExhausted(err)) break;
        throw err;
      }
    }
  };

  await Promise.all(Array.from({ length: connections }, () => worker()));

  // Use upper half of samples to reduce TCP slow-start bias
  const sorted = [...rates].sort((a, b) => a - b);
  const start = Math.floor(sorted.length * 0.5);
  const slice = sorted.slice(start);
  const mbps =
    slice.length === 0
      ? 0
      : slice.reduce((a, b) => a + b, 0) / slice.length;
  return { mbps, bytes: transferred };
}

export async function runSpeedTest(
  options: SpeedTestOptions = {},
): Promise<{ metrics: SpeedMetrics; session: SessionConfig }> {
  const mode = options.mode ?? "standard";
  const baseUrl = (options.baseUrl || DEFAULT_BASE).replace(/\/$/, "");
  const signal = options.signal;
  const metrics = emptyMetrics();
  const started = nowMs();

  const emit = (phase: TestPhase, progress: number, currentMbps: number | null = null, error?: string) => {
    options.onProgress?.({
      phase,
      progress,
      currentMbps,
      metrics: { ...metrics, durationMs: nowMs() - started },
      error,
    });
  };

  emit("preparing", 0.02);
  const session = await createSession(baseUrl, mode, signal);

  emit("ping", 0.08);
  const { pingMs, jitterMs } = await measurePing(baseUrl, 8, signal);
  metrics.pingMs = pingMs;
  metrics.jitterMs = jitterMs;
  emit("ping", 0.15);

  emit("download", 0.2);
  const download = await measureThroughput(
    "download",
    session,
    baseUrl,
    signal,
    (mbps, bytes, p) => {
      metrics.downloadedBytes = bytes;
      metrics.downloadMbps = mbps;
      emit("download", 0.2 + p * 0.4, mbps);
    },
  );
  metrics.downloadMbps = download.mbps;
  metrics.downloadedBytes = download.bytes;

  emit("upload", 0.65);
  const upload = await measureThroughput(
    "upload",
    session,
    baseUrl,
    signal,
    (mbps, bytes, p) => {
      metrics.uploadedBytes = bytes;
      metrics.uploadMbps = mbps;
      emit("upload", 0.65 + p * 0.3, mbps);
    },
  );
  metrics.uploadMbps = upload.mbps;
  metrics.uploadedBytes = upload.bytes;
  metrics.durationMs = nowMs() - started;

  emit("complete", 1, metrics.downloadMbps);
  return { metrics, session };
}

export async function cancelSession(
  token: string,
  baseUrl = DEFAULT_BASE,
): Promise<void> {
  try {
    await fetch(`${baseUrl.replace(/\/$/, "")}/sessions/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // best-effort
  }
}

export async function fetchServers(baseUrl = DEFAULT_BASE) {
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/servers`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to list servers");
  return res.json();
}
