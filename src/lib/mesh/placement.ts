import type { MeshFloor, MeshNode } from "@/lib/mesh/types";
import { newId } from "@/lib/mesh/plan";

export interface PlacementOption {
  id: string;
  title: string;
  why: string;
  nodes: MeshNode[];
}

function node(name: string, x: number, y: number, role: MeshNode["role"]): MeshNode {
  return { id: newId(), name, x: round(x), y: round(y), role };
}

function round(n: number): number {
  return Math.round(n);
}

function clamp(n: number, max: number): number {
  return Math.min(Math.max(2, n), Math.max(2, max - 2));
}

/** A few understandable layouts. Not a proof of the best possible placement. */
export function placementOptions(floor: MeshFloor, count: number): PlacementOption[] {
  const n = Math.min(6, Math.max(1, Math.floor(count) || 1));
  const w = floor.widthFt;
  const h = floor.heightFt;
  const cx = w / 2;
  const cy = h / 2;

  const spread: MeshNode[] = [node("Primary", cx, cy, "primary")];
  for (let i = 1; i < n; i += 1) {
    const t = i / n;
    spread.push(node(`Node ${i + 1}`, clamp(w * (0.2 + 0.6 * t), w), clamp(i % 2 === 0 ? h * 0.25 : h * 0.75, h), "satellite"));
  }

  const fewest: MeshNode[] = [];
  for (let i = 0; i < Math.min(n, 2); i += 1) {
    fewest.push(node(i === 0 ? "Primary" : "Node 2", clamp(w * (i === 0 ? 0.35 : 0.7), w), cy, i === 0 ? "primary" : "satellite"));
  }

  const wired = floor.outlets.length
    ? floor.outlets.slice(0, n).map((outlet, index) =>
        node(index === 0 ? "Primary" : `Node ${index + 1}`, outlet.x, outlet.y, index === 0 ? "primary" : "satellite"),
      )
    : [node("Primary", cx, cy, "primary")];

  const priority = floor.rooms.filter((room) => room.priority);
  const work: MeshNode[] = [node("Primary", cx, cy, "primary")];
  priority.slice(0, Math.max(0, n - 1)).forEach((room, index) => {
    work.push(node(`Node ${index + 2}`, room.x + room.w / 2, room.y + room.h / 2, "satellite"));
  });

  return [
    {
      id: "coverage",
      title: "Wider estimated coverage",
      why: "Nodes are spaced along the floor so estimated overlap stays moderate. Measure the far rooms before treating this as final.",
      nodes: spread,
    },
    {
      id: "fewest",
      title: "Fewer nodes",
      why: "Starts with one or two nodes. Add another only where a room test is slow.",
      nodes: fewest,
    },
    {
      id: "wired",
      title: "Near marked Ethernet",
      why: floor.outlets.length
        ? "Puts nodes on outlets you marked, which is the usual place for Ethernet backhaul."
        : "No Ethernet outlets are marked on this floor, so this option stays at the center until you add some.",
      nodes: wired,
    },
    {
      id: "work",
      title: "Priority rooms",
      why: priority.length
        ? "Keeps the primary node central and moves satellites toward rooms you marked as priority."
        : "No priority rooms are marked, so this option stays at the center.",
      nodes: work,
    },
  ];
}
