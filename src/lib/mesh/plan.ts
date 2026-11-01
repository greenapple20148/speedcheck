import type { MeshFloor, MeshHome, MeshPlan } from "@/lib/mesh/types";
import { MESH_SCHEMA_VERSION } from "@/lib/mesh/types";

export function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `m_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
}

export function emptyFloor(name = "Floor 1"): MeshFloor {
  return {
    id: newId(),
    name,
    widthFt: 40,
    heightFt: 30,
    rooms: [],
    nodes: [],
    outlets: [],
    walls: [],
    imageDataUrl: null,
  };
}

export function defaultHome(): MeshHome {
  return {
    area: 1200,
    unit: "sqft",
    floors: 1,
    construction: "drywall",
    devices: 15,
    ispMbps: null,
    connection: "unknown",
    usage: [],
    networkName: "",
    brandSlug: "generic",
    backhaul: "unknown",
    coax: false,
  };
}

export function emptyPlan(): MeshPlan {
  const floor = emptyFloor();
  return {
    schemaVersion: MESH_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    wizardStep: 0,
    home: defaultHome(),
    floors: [floor],
    activeFloorId: floor.id,
    measurements: [],
    checkedSetup: [],
  };
}

export function duplicateFloor(source: MeshFloor): MeshFloor {
  return {
    id: newId(),
    name: `${source.name} copy`.slice(0, 40),
    widthFt: source.widthFt,
    heightFt: source.heightFt,
    rooms: source.rooms.map((room) => ({ ...room, id: newId(), points: room.points?.map((point) => ({ ...point })) })),
    nodes: source.nodes.map((node) => ({ ...node, id: newId() })),
    outlets: source.outlets.map((outlet) => ({ ...outlet, id: newId() })),
    walls: (source.walls ?? []).map((wall) => ({ ...wall, id: newId() })),
    imageDataUrl: source.imageDataUrl ?? null,
  };
}

export function areaSqFt(area: number, unit: "sqft" | "sqm"): number {
  if (!Number.isFinite(area) || area <= 0) return 0;
  return unit === "sqm" ? area * 10.7639 : area;
}
