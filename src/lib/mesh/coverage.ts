import { MATERIAL_DB, OPEN_LOSS_PER_FT } from "@/lib/mesh/assumptions";
import { pointInRoom, segmentsCross } from "@/lib/mesh/geometry";
import type { CoverageCell, CoverageLevel, MeshNode, MeshRoom, MeshWall, WifiBand } from "@/lib/mesh/types";

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

export function explicitWallLossDb(walls: MeshWall[], ax: number, ay: number, bx: number, by: number): number {
  let db = 0;
  for (const wall of walls) {
    if (wall.opening) continue;
    if (segmentsCross(ax, ay, bx, by, wall.x1, wall.y1, wall.x2, wall.y2)) {
      db += MATERIAL_DB[wall.material].typical;
    }
  }
  return db;
}

/** Continuous planning color from weak to strong. This is not a dBm reading. */
export function coverageFill(score: number): string {
  const t = Math.max(0, Math.min(100, score)) / 100;
  const red: [number, number, number] = [248, 113, 113];
  const amber: [number, number, number] = [250, 204, 21];
  const teal: [number, number, number] = [20, 184, 166];
  const mix = (a: [number, number, number], b: [number, number, number], amount: number) =>
    a.map((channel, index) => Math.round(channel + ((b[index] ?? channel) - channel) * amount));
  const rgb = t > 0.55 ? mix(amber, teal, (t - 0.55) / 0.45) : mix(red, amber, t / 0.55);
  return `rgba(${rgb.join(",")},${(0.34 + t * 0.38).toFixed(2)})`;
}

export function estimateCoverage(input: {
  widthFt: number;
  heightFt: number;
  floorIndex: number;
  nodeFloors: Array<{ node: MeshNode; floorIndex: number }>;
  rooms: MeshRoom[];
  walls?: MeshWall[];
  band: WifiBand;
  cellFt?: number;
}): CoverageCell[] {
  const cell = input.cellFt ?? 2;
  const loss = OPEN_LOSS_PER_FT[input.band];
  const walls = input.walls ?? [];
  const maskToRooms = input.rooms.length > 0;
  const cells: CoverageCell[] = [];
  for (let y = cell / 2; y < input.heightFt; y += cell) {
    for (let x = cell / 2; x < input.widthFt; x += cell) {
      const inside = !maskToRooms || input.rooms.some((room) => pointInRoom(room, x, y));
      let best = 0;
      if (inside) {
        for (const placed of input.nodeFloors) {
          const floorsAway = Math.abs(placed.floorIndex - input.floorIndex);
          const distance = Math.hypot(placed.node.x - x, placed.node.y - y);
          const roomLoss = floorsAway === 0 ? wallLossDb(input.rooms, placed.node.x, placed.node.y, x, y) : 0;
          const drawnLoss = floorsAway === 0 ? explicitWallLossDb(walls, placed.node.x, placed.node.y, x, y) : 0;
          const score = (floorsAway === 0 ? 100 : 70) - distance * loss - (roomLoss + drawnLoss) * 1.4 - floorsAway * 14;
          if (score > best) best = score;
        }
      }
      cells.push({
        x,
        y,
        score: Math.round(best),
        level: !inside || input.nodeFloors.length === 0 ? "dead" : levelFor(best),
        inside,
      });
    }
  }
  return cells;
}
