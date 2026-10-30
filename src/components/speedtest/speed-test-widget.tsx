"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Activity, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Speedometer } from "@/components/speedtest/speedometer";
import { MetricCard } from "@/components/speedtest/metric-card";
import { cancelSession, runSpeedTest } from "@/lib/speedtest/engine";
import { trackEvent } from "@/lib/analytics/events";
import type {
  ClientNetworkInfo,
  ProgressState,
  SessionConfig,
  TestMode,
  TestResultPayload,
} from "@/types/speedtest";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface SpeedTestWidgetProps {
  defaultMode?: TestMode;
  showModeToggle?: boolean;
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

export function SpeedTestWidget({
  defaultMode = "standard",
  showModeToggle = true,
}: SpeedTestWidgetProps) {
  const [mode, setMode] = useState<TestMode>(defaultMode);
  const [state, setState] = useState<ProgressState>(idleProgress);
  const [network, setNetwork] = useState<ClientNetworkInfo | null>(null);
  const [serverName, setServerName] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const abortRef = useRef<AbortController | null>(null);
  const sessionRef = useRef<SessionConfig | null>(null);

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
      // optional enrichment
    }
  }, []);

  const saveResult = useCallback(
    async (payload: TestResultPayload) => {
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
    },
    [],
  );

  const start = () => {
    if (running || isPending) return;
    setShareUrl(null);
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
          onProgress: setState,
        });
        sessionRef.current = session;
        setServerName(session.server?.name ?? null);
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
        if (saved?.id) {
          setShareUrl(`/results/${saved.id}`);
        }
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
        // Persist last result locally for history
        try {
          const key = "speedcheck_history";
          const prev = JSON.parse(localStorage.getItem(key) || "[]");
          const entry = {
            id: saved?.id ?? crypto.randomUUID(),
            ...metrics,
            mode,
            serverName: session.server.name,
            createdAt: new Date().toISOString(),
          };
          localStorage.setItem(
            key,
            JSON.stringify([entry, ...(Array.isArray(prev) ? prev : [])].slice(0, 25)),
          );
        } catch {
          // ignore quota errors
        }
      } catch (err) {
        if (controller.signal.aborted) {
          setState((s) => ({ ...s, phase: "cancelled" }));
          trackEvent("speed_test_cancelled", { mode });
          return;
        }
        const message =
          err instanceof Error ? err.message : "Speed test failed";
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

  const displaySpeed =
    state.phase === "upload"
      ? state.metrics.uploadMbps
      : state.currentMbps ?? state.metrics.downloadMbps;

  const phaseLabel: Record<string, string> = {
    idle: "Ready when you are",
    preparing: "Preparing secure session…",
    ping: "Measuring latency…",
    download: "Testing download…",
    upload: "Testing upload…",
    saving: "Saving results…",
    complete: "Test complete",
    error: "Something went wrong",
    cancelled: "Test cancelled",
  };

  return (
    <section
      aria-label="Internet speed test"
      className="mx-auto w-full max-w-3xl animate-fade-up"
    >
      <div className="rounded-[1.75rem] border border-border bg-card/90 p-6 shadow-soft backdrop-blur md:p-10">
        {showModeToggle && (
          <div className="mb-6 flex justify-center gap-2">
            {(["lightweight", "standard"] as TestMode[]).map((m) => (
              <button
                key={m}
                type="button"
                disabled={running}
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  mode === m
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-accent",
                )}
              >
                {m === "lightweight" ? "Lightweight" : "Standard"}
              </button>
            ))}
          </div>
        )}

        <Speedometer
          value={displaySpeed}
          progress={state.progress}
          active={running}
        />

        <p className="mt-2 text-center text-sm text-muted-foreground" aria-live="polite">
          {phaseLabel[state.phase]}
          {mode === "lightweight" && state.phase === "idle"
            ? " · Uses less data"
            : null}
        </p>

        <div className="mt-6 flex justify-center gap-3">
          {!running ? (
            <Button
              size="lg"
              onClick={start}
              className="h-14 min-w-[160px] rounded-full bg-primary px-10 text-lg font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              GO
            </Button>
          ) : (
            <Button
              size="lg"
              variant="outline"
              onClick={cancel}
              className="h-14 min-w-[160px] rounded-full border-border px-10 text-lg"
            >
              Cancel
            </Button>
          )}
        </div>

        {state.error && (
          <p className="mt-4 text-center text-sm text-destructive" role="alert">
            {state.error}
          </p>
        )}

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricCard
            label="Download"
            value={state.metrics.downloadMbps}
            unit="Mbps"
            icon={ArrowDownToLine}
          />
          <MetricCard
            label="Upload"
            value={state.metrics.uploadMbps}
            unit="Mbps"
            icon={ArrowUpFromLine}
          />
          <MetricCard
            label="Ping"
            value={state.metrics.pingMs}
            unit="ms"
            icon={Activity}
          />
          <MetricCard
            label="Jitter"
            value={state.metrics.jitterMs}
            unit="ms"
            icon={Waves}
          />
        </div>

        <div className="mt-6 grid gap-2 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground md:grid-cols-3">
          <div>
            <span className="font-medium text-foreground">ISP</span>
            <div>{network?.isp ?? "Detecting…"}</div>
          </div>
          <div>
            <span className="font-medium text-foreground">Server</span>
            <div>{serverName ?? "Nearest available"}</div>
          </div>
          <div>
            <span className="font-medium text-foreground">IP</span>
            <div>{network?.publicIpMasked ?? "—"}</div>
          </div>
        </div>

        {shareUrl && state.phase === "complete" && (
          <div className="mt-4 text-center text-sm">
            <Link
              href={shareUrl}
              className="font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => trackEvent("speed_test_shared", { path: shareUrl })}
            >
              View / share this result
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
