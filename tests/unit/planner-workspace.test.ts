import { describe, expect, it } from "vitest";
import { applyDistanceCalibration, calibrationFactor, measuredDistance } from "@/lib/mesh/calibration";
import { coverageFill, estimateCoverage } from "@/lib/mesh/coverage";
import { recordPast, redoStacks, undoStacks } from "@/lib/mesh/history";
import { hitTestFloor } from "@/lib/mesh/hit";
import { backhaulCounts, compareLayouts, coverageShares, pointDelta } from "@/lib/mesh/insights";
import { nudgeLabels } from "@/lib/mesh/labels";
import { canAddFloor, canDeleteFloor, duplicateFloor, emptyFloor, emptyPlan } from "@/lib/mesh/plan";
import { parseMeshPlan } from "@/lib/mesh/store";
import { suggestPlacements } from "@/lib/mesh/suggestions";
import type { MeshFloor, MeshNode } from "@/lib/mesh/types";
import { clientToViewFeet, fitView, scaleBarFeet, zoomView } from "@/lib/mesh/view";

describe("planner history", () => {
  it("undoes, redoes, and caps the stack", () => {
    const undone = undoStacks([1, 2], 3, []);
    expect(undone).toEqual({ past: [1], present: 2, future: [3] });
    expect(undoStacks([], 1, [])).toBeNull();
    const redone = redoStacks([1], 2, [3]);
    expect(redone).toEqual({ past: [1, 2], present: 3, future: [] });
    expect(recordPast([1, 2, 3], 4, 3)).toEqual([2, 3, 4]);
  });
});

describe("planner floors", () => {
  it("blocks deleting the last floor and adding past six", () => {
    expect(canDeleteFloor(1)).toBe(false);
    expect(canDeleteFloor(2)).toBe(true);
    expect(canAddFloor(5)).toBe(true);
    expect(canAddFloor(6)).toBe(false);
  });

  it("duplicates image settings and remaps a parent link", () => {
    const floor = emptyFloor("Downstairs");
    floor.image = { opacity: 0.3, rotation: 90, scale: 1.2 };
    floor.nodes = [
      { id: "router", name: "Primary", x: 4, y: 4, role: "primary", link: "wired" },
      { id: "node", name: "Node 2", x: 12, y: 8, role: "satellite", link: "wireless", parentId: "router" },
    ];
    const copy = duplicateFloor(floor);
    expect(copy.id).not.toBe(floor.id);
    expect(copy.image).toEqual(floor.image);
    expect(copy.nodes[1]?.parentId).toBe(copy.nodes[0]?.id);
    expect(copy.nodes[1]?.parentId).not.toBe("router");
  });
});

describe("planner calibration", () => {
  it("scales the floor so the known distance replaces the measured one", () => {
    expect(measuredDistance({ x: 0, y: 0 }, { x: 10, y: 0 })).toBe(10);
    expect(calibrationFactor(10, 20)).toBe(2);
    expect(calibrationFactor(0.1, 10)).toBeNull();
    const floor: MeshFloor = {
      ...emptyFloor(),
      widthFt: 20,
      heightFt: 10,
      nodes: [{ id: "n", name: "Primary", x: 5, y: 4, role: "primary" }],
      rooms: [{ id: "r", name: "Room", x: 2, y: 2, w: 6, h: 4, material: "drywall", priority: false, problem: false }],
    };
    const scaled = applyDistanceCalibration(floor, { x: 0, y: 0 }, { x: 10, y: 0 }, 20);
    expect(scaled.ok).toBe(true);
    if (!scaled.ok) return;
    expect(scaled.floor.widthFt).toBe(40);
    expect(scaled.floor.nodes[0]?.x).toBe(10);
    expect(scaled.floor.rooms[0]?.w).toBe(12);
    const tooBig = applyDistanceCalibration(floor, { x: 0, y: 0 }, { x: 1, y: 0 }, 40);
    expect(tooBig.ok).toBe(false);
  });
});

