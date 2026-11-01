import { describe, expect, it } from "vitest";
import { estimateCoverage, wallLossDb } from "@/lib/mesh/coverage";
import { appendRoomSample, bestDownloadMbps, bestRoomDownload, roomSampleFromResult, summarizeRoom, throughputBand } from "@/lib/mesh/measurements";
import { meshBrandFor } from "@/lib/mesh/router-setup-guide";
import { clientToFeet, feetPerPixel, pointInRoom, segmentsCross, snapFt } from "@/lib/mesh/geometry";
import { suggestNodeCount } from "@/lib/mesh/nodes";
import { placementOptions } from "@/lib/mesh/placement";
import { emptyPlan } from "@/lib/mesh/plan";
import { parseMeshPlan } from "@/lib/mesh/store";
import { troubleshootMesh } from "@/lib/mesh/troubleshoot";
import { suggestWifiGeneration } from "@/lib/mesh/wifi-generation";
import type { MeshRoom } from "@/lib/mesh/types";

describe("mesh node count", () => {
  it("suggests one node for a small drywall home", () => {
    const result = suggestNodeCount({
      area: 1200,
      unit: "sqft",
      floors: 1,
      construction: "drywall",
      devices: 10,
      wiredBackhaul: false,
    });
    expect(result.count).toBe(1);
    expect(result.meshMayBeUnnecessary).toBe(true);
  });

  it("raises the count for a second floor and stops the starting suggestion at four", () => {
    const one = suggestNodeCount({ area: 3000, unit: "sqft", floors: 1, construction: "brick", devices: 10, wiredBackhaul: false });
    const two = suggestNodeCount({ area: 3000, unit: "sqft", floors: 2, construction: "brick", devices: 10, wiredBackhaul: false });
    expect(two.rawCount).toBeGreaterThan(one.rawCount);
    expect(two.count).toBeLessThanOrEqual(4);
    expect(two.warnings.length).toBeGreaterThan(0);
  });
});

describe("mesh coverage estimate", () => {
  const node = { id: "n", name: "Primary", x: 4, y: 4, role: "primary" as const };

  it("is strong beside the node and weaker far away", () => {
    const cells = estimateCoverage({
      widthFt: 80,
      heightFt: 20,
      floorIndex: 0,
      rooms: [],
      band: "5",
      nodeFloors: [{ node, floorIndex: 0 }],
      cellFt: 4,
    });
    const near = cells.reduce((best, cell) => (cell.score > best.score ? cell : best));
    const far = cells.reduce((best, cell) => (cell.score < best.score ? cell : best));
    expect(near.level).toBe("strong");
    expect(far.score).toBeLessThan(near.score);
  });

  it("adds wall loss when the path enters a room", () => {
    const rooms: MeshRoom[] = [
      { id: "r", name: "Hall", x: 10, y: 0, w: 10, h: 10, material: "concrete", priority: false, problem: false },
    ];
    expect(wallLossDb(rooms, 0, 5, 30, 5)).toBeGreaterThan(0);
  });
});

describe("mesh placement and troubleshooting", () => {
  it("returns four named layouts", () => {
    const floor = emptyPlan().floors[0];
    const options = placementOptions(floor, 3);
    expect(options.map((option) => option.id)).toEqual(["coverage", "fewest", "wired", "work"]);
    expect(options.every((option) => option.why.length > 0)).toBe(true);
  });

  it("asks for a room test when no symptom is specific", () => {
    const items = troubleshootMesh({ symptoms: ["gaming"], nodeCount: 1, floors: 1, wired: false, measurements: [] });
    expect(items[0]?.confidence).toBe("low");
    expect(items[0]?.guideHref).toBeTruthy();
  });

  it("does not invent an upload figure or a connected node", () => {
    const upload = troubleshootMesh({ symptoms: ["slow-upload"], nodeCount: 1, floors: 1, wired: false, measurements: [] });
    expect(upload[0]?.cause).toMatch(/not been measured/i);
    expect(upload[0]?.evidence).not.toMatch(/\d/);
    const roaming = troubleshootMesh({ symptoms: ["distant-node"], nodeCount: 1, floors: 1, wired: false, satelliteCount: 0, measurements: [] });
    expect(roaming[0]?.evidence).toMatch(/cannot see which node/i);
  });

  it("cites a room gap from saved medians", () => {
    const items = troubleshootMesh({
      symptoms: ["dead-zone"],
      nodeCount: 2,
      floors: 1,
      wired: false,
      satelliteCount: 1,
      rooms: [
        { id: "a", name: "Office", floorName: "Floor 1" },
        { id: "b", name: "Kitchen", floorName: "Floor 1" },
      ],
      measurements: [
        { roomId: "a", downloadMbps: 100, uploadMbps: 10, pingMs: 10, jitterMs: 2, testedAt: "2026-11-01T12:00:00.000Z", endpointName: "Edge" },
        { roomId: "b", downloadMbps: 20, uploadMbps: 4, pingMs: 30, jitterMs: 5, testedAt: "2026-11-01T12:00:00.000Z", endpointName: "Edge" },
      ],
    });
    expect(items[0]?.evidence).toContain("Kitchen");
    expect(items[0]?.confidence).toBe("high");
  });

  it("does not push Wi-Fi 7 without Wi-Fi 7 devices", () => {
    expect(suggestWifiGeneration({ wifi7Devices: false, needs6GHz: false, manyDevices: false }).title).toContain("Wi-Fi 6");
  });
});

