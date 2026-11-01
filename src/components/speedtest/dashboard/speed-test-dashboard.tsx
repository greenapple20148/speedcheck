"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { cancelSession, runSpeedTest } from "@/lib/speedtest/engine";
import { getPreviousUploadMbps } from "@/lib/speedtest/history";
import {
  appendHistory,
  clearHistory,
  readHistory,
  readPlan,
  readPrefs,
  writeHistory,
  type PlanSettings,
} from "@/lib/speedtest/history-store";
import { buildConnectionAssessment } from "@/lib/speedtest/connection-assessment";
import { uploadDeltaCaption } from "@/lib/speedtest/ui-config";
import { downloadResultCard } from "@/lib/speedtest/result-card";
import {
  applyRunEvent,
  beginRun,
  buildShareSummary,
  createIdleRun,
  markCancelled,
  markFailed,
  type RunView,
} from "@/lib/speedtest/run-state";
import { trackEvent } from "@/lib/analytics/events";
import type {
  ClientNetworkInfo,
  ConnectionTag,
  ProgressState,
  ServerInfo,
  SessionConfig,
  SpeedMetrics,
  SpeedSample,
  TestMode,
  SpeedtestProvider,
  TestResultPayload,
} from "@/types/speedtest";
import { cn, formatSpeedParts } from "@/lib/utils";
import { ChevronDown, Copy, ImageDown } from "lucide-react";
import { DiagnoseConnectionPanel } from "@/components/diagnostics/diagnose-connection-panel";
import { AdvancedDiagnosticsPanel } from "./advanced-diagnostics-panel";
import { SpeedDashboardLayout } from "./dashboard-layout";
import { LocalHistory } from "./local-history";

const SAMPLE_INTERVAL_MS = 120;
const DETAILS_PANEL_ID = "speed-test-detailed-results";

interface SpeedTestDashboardProps {
  defaultMode?: TestMode;
  showModeToggle?: boolean;
  className?: string;
  /** Homepage shows device-local history. Embedded tests omit it. */
  showHistory?: boolean;
  /** Optional. Existing pages omit this. Mesh room tests use it to store a finished run. */
  onComplete?: (result: {
    metrics: SpeedMetrics;
    serverName: string | null;
    testedAt: string;
    provider: "cloudflare" | "dedicated";
  }) => void;
}

function isRunningPhase(phase: RunView["phase"]): boolean {
  return (
    phase !== "idle" &&
    phase !== "complete" &&
    phase !== "error" &&
    phase !== "cancelled"
  );
}

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
  preparing: "Preparing session",
  ping: "Measuring latency",
  download: "Testing download",
  upload: "Testing upload",
  saving: "Saving results",
  error: "Error",
  cancelled: "Test cancelled",
};

