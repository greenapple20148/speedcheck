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

/**
 * Continuous color for the heuristic score. Stops sit on the same thresholds
 * as levelFor (18 weak, 40 moderate, 62 strong): very weak red, weak orange,
 * moderate yellow, then light green into strong teal.
 * This does not change the score, and it is not a dBm reading.
 */
const COVERAGE_STOPS: Array<{ at: number; rgb: [number, number, number] }> = [
  { at: 0, rgb: [239, 68, 68] },
  { at: 18, rgb: [249, 115, 22] },
  { at: 40, rgb: [234, 179, 8] },
  { at: 62, rgb: [132, 204, 22] },
  { at: 100, rgb: [0, 134, 106] },
];

export function coverageFill(score: number, opacity = 0.62): string {
  const value = Math.max(0, Math.min(100, Number.isFinite(score) ? score : 0));
  let index = 0;
  while (index < COVERAGE_STOPS.length - 2 && value > (COVERAGE_STOPS[index + 1]?.at ?? 100)) index += 1;
  const start = COVERAGE_STOPS[index] ?? COVERAGE_STOPS[0];
  const end = COVERAGE_STOPS[index + 1] ?? start;
  const span = (end?.at ?? 1) - (start?.at ?? 0) || 1;
  const amount = (value - (start?.at ?? 0)) / span;
  const rgb = (start?.rgb ?? [0, 0, 0]).map((channel, channelIndex) =>
    Math.round(channel + (((end?.rgb[channelIndex] ?? channel) - channel) * amount)),
  );
  const alpha = Math.max(0, Math.min(1, opacity));
  return `rgba(${rgb.join(", ")}, ${alpha.toFixed(2)})`;
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
