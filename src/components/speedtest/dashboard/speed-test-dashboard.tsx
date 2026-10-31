"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  Waves,
} from "lucide-react";
import { cancelSession, runSpeedTest } from "@/lib/speedtest/engine";
import { buildResultSummary } from "@/lib/speedtest/result-summary";
import { trackEvent } from "@/lib/analytics/events";
import type {
  ClientNetworkInfo,
  ProgressState,
  ServerInfo,
  SessionConfig,
  SpeedSample,
  TestMode,
  TestPhase,
  TestResultPayload,
} from "@/types/speedtest";
import { cn } from "@/lib/utils";
import { SpeedRing } from "./speed-ring";
import { MetricTile } from "./metric-tile";
import { TestModeSelector } from "./test-mode-selector";
import { StartTestButton } from "./start-test-button";
import { DetailedResultsPanel } from "./detailed-results-panel";
import { ShareResultActions } from "./share-result-actions";
import { ConnectionQualitySummary } from "./connection-quality-summary";

const SAMPLE_INTERVAL_MS = 120;

interface SpeedTestDashboardProps {
  defaultMode?: TestMode;
  showModeToggle?: boolean;
  className?: string;
}

const idleProgress: ProgressState = {
  phase: "idle",
  progress: 0,
  currentMbps: null,
  metrics: {
    downloadMbps: null,
    uploadMbps: null,
    pingMs: null,
    jitterMs: null,
    downloadedBytes: 0,
    uploadedBytes: 0,
    durationMs: 0,
  },
};

function readBrowserLinkEstimate(): string | null {
  if (typeof navigator === "undefined") return null;
  const conn = (
    navigator as Navigator & {
      connection?: { effectiveType?: string; type?: string };
    }
  ).connection;
  return conn?.effectiveType ?? conn?.type ?? null;
}

const statusCopy: Record<string, string> = {
  preparing: "Preparing session…",
  ping: "Measuring latency…",
  download: "Testing download…",
  upload: "Testing upload…",
  saving: "Saving results…",
  error: "Something went wrong",
  cancelled: "Test cancelled",
};

function gaugeMbps(phase: TestPhase, state: ProgressState): number | null {
  if (phase === "complete") return state.metrics.downloadMbps;
  if (phase === "upload") {
    return state.metrics.uploadMbps ?? state.currentMbps;
  }
  if (phase === "download") {
    return state.currentMbps ?? state.metrics.downloadMbps;
  }
  return null;
}

function showGaugeSpeed(phase: TestPhase): boolean {
  return phase === "download" || phase === "upload" || phase === "complete";
}

function TestControls({
  phase,
  running,
  buttonStatus,
  showModeToggle,
  mode,
  onStart,
  onCancel,
  onModeChange,
}: {
  phase: TestPhase;
  running: boolean;
  buttonStatus: string;
  showModeToggle: boolean;
  mode: TestMode;
  onStart: () => void;
  onCancel: () => void;
  onModeChange: (m: TestMode) => void;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-2.5">
      <StartTestButton
        phase={phase}
        running={running}
        statusLine={buttonStatus}
        onStart={onStart}
        onCancel={onCancel}
      />
      {showModeToggle && (
        <TestModeSelector mode={mode} disabled={running} onChange={onModeChange} />
      )}
    </div>
  );
}

