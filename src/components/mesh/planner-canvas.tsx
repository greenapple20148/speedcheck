"use client";

import { useEffect, useRef } from "react";
import { coverageFill } from "@/lib/mesh/coverage";
import { roomPoints, wallLength } from "@/lib/mesh/geometry";
import { bestDownloadMbps, throughputBand } from "@/lib/mesh/measurements";
import type { CoverageCell, MeshFloor, RoomMeasurement } from "@/lib/mesh/types";

export type PlannerSelection =
  | { kind: "room" | "node" | "outlet" | "wall"; id: string }
  | null;

export type PlannerOverlay = "estimate" | "download" | "latency";

const DOWNLOAD_FILL = {
  fast: "rgba(20, 184, 166, 0.55)",
  mid: "rgba(251, 191, 36, 0.45)",
  slow: "rgba(248, 113, 113, 0.42)",
  unmeasured: "transparent",
};

export function PlannerCanvas({
  floor,
  cells,
  overlay,
  measurements,
  showCoverage,
  showRooms,
  showNodes,
  showWalls,
  showOutlets,
  selection,
  draft,
  svgRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  floor: MeshFloor;
  cells: CoverageCell[];
  overlay: PlannerOverlay;
  measurements: RoomMeasurement[];
  showCoverage: boolean;
  showRooms: boolean;
  showNodes: boolean;
  showWalls: boolean;
  showOutlets: boolean;
  selection: PlannerSelection;
  draft: { kind: "room" | "wall"; x: number; y: number; x2: number; y2: number } | null;
  svgRef: React.RefObject<SVGSVGElement | null>;
  onPointerDown: (event: React.PointerEvent<SVGSVGElement>) => void;
  onPointerMove: (event: React.PointerEvent<SVGSVGElement>) => void;
  onPointerUp: (event: React.PointerEvent<SVGSVGElement>) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const best = bestDownloadMbps(measurements);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = 480;
    const height = Math.max(1, Math.round((width * floor.heightFt) / floor.widthFt));
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    if (!showCoverage || overlay !== "estimate" || floor.nodes.length === 0) return;
    const paint = cells.filter((cell) => cell.inside !== false);
    ctx.save();
    ctx.filter = "blur(8px)";
    const size = (2 / floor.widthFt) * width * 1.8;
    for (const cell of paint) {
      ctx.fillStyle = coverageFill(cell.score);
      ctx.fillRect((cell.x / floor.widthFt) * width - size / 2, (cell.y / floor.heightFt) * height - size / 2, size, size);
    }
    ctx.filter = "none";
    if (floor.rooms.length > 0) {
      ctx.globalCompositeOperation = "destination-in";
      ctx.beginPath();
      for (const room of floor.rooms) {
        const points = roomPoints(room);
        points.forEach((point, index) => {
          const x = (point.x / floor.widthFt) * width;
          const y = (point.y / floor.heightFt) * height;
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
      }
      ctx.fill();
    }
    ctx.restore();
  }, [cells, floor.heightFt, floor.nodes.length, floor.rooms, floor.widthFt, overlay, showCoverage]);

  const nearest = (nodeId: string) => {
    const node = floor.nodes.find((item) => item.id === nodeId);
    if (!node) return null;
    let bestNode = null as (typeof floor.nodes)[number] | null;
    let gap = Number.POSITIVE_INFINITY;
    for (const other of floor.nodes) {
      if (other.id === node.id) continue;
      const distance = Math.hypot(node.x - other.x, node.y - other.y);
      if (distance < gap) {
        gap = distance;
        bestNode = other;
      }
    }
    return bestNode ? { node: bestNode, wired: node.link === "wired" || bestNode.link === "wired" } : null;
  };

  return (
    <div className="relative h-full w-full">
      {floor.imageDataUrl && (
        <img src={floor.imageDataUrl} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-fill opacity-40" />
      )}
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${floor.widthFt} ${floor.heightFt}`}
        className="absolute inset-0 h-full w-full touch-none"
        role="img"
        aria-label="Floor plan in feet. Drag a node to move it."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <defs>
          <pattern id="mesh-grid" width="2" height="2" patternUnits="userSpaceOnUse">
            <path d="M 2 0 L 0 0 0 2" fill="none" stroke="currentColor" strokeWidth="0.06" opacity="0.45" />
          </pattern>
        </defs>
        <rect width={floor.widthFt} height={floor.heightFt} fill="url(#mesh-grid)" />
        {showRooms && floor.rooms.map((room) => {
          const points = roomPoints(room);
          const selected = selection?.kind === "room" && selection.id === room.id;
          const sample = measurements.find((row) => row.roomId === room.id);
          let fill = "transparent";
          if (overlay === "download") fill = DOWNLOAD_FILL[throughputBand(sample?.downloadMbps, best)];
          if (overlay === "latency") {
            const ping = sample?.pingMs;
            fill = ping == null ? "transparent" : ping < 30 ? "rgba(20, 184, 166, 0.5)" : ping < 80 ? "rgba(251, 191, 36, 0.45)" : "rgba(248, 113, 113, 0.42)";
          }
          const minX = Math.min(...points.map((point) => point.x));
          const maxX = Math.max(...points.map((point) => point.x));
          const minY = Math.min(...points.map((point) => point.y));
          return (
            <g key={room.id}>
              <polygon
                points={points.map((point) => `${point.x},${point.y}`).join(" ")}
                fill={fill}
                stroke={selected ? "var(--primary, #0f766e)" : "currentColor"}
                strokeWidth={selected ? 0.28 : 0.16}
              />
              <text x={(minX + maxX) / 2} y={minY + 1.6} textAnchor="middle" fontSize="1.15" fill="currentColor">
                {room.name}
              </text>
              {selected && points.map((point, index) => (
                <rect key={`${room.id}-${index}`} data-handle={`${room.id}:${index}`} x={point.x - 0.45} y={point.y - 0.45} width="0.9" height="0.9" fill="white" stroke="currentColor" strokeWidth="0.12" />
              ))}
            </g>
          );
        })}
        {showWalls && (floor.walls ?? []).map((wall) => (
          <line
            key={wall.id}
            x1={wall.x1}
            y1={wall.y1}
            x2={wall.x2}
            y2={wall.y2}
            stroke={selection?.kind === "wall" && selection.id === wall.id ? "var(--primary, #0f766e)" : "currentColor"}
            strokeWidth={wall.opening ? 0.28 : 0.45}
            strokeDasharray={wall.opening ? "0.7 0.45" : undefined}
          >
            <title>{wall.opening ? "Opening" : wall.material}, {wallLength(wall).toFixed(0)} ft</title>
          </line>
        ))}
        {showNodes && floor.nodes.filter((node) => node.role === "satellite").map((node) => {
          const hop = nearest(node.id);
          if (!hop) return null;
          return (
            <line
              key={`hop-${node.id}`}
              x1={node.x}
              y1={node.y}
              x2={hop.node.x}
              y2={hop.node.y}
              stroke="currentColor"
              strokeWidth="0.12"
              strokeDasharray={hop.wired ? undefined : "0.55 0.4"}
              opacity="0.7"
            />
          );
        })}
        {showOutlets && floor.outlets.map((outlet) => (
          <rect
            key={outlet.id}
            x={outlet.x - 0.55}
            y={outlet.y - 0.55}
            width="1.1"
            height="1.1"
            fill="#5B6CFF"
            stroke={selection?.kind === "outlet" && selection.id === outlet.id ? "white" : "transparent"}
            strokeWidth="0.15"
          >
            <title>Ethernet outlet</title>
          </rect>
        ))}
        {showNodes && floor.nodes.map((node) => {
          const selected = selection?.kind === "node" && selection.id === node.id;
          const radius = node.role === "primary" ? 1.35 : 1.05;
          return (
            <g key={node.id}>
              <circle cx={node.x} cy={node.y} r={radius + (selected ? 0.35 : 0)} fill="none" stroke="currentColor" strokeWidth={selected ? 0.18 : 0} />
              <circle cx={node.x} cy={node.y} r={radius} fill={node.role === "primary" ? "#0f766e" : "#14C8B4"} />
              <text x={node.x} y={node.y - radius - 0.4} textAnchor="middle" fontSize="1.15" fill="currentColor">{node.name}</text>
            </g>
          );
        })}
        {draft?.kind === "room" && (
          <rect
            x={Math.min(draft.x, draft.x2)}
            y={Math.min(draft.y, draft.y2)}
            width={Math.abs(draft.x2 - draft.x)}
            height={Math.abs(draft.y2 - draft.y)}
            fill="transparent"
            stroke="currentColor"
            strokeDasharray="0.5 0.3"
          />
        )}
        {draft?.kind === "wall" && <line x1={draft.x} y1={draft.y} x2={draft.x2} y2={draft.y2} stroke="currentColor" strokeWidth="0.3" />}
      </svg>
      <p className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-card/90 px-2 py-1 text-[11px] text-foreground">
        <span className="mr-2 inline-block h-px w-10 bg-foreground align-middle" />
        8 ft
      </p>
    </div>
  );
}
