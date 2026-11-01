import { afterEach, describe, expect, it, vi } from "vitest";
import { CHANGE_LABELS, compareSnapshots, noteError, percentChange } from "@/lib/network-health/compare";
import { coverageOverview } from "@/lib/network-health/overview";
import { buildHealthRecommendations } from "@/lib/network-health/recommendations";
import { emptyPlan } from "@/lib/mesh/plan";
import { snapshotFromHistory, snapshotFromRoom } from "@/lib/network-health/snapshot";
import { readComparisons, saveComparison } from "@/lib/network-health/store";
import type { StoredHistoryEntry } from "@/lib/speedtest/history-store";

const baseEntry: StoredHistoryEntry = {
  id: "h1",
  downloadMbps: 100,
  uploadMbps: 20,
  pingMs: 18,
  jitterMs: 4,
  mode: "standard",
  serverName: "Example edge",
  createdAt: "2026-11-01T12:00:00.000Z",
  bufferbloatIdleMs: 16,
  bufferbloatLoadedDownMs: 90,
  bufferbloatLoadedUpMs: 40,
  bufferbloatGrade: "D",
  provider: "cloudflare",
  packetLossPercent: null,
};

function entry(overrides: Partial<StoredHistoryEntry> = {}): StoredHistoryEntry {
  return { ...baseEntry, ...overrides };
}

describe("measurement mapping", () => {
  it("keeps missing metrics empty", () => {
    const snapshot = snapshotFromHistory(entry({
      uploadMbps: null,
      jitterMs: null,
      bufferbloatGrade: null,
      bufferbloatLoadedDownMs: null,
      bufferbloatLoadedUpMs: null,
      provider: null,
      serverName: undefined,
    }));
    expect(snapshot.uploadMbps).toBeNull();
    expect(snapshot.jitterMs).toBeNull();
    expect(snapshot.loadedLatencyMs).toBeNull();
    expect(snapshot.bufferbloatGrade).toBeNull();
    expect(snapshot.provider).toBeNull();
    expect(snapshot.endpointName).toBeNull();
    expect(snapshot.idleLatencyMs).toBe(16);
  });

  it("maps a room test without inventing loaded latency", () => {
    const snapshot = snapshotFromRoom({
      roomId: "kitchen",
      roomLabel: "Kitchen",
      downloadMbps: 40,
      uploadMbps: null,
      pingMs: 22,
      jitterMs: null,
      testedAt: "2026-11-01T12:00:00.000Z",
      endpointName: "Example edge",
    });
    expect(snapshot.source).toBe("room-test");
    expect(snapshot.loadedLatencyMs).toBeNull();
    expect(snapshot.bufferbloatGrade).toBeNull();
    expect(snapshot.uploadMbps).toBeNull();
  });
});

describe("baseline comparisons", () => {
  it("calculates improvement and regression percentages", () => {
    expect(percentChange(100, 150)).toBe(50);
    expect(percentChange(20, 10)).toBe(-50);
    expect(percentChange(0, 10)).toBeNull();
    expect(percentChange(null, 10)).toBeNull();
    const before = snapshotFromHistory(entry());
    const after = snapshotFromHistory(entry({
      id: "h2",
      downloadMbps: 150,
      bufferbloatLoadedDownMs: 30,
      bufferbloatGrade: "B",
      createdAt: "2026-11-01T13:00:00.000Z",
    }));
    const result = compareSnapshots(before, after);
    expect(result.metrics.find((metric) => metric.id === "download")).toMatchObject({ percent: 50, direction: "improved" });
    expect(result.metrics.find((metric) => metric.id === "loaded")?.direction).toBe("improved");
  });

  it("warns when servers or connection types differ", () => {
    const before = snapshotFromHistory(entry({ connectionTag: "wifi" }));
    const after = snapshotFromHistory(entry({ id: "h2", serverName: "Other edge", connectionTag: "wired" }));
    const warnings = compareSnapshots(before, after).warnings.join(" ");
    expect(warnings).toContain("different servers");
    expect(warnings).toContain("Ethernet");
  });

  it("warns when the room, loaded latency, or week differ", () => {
    expect(CHANGE_LABELS["ethernet-backhaul"]).toBe("Ethernet backhaul installation");
    expect(CHANGE_LABELS.firmware).toBe("Router firmware update");
    expect(CHANGE_LABELS.channel).toBe("Channel configuration change");
    expect(CHANGE_LABELS["router-mode"]).toBe("Router mode change");
    const before = snapshotFromRoom({
      roomId: "a", roomLabel: "Office", downloadMbps: 10, uploadMbps: 1, pingMs: 10, jitterMs: 1,
      testedAt: "2026-10-01T12:00:00.000Z", endpointName: "Edge", loadedLatencyMs: 40,
    });
    const after = snapshotFromRoom({
      roomId: "b", roomLabel: "Kitchen", downloadMbps: 20, uploadMbps: 2, pingMs: 8, jitterMs: 1,
      testedAt: "2026-11-01T12:00:00.000Z", endpointName: "Edge",
    });
    const warnings = compareSnapshots(before, after).warnings.join(" ");
    expect(warnings).toContain("different rooms");
    expect(warnings).toContain("Loaded latency was recorded on only one");
    expect(warnings).toContain("more than a week apart");
  });

  it("warns when a server name was not recorded", () => {
    const before = snapshotFromHistory(entry({ serverName: undefined }));
    const after = snapshotFromHistory(entry({ id: "h2" }));
    expect(compareSnapshots(before, after).warnings.join(" ")).toContain("did not record");
  });
});

