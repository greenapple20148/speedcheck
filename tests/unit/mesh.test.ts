import { describe, expect, it } from "vitest";
import { estimateCoverage, wallLossDb } from "@/lib/mesh/coverage";
import { bestDownloadMbps, throughputBand } from "@/lib/mesh/measurements";
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

describe("mesh plan import", () => {
  it("round-trips an empty plan and rejects credential fields", () => {
    const plan = emptyPlan();
    expect(parseMeshPlan(plan).ok).toBe(true);
    const dirty = { ...plan, wifiPassword: "nope" };
    const rejected = parseMeshPlan(dirty);
    expect(rejected.ok).toBe(false);
  });
});
