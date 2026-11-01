import type { MeshNode, WifiBand } from "@/lib/mesh/types";

const FAR_FT: Record<WifiBand, number> = { "2.4": 55, "5": 40, "6": 28 };

/** Spacing notes for the nodes on one floor. These are planning hints, not a survey. */
export function spacingWarnings(nodes: MeshNode[], band: WifiBand): string[] {
  const notes: string[] = [];
  for (const node of nodes) {
    const others = nodes.filter((item) => item.id !== node.id);
    if (others.length === 0) continue;
    let nearest = others[0];
    let distance = Number.POSITIVE_INFINITY;
    for (const other of others) {
      const gap = Math.hypot(node.x - other.x, node.y - other.y);
      if (gap < distance) {
        distance = gap;
        nearest = other;
      }
    }
    if (!nearest || !Number.isFinite(distance)) continue;
    if (distance < 8) {
      notes.push(`${node.name} is about ${Math.round(distance)} ft from ${nearest.name}. Nodes this close can overlap.`);
    } else if (distance > FAR_FT[band] && node.link !== "wired" && nearest.link !== "wired") {
      notes.push(`${node.name} is about ${Math.round(distance)} ft from ${nearest.name}. A wireless hop on ${band} GHz may be weak here.`);
    }
  }
  return [...new Set(notes)].slice(0, 3);
}
