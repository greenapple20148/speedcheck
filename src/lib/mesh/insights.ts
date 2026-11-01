import { pointInRoom, segmentsCross } from "@/lib/mesh/geometry";
import type { CoverageCell, CoverageLevel, MeshNode, MeshRoom, MeshWall } from "@/lib/mesh/types";

/**
 * Acceptable estimated coverage means the heuristic score is strong or moderate
 * (40 or higher). Weak zones are weak or very weak. These are not RSSI bands.
 */
export const COVERAGE_LEGEND: Array<{ level: CoverageLevel; label: string; color: string }> = [
  { level: "strong", label: "Strong", color: "#00866A" },
  { level: "moderate", label: "Moderate", color: "#EAB308" },
  { level: "weak", label: "Weak", color: "#F97316" },
  { level: "dead", label: "Very weak", color: "#EF4444" },
];

export function coverageLabel(level: CoverageLevel): string {
  return COVERAGE_LEGEND.find((item) => item.level === level)?.label ?? level;
}

export interface CoverageShares {
  modeled: number;
  counts: Record<CoverageLevel, number>;
  /** Null when no cells were modeled. */
  shares: Record<CoverageLevel, number> | null;
  acceptableShare: number | null;
  weakShare: number | null;
}

const EMPTY_COUNTS: Record<CoverageLevel, number> = { strong: 0, moderate: 0, weak: 0, dead: 0 };

export function coverageShares(cells: CoverageCell[]): CoverageShares {
  const modeled = cells.filter((cell) => cell.inside !== false);
  const counts = { ...EMPTY_COUNTS };
  for (const cell of modeled) counts[cell.level] += 1;
  if (modeled.length === 0) {
    return { modeled: 0, counts, shares: null, acceptableShare: null, weakShare: null };
  }
  const shares = {
    strong: counts.strong / modeled.length,
    moderate: counts.moderate / modeled.length,
    weak: counts.weak / modeled.length,
    dead: counts.dead / modeled.length,
  };
  return {
    modeled: modeled.length,
    counts,
    shares,
    acceptableShare: shares.strong + shares.moderate,
    weakShare: shares.weak + shares.dead,
  };
}

/** Percentage-point difference. Null when either side was not modeled. */
export function pointDelta(next: number | null, previous: number | null): number | null {
  if (next == null || previous == null) return null;
  return Math.round((next - previous) * 1000) / 10;
}

export function formatShare(share: number | null): string | null {
  if (share == null || !Number.isFinite(share)) return null;
  return `${Math.round(share * 100)}%`;
}

export interface MeshLink {
  fromId: string;
  toId: string;
  wired: boolean;
}

/** Drawn backhaul hops. A primary with no parent is the root and is not a hop. */
export function meshLinks(nodes: MeshNode[]): MeshLink[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const links: MeshLink[] = [];
  const seen = new Set<string>();
  for (const node of nodes) {
    if (!node.parentId && node.role === "primary") continue;
    const explicit = node.parentId ? byId.get(node.parentId) : undefined;
    const parent = explicit && explicit.id !== node.id ? explicit : nearestNode(node, nodes)?.node;
    if (!parent || parent.id === node.id) continue;
    const key = [node.id, parent.id].sort().join(":");
    const existing = links.find((link) => [link.fromId, link.toId].sort().join(":") === key);
    if (seen.has(key) && existing) {
      if (node.link === "wired") existing.wired = true;
      continue;
    }
    seen.add(key);
    links.push({ fromId: node.id, toId: parent.id, wired: node.link === "wired" });
  }
  return links;
}

export function backhaulCounts(nodes: MeshNode[]): { wired: number; wireless: number } {
  const links = meshLinks(nodes);
  return {
    wired: links.filter((link) => link.wired).length,
    wireless: links.filter((link) => !link.wired).length,
  };
}

export function nearestNode(node: MeshNode, nodes: MeshNode[]): { node: MeshNode; distanceFt: number } | null {
  let best: MeshNode | null = null;
  let distanceFt = Number.POSITIVE_INFINITY;
  for (const other of nodes) {
    if (other.id === node.id) continue;
    const distance = Math.hypot(node.x - other.x, node.y - other.y);
    if (distance < distanceFt) {
      distanceFt = distance;
      best = other;
    }
  }
  return best ? { node: best, distanceFt } : null;
}

