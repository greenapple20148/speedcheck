"use client";

import { useMemo, useRef, useState } from "react";
import { estimateCoverage } from "@/lib/mesh/coverage";
import { emptyPlan, newId } from "@/lib/mesh/plan";
import { clearPlan, parseMeshPlan } from "@/lib/mesh/store";
import type { CoverageLevel, MeshFloor, MeshPlan, WifiBand } from "@/lib/mesh/types";
import { useMeshPlan } from "@/components/mesh/use-mesh-plan";

const FILL: Record<CoverageLevel, string> = {
  strong: "rgba(20, 200, 180, 0.45)",
  moderate: "rgba(91, 108, 255, 0.35)",
  weak: "rgba(230, 162, 60, 0.4)",
  dead: "rgba(196, 86, 86, 0.28)",
};

function snap(n: number, max: number): number {
  return Math.min(max, Math.max(0, Math.round(n)));
}

export function FloorPlanner() {
  const { plan, update, ready } = useMeshPlan();
  const undo = useRef<MeshPlan[]>([]);
  const redo = useRef<MeshPlan[]>([]);
  const [band, setBand] = useState<WifiBand>("5");
  const [showEstimate, setShowEstimate] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const drag = useRef<{ id: string; kind: "node" | "outlet" } | null>(null);
  const planRef = useRef(plan);
  planRef.current = plan;

  const floor = plan?.floors.find((item) => item.id === plan.activeFloorId) ?? plan?.floors[0];
  const floorIndex = plan && floor ? plan.floors.findIndex((item) => item.id === floor.id) : 0;
  const cells = useMemo(() => {
    if (!plan || !floor || !showEstimate) return [];
    return estimateCoverage({
      widthFt: floor.widthFt,
      heightFt: floor.heightFt,
      floorIndex,
      rooms: floor.rooms,
      band,
      nodeFloors: plan.floors.flatMap((level, index) => level.nodes.map((node) => ({ node, floorIndex: index }))),
    });
  }, [plan, floor, floorIndex, band, showEstimate]);

  if (!ready || !plan || !floor) return <p className="text-sm text-muted-foreground">Loading your saved plan…</p>;

  const commit = (next: MeshPlan) => {
    undo.current = [...undo.current, plan].slice(-30);
    redo.current = [];
    update(next);
  };

  const patchFloor = (mutator: (current: MeshFloor) => MeshFloor) => {
    commit({
      ...plan,
      floors: plan.floors.map((item) => (item.id === floor.id ? mutator(item) : item)),
    });
  };

  const point = (event: React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * floor.widthFt;
    const y = ((event.clientY - rect.top) / rect.height) * floor.heightFt;
    return { x: snap(x, floor.widthFt), y: snap(y, floor.heightFt) };
  };

  const addRoom = () => {
    const offset = floor.rooms.length * 2;
    patchFloor((current) => ({
      ...current,
      rooms: [
        ...current.rooms,
        {
          id: newId(),
          name: `Room ${current.rooms.length + 1}`,
          x: snap(4 + offset, current.widthFt - 12),
          y: snap(4 + offset, current.heightFt - 10),
          w: 12,
          h: 10,
          material: "drywall",
          priority: false,
          problem: false,
        },
      ],
    }));
  };

  const addNode = () => {
    patchFloor((current) => ({
      ...current,
      nodes: [
        ...current.nodes,
        {
          id: newId(),
          name: current.nodes.length === 0 ? "Primary" : `Node ${current.nodes.length + 1}`,
          x: snap(current.widthFt / 2, current.widthFt),
          y: snap(current.heightFt / 2, current.heightFt),
          role: current.nodes.length === 0 ? "primary" : "satellite",
        },
      ],
    }));
  };

  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-border bg-[var(--surface-subtle)] px-3 py-2 text-sm text-muted-foreground">
        Estimated coverage — not a measured Wi-Fi signal map. Colors use planning losses for walls and distance. They are not RSSI readings from your phone.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="min-h-11 rounded-xl border border-border px-3 text-sm font-medium" onClick={addRoom}>Add room</button>
        <button type="button" className="min-h-11 rounded-xl border border-border px-3 text-sm font-medium" onClick={addNode}>Add node</button>
        <button type="button" className="min-h-11 rounded-xl border border-border px-3 text-sm font-medium" onClick={() => patchFloor((current) => ({ ...current, outlets: [...current.outlets, { id: newId(), x: snap(current.widthFt / 3, current.widthFt), y: snap(current.heightFt / 3, current.heightFt) }] }))}>Add Ethernet outlet</button>
        <button type="button" className="min-h-11 rounded-xl border border-border px-3 text-sm font-medium" onClick={() => { const previous = undo.current.pop(); if (previous) { redo.current.push(plan); update(previous); } }}>Undo</button>
        <button type="button" className="min-h-11 rounded-xl border border-border px-3 text-sm font-medium" onClick={() => { const next = redo.current.pop(); if (next) { undo.current.push(plan); update(next); } }}>Redo</button>
        <button type="button" className="min-h-11 rounded-xl border border-border px-3 text-sm font-medium" onClick={() => setZoom((value) => Math.min(2, value + 0.25))}>Zoom in</button>
        <button type="button" className="min-h-11 rounded-xl border border-border px-3 text-sm font-medium" onClick={() => setZoom((value) => Math.max(0.75, value - 0.25))}>Zoom out</button>
        <button type="button" className="min-h-11 rounded-xl border border-border px-3 text-sm font-medium" onClick={() => setShowEstimate((value) => !value)}>{showEstimate ? "Hide estimate" : "Show estimate"}</button>
        <label className="min-h-11 text-sm">
          Band
          <select className="ml-2 rounded-lg border border-border bg-background px-2 py-2" value={band} onChange={(event) => setBand(event.target.value as WifiBand)} aria-label="Frequency band for the estimate">
            <option value="2.4">2.4 GHz</option>
            <option value="5">5 GHz</option>
            <option value="6">6 GHz</option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        {plan.floors.map((item) => (
          <button key={item.id} type="button" className="min-h-11 rounded-full border border-border px-3 text-sm" aria-pressed={item.id === floor.id} onClick={() => update({ ...plan, activeFloorId: item.id })}>{item.name}</button>
        ))}
        <button type="button" className="min-h-11 rounded-full border border-border px-3 text-sm" onClick={() => {
          if (plan.floors.length >= 6) return;
          const created = { id: newId(), name: `Floor ${plan.floors.length + 1}`, widthFt: floor.widthFt, heightFt: floor.heightFt, rooms: [], nodes: [], outlets: [] };
          commit({ ...plan, floors: [...plan.floors, created], activeFloorId: created.id, home: { ...plan.home, floors: plan.floors.length + 1 } });
        }}>Add floor</button>
      </div>
      <div className="overflow-auto rounded-2xl border border-border bg-card">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${floor.widthFt} ${floor.heightFt}`}
          role="img"
          aria-label="Floor plan in feet. Drag a node to move it. Scroll to pan."
          className="mx-auto block h-auto touch-none bg-[var(--surface-subtle)]"
          style={{ width: `min(100%, ${Math.round(zoom * 480)}px)` }}
          onPointerMove={(event) => {
            if (!drag.current) return;
            const next = point(event);
            const current = drag.current;
            const latest = planRef.current;
            if (!latest) return;
            update({
              ...latest,
              floors: latest.floors.map((item) => {
                if (item.id !== floor.id) return item;
                if (current.kind === "node") {
                  return { ...item, nodes: item.nodes.map((node) => node.id === current.id ? { ...node, ...next } : node) };
                }
                return { ...item, outlets: item.outlets.map((outlet) => outlet.id === current.id ? { ...outlet, ...next } : outlet) };
              }),
            });
          }}
          onPointerUp={() => { drag.current = null; }}
        >
          {showEstimate && cells.map((cell) => (
            <rect key={`${cell.x}-${cell.y}`} x={cell.x - 2} y={cell.y - 2} width={4} height={4} fill={FILL[cell.level]} />
          ))}
          {floor.rooms.map((room) => (
            <g key={room.id}>
              <rect x={room.x} y={room.y} width={room.w} height={room.h} fill="transparent" stroke="currentColor" strokeWidth={0.15} />
              <text x={room.x + 0.4} y={room.y + 1.4} fontSize={1.2} fill="currentColor">{room.name}</text>
            </g>
          ))}
          {floor.outlets.map((outlet) => (
            <rect
              key={outlet.id}
              x={outlet.x - 0.6}
              y={outlet.y - 0.6}
              width={1.2}
              height={1.2}
              fill="#5B6CFF"
              onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); drag.current = { id: outlet.id, kind: "outlet" }; }}
            >
              <title>Ethernet outlet</title>
            </rect>
          ))}
          {floor.nodes.map((node) => (
            <g key={node.id} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); drag.current = { id: node.id, kind: "node" }; }}>
              <circle cx={node.x} cy={node.y} r={1.1} fill={node.role === "primary" ? "#0f766e" : "#14C8B4"} />
              <text x={node.x + 1.4} y={node.y} fontSize={1.3} fill="currentColor">{node.name}</text>
            </g>
          ))}
        </svg>
      </div>
      <ul className="flex flex-wrap gap-3 text-xs text-muted-foreground" aria-label="Estimate legend">
        <li>Strong estimate</li>
        <li>Moderate estimate</li>
        <li>Weak estimate</li>
        <li>Possible dead zone</li>
      </ul>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Floor width (ft)
          <input className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" inputMode="numeric" value={floor.widthFt} onChange={(event) => patchFloor((current) => ({ ...current, widthFt: clampDim(event.target.value) }))} />
        </label>
        <label className="text-sm">Floor depth (ft)
          <input className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" inputMode="numeric" value={floor.heightFt} onChange={(event) => patchFloor((current) => ({ ...current, heightFt: clampDim(event.target.value) }))} />
        </label>
      </div>
      <ul className="space-y-2">
        {floor.rooms.map((room) => (
          <li key={room.id} className="flex flex-wrap items-center gap-2 text-sm">
            <input aria-label={`Name for ${room.name}`} className="rounded-lg border border-border bg-background px-2 py-1" value={room.name} onChange={(event) => patchFloor((current) => ({ ...current, rooms: current.rooms.map((item) => item.id === room.id ? { ...item, name: event.target.value.slice(0, 80) } : item) }))} />
            <select aria-label={`Wall material for ${room.name}`} className="rounded-lg border border-border bg-background px-2 py-1" value={room.material} onChange={(event) => patchFloor((current) => ({ ...current, rooms: current.rooms.map((item) => item.id === room.id ? { ...item, material: event.target.value as typeof room.material } : item) }))}>
              <option value="drywall">Drywall</option>
              <option value="wood">Wood</option>
              <option value="brick">Brick</option>
              <option value="concrete">Concrete</option>
              <option value="glass">Glass</option>
              <option value="open">Open</option>
            </select>
            <label className="inline-flex items-center gap-1"><input type="checkbox" checked={room.priority} onChange={() => patchFloor((current) => ({ ...current, rooms: current.rooms.map((item) => item.id === room.id ? { ...item, priority: !item.priority } : item) }))} /> Priority</label>
            <label className="inline-flex items-center gap-1"><input type="checkbox" checked={room.problem} onChange={() => patchFloor((current) => ({ ...current, rooms: current.rooms.map((item) => item.id === room.id ? { ...item, problem: !item.problem } : item) }))} /> Problem room</label>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground" onClick={() => {
          const blob = new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "mesh-plan.json";
          link.click();
          URL.revokeObjectURL(url);
        }}>Export JSON</button>
        <label className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-border px-4 text-sm font-medium">
          Import JSON
          <input type="file" accept="application/json" className="sr-only" onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            try {
              const parsed = parseMeshPlan(JSON.parse(await file.text()));
              if (!parsed.ok) setMessage(parsed.error);
              else { setMessage(null); update(parsed.plan); }
            } catch {
              setMessage("That file is not valid JSON.");
            }
          }} />
        </label>
        <button type="button" className="min-h-11 rounded-xl border border-border px-4 text-sm" onClick={() => { if (window.confirm("Delete the mesh plan saved in this browser?")) { clearPlan(); update(emptyPlan()); } }}>Delete saved plan</button>
        <a href="/mesh-wifi/report" className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-medium">Print report</a>
      </div>
      {message && <p className="text-sm text-destructive" role="alert">{message}</p>}
    </div>
  );
}

function clampDim(value: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 20;
  return Math.min(300, Math.max(8, Math.round(n)));
}
