import { MATERIAL_DB, OPEN_LOSS_PER_FT } from "@/lib/mesh/assumptions";
import type { CoverageCell, CoverageLevel, MeshNode, MeshRoom, WifiBand } from "@/lib/mesh/types";

function levelFor(score: number): CoverageLevel {
  if (score >= 62) return "strong";
  if (score >= 40) return "moderate";
  if (score >= 18) return "weak";
  return "dead";
}

function roomAt(rooms: MeshRoom[], x: number, y: number): MeshRoom | null {
  return rooms.find((room) => x >= room.x && x <= room.x + room.w && y >= room.y && y <= room.y + room.h) ?? null;
}

/** Each time the path enters a room, add that room’s typical wall loss once. */
export function wallLossDb(rooms: MeshRoom[], ax: number, ay: number, bx: number, by: number): number {
  const distance = Math.hypot(bx - ax, by - ay);
  const steps = Math.max(1, Math.ceil(distance));
  let previous: string | null = null;
  let db = 0;
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const room = roomAt(rooms, ax + (bx - ax) * t, ay + (by - ay) * t);
    const id = room?.id ?? null;
    if (room && id !== previous) db += MATERIAL_DB[room.material].typical;
    previous = id;
  }
  return db;
}

export function estimateCoverage(input: {
  widthFt: number;
  heightFt: number;
  floorIndex: number;
  nodeFloors: Array<{ node: MeshNode; floorIndex: number }>;
  rooms: MeshRoom[];
  band: WifiBand;
  cellFt?: number;
}): CoverageCell[] {
  const cell = input.cellFt ?? 4;
  const loss = OPEN_LOSS_PER_FT[input.band];
  const cells: CoverageCell[] = [];
  for (let y = cell / 2; y < input.heightFt; y += cell) {
    for (let x = cell / 2; x < input.widthFt; x += cell) {
      let best = 0;
      for (const placed of input.nodeFloors) {
        const floorsAway = Math.abs(placed.floorIndex - input.floorIndex);
        const distance = Math.hypot(placed.node.x - x, placed.node.y - y);
        const walls = floorsAway === 0 ? wallLossDb(input.rooms, placed.node.x, placed.node.y, x, y) : 0;
        const score = (floorsAway === 0 ? 100 : 70) - distance * loss - walls * 1.4 - floorsAway * 14;
        if (score > best) best = score;
      }
      cells.push({ x, y, score: Math.round(best), level: input.nodeFloors.length ? levelFor(best) : "dead" });
    }
  }
  return cells;
}
