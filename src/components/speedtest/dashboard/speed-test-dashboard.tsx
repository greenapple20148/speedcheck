"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { cancelSession, runSpeedTest } from "@/lib/speedtest/engine";
import { getPreviousUploadMbps } from "@/lib/speedtest/history";
import {
  appendHistory,
  readHistory,
  readPlan,
  writeHistory,
  type PlanSettings,
} from "@/lib/speedtest/history-store";
import { buildConnectionAssessment } from "@/lib/speedtest/connection-assessment";
import { uploadDeltaCaption } from "@/lib/speedtest/ui-config";
import { trackEvent } from "@/lib/analytics/events";
import type {
  ClientNetworkInfo,
  ConnectionTag,
  ProgressState,
  ServerInfo,
  SessionConfig,
  SpeedSample,
  TestMode,
  TestPhase,
  TestResultPayload,
} from "@/types/speedtest";
import { cn, formatSpeedParts } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { ModeToggle } from "./mode-toggle";
import { StartTestButton } from "./start-test-button";
import { DiagnoseConnectionPanel } from "@/components/diagnostics/diagnose-connection-panel";
import { CloudflareSpeedLayout } from "./cloudflare-speed-layout";
import { AdvancedDiagnosticsPanel } from "./advanced-diagnostics-panel";