export function SpeedTestDashboard({
  defaultMode = "standard",
  showModeToggle = true,
  className,
  showHistory = false,
  onComplete,
}: SpeedTestDashboardProps) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const [mode, setMode] = useState<TestMode>(defaultMode);
  const [view, setView] = useState<RunView>(createIdleRun);
  const [network, setNetwork] = useState<ClientNetworkInfo | null>(null);
  const [server, setServer] = useState<ServerInfo | null>(null);
  const [samples, setSamples] = useState<SpeedSample[]>([]);
  const [testedAt, setTestedAt] = useState<Date | null>(null);
  const [browserLinkEstimate, setBrowserLinkEstimate] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [previousUploadMbps, setPreviousUploadMbps] = useState<number | null>(null);
  const [measurementBaseUrl, setMeasurementBaseUrl] = useState<string | null>(null);
  const [measurementProvider, setMeasurementProvider] =
    useState<SpeedtestProvider>("dedicated");
  const [measurementReady, setMeasurementReady] = useState(false);
  const [measurementNotice, setMeasurementNotice] = useState<string | null>(null);
  const [connectionTag, setConnectionTag] = useState<ConnectionTag>("wifi");
  const [lastHistoryId, setLastHistoryId] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanSettings | null>(null);
  const [historySnapshot, setHistorySnapshot] = useState(readHistory);
  const [savedOnDevice, setSavedOnDevice] = useState(false);
  const [summaryCopied, setSummaryCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const abortRef = useRef<AbortController | null>(null);
  const sessionRef = useRef<SessionConfig | null>(null);
  const testStartedRef = useRef<number | null>(null);
  const phaseStartedRef = useRef<number | null>(null);
  const lastPhaseRef = useRef<RunView["phase"]>("idle");
  const lastSampleRef = useRef<number>(0);
  const pendingProgressRef = useRef<{ runId: string; progress: ProgressState } | null>(null);
  const rafRef = useRef<number | null>(null);
  const runIdRef = useRef<string | null>(null);
  const activeRef = useRef(false);

  const running = isRunningPhase(view.phase);

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
          provider?: SpeedtestProvider;
          ready?: boolean;
          message?: string;
          probeOk?: boolean;
        };
        if (cancelled) return;
        const provider = data.provider ?? "dedicated";
        setMeasurementProvider(provider);
        setMeasurementBaseUrl(data.baseUrl ?? null);
        const ready =
          provider === "cloudflare"
            ? Boolean(data.ready)
            : Boolean(data.ready && data.baseUrl);
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
    if (measurementProvider !== "dedicated" || !measurementBaseUrl) return;
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
  }, [measurementBaseUrl, measurementProvider]);

  useEffect(() => {
    if (view.phase === "complete") {
      setPreviousUploadMbps(getPreviousUploadMbps());
    }
  }, [view.phase, view.metrics.uploadMbps]);

  const appendSample = useCallback((runId: string, progress: ProgressState) => {
    if (runIdRef.current !== runId) return;
    if (
      (progress.phase !== "download" && progress.phase !== "upload") ||
      progress.currentMbps == null ||
      progress.currentMbps <= 0
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

  const scheduleVisualUpdate = useCallback((runId: string, progress: ProgressState) => {
    pendingProgressRef.current = { runId, progress };
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const next = pendingProgressRef.current;
      pendingProgressRef.current = null;
      if (!next || runIdRef.current !== next.runId) return;
      setView((current) =>
        applyRunEvent(current, {
          runId: next.runId,
          phase: next.progress.phase,
          phaseProgress: next.progress.phaseProgress ?? null,
          currentMbps: next.progress.currentMbps,
          metrics: next.progress.metrics,
          error: next.progress.error,
        }),
      );
    });
  }, []);

  const acceptProgress = useCallback(
    (runId: string, progress: ProgressState) => {
      if (runIdRef.current !== runId) return;
      if (progress.phase !== lastPhaseRef.current) {
        lastPhaseRef.current = progress.phase;
        if (progress.phase === "download" || progress.phase === "upload") {
          phaseStartedRef.current = performance.now();
        }
      }
      appendSample(runId, progress);
      scheduleVisualUpdate(runId, progress);
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

  const persistResult = useCallback(
    async (metrics: ProgressState["metrics"], session: SessionConfig) => {
      const measured =
        metrics.downloadMbps != null &&
        metrics.uploadMbps != null &&
        metrics.pingMs != null &&
        metrics.jitterMs != null;
      const saved = measured
        ? await saveResult({
            downloadMbps: metrics.downloadMbps!,
            uploadMbps: metrics.uploadMbps!,
            pingMs: metrics.pingMs!,
            jitterMs: metrics.jitterMs!,
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
          })
        : null;
      const historyId = saved?.id ?? crypto.randomUUID();
      setLastHistoryId(historyId);
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
        persisted: Boolean(saved?.id),
        provider: measurementProvider,
        packetLossPercent: metrics.packetLossPercent ?? null,
      });
      setHistorySnapshot(readHistory());
      setSavedOnDevice(true);
      trackEvent("history_saved", { mode });
    },
    [connectionTag, measurementProvider, mode, network, saveResult],
  );

  const start = () => {
    if (activeRef.current || running || isPending) return;
    const needsDedicatedUrl = measurementProvider === "dedicated";
    if (!measurementReady || (needsDedicatedUrl && !measurementBaseUrl)) {
      const failed = beginRun(crypto.randomUUID());
      setView(
        markFailed(
          failed,
          measurementNotice ?? "Speed test is not available on this deployment yet.",
        ),
      );
      return;
    }
    const runId = crypto.randomUUID();
    activeRef.current = true;
    runIdRef.current = runId;
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    pendingProgressRef.current = null;
    setSamples([]);
    setTestedAt(null);
    setDetailsOpen(false);
    setPreviousUploadMbps(null);
    setConnectionTag("wifi");
    setLastHistoryId(null);
    setSavedOnDevice(false);
    lastPhaseRef.current = "preparing";
    testStartedRef.current = performance.now();
    phaseStartedRef.current = testStartedRef.current;
    lastSampleRef.current = 0;
    setView(beginRun(runId));
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    startTransition(async () => {
      trackEvent("speed_test_started", { mode });
      void loadNetwork();
      try {
        const { metrics, session } = await runSpeedTest({
          mode,
          provider: measurementProvider,
          baseUrl: measurementBaseUrl ?? undefined,
          signal: controller.signal,
          onProgress: (progress) => acceptProgress(runId, progress),
        });
        if (runIdRef.current !== runId || controller.signal.aborted) return;
        sessionRef.current = session;
        setServer(session.server ?? null);
        if (readPrefs().saveHistory) {
          setView((current) =>
            current.runId === runId
              ? applyRunEvent(current, {
                  runId,
                  phase: "saving",
                  phaseProgress: null,
                  currentMbps: null,
                  metrics,
                })
              : current,
          );
          await persistResult(metrics, session);
        }
        if (runIdRef.current !== runId) return;
        const finishedAt = new Date();
        setTestedAt(finishedAt);
        setView((current) =>
          current.runId === runId
            ? applyRunEvent(current, {
                runId,
                phase: "complete",
                phaseProgress: null,
                currentMbps: null,
                metrics,
              })
            : current,
        );
        trackEvent("speed_test_completed", { mode });
        onCompleteRef.current?.({
          metrics,
          serverName: session.server?.name ?? null,
          testedAt: finishedAt.toISOString(),
          provider: measurementProvider,
        });
        if (mode === "standard" && metrics.bufferbloatGrade) {
          trackEvent("bufferbloat_test_completed", { grade: metrics.bufferbloatGrade });
        }
      } catch (err) {
        if (runIdRef.current !== runId) return;
        if (controller.signal.aborted) {
          setView((current) => (current.runId === runId ? markCancelled(current) : current));
          trackEvent("speed_test_cancelled", { mode });
          return;
        }
        const message = err instanceof Error ? err.message : "Speed test failed";
        setView((current) => (current.runId === runId ? markFailed(current, message) : current));
        trackEvent("speed_test_failed", { mode, error: message });
      } finally {
        if (runIdRef.current === runId) activeRef.current = false;
      }
    });
  };

  const cancel = () => {
    const id = runIdRef.current;
    runIdRef.current = null;
    activeRef.current = false;
    abortRef.current?.abort();
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    pendingProgressRef.current = null;
    const token = sessionRef.current?.token;
    void cancelSession(token ?? "", measurementBaseUrl ?? undefined, measurementProvider);
    if (id) {
      setView((current) => (current.runId === id ? markCancelled(current) : current));
      trackEvent("speed_test_cancelled", { mode });
    }
  };

  const buttonStatus = statusCopy[view.phase] ?? "Testing";

  const complete = view.phase === "complete";

  const uploadCaption = useMemo(
    () => uploadDeltaCaption(view.metrics.uploadMbps, previousUploadMbps),
    [view.metrics.uploadMbps, previousUploadMbps],
  );

  const assessment = useMemo(() => {
    if (!complete) return null;
    return buildConnectionAssessment({
      ...view.metrics,
      mode,
    });
  }, [complete, view.metrics, mode]);

  const liveAnnouncement = useMemo(() => {
    if (running) return buttonStatus;
    if (view.phase === "cancelled") return "Test cancelled";
    if (view.phase === "error") return view.error ?? "Error";
    if (complete && view.metrics.downloadMbps != null) {
      const parts = formatSpeedParts(view.metrics.downloadMbps);
      if (!parts) return "Test complete.";
      return `Test complete. Download speed ${parts.amount} ${parts.unit}.`;
    }
    return "";
  }, [running, complete, buttonStatus, view.phase, view.error, view.metrics.downloadMbps]);

  const protocol =
    measurementProvider === "cloudflare"
      ? "HTTPS"
      : server?.url
        ? (() => {
            try {
              return new URL(server.url).protocol.replace(":", "").toUpperCase();
            } catch {
              return null;
            }
          })()
        : null;

  const copySummary = async () => {
    const text = buildShareSummary({
      downloadMbps: view.metrics.downloadMbps,
      uploadMbps: view.metrics.uploadMbps,
      pingMs: view.metrics.pingMs,
      jitterMs: view.metrics.jitterMs,
      mode,
      testedAt,
      serverName: server?.name ?? null,
    });
    try {
      await navigator.clipboard.writeText(text);
      setSummaryCopied(true);
      window.setTimeout(() => setSummaryCopied(false), 2000);
    } catch {
      setSummaryCopied(false);
    }
  };

  return (
    <section
      aria-label="Internet speed test"
      className={cn("speed-dashboard mx-auto w-full max-w-[1280px] px-4", className)}
    >
      {!measurementReady && measurementNotice && view.phase === "idle" && (
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

        <SpeedDashboardLayout
          view={view}
          samples={samples}
          server={server}
          network={network}
          mode={mode}
          showModeToggle={showModeToggle}
          modeDisabled={running || isPending}
          running={running}
          canStart={
            measurementReady &&
            (measurementProvider !== "dedicated" || Boolean(measurementBaseUrl))
          }
          testedAt={testedAt}
          onModeChange={setMode}
          onStart={start}
          onCancel={cancel}
        />

        {view.error && (
          <p className="mt-3 text-[14px] text-destructive" role="alert">
            {view.error}
          </p>
        )}

        {complete && uploadCaption && (
          <p className="mt-2 text-center text-[12px] text-muted-foreground">
            Upload {uploadCaption}
          </p>
        )}

        {complete && (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => void copySummary()}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-[var(--sd-border)] bg-[var(--sd-card)] px-3 text-[14px] font-semibold text-[var(--sd-text)] hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00866A]"
            >
              <Copy className="h-4 w-4" aria-hidden />
              {summaryCopied ? "Copied" : "Copy summary"}
            </button>
            <button
              type="button"
              onClick={() =>
                downloadResultCard({
                  downloadMbps: view.metrics.downloadMbps,
                  uploadMbps: view.metrics.uploadMbps,
                  pingMs: view.metrics.pingMs,
                  jitterMs: view.metrics.jitterMs,
                  mode,
                  testedAt,
                  serverName: server?.name ?? null,
                })
              }
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-[var(--sd-border)] bg-[var(--sd-card)] px-3 text-[14px] font-semibold text-[var(--sd-text)] hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00866A]"
            >
              <ImageDown className="h-4 w-4" aria-hidden />
              Download image
            </button>
            <button
              type="button"
              onClick={() => {
                const session = sessionRef.current;
                if (session) void persistResult(view.metrics, session);
              }}
              disabled={savedOnDevice}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--sd-border)] px-3 text-[14px] font-semibold text-[var(--sd-text)] hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00866A] disabled:opacity-70"
            >
              {savedOnDevice ? "Saved on this device" : "Save result on this device"}
            </button>
            <button
              type="button"
              id={`${DETAILS_PANEL_ID}-trigger`}
              aria-expanded={detailsOpen}
              aria-controls={DETAILS_PANEL_ID}
              onClick={() => setDetailsOpen(!detailsOpen)}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 text-[14px] font-semibold text-[#00866A] hover:bg-[#14B8A6]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00866A]"
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
          </div>
        )}

        {complete && (
          <DiagnoseConnectionPanel
            className="mt-4"
            metrics={view.metrics}
            mode={mode}
            server={server}
            plan={plan}
            history={historySnapshot}
          />
        )}

        {complete && assessment && (
          <AdvancedDiagnosticsPanel
            showToggle={false}
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
            panelId={DETAILS_PANEL_ID}
            assessment={assessment}
            metrics={view.metrics}
            mode={mode}
            network={network}
            server={server}
            browserLinkEstimate={browserLinkEstimate}
            testedAt={testedAt}
            samples={samples}
            plan={plan}
            history={historySnapshot}
            shareUrl={null}
            protocol={protocol}
            connectionTag={connectionTag}
            onConnectionTagChange={(tag) => {
              setConnectionTag(tag);
              if (lastHistoryId) patchHistoryTag(lastHistoryId, tag);
            }}
          />
        )}

        {showHistory && (
          <LocalHistory
            entries={historySnapshot}
            onClear={() => {
              clearHistory();
              setHistorySnapshot([]);
            }}
          />
        )}
      </div>
    </section>
  );
}
