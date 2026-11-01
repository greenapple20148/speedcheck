import { estimateCoverage } from "@/lib/mesh/coverage";
import type { MeshPlan } from "@/lib/mesh/types";

export interface CoverageOverview {
  status: "estimated" | "unavailable";
  floorName: string | null;
  band: "5";
  weakPercent: number | null;
  nodeCount: number;
}

/** Share of the active floor that the planner model marks weak. This is not a signal reading. */
export function coverageOverview(plan: MeshPlan | null): CoverageOverview {
  const empty: CoverageOverview = { status: "unavailable", floorName: null, band: "5", weakPercent: null, nodeCount: 0 };
  if (!plan) return empty;
  const floor = plan.floors.find((item) => item.id === plan.activeFloorId) ?? plan.floors[0];
  const nodeCount = plan.floors.reduce((sum, level) => sum + level.nodes.length, 0);
  if (!floor || nodeCount === 0) return { ...empty, floorName: floor?.name ?? null, nodeCount };
  const floorIndex = Math.max(0, plan.floors.findIndex((item) => item.id === floor.id));
  const cells = estimateCoverage({
    widthFt: floor.widthFt,
    heightFt: floor.heightFt,
    floorIndex,
    rooms: floor.rooms,
    walls: floor.walls ?? [],
    band: "5",
    nodeFloors: plan.floors.flatMap((level, index) => level.nodes.map((node) => ({ node, floorIndex: index }))),
    cellFt: 4,
  });
  const inside = cells.filter((cell) => cell.inside !== false);
  if (inside.length === 0) return { ...empty, floorName: floor.name, nodeCount };
  const weak = inside.filter((cell) => cell.level === "weak" || cell.level === "dead").length;
  return {
    status: "estimated",
    floorName: floor.name,
    band: "5",
    weakPercent: Math.round((100 * weak) / inside.length),
    nodeCount,
  };
}