describe("planner coverage summary", () => {
  it("reports acceptable area from the heuristic and does not invent a signal unit", () => {
    const node: MeshNode = { id: "n", name: "Primary", x: 4, y: 4, role: "primary", link: "wired" };
    const cells = estimateCoverage({
      widthFt: 40,
      heightFt: 16,
      floorIndex: 0,
      rooms: [],
      band: "5",
      nodeFloors: [{ node, floorIndex: 0 }],
      cellFt: 4,
    });
    const shares = coverageShares(cells);
    expect(shares.acceptableShare).not.toBeNull();
    expect((shares.acceptableShare ?? 0) + (shares.weakShare ?? 0)).toBeCloseTo(1);
    expect(coverageFill(90)).not.toMatch(/dBm|Mbps/i);
    expect(coverageFill(0)).toMatch(/239, 68, 68/);
    const far = { ...node, id: "s", name: "Node 2", x: 36, y: 12, role: "satellite" as const, link: "wireless" as const };
    const proposed = estimateCoverage({
      widthFt: 40,
      heightFt: 16,
      floorIndex: 0,
      rooms: [],
      band: "5",
      nodeFloors: [{ node, floorIndex: 0 }, { node: far, floorIndex: 0 }],
      cellFt: 4,
    });
    const comparison = compareLayouts(
      { nodes: [node], shares },
      { nodes: [node, far], shares: coverageShares(proposed) },
    );
    expect(comparison.nodeCount).toEqual({ current: 1, proposed: 2 });
    expect(comparison.backhaul).toEqual({ current: { wired: 0, wireless: 0 }, proposed: { wired: 0, wireless: 1 } });
    expect(typeof comparison.acceptablePointDelta).toBe("number");
    expect(pointDelta(null, 0.2)).toBeNull();
  });

  it("suggests a spot with a modeled delta and no throughput claim", () => {
    const floor: MeshFloor = {
      ...emptyFloor(),
      widthFt: 40,
      heightFt: 20,
      rooms: [
        { id: "near", name: "Office", x: 0, y: 0, w: 12, h: 20, material: "drywall", priority: false, problem: false },
        { id: "far", name: "Bedroom", x: 28, y: 0, w: 12, h: 20, material: "concrete", priority: false, problem: false },
      ],
      nodes: [{ id: "n", name: "Primary", x: 4, y: 10, role: "primary", link: "wired" }],
      outlets: [{ id: "o", x: 34, y: 10 }],
      walls: [],
    };
    const cells = estimateCoverage({
      widthFt: floor.widthFt,
      heightFt: floor.heightFt,
      floorIndex: 0,
      rooms: floor.rooms,
      walls: [],
      band: "5",
      nodeFloors: [{ node: floor.nodes[0]!, floorIndex: 0 }],
      cellFt: 4,
    });
    const suggestions = suggestPlacements({ floor, floorIndex: 0, nodeFloors: [{ node: floor.nodes[0]!, floorIndex: 0 }], band: "5", cells, cellFt: 4 });
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.length).toBeLessThanOrEqual(3);
    for (const suggestion of suggestions) {
      expect(suggestion.node.x).toBeGreaterThanOrEqual(0);
      expect(suggestion.node.x).toBeLessThanOrEqual(floor.widthFt);
      expect(suggestion.reason).not.toMatch(/dBm|Mbps/i);
      expect(suggestion.tradeoff.length).toBeGreaterThan(10);
      expect(suggestion.acceptablePointDelta == null || typeof suggestion.acceptablePointDelta === "number").toBe(true);
    }
  });
});

describe("planner view and labels", () => {
  it("fits a wide viewport around the floor and zooms toward an anchor", () => {
    const fitted = fitView(40, 20, 2);
    expect(fitted.width / fitted.height).toBeCloseTo(2);
    expect(fitted.x).toBeLessThan(0);
    const zoomed = zoomView(fitted, 2, 20, 10);
    expect(zoomed.width).toBeCloseTo(fitted.width / 2);
    expect(clientToViewFeet(50, 25, { left: 0, top: 0, width: 100, height: 50 }, { x: 0, y: 0, width: 40, height: 20 })).toEqual({ x: 20, y: 10 });
    expect(scaleBarFeet(80)).toBe(10);
  });

  it("nudges a label that sits on another without moving stored coordinates", () => {
    const offsets = nudgeLabels([
      { id: "a", x: 0, y: 0, w: 4, h: 1 },
      { id: "b", x: 1, y: 0, w: 4, h: 1 },
    ]);
    expect(offsets.a?.dy).toBe(0);
    expect(offsets.b?.dy).toBeGreaterThan(0);
  });

  it("hits a node before the room underneath it", () => {
    const floor = emptyFloor();
    floor.rooms = [{ id: "r", name: "Room", x: 0, y: 0, w: 20, h: 20, material: "drywall", priority: false, problem: false }];
    floor.nodes = [{ id: "n", name: "Primary", x: 5, y: 5, role: "primary" }];
    expect(hitTestFloor(floor, 5, 5)?.kind).toBe("node");
    expect(hitTestFloor(floor, 12, 12)?.kind).toBe("room");
  });
});

describe("planner import compatibility", () => {
  it("keeps schema version 1, accepts optional fields, and rejects secrets", () => {
    const plan = emptyPlan();
    plan.floors[0]!.nodes = [{ id: "n", name: "Primary", x: 1, y: 1, role: "primary", parentId: "missing" }];
    plan.floors[0]!.image = { opacity: 0.4, rotation: 90, scale: 1 };
    const parsed = parseMeshPlan(plan);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.plan.schemaVersion).toBe(1);
    expect(parseMeshPlan({ ...plan, adminPassword: "nope" }).ok).toBe(false);
    expect(parseMeshPlan({ ...plan, nested: { wifiSecret: "nope" } }).ok).toBe(false);
    const legacy = emptyPlan();
    delete (legacy.floors[0] as { image?: unknown }).image;
    expect(parseMeshPlan(legacy).ok).toBe(true);
  });

  it("counts wired and wireless hops from links, not from a screenshot", () => {
    expect(backhaulCounts([
      { id: "a", name: "Primary", x: 0, y: 0, role: "primary", link: "wired" },
      { id: "b", name: "Node 2", x: 10, y: 0, role: "satellite", link: "wireless", parentId: "a" },
      { id: "c", name: "Node 3", x: 20, y: 0, role: "satellite", link: "wired", parentId: "a" },
    ])).toEqual({ wired: 1, wireless: 1 });
  });
});