describe("room throughput bands", () => {
  it("leaves an unmeasured room unlabeled and compares saved downloads", () => {
    expect(throughputBand(null, 100)).toBe("unmeasured");
    expect(throughputBand(80, 100)).toBe("fast");
    expect(throughputBand(20, 100)).toBe("slow");
    expect(bestDownloadMbps([{ downloadMbps: 10 }, { downloadMbps: null }, { downloadMbps: 40 }])).toBe(40);
  });
});

describe("floor geometry", () => {
  it("snaps to the grid and maps pointer position into feet", () => {
    expect(snapFt(10.4, 40)).toBe(10);
    expect(snapFt(-4, 40)).toBe(0);
    expect(clientToFeet(50, 25, { left: 0, top: 0, width: 100, height: 50 }, 40, 20)).toEqual({ x: 20, y: 10 });
    expect(feetPerPixel(40, 200)).toBeCloseTo(0.2);
  });

  it("knows when a point is inside a room and when a wall is crossed", () => {
    const room = { id: "r", name: "Room", x: 0, y: 0, w: 10, h: 10, material: "drywall" as const, priority: false, problem: false };
    expect(pointInRoom(room, 5, 5)).toBe(true);
    expect(pointInRoom(room, 12, 5)).toBe(false);
    expect(segmentsCross(0, 5, 10, 5, 5, 0, 5, 10)).toBe(true);
    expect(segmentsCross(0, 0, 2, 0, 0, 1, 2, 1)).toBe(false);
  });
});

describe("room samples", () => {
  const base = {
    roomId: "kitchen",
    downloadMbps: 100,
    uploadMbps: 10,
    pingMs: 20,
    jitterMs: 4,
    testedAt: "2026-11-01T12:00:00.000Z",
    endpointName: "Edge",
    provider: "cloudflare" as const,
  };

  it("uses the median of several samples and keeps the loaded latency when present", () => {
    const samples = [
      { ...base, downloadMbps: 10, pingMs: 40, loadedLatencyMs: 80 },
      { ...base, downloadMbps: 30, pingMs: 10, loadedLatencyMs: 40, testedAt: "2026-11-01T13:00:00.000Z" },
      { ...base, downloadMbps: 20, pingMs: 30, loadedLatencyMs: null },
    ];
    const summary = summarizeRoom(samples, "kitchen");
    expect(summary?.downloadMbps).toBe(20);
    expect(summary?.pingMs).toBe(30);
    expect(summary?.loadedLatencyMs).toBe(60);
    expect(summary?.sampleCount).toBe(3);
    expect(bestRoomDownload(samples)).toBe(20);
  });

  it("caps samples per room and records the provider from a finished test", () => {
    let stored = [] as ReturnType<typeof appendRoomSample>;
    for (let index = 0; index < 10; index += 1) {
      stored = appendRoomSample(stored, { ...base, downloadMbps: index, testedAt: `2026-11-01T12:0${index}:00.000Z` });
    }
    expect(stored).toHaveLength(8);
    expect(stored[0]?.downloadMbps).toBe(9);
    const sample = roomSampleFromResult("hall", {
      metrics: { downloadMbps: 50, uploadMbps: 5, pingMs: 12, jitterMs: 2, downloadedBytes: 1, uploadedBytes: 1, durationMs: 1, bufferbloatLoadedDownMs: 40, bufferbloatLoadedUpMs: 55 },
      serverName: "Edge",
      testedAt: "2026-11-01T12:00:00.000Z",
      provider: "cloudflare",
    });
    expect(sample.loadedLatencyMs).toBe(55);
    expect(sample.provider).toBe("cloudflare");
  });

  it("maps mesh brands without treating an Archer router as a Deco kit", () => {
    expect(meshBrandFor("tp-link", "deco")).toBe("tp-link-deco");
    expect(meshBrandFor("tp-link", "archer")).toBe("generic");
    expect(meshBrandFor("eero", "eero-6")).toBe("eero");
  });

  it("still reads a plan saved before loaded latency existed", () => {
    const plan = emptyPlan();
    plan.measurements = [{ ...base, loadedLatencyMs: undefined, provider: undefined }];
    const parsed = parseMeshPlan(plan);
    expect(parsed.ok).toBe(true);
  });
});

describe("mesh plan import", () => {
  it("round-trips an empty plan and rejects credential fields", () => {
    const plan = emptyPlan();
    expect(parseMeshPlan(plan).ok).toBe(true);
    const dirty = { ...plan, wifiPassword: "nope" };
    const rejected = parseMeshPlan(dirty);
    expect(rejected.ok).toBe(false);
  });
});
