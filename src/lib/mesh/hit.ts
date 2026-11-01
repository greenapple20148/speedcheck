import { pointInPolygon, roomPoints } from "@/lib/mesh/geometry";
import type { MeshFloor, MeshRoom } from "@/lib/mesh/types";

export type PlanHit = { kind: "room" | "node" | "outlet" | "wall"; id: string } | null;

export function hitTestFloor(floor: MeshFloor, x: number, y: number, reach = { node: 1.6, outlet: 1.2, wall: 0.8 }): PlanHit {
  const near = (ax: number, ay: number, radius: number) => Math.hypot(ax - x, ay - y) <= radius;
  const node = [...floor.nodes].reverse().find((item) => near(item.x, item.y, reach.node));
  if (node) return { kind: "node", id: node.id };
  const outlet = [...floor.outlets].reverse().find((item) => near(item.x, item.y, reach.outlet));
  if (outlet) return { kind: "outlet", id: outlet.id };
  const wall = [...(floor.walls ?? [])].reverse().find((item) => distanceToSegment(x, y, item.x1, item.y1, item.x2, item.y2) < reach.wall);
  if (wall) return { kind: "wall", id: wall.id };
  const room = [...floor.rooms].reverse().find((item) => roomHit(item, x, y));
  return room ? { kind: "room", id: room.id } : null;
}

function roomHit(room: MeshRoom, x: number, y: number): boolean {
  const points = roomPoints(room);
  const inside = pointInPolygon(x, y, points);
  if (inside) return true;
  return points.some((point, index) => {
    const next = points[(index + 1) % points.length];
    if (!next) return false;
    return distanceToSegment(x, y, point.x, point.y, next.x, next.y) < 0.6;
  });
}

function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const length = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / length));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
