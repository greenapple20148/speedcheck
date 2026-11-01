import { newId } from "@/lib/mesh/plan";
import type { MeshFloor, MeshRoom } from "@/lib/mesh/types";

function room(name: string, x: number, y: number, w: number, h: number, priority = false): MeshRoom {
  return { id: newId(), name, x, y, w, h, material: "drywall", priority, problem: false };
}

/** A small labeled plan so the first screen is a home, not a blank sheet. */
export function sampleFloor(id: string, name = "Floor 1"): MeshFloor {
  return {
    id,
    name,
    widthFt: 36,
    heightFt: 30,
    rooms: [
      room("Living room", 2, 2, 16, 14, true),
      room("Bedroom", 18, 2, 16, 14),
      room("Office", 2, 16, 10, 12, true),
      room("Kitchen", 12, 16, 22, 12),
    ],
    nodes: [
      { id: newId(), name: "Primary", x: 10, y: 9, role: "primary", link: "wired", band: "5" },
      { id: newId(), name: "Node 2", x: 24, y: 22, role: "satellite", link: "wireless", band: "5" },
    ],
    outlets: [{ id: newId(), x: 4, y: 8 }],
    walls: [
      { id: newId(), x1: 18, y1: 2, x2: 18, y2: 16, material: "drywall", opening: false },
      { id: newId(), x1: 8, y1: 16, x2: 14, y2: 16, material: "drywall", opening: true },
    ],
    imageDataUrl: null,
  };
}
