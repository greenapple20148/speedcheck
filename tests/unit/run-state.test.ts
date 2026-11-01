import { describe, expect, it } from "vitest";
import {
  applyRunEvent,
  beginRun,
  buildShareSummary,
  emptyRunMetrics,
  historyDeltaPercent,
  lockGaugeScale,
  logGaugeProgress,
  markCancelled,
  type RunProgressEvent,
} from "@/lib/speedtest/run-state";

function event(partial: Partial<RunProgressEvent> & Pick<RunProgressEvent, "runId" | "phase">): RunProgressEvent {
  return {
    phaseProgress: null,
    currentMbps: null,
    metrics: emptyRunMetrics(),
    ...partial,
  };
}

describe("run state machine", () => {
  it("ignores results from a different run", () => {
    let view = beginRun("current");
    view = applyRunEvent(
      view,
      event({
        runId: "current",
        phase: "download",
        currentMbps: 40,
        metrics: { ...emptyRunMetrics(), pingMs: 18, jitterMs: 2, downloadMbps: 40 },
      }),
    );
    const stale = applyRunEvent(
      view,
      event({
        runId: "previous",
        phase: "upload",
        currentMbps: 99,
        metrics: { ...emptyRunMetrics(), uploadMbps: 99, downloadMbps: 1 },
      }),
    );
    expect(stale.metrics.downloadMbps).toBe(40);
    expect(stale.metrics.uploadMbps).toBeNull();
    expect(stale.phase).toBe("download");
  });

  it("ignores late results after cancel", () => {
    let view = beginRun("run");
    view = applyRunEvent(
      view,
      event({
        runId: "run",
        phase: "download",
        metrics: { ...emptyRunMetrics(), pingMs: 12, downloadMbps: 80 },
      }),
    );
    view = markCancelled(view);
    const late = applyRunEvent(
      view,
      event({
        runId: "run",
        phase: "upload",
        phaseProgress: 1,
        metrics: { ...emptyRunMetrics(), uploadMbps: 20, downloadMbps: 80, pingMs: 12 },
      }),
    );
    expect(late.phase).toBe("cancelled");
    expect(late.metrics.uploadMbps).toBeNull();
    expect(late.metrics.downloadMbps).toBe(80);
    expect(late.phaseProgress).toBeNull();
  });

  it("does not show upload while download is active", () => {
    let view = beginRun("run");
    view = applyRunEvent(
      view,
      event({
        runId: "run",
        phase: "ping",
        metrics: { ...emptyRunMetrics(), pingMs: 21, jitterMs: 3 },
      }),
    );
    view = applyRunEvent(
      view,
      event({
        runId: "run",
        phase: "download",
        phaseProgress: 0.4,
        currentMbps: 100,
        metrics: {
          ...emptyRunMetrics(),
          pingMs: 21,
          jitterMs: 3,
          downloadMbps: 100,
          uploadMbps: 55,
          uploadedBytes: 9_000_000,
          bufferbloatLoadedUpMs: 40,
        },
      }),
    );
    expect(view.phase).toBe("download");
    expect(view.metrics.downloadMbps).toBe(100);
    expect(view.metrics.uploadMbps).toBeNull();
    expect(view.metrics.uploadedBytes).toBe(0);
    expect(view.metrics.bufferbloatLoadedUpMs).toBeNull();
    expect(view.stages.upload).toBe("pending");
    expect(view.stages.download).toBe("active");
    expect(view.currentMbps).toBe(100);
  });

  it("keeps a finished download when upload starts and does not move the label backward", () => {
    let view = beginRun("run");
    view = applyRunEvent(
      view,
      event({
        runId: "run",
        phase: "download",
        metrics: { ...emptyRunMetrics(), pingMs: 15, jitterMs: 1, downloadMbps: 200 },
      }),
    );
    view = applyRunEvent(
      view,
      event({
        runId: "run",
        phase: "upload",
        phaseProgress: 0.25,
        metrics: {
          ...emptyRunMetrics(),
          pingMs: 15,
          jitterMs: 1,
          downloadMbps: 200,
          uploadMbps: 40,
        },
      }),
    );
    view = applyRunEvent(
      view,
      event({
        runId: "run",
        phase: "download",
        phaseProgress: 0.9,
        currentMbps: 210,
        metrics: {
          ...emptyRunMetrics(),
          pingMs: 15,
          jitterMs: 1,
          downloadMbps: 210,
          uploadMbps: 40,
        },
      }),
    );
    expect(view.phase).toBe("upload");
    expect(view.metrics.downloadMbps).toBe(210);
    expect(view.metrics.uploadMbps).toBe(40);
    expect(view.currentMbps).toBe(40);
    expect(view.stages.download).toBe("completed");
    expect(view.stages.upload).toBe("active");
    expect(view.phaseProgress).toBeNull();
  });

  it("leaves pending phases empty instead of zero", () => {
    const view = applyRunEvent(
      beginRun("run"),
      event({
        runId: "run",
        phase: "ping",
        metrics: {
          ...emptyRunMetrics(),
          pingMs: 0,
          jitterMs: 0,
          downloadMbps: 0,
          uploadMbps: 0,
        },
      }),
    );
    expect(view.metrics.pingMs).toBeNull();
    expect(view.metrics.downloadMbps).toBeNull();
    expect(view.metrics.uploadMbps).toBeNull();
    expect(view.stages.download).toBe("pending");
    expect(view.stages.upload).toBe("pending");
    expect(view.metrics.jitterMs).toBe(0);
  });

  it("does not invent a progress percent", () => {
    const view = applyRunEvent(
      beginRun("run"),
      event({
        runId: "run",
        phase: "download",
        phaseProgress: null,
        metrics: { ...emptyRunMetrics(), downloadMbps: 75 },
      }),
    );
    expect(view.phaseProgress).toBeNull();
    const known = applyRunEvent(
      view,
      event({
        runId: "run",
        phase: "download",
        phaseProgress: 0.33,
        metrics: { ...emptyRunMetrics(), downloadMbps: 80 },
      }),
    );
    expect(known.phaseProgress).toBe(0.33);
  });
});

describe("gauge scale lock", () => {
  it("covers low speed and gigabit without rescaling on every sample", () => {
    const locked = lockGaugeScale(null, null);
    expect(locked).toBe(1000);
    expect(lockGaugeScale(locked, 12)).toBe(1000);
    expect(lockGaugeScale(locked, 400)).toBe(1000);
    expect(lockGaugeScale(locked, 980)).toBe(2000);
    expect(logGaugeProgress(10, 1000)).toBeGreaterThan(0.2);
    expect(logGaugeProgress(1000, 1000)).toBe(1);
  });
});

describe("share summary", () => {
  it("includes measured fields and no IP address", () => {
    const text = buildShareSummary({
      downloadMbps: 120.4,
      uploadMbps: 30,
      pingMs: 18,
      jitterMs: 2,
      mode: "standard",
      testedAt: new Date("2026-11-01T15:00:00Z"),
      serverName: "Cloudflare",
    });
    expect(text).toContain("120.4 Mbps");
    expect(text).toContain("Mode: standard");
    expect(text).not.toMatch(/\b\d{1,3}(?:\.\d{1,3}){3}\b/);
    expect(historyDeltaPercent(110, 100)).toBeCloseTo(10);
    expect(historyDeltaPercent(null, 100)).toBeNull();
  });
});
