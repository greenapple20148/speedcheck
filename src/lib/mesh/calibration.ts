import type { MeshFloor, MeshPoint } from "@/lib/mesh/types";

/**
 * Two-point calibration rescales the floor from the origin so the distance
 * between the two points matches a known length. Rooms, nodes, walls, outlets,
 * and the image offset scale with it. This does not measure signal.
 */

const DIM_MIN = 8;
const DIM_MAX = 300;
const COORD_MAX = 400;

export function measuredDistance(a: MeshPoint, b: MeshPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function calibrationFactor(measuredFt: number, knownFt: number): number | null {
  if (!Number.isFinite(measuredFt) || !Number.isFinite(knownFt)) return null;
  if (measuredFt < 0.5 || knownFt < 1 || knownFt > 500) return null;
  const factor = knownFt / measuredFt;
  if (factor < 0.05 || factor > 20) return null;
  return factor;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function scaleFloorAboutOrigin(
  floor: MeshFloor,
  factor: number,
): { ok: true; floor: MeshFloor } | { ok: false; error: string } {
  if (!Number.isFinite(factor) || factor <= 0) return { ok: false, error: "Enter a distance this plan can scale to." };
  const widthFt = round2(floor.widthFt * factor);
  const heightFt = round2(floor.heightFt * factor);
  if (widthFt < DIM_MIN || heightFt < DIM_MIN || widthFt > DIM_MAX || heightFt > DIM_MAX) {
    return { ok: false, error: "That distance would put the floor outside the 8–300 ft range." };
  }
  const scale = (value: number) => {
    const next = round2(value * factor);
    if (next < 0 || next > COORD_MAX) return null;
    return next;
  };
  const rooms = [];
  for (const room of floor.rooms) {
    const x = scale(room.x);
    const y = scale(room.y);
    const w = scale(room.w);
    const h = scale(room.h);
    if (x == null || y == null || w == null || h == null || w < 1 || h < 1 || w > 200 || h > 200) {
      return { ok: false, error: "That distance would push a room outside the plan limits." };
    }
    const points = room.points?.map((point) => {
      const px = scale(point.x);
      const py = scale(point.y);
      return px == null || py == null ? null : { x: px, y: py };
    });
    if (points?.some((point) => point == null)) return { ok: false, error: "That distance would push a room outside the plan limits." };
    rooms.push({ ...room, x, y, w, h, points: points?.filter((point): point is MeshPoint => point != null) });
  }
  const nodes = [];
  for (const node of floor.nodes) {
    const x = scale(node.x);
    const y = scale(node.y);
    if (x == null || y == null) return { ok: false, error: "That distance would push a node outside the plan limits." };
    nodes.push({ ...node, x, y });
  }
  const outlets = [];
  for (const outlet of floor.outlets) {
    const x = scale(outlet.x);
    const y = scale(outlet.y);
    if (x == null || y == null) return { ok: false, error: "That distance would push an outlet outside the plan limits." };
    outlets.push({ ...outlet, x, y });
  }
  const walls = [];
  for (const wall of floor.walls ?? []) {
    const x1 = scale(wall.x1);
    const y1 = scale(wall.y1);
    const x2 = scale(wall.x2);
    const y2 = scale(wall.y2);
    if (x1 == null || y1 == null || x2 == null || y2 == null) {
      return { ok: false, error: "That distance would push a wall outside the plan limits." };
    }
    walls.push({ ...wall, x1, y1, x2, y2 });
  }
  const offsetX = floor.image?.offsetX == null ? undefined : scale(floor.image.offsetX);
  const offsetY = floor.image?.offsetY == null ? undefined : scale(floor.image.offsetY);
  if (floor.image?.offsetX != null && offsetX == null) return { ok: false, error: "That distance would push the image outside the plan limits." };
  if (floor.image?.offsetY != null && offsetY == null) return { ok: false, error: "That distance would push the image outside the plan limits." };
  return {
    ok: true,
    floor: {
      ...floor,
      widthFt,
      heightFt,
      rooms,
      nodes,
      outlets,
      walls,
      image: floor.image ? { ...floor.image, offsetX: offsetX ?? undefined, offsetY: offsetY ?? undefined } : undefined,
    },
  };
}

export function applyDistanceCalibration(
  floor: MeshFloor,
  a: MeshPoint,
  b: MeshPoint,
  knownFt: number,
): { ok: true; floor: MeshFloor } | { ok: false; error: string } {
  const factor = calibrationFactor(measuredDistance(a, b), knownFt);
  if (factor == null) return { ok: false, error: "Those two points need a longer known distance." };
  return scaleFloorAboutOrigin(floor, factor);
}

export function imageSettings(floor: MeshFloor): { opacity: number; rotation: number; scale: number; offsetX: number; offsetY: number } {
  return {
    opacity: floor.image?.opacity ?? 0.45,
    rotation: floor.image?.rotation ?? 0,
    scale: floor.image?.scale ?? 1,
    offsetX: floor.image?.offsetX ?? 0,
    offsetY: floor.image?.offsetY ?? 0,
  };
}