describe("network health overview", () => {
  it("does not estimate coverage until a node is saved", () => {
    expect(coverageOverview(null).status).toBe("unavailable");
    expect(coverageOverview(emptyPlan()).weakPercent).toBeNull();
  });

  it("marks a placed node as an estimate rather than a measurement", () => {
    const plan = emptyPlan();
    const floor = plan.floors[0];
    floor.rooms = [{ id: "room", name: "Office", x: 0, y: 0, w: 20, h: 16, material: "drywall", priority: false, problem: false }];
    floor.nodes = [{ id: "node", name: "Primary", x: 4, y: 4, role: "primary" }];
    const overview = coverageOverview(plan);
    expect(overview.status).toBe("estimated");
    expect(overview.weakPercent).toEqual(expect.any(Number));
    expect(overview.floorName).toBe(floor.name);
  });
});

describe("recommendations", () => {
  it("cites loaded latency evidence and a verification test", () => {
    const [first] = buildHealthRecommendations({
      snapshot: snapshotFromHistory(entry()),
      rooms: [],
      plan: null,
    });
    expect(first?.id).toBe("loaded-latency");
    expect(first?.evidence).toContain("Grade D");
    expect(first?.evidence).toContain("90 ms");
    expect(first?.confidence).toBe("high");
    expect(first?.verification.length).toBeGreaterThan(0);
  });

  it("returns nothing when there is no measurement", () => {
    expect(buildHealthRecommendations({ snapshot: null, rooms: [], plan: null })).toEqual([]);
  });

  it("flags a slow room only when two measurements exist", () => {
    const findings = buildHealthRecommendations({
      snapshot: snapshotFromHistory(entry({ bufferbloatGrade: "A", bufferbloatLoadedDownMs: 18, jitterMs: 2 })),
      rooms: [
        { name: "Office", downloadMbps: 100 },
        { name: "Bedroom", downloadMbps: 20 },
      ],
      plan: null,
    });
    expect(findings.some((item) => item.id === "room-gap" && item.evidence.includes("Bedroom") && item.evidence.includes("20"))).toBe(true);
  });
});

describe("local notes", () => {
  it("rejects passwords and IP addresses", () => {
    expect(noteError("password is hunter2")).toMatch(/password/i);
    expect(noteError("gateway 192.168.1.1")).toMatch(/IP/);
    expect(noteError("Moved the node upstairs")).toBeNull();
  });
});

describe("local persistence", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("saves a comparison in this browser and refuses a sensitive note", () => {
    const memory = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => memory.get(key) ?? null,
        setItem: (key: string, value: string) => { memory.set(key, value); },
      },
    });
    const baseline = snapshotFromHistory(entry());
    const saved = saveComparison({ changeKind: "router-move", note: "Moved the router", baseline, followUp: null });
    expect(saved.ok).toBe(true);
    expect(readComparisons()).toHaveLength(1);
    expect(readComparisons()[0]?.note).toBe("Moved the router");
    const rejected = saveComparison({ changeKind: "router-move", note: "secret token", baseline, followUp: null });
    expect(rejected.ok).toBe(false);
    expect(readComparisons()).toHaveLength(1);
    expect(JSON.stringify(memory.get("myspeedgauge_network_health_v1"))).not.toMatch(/password|192\.168/);
  });
});
