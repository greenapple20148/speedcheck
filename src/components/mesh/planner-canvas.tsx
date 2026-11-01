"use client";

import { useEffect, useId, useRef } from "react";
import { coverageFill } from "@/lib/mesh/coverage";
import { roomPoints, wallLength } from "@/lib/mesh/geometry";
import { coverageLabel, meshLinks } from "@/lib/mesh/insights";
import { nudgeLabels, type LabelBox } from "@/lib/mesh/labels";
import { bestRoomDownload, summarizeRoom, throughputBand } from "@/lib/mesh/measurements";
import type { CoverageCell, CoverageLevel, MeshFloor, MeshNode, RoomMeasurement } from "@/lib/mesh/types";
import type { PlanView } from "@/lib/mesh/view";

export type PlannerSelection = { kind: "room" | "node" | "outlet" | "wall"; id: string } | null;

export type PlannerOverlay = "estimate" | "download" | "latency" | "compare";

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
  view,
  showCoverage,
  showRooms,
  showNodes,
  showWalls,
  showOutlets,
  selection,
  draft,
  measure,
  calibrate,
  fadedIds,
  previewIds,
  heatmapOpacity,
  scaleFeet,
  probe,
  svgRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onCloseProbe,
}: {
  floor: MeshFloor;
  cells: CoverageCell[];
  overlay: PlannerOverlay;
  measurements: RoomMeasurement[];
  view: PlanView;
  showCoverage: boolean;
  showRooms: boolean;
  showNodes: boolean;
  showWalls: boolean;
  showOutlets: boolean;
  selection: PlannerSelection;
  draft: { kind: "room" | "wall"; x: number; y: number; x2: number; y2: number } | null;
  measure: { x: number; y: number; x2: number; y2: number } | null;
  calibrate: { x: number; y: number; x2: number; y2: number } | null;
  fadedIds: string[];
  previewIds: string[];
  heatmapOpacity: number;
  scaleFeet: number;
  probe: { left: number; top: number; level: CoverageLevel | null; nearest: string | null; distanceFt: number | null; walls: number } | null;
  svgRef: React.RefObject<SVGSVGElement | null>;
  onPointerDown: (event: React.PointerEvent<SVGSVGElement>) => void;
  onPointerMove: (event: React.PointerEvent<SVGSVGElement>) => void;
  onPointerUp: (event: React.PointerEvent<SVGSVGElement>) => void;
  onCloseProbe: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gridId = useId().replace(/:/g, "");
  const best = bestRoomDownload(measurements);
  const image = floor.image;
  const opacity = image?.opacity ?? 0.45;
  const rotation = image?.rotation ?? 0;
  const imageScale = image?.scale ?? 1;
  const offsetX = image?.offsetX ?? 0;
  const offsetY = image?.offsetY ?? 0;
  const faded = new Set(fadedIds);
  const preview = new Set(previewIds);
  const activeNodes = floor.nodes.filter((node) => !faded.has(node.id));
  const links = showNodes ? meshLinks(activeNodes) : [];

  useEffect(() => {
    const canvas = canvasRef.current;
    const svg = svgRef.current;
    if (!canvas || !svg) return;
    const paint = () => {
      const rect = svg.getBoundingClientRect();
      const cssW = Math.max(1, Math.floor(rect.width));
      const cssH = Math.max(1, Math.floor(rect.height));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);
      const drawing = showCoverage && overlay === "estimate" && activeNodes.length > 0;
      if (!drawing) return;
      const toX = (feet: number) => ((feet - view.x) / view.width) * cssW;
      const toY = (feet: number) => ((feet - view.y) / view.height) * cssH;
      const visible = cells.filter((cell) => cell.inside !== false);
      ctx.save();
      ctx.filter = "blur(12px)";
      const size = Math.max(8, (2 / view.width) * cssW * 1.7);
      for (const cell of visible) {
        ctx.fillStyle = coverageFill(cell.score, heatmapOpacity);
        ctx.fillRect(toX(cell.x) - size / 2, toY(cell.y) - size / 2, size, size);
      }
      ctx.filter = "none";
      if (floor.rooms.length > 0) {
        ctx.globalCompositeOperation = "destination-in";
        ctx.beginPath();
        for (const room of floor.rooms) {
          const points = roomPoints(room);
          points.forEach((point, index) => {
            const x = toX(point.x);
            const y = toY(point.y);
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.closePath();
        }
        ctx.fill();
      }
      ctx.restore();
    };
    paint();
  }, [activeNodes.length, cells, floor.rooms, heatmapOpacity, overlay, showCoverage, svgRef, view.height, view.width, view.x, view.y]);

  const labelOffsets = nudgeLabels(labelBoxes(floor.nodes, floor, showNodes, showRooms));

  return (
    <div className="relative h-full w-full bg-white">
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />
      <svg
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full touch-none text-[#334155]"
        role="img"
        aria-label="Floor plan in feet. Drag a node to move it."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <defs>
          <pattern id={`${gridId}-minor`} width="2" height="2" patternUnits="userSpaceOnUse">
            <path d="M 2 0 L 0 0 0 2" fill="none" stroke="#CBD5E1" strokeWidth="0.035" />
          </pattern>
          <pattern id={`${gridId}-major`} width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#94A3B8" strokeWidth="0.06" />
          </pattern>
        </defs>
        <rect x={view.x} y={view.y} width={view.width} height={view.height} fill="#F8FAFC" />
        <rect x={0} y={0} width={floor.widthFt} height={floor.heightFt} fill={`url(#${gridId}-minor)`} />
        <rect x={0} y={0} width={floor.widthFt} height={floor.heightFt} fill={`url(#${gridId}-major)`} />
        {floor.imageDataUrl && (
          <image
            href={floor.imageDataUrl}
            x={offsetX}
            y={offsetY}
            width={floor.widthFt * imageScale}
            height={floor.heightFt * imageScale}
            opacity={opacity}
            preserveAspectRatio="none"
            transform={rotation ? `rotate(${rotation} ${offsetX + (floor.widthFt * imageScale) / 2} ${offsetY + (floor.heightFt * imageScale) / 2})` : undefined}
          />
        )}
        {showRooms && floor.rooms.map((room) => {
          const points = roomPoints(room);
          const selected = selection?.kind === "room" && selection.id === room.id;
          const sample = summarizeRoom(measurements, room.id);
          let fill = "rgba(255,255,255,0.2)";
          if (overlay === "download" || overlay === "compare") fill = DOWNLOAD_FILL[throughputBand(sample?.downloadMbps, best)];
          if (overlay === "latency") {
            const ping = sample?.pingMs;
            fill = ping == null ? "rgba(255,255,255,0.2)" : ping < 30 ? "rgba(20, 184, 166, 0.5)" : ping < 80 ? "rgba(251, 191, 36, 0.45)" : "rgba(248, 113, 113, 0.42)";
          }
          const measuredLabel = overlay === "latency"
            ? (sample?.pingMs == null ? "—" : `${Math.round(sample.pingMs)} ms`)
            : overlay === "download" || overlay === "compare"
              ? (sample?.downloadMbps == null ? "—" : `${Math.round(sample.downloadMbps)} Mbps`)
              : null;
          const minX = Math.min(...points.map((point) => point.x));
          const maxX = Math.max(...points.map((point) => point.x));
          const minY = Math.min(...points.map((point) => point.y));
          const maxY = Math.max(...points.map((point) => point.y));
          const nudge = labelOffsets[`room-${room.id}`] ?? { dx: 0, dy: 0 };
          const labelX = (minX + maxX) / 2 + nudge.dx;
          const labelY = (minY + maxY) / 2 + nudge.dy;
          return (
            <g key={room.id}>
              <polygon
                points={points.map((point) => `${point.x},${point.y}`).join(" ")}
                fill={fill}
                stroke={selected ? "#00866A" : "#334155"}
                strokeWidth={selected ? 0.28 : 0.12}
              />
              <text x={labelX} y={labelY} textAnchor="middle" fontSize="1.05" fill="#0F172A" stroke="#F8FAFC" strokeWidth="0.28" paintOrder="stroke" style={{ fontWeight: 600 }}>
                {room.name}
              </text>
              <text x={labelX} y={labelY + 1.25} textAnchor="middle" fontSize="0.78" fill="#64748B" stroke="#F8FAFC" strokeWidth="0.22" paintOrder="stroke">
                {measuredLabel ?? `${Math.round(room.w)} × ${Math.round(room.h)} ft`}
              </text>
              {selected && points.map((point, index) => (
                <rect key={`${room.id}-${index}`} data-handle={`${room.id}:${index}`} x={point.x - 0.42} y={point.y - 0.42} width="0.84" height="0.84" rx="0.12" fill="white" stroke="#00866A" strokeWidth="0.12" />
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
            stroke={selection?.kind === "wall" && selection.id === wall.id ? "#00866A" : "#1E293B"}
            strokeWidth={wall.opening ? 0.22 : 0.34}
            strokeLinecap="round"
            strokeDasharray={wall.opening ? "0.7 0.4" : undefined}
          >
            <title>{wall.opening ? "Opening" : wall.material}, {wallLength(wall).toFixed(0)} ft</title>
          </line>
        ))}
        {showNodes && links.map((link) => {
          const from = floor.nodes.find((node) => node.id === link.fromId);
          const to = floor.nodes.find((node) => node.id === link.toId);
          if (!from || !to) return null;
          return (
            <line
              key={`${link.fromId}-${link.toId}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={link.wired ? "#0F766E" : "#64748B"}
              strokeWidth="0.12"
              strokeDasharray={link.wired ? undefined : "0.55 0.38"}
            />
          );
        })}
        {showOutlets && floor.outlets.map((outlet) => {
          const selected = selection?.kind === "outlet" && selection.id === outlet.id;
          return (
            <g key={outlet.id} transform={`translate(${outlet.x} ${outlet.y})`}>
              <circle r={selected ? 0.95 : 0.72} fill="#7C3AED" stroke={selected ? "#00866A" : "white"} strokeWidth="0.12" />
              <path d="M -0.22 -0.28 v0.56 M 0.22 -0.28 v0.56 M -0.34 0.05 h0.68 v0.22 a0.34 0.34 0 0 1 -0.68 0 z" fill="none" stroke="white" strokeWidth="0.1" />
              <title>Ethernet outlet</title>
            </g>
          );
        })}
        {showNodes && floor.nodes.map((node) => (
          <NodeMarker
            key={node.id}
            node={node}
            selected={selection?.kind === "node" && selection.id === node.id}
            faded={faded.has(node.id)}
            preview={preview.has(node.id)}
            labelDy={labelOffsets[node.id]?.dy ?? 0}
          />
        ))}
        {draft?.kind === "room" && (
          <rect
            x={Math.min(draft.x, draft.x2)}
            y={Math.min(draft.y, draft.y2)}
            width={Math.abs(draft.x2 - draft.x)}
            height={Math.abs(draft.y2 - draft.y)}
            fill="rgba(0,134,106,0.08)"
            stroke="#00866A"
            strokeWidth="0.14"
            strokeDasharray="0.45 0.3"
          />
        )}
        {draft?.kind === "wall" && <line x1={draft.x} y1={draft.y} x2={draft.x2} y2={draft.y2} stroke="#00866A" strokeWidth="0.28" />}
        {measure && <MeasureLine x={measure.x} y={measure.y} x2={measure.x2} y2={measure.y2} />}
        {calibrate && <MeasureLine x={calibrate.x} y={calibrate.y} x2={calibrate.x2} y2={calibrate.y2} />}
      </svg>
      <div className="pointer-events-none absolute bottom-2 left-2 rounded-md border border-[#E2E8F0] bg-white/95 px-2 py-1 text-[10px] text-[#0F172A] shadow-sm">
        <span className="mb-1 block h-px bg-[#0F172A]" style={{ width: `${Math.max(8, (scaleFeet / view.width) * 100)}%`, minWidth: 28 }} />
        {scaleFeet} ft
        <span className="mt-0.5 block text-[#64748B]">Solid wired · dashed wireless</span>
      </div>
      {probe && (
        <div
          className="absolute z-10 w-52 rounded-lg border border-[#E2E8F0] bg-white p-2.5 text-xs text-[#0F172A] shadow-md"
          style={{ left: `${probe.left}%`, top: `${probe.top}%`, transform: probe.left > 62 ? "translate(-110%, 12px)" : "translate(12px, 12px)" }}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold">Coverage at this point</p>
            <button type="button" className="text-[#64748B]" aria-label="Close coverage callout" onClick={onCloseProbe}>×</button>
          </div>
          <p className="mt-1">
            <span className="font-medium">{probe.level ? coverageLabel(probe.level) : "Outside modeled rooms"}</span>
            <span className="text-[#64748B]"> · estimated</span>
          </p>
          {probe.nearest && probe.distanceFt != null && <p className="mt-1 text-[#64748B]">Nearest device {probe.nearest} · {Math.round(probe.distanceFt)} ft</p>}
          {probe.walls > 0 && <p className="text-[#64748B]">Drawn walls crossed: {probe.walls}</p>}
          <p className="mt-1 text-[10px] leading-4 text-[#64748B]">Category from the planning estimate. Not a signal reading.</p>
        </div>
      )}
    </div>
  );
}

function NodeMarker({ node, selected, faded, preview, labelDy }: { node: MeshNode; selected: boolean; faded: boolean; preview: boolean; labelDy: number }) {
  const primary = node.role === "primary";
  const radius = primary ? 1.2 : 1.02;
  return (
    <g opacity={faded ? 0.28 : 1} transform={`translate(${node.x} ${node.y})`}>
      {(selected || preview) && <circle r={radius + 0.42} fill="none" stroke="#00866A" strokeWidth="0.16" strokeDasharray={preview ? "0.35 0.25" : undefined} />}
      <circle r={radius} fill={primary ? "#115E59" : "#14B8A6"} />
      {primary ? (
        <path d="M -0.55 -0.15 h1.1 v0.48 h-1.1 z M -0.32 -0.15 v-0.38 M 0.32 -0.15 v-0.42" fill="none" stroke="white" strokeWidth="0.12" strokeLinecap="round" />
      ) : (
        <path d="M -0.46 0.05 a0.5 0.5 0 0 1 0.92 0 M -0.28 0.12 a0.28 0.28 0 0 1 0.56 0 M 0 0.28 v0.02" fill="none" stroke="white" strokeWidth="0.1" strokeLinecap="round" />
      )}
      <text x={0} y={-radius - 0.45 + labelDy} textAnchor="middle" fontSize="0.95" fill="#0F172A" stroke="#F8FAFC" strokeWidth="0.28" paintOrder="stroke" style={{ fontWeight: 600 }}>
        {preview ? `${node.name} preview` : node.name}
      </text>
    </g>
  );
}

function MeasureLine({ x, y, x2, y2 }: { x: number; y: number; x2: number; y2: number }) {
  const length = Math.hypot(x2 - x, y2 - y);
  return (
    <g>
      <line x1={x} y1={y} x2={x2} y2={y2} stroke="#00866A" strokeWidth="0.12" />
      <circle cx={x} cy={y} r="0.28" fill="#00866A" />
      <circle cx={x2} cy={y2} r="0.28" fill="#00866A" />
      <text x={(x + x2) / 2} y={(y + y2) / 2 - 0.4} textAnchor="middle" fontSize="0.9" fill="#0F172A" stroke="#F8FAFC" strokeWidth="0.25" paintOrder="stroke">
        {length.toFixed(1)} ft
      </text>
    </g>
  );
}

function labelBoxes(nodes: MeshNode[], floor: MeshFloor, showNodes: boolean, showRooms: boolean): LabelBox[] {
  const boxes: LabelBox[] = [];
  if (showNodes) {
    for (const node of nodes) {
      const width = Math.max(2.2, node.name.length * 0.62);
      boxes.push({ id: node.id, x: node.x - width / 2, y: node.y - 2.6, w: width, h: 1.2 });
    }
  }
  if (showRooms) {
    for (const room of floor.rooms) {
      const width = Math.max(room.w * 0.7, room.name.length * 0.62);
      boxes.push({
        id: `room-${room.id}`,
        x: room.x + room.w / 2 - width / 2,
        y: room.y + room.h / 2 - 0.8,
        w: width,
        h: 2.2,
      });
    }
  }
  return boxes;
}
