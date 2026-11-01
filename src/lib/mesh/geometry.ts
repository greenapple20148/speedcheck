import type { MeshPoint, MeshRoom, MeshWall } from "@/lib/mesh/types";

export function snapFt(value: number, max: number, grid = 1): number {
  if (!Number.isFinite(value)) return 0;
  const snapped = Math.round(value / grid) * grid;
  return Math.min(max, Math.max(0, snapped));
}

/** Map a pointer position inside an SVG box into floor feet. */
export function clientToFeet(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  widthFt: number,
  heightFt: number,
): { x: number; y: number } {
  const width = rect.width || 1;
  const height = rect.height || 1;
  return {
    x: ((clientX - rect.left) / width) * widthFt,
    y: ((clientY - rect.top) / height) * heightFt,
  };
}

export function feetPerPixel(widthFt: number, pixelWidth: number): number {
  if (!Number.isFinite(widthFt) || !Number.isFinite(pixelWidth) || pixelWidth <= 0) return 0;
  return widthFt / pixelWidth;
}

export function roomPoints(room: MeshRoom): MeshPoint[] {
  if (room.points && room.points.length >= 3) return room.points;
  return [
    { x: room.x, y: room.y },
    { x: room.x + room.w, y: room.y },
    { x: room.x + room.w, y: room.y + room.h },
    { x: room.x, y: room.y + room.h },
  ];
}

export function pointInRoom(room: MeshRoom, x: number, y: number): boolean {
  return pointInPolygon(x, y, roomPoints(room));
}

export function pointInPolygon(x: number, y: number, points: MeshPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const xi = points[i]?.x ?? 0;
    const yi = points[i]?.y ?? 0;
    const xj = points[j]?.x ?? 0;
    const yj = points[j]?.y ?? 0;
    const crosses = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-9) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

export function segmentsCross(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  dx: number,
  dy: number,
): boolean {
  const rx = bx - ax;
  const ry = by - ay;
  const sx = dx - cx;
  const sy = dy - cy;
  const denom = rx * sy - ry * sx;
  if (Math.abs(denom) < 1e-9) return false;
  const qpx = cx - ax;
  const qpy = cy - ay;
  const t = (qpx * sy - qpy * sx) / denom;
  const u = (qpx * ry - qpy * rx) / denom;
  return t > 0.02 && t < 0.98 && u > 0.02 && u < 0.98;
}

export function boundsOf(points: MeshPoint[]): { x: number; y: number; w: number; h: number } {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { x: minX, y: minY, w: Math.max(1, Math.max(...xs) - minX), h: Math.max(1, Math.max(...ys) - minY) };
}

export function wallLength(wall: Pick<MeshWall, "x1" | "y1" | "x2" | "y2">): number {
  return Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
}