export function SpeedTestDashboard({
  defaultMode = "standard",
  showModeToggle = true,
  className,
}: SpeedTestDashboardProps) {
  const [mode, setMode] = useState<TestMode>(defaultMode);
  const [state, setState] = useState<ProgressState>(idleProgress);
  const [network, setNetwork] = useState<ClientNetworkInfo | null>(null);
  const [server, setServer] = useState<ServerInfo | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [samples, setSamples] = useState<SpeedSample[]>([]);
  const [testedAt, setTestedAt] = useState<Date | null>(null);
  const [browserLinkEstimate, setBrowserLinkEstimate] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const abortRef = useRef<AbortController | null>(null);
  const sessionRef = useRef<SessionConfig | null>(null);
  const testStartedRef = useRef<number | null>(null);
  const phaseStartedRef = useRef<number | null>(null);
  const lastPhaseRef = useRef<TestPhase>("idle");
  const lastSampleRef = useRef<number>(0);
  const pendingProgressRef = useRef<ProgressState | null>(null);
  const rafRef = useRef<number | null>(null);

  const running =
    state.phase !== "idle" &&
    state.phase !== "complete" &&
    state.phase !== "error" &&
    state.phase !== "cancelled";

  const loadNetwork = useCallback(async () => {
    try {
      const res = await fetch("/api/network", { cache: "no-store" });
      if (res.ok) setNetwork(await res.json());
    } catch {
      /* optional */
    }
  }, []);

  useEffect(() => {
    void loadNetwork();
    setBrowserLinkEstimate(readBrowserLinkEstimate());
  }, [loadNetwork]);

  const appendSample = useCallback((progress: ProgressState) => {
    if (
      (progress.phase !== "download" && progress.phase !== "upload") ||
      progress.currentMbps == null
    ) {
      return;
    }
    const testStart = testStartedRef.current;
    const phaseStart = phaseStartedRef.current;
    if (testStart == null || phaseStart == null) return;

    const now = performance.now();
    if (now - lastSampleRef.current < SAMPLE_INTERVAL_MS) return;
    lastSampleRef.current = now;

    setSamples((prev) => [
      ...prev,
      {
        testElapsedSec: Math.round((now - testStart) / 100) / 10,
        phaseElapsedSec: Math.round((now - phaseStart) / 100) / 10,
        mbps: progress.currentMbps!,
        kind: progress.phase === "upload" ? "upload" : "download",
      },
    ]);
  }, []);

  const scheduleVisualUpdate = useCallback((progress: ProgressState) => {
    pendingProgressRef.current = progress;
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const next = pendingProgressRef.current;
      if (next) setState(next);
    });
  }, []);

  const handleProgress = useCallback(
    (progress: ProgressState) => {
      if (progress.phase !== lastPhaseRef.current) {
        lastPhaseRef.current = progress.phase;
        if (progress.phase === "download" || progress.phase === "upload") {
          phaseStartedRef.current = performance.now();
        }
      }
      appendSample(progress);
      scheduleVisualUpdate(progress);
    },
    [appendSample, scheduleVisualUpdate],
  );

  const saveResult = useCallback(async (payload: TestResultPayload) => {
    try {
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      return (await res.json()) as { id: string; shareId?: string };
    } catch {
      return null;
    }
  }, []);

  const start = () => {
    if (running || isPending) return;
    setShareUrl(null);
    setSamples([]);
    setTestedAt(null);
    setDetailsOpen(false);
    lastPhaseRef.current = "idle";
    testStartedRef.current = performance.now();
    phaseStartedRef.current = testStartedRef.current;
    lastSampleRef.current = 0;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    startTransition(async () => {
      trackEvent("speed_test_started", { mode });
      void loadNetwork();
      setState({ ...idleProgress, phase: "preparing", progress: 0.02 });
      try {
        const { metrics, session } = await runSpeedTest({
          mode,
          signal: controller.signal,
          onProgress: handleProgress,
        });
        sessionRef.current = session;
        setServer(session.server ?? null);
        setState({
          phase: "saving",
          progress: 0.95,
          currentMbps: metrics.downloadMbps,
          metrics,
        });
        const saved = await saveResult({
          downloadMbps: metrics.downloadMbps ?? 0,
          uploadMbps: metrics.uploadMbps ?? 0,
          pingMs: metrics.pingMs ?? 0,
          jitterMs: metrics.jitterMs ?? 0,
          mode,
          serverId: session.server.id,
          serverName: session.server.name,
          isp: network?.isp,
          city: network?.city,
          country: network?.country,
          isPublic: false,
        });
        if (saved?.id) setShareUrl(`/results/${saved.id}`);
        setTestedAt(new Date());
        setState({
          phase: "complete",
          progress: 1,
          currentMbps: metrics.downloadMbps,
          metrics,
        });
        trackEvent("speed_test_completed", {
          mode,
          downloadMbps: metrics.downloadMbps,
          uploadMbps: metrics.uploadMbps,
          pingMs: metrics.pingMs,
        });
        try {
          const key = "speedcheck_history";
          const prev = JSON.parse(localStorage.getItem(key) || "[]");
          localStorage.setItem(
            key,
            JSON.stringify(
              [
                {
                  id: saved?.id ?? crypto.randomUUID(),
                  ...metrics,
                  mode,
                  serverName: session.server.name,
                  createdAt: new Date().toISOString(),
                },
                ...(Array.isArray(prev) ? prev : []),
              ].slice(0, 25),
            ),
          );
        } catch {
          /* quota */
        }
      } catch (err) {
        if (controller.signal.aborted) {
          setState((s) => ({ ...s, phase: "cancelled" }));
          trackEvent("speed_test_cancelled", { mode });
          return;
        }
        const message = err instanceof Error ? err.message : "Speed test failed";
        setState((s) => ({ ...s, phase: "error", error: message }));
        trackEvent("speed_test_failed", { mode, error: message });
      }
    });
  };

  const cancel = async () => {
    abortRef.current?.abort();
    const token = sessionRef.current?.token;
    if (token) await cancelSession(token);
    setState((s) => ({ ...s, phase: "cancelled" }));
    trackEvent("speed_test_cancelled", { mode });
  };

  const buttonStatus =
    state.phase === "download"
      ? "Testing Download…"
      : state.phase === "upload"
        ? "Testing Upload…"
        : statusCopy[state.phase] ?? "Testing…";

  const summary =
    state.phase === "complete" ? buildResultSummary(state.metrics) : null;

  const showStatusLine =
    state.phase !== "idle" &&
    state.phase !== "complete" &&
    state.phase in statusCopy;

  const metricsGrid = (
    <div className="grid grid-cols-2 gap-2">
      <MetricTile
        label="Download"
        value={state.metrics.downloadMbps}
        unit="Mbps"
        icon={ArrowDownToLine}
        active={state.phase === "download"}
        primary
      />
      <MetricTile
        label="Upload"
        value={state.metrics.uploadMbps}
        unit="Mbps"
        icon={ArrowUpFromLine}
        active={state.phase === "upload"}
        primary
      />
      <MetricTile
        label="Ping"
        value={state.metrics.pingMs}
        unit="ms"
        icon={Activity}
        active={state.phase === "ping"}
      />
      <MetricTile
        label="Jitter"
        value={state.metrics.jitterMs}
        unit="ms"
        icon={Waves}
      />
    </div>
  );

  return (
    <section
      aria-label="Internet speed test"
      className={cn("mx-auto w-full max-w-[960px] px-4", className)}
    >
      <div className="overflow-x-hidden rounded-[20px] bg-white px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex min-w-0 flex-col gap-4 lg:grid lg:grid-cols-[0.45fr_0.55fr] lg:items-start lg:gap-5">
          {/* Left: gauge + controls (desktop) */}
          <div className="flex flex-col items-center gap-3">
            <SpeedRing
              compact
              valueMbps={gaugeMbps(state.phase, state)}
              phase={state.phase}
              showSpeed={showGaugeSpeed(state.phase)}
            />
            <p className="sr-only" aria-live="polite">
              {running ? buttonStatus : state.phase === "complete" ? "Test finished" : ""}
            </p>
            {showStatusLine && (
              <p className="text-center text-[14px] text-muted-foreground">
                {statusCopy[state.phase]}
              </p>
            )}
            <div className="hidden w-full lg:flex lg:justify-center">
              <TestControls
                phase={state.phase}
                running={running}
                buttonStatus={buttonStatus}
                showModeToggle={showModeToggle}
                mode={mode}
                onStart={start}
                onCancel={cancel}
                onModeChange={setMode}
              />
            </div>
          </div>

          {/* Right: metrics + summary + share */}
          <div className="flex min-w-0 flex-col gap-3">
            {metricsGrid}
            {summary && (
              <p className="text-[14px] font-medium leading-snug text-foreground">
                {summary}
              </p>
            )}
            <ConnectionQualitySummary
              metrics={state.metrics}
              visible={state.phase === "complete"}
            />
            {state.phase === "complete" && <ShareResultActions shareUrl={shareUrl} />}
            {state.error && (
              <p className="text-[14px] text-destructive" role="alert">
                {state.error}
              </p>
            )}
            <div className="lg:hidden">
              <TestControls
                phase={state.phase}
                running={running}
                buttonStatus={buttonStatus}
                showModeToggle={showModeToggle}
                mode={mode}
                onStart={start}
                onCancel={cancel}
                onModeChange={setMode}
              />
            </div>
          </div>
        </div>
      </div>

      <DetailedResultsPanel
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        network={network}
        server={server}
        browserLinkEstimate={browserLinkEstimate}
        testedAt={testedAt}
        samples={samples}
        metrics={state.metrics}
        mode={mode}
        showInsights={state.phase === "complete"}
        showChart={state.phase === "complete"}
      />
    </section>
  );
}
