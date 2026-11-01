import { estimateCoverage } from "@/lib/mesh/coverage";
import { pointInRoom } from "@/lib/mesh/geometry";
import { coverageShares, pointDelta } from "@/lib/mesh/insights";
import { newId } from "@/lib/mesh/plan";
import type { CoverageCell, MeshFloor, MeshNode, MeshPoint, MeshRoom, WifiBand } from "@/lib/mesh/types";

/**
 * Placement ideas from the floor and the same coverage heuristic.
 * Deltas are percentage points of modeled area, not throughput and not guaranteed.
 */
export interface PlacementSuggestion {
  id: string;
  node: MeshNode;
  reason: string;
  tradeoff: string;
  roomName: string | null;
  acceptablePointDelta: number | null;
  weakPointDelta: number | null;
}

export function suggestPlacements(input: {
  floor: MeshFloor;
  floorIndex: number;
  nodeFloors: Array<{ node: MeshNode; floorIndex: number }>;
  band: WifiBand;
  cells: CoverageCell[];
  cellFt?: number;
}): PlacementSuggestion[] {
  const cellFt = input.cellFt ?? 2;
  const baseline = coverageShares(input.cells);
  const hasNodes = input.nodeFloors.length > 0;
  const spots = candidateSpots(input.floor, input.cells);
  const suggestions: PlacementSuggestion[] = [];
  for (const spot of spots) {
    const node: MeshNode = {
      id: newId(),
      name: input.floor.nodes.length === 0 && suggestions.length === 0 ? "Primary" : `Node ${input.floor.nodes.length + suggestions.length + 1}`,
      x: spot.x,
      y: spot.y,
      role: input.floor.nodes.length === 0 && suggestions.length === 0 ? "primary" : "satellite",
      link: spot.preferWired || (input.floor.nodes.length === 0 && suggestions.length === 0) ? "wired" : "wireless",
      band: input.band,
    };
    const proposed = estimateCoverage({
      widthFt: input.floor.widthFt,
      heightFt: input.floor.heightFt,
      floorIndex: input.floorIndex,
      rooms: input.floor.rooms,
      walls: input.floor.walls ?? [],
      band: input.band,
      cellFt,
      nodeFloors: [...input.nodeFloors, { node, floorIndex: input.floorIndex }],
    });
    const shares = coverageShares(proposed);
    suggestions.push({
      id: node.id,
      node,
      reason: spot.reason,
      tradeoff: spot.tradeoff,
      roomName: spot.roomName,
      acceptablePointDelta: hasNodes || baseline.acceptableShare != null ? pointDelta(shares.acceptableShare, baseline.acceptableShare) : null,
      weakPointDelta: hasNodes || baseline.weakShare != null ? pointDelta(shares.weakShare, baseline.weakShare) : null,
    });
  }
  return suggestions.slice(0, 3);
}

interface Spot {
  x: number;
  y: number;
  reason: string;
  tradeoff: string;
  roomName: string | null;
  preferWired?: boolean;
}