export function connectedParent(node: MeshNode, nodes: MeshNode[]): { node: MeshNode; distanceFt: number } | null {
  if (node.parentId) {
    const parent = nodes.find((item) => item.id === node.parentId);
    if (parent) return { node: parent, distanceFt: Math.hypot(node.x - parent.x, node.y - parent.y) };
  }
  if (node.role === "primary") return null;
  return nearestNode(node, nodes);
}

export function nearestCell(cells: CoverageCell[], x: number, y: number): CoverageCell | null {
  let best: CoverageCell | null = null;
  let gap = 2.4;
  for (const cell of cells) {
    if (cell.inside === false) continue;
    const distance = Math.hypot(cell.x - x, cell.y - y);
    if (distance <= gap) {
      gap = distance;
      best = cell;
    }
  }
  return best;
}

export function drawnWallsBetween(walls: MeshWall[], ax: number, ay: number, bx: number, by: number): number {
  let count = 0;
  for (const wall of walls) {
    if (wall.opening) continue;
    if (segmentsCross(ax, ay, bx, by, wall.x1, wall.y1, wall.x2, wall.y2)) count += 1;
  }
  return count;
}

export interface RoomCoverage {
  level: CoverageLevel | null;
  acceptableShare: number | null;
  weakShare: number | null;
  modeled: number;
}

const LEVEL_RANK: Record<CoverageLevel, number> = { strong: 3, moderate: 2, weak: 1, dead: 0 };

export function roomCoverage(room: MeshRoom, cells: CoverageCell[]): RoomCoverage {
  const inside = cells.filter((cell) => cell.inside !== false && pointInRoom(room, cell.x, cell.y));
  if (inside.length === 0) return { level: null, acceptableShare: null, weakShare: null, modeled: 0 };
  const counts = { ...EMPTY_COUNTS };
  for (const cell of inside) counts[cell.level] += 1;
  let level: CoverageLevel = "dead";
  let best = -1;
  for (const key of Object.keys(counts) as CoverageLevel[]) {
    const count = counts[key];
    if (count > best || (count === best && LEVEL_RANK[key] < LEVEL_RANK[level])) {
      best = count;
      level = key;
    }
  }
  return {
    level,
    acceptableShare: (counts.strong + counts.moderate) / inside.length,
    weakShare: (counts.weak + counts.dead) / inside.length,
    modeled: inside.length,
  };
}

export interface RoomAttention {
  id: string;
  name: string;
  weakShare: number | null;
  reason: string;
}

export function roomsNeedingAttention(rooms: MeshRoom[], cells: CoverageCell[]): RoomAttention[] {
  const notes: RoomAttention[] = [];
  for (const room of rooms) {
    const coverage = roomCoverage(room, cells);
    if (room.problem) {
      notes.push({ id: room.id, name: room.name, weakShare: coverage.weakShare, reason: "Marked as a problem room." });
      continue;
    }
    if (coverage.weakShare != null && coverage.weakShare >= 0.5) {
      notes.push({
        id: room.id,
        name: room.name,
        weakShare: coverage.weakShare,
        reason: "Most of the modeled area in this room is weak or very weak.",
      });
    }
  }
  return notes.slice(0, 4);
}

export interface LayoutComparison {
  acceptablePointDelta: number | null;
  weakPointDelta: number | null;
  currentAcceptable: number | null;
  proposedAcceptable: number | null;
  nodeCount: { current: number; proposed: number };
  backhaul: {
    current: { wired: number; wireless: number };
    proposed: { wired: number; wireless: number };
  };
}

export function compareLayouts(
  current: { nodes: MeshNode[]; shares: CoverageShares },
  proposed: { nodes: MeshNode[]; shares: CoverageShares },
): LayoutComparison {
  return {
    acceptablePointDelta: pointDelta(proposed.shares.acceptableShare, current.shares.acceptableShare),
    weakPointDelta: pointDelta(proposed.shares.weakShare, current.shares.weakShare),
    currentAcceptable: current.shares.acceptableShare,
    proposedAcceptable: proposed.shares.acceptableShare,
    nodeCount: { current: current.nodes.length, proposed: proposed.nodes.length },
    backhaul: { current: backhaulCounts(current.nodes), proposed: backhaulCounts(proposed.nodes) },
  };
}