const SAMPLE_INTERVAL_MS = 120;
const DETAILS_PANEL_ID = "speed-test-detailed-results";

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
  const [previousUploadMbps, setPreviousUploadMbps] = useState<number | null>(null);
  const [measurementBaseUrl, setMeasurementBaseUrl] = useState<string | null>(null);
  const [measurementReady, setMeasurementReady] = useState(true);
  const [measurementNotice, setMeasurementNotice] = useState<string | null>(null);
  const [connectionTag, setConnectionTag] = useState<ConnectionTag>("wifi");
  const [lastHistoryId, setLastHistoryId] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanSettings | null>(null);
  const [historySnapshot, setHistorySnapshot] = useState(readHistory);
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
    setPlan(readPlan());
    setHistorySnapshot(readHistory());
  }, [loadNetwork]);

  const patchHistoryTag = useCallback((id: string, tag: ConnectionTag) => {
    const list = readHistory().map((e) =>
      e.id === id ? { ...e, connectionTag: tag } : e,
    );
    writeHistory(list);
    setHistorySnapshot(list);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/speedtest/config", { cache: "no-store" });
        const data = (await res.json()) as {
          baseUrl?: string | null;
          ready?: boolean;
          message?: string;
          probeOk?: boolean;
        };
        if (cancelled) return;
        setMeasurementBaseUrl(data.baseUrl ?? null);
        const ready = Boolean(data.ready && data.baseUrl);
        setMeasurementReady(ready);
        if (!ready) {
          setMeasurementNotice(
            data.message ??
              "Speed test is not configured for this deployment.",
          );
        } else if (data.probeOk === false) {
          setMeasurementNotice(
            data.message ??
              "Measurement service may be offline; you can still try a test.",
          );
        } else if (data.message) {
          setMeasurementNotice(data.message);
        }
      } catch {
        if (!cancelled) {
          setMeasurementReady(false);
          setMeasurementNotice(
            "Could not load speed test configuration. Try refreshing the page.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!measurementBaseUrl) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${measurementBaseUrl.replace(/\/$/, "")}/servers`, {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { servers?: ServerInfo[] };
        const first = data.servers?.[0];
        if (first && !cancelled) setServer(first);
      } catch {
        /* optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [measurementBaseUrl]);

  useEffect(() => {
    if (state.phase === "complete") {
      setPreviousUploadMbps(getPreviousUploadMbps());
    }
  }, [state.phase, state.metrics.uploadMbps]);

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
    if (!measurementReady || !measurementBaseUrl) {
      setState((s) => ({
        ...s,
        phase: "error",
        error:
          measurementNotice ??
          "Speed test is not available on this deployment yet.",
      }));
      return;
    }
    setShareUrl(null);
    setSamples([]);
    setTestedAt(null);
    setDetailsOpen(false);
    setPreviousUploadMbps(null);
    setConnectionTag("wifi");
    setLastHistoryId(null);
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
          baseUrl: measurementBaseUrl,
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
          bufferbloatIdleMs: metrics.bufferbloatIdleMs,
          bufferbloatLoadedDownMs: metrics.bufferbloatLoadedDownMs,
          bufferbloatLoadedUpMs: metrics.bufferbloatLoadedUpMs,
          bufferbloatGrade: metrics.bufferbloatGrade,
          connectionTag,
        });
        const historyId = saved?.id ?? crypto.randomUUID();
        if (saved?.id) setShareUrl(`/results/${saved.id}`);
        setLastHistoryId(historyId);
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
          appendHistory({
            id: historyId,
            downloadMbps: metrics.downloadMbps,
            uploadMbps: metrics.uploadMbps,
            pingMs: metrics.pingMs,
            jitterMs: metrics.jitterMs,
            mode,
            serverName: session.server.name,
            createdAt: new Date().toISOString(),
            bufferbloatIdleMs: metrics.bufferbloatIdleMs,
            bufferbloatLoadedDownMs: metrics.bufferbloatLoadedDownMs,
            bufferbloatLoadedUpMs: metrics.bufferbloatLoadedUpMs,
            bufferbloatGrade: metrics.bufferbloatGrade,
            connectionTag,
          });
          setHistorySnapshot(readHistory());
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

  const complete = state.phase === "complete";

  const uploadCaption = useMemo(
    () => uploadDeltaCaption(state.metrics.uploadMbps, previousUploadMbps),
    [state.metrics.uploadMbps, previousUploadMbps],
  );

  const assessment = useMemo(() => {
    if (!complete) return null;
    return buildConnectionAssessment({
      ...state.metrics,
      mode,
    });
  }, [complete, state.metrics, mode]);

  const liveAnnouncement = useMemo(() => {
    if (running) return buttonStatus;
    if (complete && state.metrics.downloadMbps != null) {
      const parts = formatSpeedParts(state.metrics.downloadMbps);
      if (!parts) return "Test complete.";
      return `Test complete. Download speed ${parts.amount} ${parts.unit}.`;
    }
    return "";
  }, [running, complete, buttonStatus, state.metrics.downloadMbps]);

  return (
    <section
      aria-label="Internet speed test"
      className={cn("mx-auto w-full max-w-[1100px] px-3 sm:px-4", className)}
    >
      {!measurementReady && measurementNotice && state.phase === "idle" && (
        <div
          className="mb-2 rounded-xl border border-warning/40 bg-warning/10 px-3 py-2.5 text-[13px] leading-snug text-foreground"
          role="status"
        >
          {measurementNotice}
        </div>
      )}

      <div>
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {liveAnnouncement}
        </p>

        <CloudflareSpeedLayout
          state={state}
          samples={samples}
          server={server}
          network={network}
          assessment={assessment}
          running={running}
          complete={complete}
          statusLine={buttonStatus}
          onStart={start}
          onCancel={cancel}
        />

        {state.error && (
          <p className="mt-3 text-[14px] text-destructive" role="alert">
            {state.error}
          </p>
        )}

        {complete && uploadCaption && (
          <p className="mt-2 text-center text-[12px] text-muted-foreground">
            Upload {uploadCaption}
          </p>
        )}

        {complete && (
          <DiagnoseConnectionPanel
            className="mt-4"
            metrics={state.metrics}
            mode={mode}
            server={server}
            plan={plan}
            history={historySnapshot}
          />
        )}

        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[var(--card-border)] bg-card px-3 py-4 lg:flex-row lg:items-center lg:justify-between sm:px-4">
          {showModeToggle && (
            <ModeToggle
              mode={mode}
              disabled={running}
              onChange={setMode}
              compact
            />
          )}
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end lg:ml-auto lg:w-auto">
            {complete && (
              <button
                type="button"
                id={`${DETAILS_PANEL_ID}-trigger`}
                aria-expanded={detailsOpen}
                aria-controls={DETAILS_PANEL_ID}
                onClick={() => setDetailsOpen(!detailsOpen)}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-3 text-[14px] font-semibold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                View detailed diagnostics
                <ChevronDown
                  className={cn(
                    "h-4 w-4 motion-safe:transition-transform",
                    detailsOpen && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>
            )}
            <StartTestButton
              phase={state.phase}
              running={running}
              statusLine={buttonStatus}
              onStart={start}
              onCancel={cancel}
            />
          </div>
        </div>

        {complete && assessment && (
          <AdvancedDiagnosticsPanel
            showToggle={false}
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
            panelId={DETAILS_PANEL_ID}
            assessment={assessment}
            metrics={state.metrics}
            mode={mode}
            network={network}
            server={server}
            browserLinkEstimate={browserLinkEstimate}
            testedAt={testedAt}
            samples={samples}
            plan={plan}
            history={historySnapshot}
            shareUrl={shareUrl}
            connectionTag={connectionTag}
            onConnectionTagChange={(tag) => {
              setConnectionTag(tag);
              if (lastHistoryId) patchHistoryTag(lastHistoryId, tag);
            }}
          />
        )}
      </div>
    </section>
  );
}