function candidateSpots(floor: MeshFloor, cells: CoverageCell[]): Spot[] {
  const spots: Spot[] = [];
  const weak = cells.filter((cell) => cell.inside !== false && (cell.level === "weak" || cell.level === "dead"));
  if (floor.nodes.length === 0) {
    const room = largestRoom(floor.rooms);
    const point = clampPoint(room ? { x: room.x + room.w / 2, y: room.y + room.h / 2 } : { x: floor.widthFt / 2, y: floor.heightFt / 2 }, floor);
    spots.push({
      ...point,
      roomName: room?.name ?? null,
      reason: room
        ? `${room.name} is the largest drawn room, so it is a starting point for the primary router.`
        : "The middle of the floor is a starting point until rooms are drawn.",
      tradeoff: "Put the primary router near the modem when you can. This spot is only a planning estimate.",
    });
    return spots;
  }

  const ranked = floor.rooms
    .map((room) => {
      const inside = cells.filter((cell) => cell.inside !== false && pointInRoom(room, cell.x, cell.y));
      const weakCount = inside.filter((cell) => cell.level === "weak" || cell.level === "dead").length;
      return { room, inside: inside.length, share: inside.length ? weakCount / inside.length : 0 };
    })
    .filter((item) => item.inside > 0 && item.share >= 0.34)
    .sort((a, b) => b.share - a.share);

  const worst = ranked[0];
  if (worst) {
    const roomWeak = weak.filter((cell) => pointInRoom(worst.room, cell.x, cell.y));
    const center = centroid(roomWeak.length ? roomWeak : [{ x: worst.room.x + worst.room.w / 2, y: worst.room.y + worst.room.h / 2 }]);
    const point = avoidNodes(center, floor);
    spots.push({
      ...point,
      roomName: worst.room.name,
      reason: `${worst.room.name} has the largest share of modeled area marked weak or very weak.`,
      tradeoff: "Furniture and appliances are not in the model. Test the room before adding hardware.",
    });
  }

  if (weak.length >= 3) {
    const point = avoidNodes(centroid(weak), floor);
    if (!spots.some((spot) => Math.hypot(spot.x - point.x, spot.y - point.y) < 5)) {
      spots.push({
        ...point,
        roomName: floor.rooms.find((room) => pointInRoom(room, point.x, point.y))?.name ?? null,
        reason: "This is near the center of the modeled area the estimate marks weak or very weak.",
        tradeoff: "A node here can overlap coverage you already have. The estimate does not prove the hop will be stable.",
      });
    }
  }

  const weakCenter = weak.length ? centroid(weak) : { x: floor.widthFt / 2, y: floor.heightFt / 2 };
  const outlet = [...floor.outlets]
    .filter((item) => floor.nodes.every((node) => Math.hypot(node.x - item.x, node.y - item.y) > 3))
    .sort((a, b) => Math.hypot(a.x - weakCenter.x, a.y - weakCenter.y) - Math.hypot(b.x - weakCenter.x, b.y - weakCenter.y))[0];
  if (outlet && spots.length < 3) {
    const point = clampPoint(outlet, floor);
    if (!spots.some((spot) => Math.hypot(spot.x - point.x, spot.y - point.y) < 4)) {
      spots.push({
        ...point,
        roomName: floor.rooms.find((room) => pointInRoom(room, point.x, point.y))?.name ?? null,
        preferWired: true,
        reason: "A marked outlet is open here, which is a practical place if that outlet has Ethernet.",
        tradeoff: "The planner cannot tell whether the outlet is wired. Set backhaul to wired only if Ethernet is really there.",
      });
    }
  }
  return spots.slice(0, 3);
}

function largestRoom(rooms: MeshRoom[]): MeshRoom | null {
  return rooms.reduce<MeshRoom | null>((best, room) => (best == null || room.w * room.h > best.w * best.h ? room : best), null);
}

function centroid(points: MeshPoint[]): MeshPoint {
  const count = points.length || 1;
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / count,
    y: points.reduce((sum, point) => sum + point.y, 0) / count,
  };
}

function avoidNodes(point: MeshPoint, floor: MeshFloor): MeshPoint {
  let next = clampPoint(point, floor);
  const nearest = floor.nodes.reduce<{ node: MeshNode; distance: number } | null>((best, node) => {
    const distance = Math.hypot(node.x - next.x, node.y - next.y);
    return best == null || distance < best.distance ? { node, distance } : best;
  }, null);
  if (nearest && nearest.distance < 6) {
    const dx = next.x - nearest.node.x;
    const dy = next.y - nearest.node.y;
    const length = Math.hypot(dx, dy) || 1;
    next = clampPoint({ x: nearest.node.x + (dx / length) * 6, y: nearest.node.y + (dy / length) * 6 }, floor);
    if (Math.hypot(next.x - nearest.node.x, next.y - nearest.node.y) < 5) {
      next = clampPoint({ x: nearest.node.x + 6, y: nearest.node.y }, floor);
    }
  }
  return { x: snap(next.x, floor.widthFt), y: snap(next.y, floor.heightFt) };
}

function clampPoint(point: MeshPoint, floor: MeshFloor): MeshPoint {
  return {
    x: Math.min(Math.max(0, point.x), floor.widthFt),
    y: Math.min(Math.max(0, point.y), floor.heightFt),
  };
}

function snap(value: number, max: number): number {
  return Math.min(max, Math.max(0, Math.round(value)));
}
