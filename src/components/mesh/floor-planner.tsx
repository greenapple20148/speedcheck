"use client";

import dynamic from "next/dynamic";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { estimateCoverage } from "@/lib/mesh/coverage";
import { boundsOf, clientToFeet, roomPoints, snapFt, wallLength } from "@/lib/mesh/geometry";
import { duplicateFloor, emptyPlan, newId } from "@/lib/mesh/plan";
import { placementOptions } from "@/lib/mesh/placement";
import { sampleFloor } from "@/lib/mesh/sample-floor";
import { clearPlan, parseMeshPlan } from "@/lib/mesh/store";
import type { MeshFloor, MeshPlan, MeshRoom, WallMaterial, WifiBand } from "@/lib/mesh/types";
import { spacingWarnings } from "@/lib/mesh/warnings";
import { useMeshPlan } from "@/components/mesh/use-mesh-plan";
import { PlannerCanvas, type PlannerOverlay, type PlannerSelection } from "@/components/mesh/planner-canvas";

const SpeedTestDashboard = dynamic(
  () => import("@/components/speedtest/dashboard/speed-test-dashboard").then((mod) => mod.SpeedTestDashboard),
  { ssr: false, loading: () => <p className="text-sm text-muted-foreground">Loading the speed test…</p> },
);

type Tool = "select" | "room" | "wall";
type Draft = { kind: "room" | "wall"; x: number; y: number; x2: number; y2: number } | null;

const MATERIALS: WallMaterial[] = ["drywall", "wood", "brick", "concrete", "glass", "open"];

export function FloorPlanner() {
  const { plan, update, ready } = useMeshPlan();
  const undo = useRef<MeshPlan[]>([]);
  const redo = useRef<MeshPlan[]>([]);
  const [band, setBand] = useState<WifiBand>("5");
  const [overlay, setOverlay] = useState<PlannerOverlay>("estimate");
  const [zoom, setZoom] = useState(1);
  const [tool, setTool] = useState<Tool>("select");
  const [selection, setSelection] = useState<PlannerSelection>(null);
  const [draft, setDraft] = useState<Draft>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [mobilePane, setMobilePane] = useState<"canvas" | "floors" | "details">("canvas");
  const [layers, setLayers] = useState({ coverage: true, rooms: true, nodes: true, walls: true, outlets: true });
  const svgRef = useRef<SVGSVGElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const planRef = useRef(plan);
  const beforeDrag = useRef<MeshPlan | null>(null);
  const drag = useRef<{ kind: "node" | "outlet" | "room" | "wall" | "vertex"; id: string; index?: number } | { kind: "pan"; x: number; y: number; left: number; top: number } | null>(null);
  const actionsRef = useRef({ undo: () => {}, redo: () => {}, node: () => {}, outlet: () => {}, remove: () => {} });
  useEffect(() => {
    planRef.current = plan;
  }, [plan]);

  const floor = plan?.floors.find((item) => item.id === plan.activeFloorId) ?? plan?.floors[0];
  const floorIndex = plan && floor ? plan.floors.findIndex((item) => item.id === floor.id) : 0;
  const deferredPlan = useDeferredValue(plan);
  const deferredFloor = deferredPlan?.floors.find((item) => item.id === deferredPlan.activeFloorId) ?? deferredPlan?.floors[0];
  const cells = useMemo(() => {
    if (!deferredPlan || !deferredFloor || overlay !== "estimate") return [];
    const index = deferredPlan.floors.findIndex((item) => item.id === deferredFloor.id);
    return estimateCoverage({
      widthFt: deferredFloor.widthFt,
      heightFt: deferredFloor.heightFt,
      floorIndex: Math.max(0, index),
      rooms: deferredFloor.rooms,
      walls: deferredFloor.walls ?? [],
      band,
      nodeFloors: deferredPlan.floors.flatMap((level, levelIndex) => level.nodes.map((node) => ({ node, floorIndex: levelIndex }))),
      cellFt: 2,
    });
  }, [deferredPlan, deferredFloor, overlay, band]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === "z") {
        event.preventDefault();
        if (event.shiftKey) actionsRef.current.redo();
        else actionsRef.current.undo();
        return;
      }
      if (key === "v") setTool("select");
      if (key === "r") setTool("room");
      if (key === "w") setTool("wall");
      if (key === "n") actionsRef.current.node();
      if (key === "o") actionsRef.current.outlet();
      if (key === "escape") setSelection(null);
      if (key === "backspace" || key === "delete") actionsRef.current.remove();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!ready || !plan || !floor) return <p className="text-sm text-muted-foreground">Loading your saved plan…</p>;

  const writePlan = (next: MeshPlan, record: boolean) => {
    const previous = planRef.current;
    if (record && previous) {
      undo.current = [...undo.current, previous].slice(-40);
      redo.current = [];
    }
    planRef.current = next;
    update(next);
  };
  const commit = (next: MeshPlan) => writePlan(next, true);
  const undoPlan = () => {
    const previous = undo.current.pop();
    const current = planRef.current;
    if (!previous || !current) return;
    redo.current.push(current);
    planRef.current = previous;
    update(previous);
  };
  const redoPlan = () => {
    const next = redo.current.pop();
    const current = planRef.current;
    if (!next || !current) return;
    undo.current.push(current);
    planRef.current = next;
    update(next);
  };
  const patchFloor = (mutator: (current: MeshFloor) => MeshFloor, record = true) => {
    const current = planRef.current;
    if (!current) return;
    const active = current.floors.find((item) => item.id === current.activeFloorId) ?? current.floors[0];
    if (!active) return;
    const next = {
      ...current,
      floors: current.floors.map((item) => (item.id === active.id ? mutator(item) : item)),
    };
    writePlan(next, record);
  };
  const feetFrom = (event: React.PointerEvent) => {
    const svg = svgRef.current;
    const current = planRef.current;
    const active = current?.floors.find((item) => item.id === current.activeFloorId) ?? current?.floors[0];
    if (!svg || !active) return { x: 0, y: 0 };
    const point = clientToFeet(event.clientX, event.clientY, svg.getBoundingClientRect(), active.widthFt, active.heightFt);
    return { x: snapFt(point.x, active.widthFt), y: snapFt(point.y, active.heightFt) };
  };
  const placeNode = () => {
    patchFloor((current) => {
      if (current.nodes.length >= 12) return current;
      const index = current.nodes.length;
      return {
        ...current,
        nodes: [...current.nodes, {
          id: newId(),
          name: index === 0 ? "Primary" : `Node ${index + 1}`,
          x: snapFt(current.widthFt * (0.35 + (index % 4) * 0.12), current.widthFt),
          y: snapFt(current.heightFt * (0.4 + (index % 3) * 0.12), current.heightFt),
          role: index === 0 ? "primary" : "satellite",
          link: index === 0 ? "wired" : "wireless",
          band,
        }],
      };
    });
    setTool("select");
  };
  const placeOutlet = () => {
    patchFloor((current) => ({
      ...current,
      outlets: [...current.outlets, { id: newId(), x: snapFt(current.widthFt / 3, current.widthFt), y: snapFt(current.heightFt / 3, current.heightFt) }],
    }));
    setTool("select");
  };
  const removeSelection = () => {
    if (!selection) return;
    patchFloor((current) => ({
      ...current,
      rooms: selection.kind === "room" ? current.rooms.filter((item) => item.id !== selection.id) : current.rooms,
      nodes: selection.kind === "node" ? current.nodes.filter((item) => item.id !== selection.id) : current.nodes,
      outlets: selection.kind === "outlet" ? current.outlets.filter((item) => item.id !== selection.id) : current.outlets,
      walls: selection.kind === "wall" ? (current.walls ?? []).filter((item) => item.id !== selection.id) : current.walls,
    }));
    setSelection(null);
  };

  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    const point = feetFrom(event);
    const handle = (event.target as SVGElement | null)?.getAttribute?.("data-handle");
    if (handle && selection?.kind === "room") {
      const index = Number(handle.split(":")[1]);
      beforeDrag.current = planRef.current;
      drag.current = { kind: "vertex", id: selection.id, index };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    if (tool === "room" || tool === "wall") {
      setDraft({ kind: tool, x: point.x, y: point.y, x2: point.x, y2: point.y });
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    const hit = hitTest(floor, point.x, point.y);
    if (hit) {
      setSelection(hit);
      beforeDrag.current = planRef.current;
      drag.current = { kind: hit.kind, id: hit.id };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    setSelection(null);
    const scroller = scrollerRef.current;
    if (scroller) drag.current = { kind: "pan", x: event.clientX, y: event.clientY, left: scroller.scrollLeft, top: scroller.scrollTop };
  };
  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const point = feetFrom(event);
    if (draft) {
      setDraft({ ...draft, x2: point.x, y2: point.y });
      return;
    }
    const currentDrag = drag.current;
    if (!currentDrag) return;
    if (currentDrag.kind === "pan") {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      scroller.scrollLeft = currentDrag.left - (event.clientX - currentDrag.x);
      scroller.scrollTop = currentDrag.top - (event.clientY - currentDrag.y);
      return;
    }
    patchFloor((current) => {
      if (currentDrag.kind === "node") {
        return { ...current, nodes: current.nodes.map((node) => node.id === currentDrag.id ? { ...node, ...point } : node) };
      }
      if (currentDrag.kind === "outlet") {
        return { ...current, outlets: current.outlets.map((outlet) => outlet.id === currentDrag.id ? { ...outlet, ...point } : outlet) };
      }
      if (currentDrag.kind === "wall") {
        const wall = (current.walls ?? []).find((item) => item.id === currentDrag.id);
        if (!wall) return current;
        const dx = point.x - (wall.x1 + wall.x2) / 2;
        const dy = point.y - (wall.y1 + wall.y2) / 2;
        return {
          ...current,
          walls: (current.walls ?? []).map((item) => item.id === wall.id ? {
            ...item,
            x1: snapFt(item.x1 + dx, current.widthFt),
            y1: snapFt(item.y1 + dy, current.heightFt),
            x2: snapFt(item.x2 + dx, current.widthFt),
            y2: snapFt(item.y2 + dy, current.heightFt),
          } : item),
        };
      }
      if (currentDrag.kind === "vertex") {
        return {
          ...current,
          rooms: current.rooms.map((room) => {
            if (room.id !== currentDrag.id) return room;
            const points = roomPoints(room).map((vertex, index) => index === currentDrag.index ? point : vertex);
            return { ...room, points, ...boundsOf(points) };
          }),
        };
      }
      return {
        ...current,
        rooms: current.rooms.map((room) => {
          if (room.id !== currentDrag.id) return room;
          const dx = point.x - (room.x + room.w / 2);
          const dy = point.y - (room.y + room.h / 2);
          if (room.points) {
            const points = room.points.map((vertex) => ({ x: snapFt(vertex.x + dx, current.widthFt), y: snapFt(vertex.y + dy, current.heightFt) }));
            return { ...room, points, ...boundsOf(points) };
          }
          return { ...room, x: snapFt(room.x + dx, Math.max(room.w, current.widthFt)), y: snapFt(room.y + dy, Math.max(room.h, current.heightFt)) };
        }),
      };
    }, false);
  };
  const onPointerUp = () => {
    if (draft && planRef.current) {
      const width = Math.abs(draft.x2 - draft.x);
      const height = Math.abs(draft.y2 - draft.y);
      if (draft.kind === "room" && width >= 3 && height >= 3) {
        const created: MeshRoom = {
          id: newId(),
          name: `Room ${floor.rooms.length + 1}`,
          x: Math.min(draft.x, draft.x2),
          y: Math.min(draft.y, draft.y2),
          w: width,
          h: height,
          material: "drywall",
          priority: false,
          problem: false,
        };
        patchFloor((current) => ({ ...current, rooms: [...current.rooms, created] }));
        setSelection({ kind: "room", id: created.id });
        setTool("select");
      }
      if (draft.kind === "wall" && Math.hypot(width, height) >= 2) {
        const id = newId();
        patchFloor((current) => ({
          ...current,
          walls: [...(current.walls ?? []), { id, x1: draft.x, y1: draft.y, x2: draft.x2, y2: draft.y2, material: "drywall", opening: false }],
        }));
        setSelection({ kind: "wall", id });
        setTool("select");
      }
    }
    if (beforeDrag.current && planRef.current && beforeDrag.current !== planRef.current) {
      undo.current = [...undo.current, beforeDrag.current].slice(-40);
      redo.current = [];
    }
    beforeDrag.current = null;
    drag.current = null;
    setDraft(null);
  };

  const selectedRoom = selection?.kind === "room" ? floor.rooms.find((room) => room.id === selection.id) : undefined;
  const selectedNode = selection?.kind === "node" ? floor.nodes.find((node) => node.id === selection.id) : undefined;
  const selectedWall = selection?.kind === "wall" ? (floor.walls ?? []).find((wall) => wall.id === selection.id) : undefined;
  const selectedOutlet = selection?.kind === "outlet" ? floor.outlets.find((outlet) => outlet.id === selection.id) : undefined;
  const insideCells = cells.filter((cell) => cell.inside !== false);
  const weakCells = insideCells.filter((cell) => cell.level === "weak" || cell.level === "dead").length;
  const gapSummary = (deferredFloor ?? floor).nodes.length === 0
    ? "Add a node to see an estimate."
    : insideCells.length === 0
      ? "Draw rooms to limit the estimate to the home."
      : `About ${Math.round((100 * weakCells) / insideCells.length)}% of the drawn area looks weak in this estimate.`;
  const untested = floor.rooms.filter((room) => !plan.measurements.some((row) => row.roomId === room.id)).length;
  const warnings = spacingWarnings(floor.nodes, band);
  const empty = floor.rooms.length === 0 && floor.nodes.length === 0 && !(floor.walls ?? []).length && !floor.imageDataUrl;
  const options = placementOptions(floor, Math.max(2, floor.nodes.length || 2)).filter((option) => option.id !== "work");

  actionsRef.current = { undo: undoPlan, redo: redoPlan, node: placeNode, outlet: placeOutlet, remove: removeSelection };

  const replaceFloor = (next: MeshFloor) => {
    commit({ ...plan, floors: plan.floors.map((item) => item.id === floor.id ? next : item), activeFloorId: next.id });
  };

  const field = "mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm";
  const side = (name: "floors" | "details") => mobilePane === "canvas" ? "hidden lg:flex" : mobilePane === name ? "flex" : "hidden lg:flex";

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card text-foreground">
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
        <div>
          <h2 className="text-base font-semibold">Mesh coverage planner</h2>
          <p className="text-xs text-muted-foreground">{floor.name} · {plan.floors.length} floor{plan.floors.length === 1 ? "" : "s"} · {plan.home.networkName || "Saved on this device"}</p>
        </div>
        <div className="flex items-center gap-1">
          <IconButton label="Undo" shortcut="⌘Z" onClick={undoPlan}>↩</IconButton>
          <IconButton label="Redo" shortcut="⇧⌘Z" onClick={redoPlan}>↪</IconButton>
          <div className="relative">
            <IconButton label="Plan menu" onClick={() => setMenu((open) => !open)}>...</IconButton>
            {menu && (
              <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-border bg-card p-1 shadow-lg">
                <MenuItem onClick={() => { exportPlan(plan); setMenu(false); }}>Export JSON</MenuItem>
                <label className="block cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-muted">
                  Import JSON
                  <input type="file" accept="application/json" className="sr-only" onChange={async (event) => {
                    const file = event.target.files?.[0];
                    setMenu(false);
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
                <a className="block rounded-lg px-3 py-2 text-sm hover:bg-muted" href="/mesh-wifi/report">Print report</a>
                <MenuItem onClick={() => { if (window.confirm("Delete the mesh plan saved in this browser?")) { clearPlan(); update(emptyPlan()); setSelection(null); } setMenu(false); }}>Delete saved plan</MenuItem>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1 border-b border-border px-2 py-2">
        <ToolButton pressed={tool === "select"} label="Select" shortcut="V" onClick={() => setTool("select")}>Select</ToolButton>
        <ToolButton pressed={tool === "room"} label="Draw room" shortcut="R" onClick={() => setTool("room")}>Draw room</ToolButton>
        <ToolButton pressed={tool === "wall"} label="Draw wall" shortcut="W" onClick={() => setTool("wall")}>Draw wall</ToolButton>
        <ToolButton pressed={false} label="Add node" shortcut="N" onClick={placeNode}>Add node</ToolButton>
        <ToolButton pressed={false} label="Add outlet" shortcut="O" onClick={placeOutlet}>Add outlet</ToolButton>
        <label className="ml-auto text-xs text-muted-foreground">
          View
          <select className="ml-2 rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground" value={`${overlay}:${band}`} aria-label="Coverage view and band" onChange={(event) => {
            const [nextOverlay, nextBand] = event.target.value.split(":") as [PlannerOverlay, WifiBand];
            setOverlay(nextOverlay);
            setBand(nextBand);
          }}>
            <option value="estimate:2.4">Estimate · 2.4 GHz</option>
            <option value="estimate:5">Estimate · 5 GHz</option>
            <option value="estimate:6">Estimate · 6 GHz</option>
            <option value="download:5">Measured download</option>
            <option value="latency:5">Measured latency</option>
          </select>
        </label>
      </div>
      <div className="flex gap-2 border-b border-border px-2 py-2 lg:hidden">
        {(["canvas", "floors", "details"] as const).map((pane) => (
          <button key={pane} type="button" className="min-h-11 flex-1 rounded-full border border-border text-sm capitalize" aria-pressed={mobilePane === pane} onClick={() => setMobilePane(pane)}>{pane === "canvas" ? "Plan" : pane}</button>
        ))}
      </div>
      <div className="grid lg:grid-cols-[240px_minmax(0,1fr)_280px]">
        <aside className={`${side("floors")} max-h-[70vh] flex-col gap-4 overflow-auto border-border p-3 lg:border-r`}>
          <Section title="Floors">
            <ul className="space-y-1">
              {plan.floors.map((item) => (
                <li key={item.id}>
                  <button type="button" className="w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted" aria-pressed={item.id === floor.id} onClick={() => { update({ ...plan, activeFloorId: item.id }); setSelection(null); }}>
                    <span className="block font-medium">{item.name}</span>
                    <span className="text-xs text-muted-foreground">{item.rooms.length === 1 ? "1 room" : `${item.rooms.length} rooms`}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex flex-wrap gap-1">
              <SmallButton onClick={() => {
                if (plan.floors.length >= 6) return;
                const created = { ...floor, id: newId(), name: `Floor ${plan.floors.length + 1}`, rooms: [], nodes: [], outlets: [], walls: [], imageDataUrl: null };
                commit({ ...plan, floors: [...plan.floors, created], activeFloorId: created.id, home: { ...plan.home, floors: plan.floors.length + 1 } });
              }}>Add</SmallButton>
              <SmallButton onClick={() => { const copy = duplicateFloor(floor); commit({ ...plan, floors: [...plan.floors, copy], activeFloorId: copy.id }); }}>Duplicate</SmallButton>
              <SmallButton onClick={() => {
                if (plan.floors.length < 2) return;
                const floors = plan.floors.filter((item) => item.id !== floor.id);
                commit({ ...plan, floors, activeFloorId: floors[0]?.id ?? floor.id, home: { ...plan.home, floors: floors.length } });
                setSelection(null);
              }}>Delete</SmallButton>
            </div>
            <label className="mt-2 block text-xs">Rename
              <input className={field} value={floor.name} onChange={(event) => patchFloor((current) => ({ ...current, name: event.target.value.slice(0, 40) }))} />
            </label>
          </Section>
          <Section title="Equipment">
            <ul className="space-y-1 text-sm">
              {floor.nodes.map((node) => (
                <li key={node.id}><button type="button" className="w-full rounded-lg px-2 py-1 text-left hover:bg-muted" onClick={() => setSelection({ kind: "node", id: node.id })}>{node.role === "primary" ? "Router" : "Node"} · {node.name}</button></li>
              ))}
              {floor.outlets.map((outlet, index) => (
                <li key={outlet.id}><button type="button" className="w-full rounded-lg px-2 py-1 text-left hover:bg-muted" onClick={() => setSelection({ kind: "outlet", id: outlet.id })}>Outlet {index + 1}</button></li>
              ))}
              {floor.nodes.length === 0 && floor.outlets.length === 0 && <li className="text-xs text-muted-foreground">No equipment on this floor.</li>}
            </ul>
          </Section>
          <Section title="Show">
            {(Object.keys(layers) as Array<keyof typeof layers>).map((key) => (
              <label key={key} className="flex items-center gap-2 text-sm capitalize">
                <input type="checkbox" checked={layers[key]} onChange={() => setLayers((current) => ({ ...current, [key]: !current[key] }))} /> {key}
              </label>
            ))}
          </Section>
        </aside>
        <div className={`${mobilePane === "canvas" ? "block" : "hidden"} relative min-w-0 lg:block`}>
          <div ref={scrollerRef} className="relative max-h-[72vh] overflow-auto bg-[var(--surface-subtle)]">
            <div className="relative" style={{ width: `${Math.round(zoom * 100)}%`, minWidth: 320, aspectRatio: `${floor.widthFt} / ${floor.heightFt}` }}>
              <PlannerCanvas
                floor={floor}
                cells={cells}
                overlay={overlay}
                measurements={plan.measurements}
                showCoverage={layers.coverage}
                showRooms={layers.rooms}
                showNodes={layers.nodes}
                showWalls={layers.walls}
                showOutlets={layers.outlets}
                selection={selection}
                draft={draft}
                svgRef={svgRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
              />
              <div className="absolute bottom-3 right-3 flex gap-1">
                <IconButton label="Zoom out" onClick={() => setZoom((value) => Math.max(0.6, value - 0.2))}>−</IconButton>
                <IconButton label="Zoom in" onClick={() => setZoom((value) => Math.min(2.4, value + 0.2))}>+</IconButton>
                <IconButton label="Fit to screen" onClick={() => { setZoom(1); scrollerRef.current?.scrollTo(0, 0); }}>Fit</IconButton>
              </div>
            </div>
          </div>
          {empty && (
            <div className="absolute inset-x-6 top-8 rounded-2xl border border-border bg-card/95 p-4 shadow-lg">
              <p className="text-base font-semibold">Start with your home layout</p>
              <p className="mt-1 text-sm text-muted-foreground">Draw the rooms you care about, or open a sample and move the nodes.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="min-h-11 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground" onClick={() => replaceFloor(sampleFloor(floor.id, floor.name))}>Use sample floor plan</button>
                <button type="button" className="min-h-11 rounded-xl border border-border px-3 text-sm" onClick={() => setTool("room")}>Draw my home</button>
                <ImageButton onLoad={(imageDataUrl) => patchFloor((current) => ({ ...current, imageDataUrl }))} />
              </div>
            </div>
          )}
          <p className="border-t border-border px-3 py-2 text-center text-xs text-muted-foreground">
            {overlay === "estimate" ? `Floor ${floorIndex + 1} · ${band} GHz · Estimated coverage — not a measured Wi-Fi signal map.` : overlay === "download" ? "Measured download speed by room. This is throughput, not signal strength." : "Measured latency by room. This is not a Wi-Fi signal reading."}
          </p>
        </div>
        <aside className={`${side("details")} max-h-[70vh] flex-col gap-3 overflow-auto border-border p-3 lg:border-l`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Details</p>
          {selectedRoom && (
            <div className="space-y-2">
              <label className="block text-xs">Room name
                <input className={field} value={selectedRoom.name} onChange={(event) => patchFloor((current) => ({ ...current, rooms: current.rooms.map((room) => room.id === selectedRoom.id ? { ...room, name: event.target.value.slice(0, 80) } : room) }))} />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <NumberField label="X (ft)" value={selectedRoom.x} onChange={(value) => moveRoom(selectedRoom, value, selectedRoom.y)} />
                <NumberField label="Y (ft)" value={selectedRoom.y} onChange={(value) => moveRoom(selectedRoom, selectedRoom.x, value)} />
                <NumberField label="Width" value={selectedRoom.w} onChange={(value) => resizeRoom(selectedRoom, value, selectedRoom.h)} />
                <NumberField label="Depth" value={selectedRoom.h} onChange={(value) => resizeRoom(selectedRoom, selectedRoom.w, value)} />
              </div>
              <MaterialSelect value={selectedRoom.material} onChange={(material) => patchFloor((current) => ({ ...current, rooms: current.rooms.map((room) => room.id === selectedRoom.id ? { ...room, material } : room) }))} />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedRoom.priority} onChange={() => patchFloor((current) => ({ ...current, rooms: current.rooms.map((room) => room.id === selectedRoom.id ? { ...room, priority: !room.priority } : room) }))} /> Priority room</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedRoom.problem} onChange={() => patchFloor((current) => ({ ...current, rooms: current.rooms.map((room) => room.id === selectedRoom.id ? { ...room, problem: !room.problem } : room) }))} /> Problem room</label>
              <button type="button" className="text-sm text-primary" onClick={() => patchFloor((current) => ({ ...current, rooms: current.rooms.map((room) => room.id === selectedRoom.id ? { ...room, points: roomPoints(room) } : room) }))}>Edit corners</button>
              <button type="button" className="min-h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground" onClick={() => setTesting(true)}>Test this room</button>
              {testing && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Stand in {selectedRoom.name}. Nothing runs until you press Start. The result is throughput, not signal strength.</p>
                  <SpeedTestDashboard defaultMode="lightweight" onComplete={(result) => {
                    const latest = planRef.current;
                    if (!latest) return;
                    update({
                      ...latest,
                      measurements: [
                        { roomId: selectedRoom.id, downloadMbps: result.metrics.downloadMbps, uploadMbps: result.metrics.uploadMbps, pingMs: result.metrics.pingMs, jitterMs: result.metrics.jitterMs, testedAt: result.testedAt, endpointName: result.serverName },
                        ...latest.measurements.filter((row) => row.roomId !== selectedRoom.id),
                      ],
                    });
                  }} />
                </div>
              )}
            </div>
          )}
          {selectedNode && (
            <div className="space-y-2">
              <label className="block text-xs">Name
                <input className={field} value={selectedNode.name} onChange={(event) => patchFloor((current) => ({ ...current, nodes: current.nodes.map((node) => node.id === selectedNode.id ? { ...node, name: event.target.value.slice(0, 40) } : node) }))} />
              </label>
              <label className="block text-xs">Type
                <select className={field} value={selectedNode.role} onChange={(event) => patchFloor((current) => ({ ...current, nodes: current.nodes.map((node) => node.id === selectedNode.id ? { ...node, role: event.target.value as "primary" | "satellite" } : node) }))}>
                  <option value="primary">Primary router</option>
                  <option value="satellite">Mesh satellite</option>
                </select>
              </label>
              <label className="block text-xs">Band
                <select className={field} value={selectedNode.band ?? band} onChange={(event) => patchFloor((current) => ({ ...current, nodes: current.nodes.map((node) => node.id === selectedNode.id ? { ...node, band: event.target.value as WifiBand } : node) }))}>
                  <option value="2.4">2.4 GHz</option>
                  <option value="5">5 GHz</option>
                  <option value="6">6 GHz</option>
                </select>
              </label>
              <label className="block text-xs">Backhaul
                <select className={field} value={selectedNode.link ?? "wireless"} onChange={(event) => patchFloor((current) => ({ ...current, nodes: current.nodes.map((node) => node.id === selectedNode.id ? { ...node, link: event.target.value as "wired" | "wireless" } : node) }))}>
                  <option value="wireless">Wireless</option>
                  <option value="wired">Wired</option>
                </select>
              </label>
              <p className="text-xs text-muted-foreground">Position {selectedNode.x} ft, {selectedNode.y} ft. Drag the node to move it.</p>
            </div>
          )}
          {selectedWall && (
            <div className="space-y-2">
              <p className="text-sm">Wall, about {wallLength(selectedWall).toFixed(0)} ft</p>
              <MaterialSelect value={selectedWall.material} onChange={(material) => patchFloor((current) => ({ ...current, walls: (current.walls ?? []).map((wall) => wall.id === selectedWall.id ? { ...wall, material } : wall) }))} />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedWall.opening} onChange={() => patchFloor((current) => ({ ...current, walls: (current.walls ?? []).map((wall) => wall.id === selectedWall.id ? { ...wall, opening: !wall.opening } : wall) }))} /> Door or opening</label>
            </div>
          )}
          {selectedOutlet && <p className="text-sm">Ethernet outlet at {selectedOutlet.x} ft, {selectedOutlet.y} ft. Drag it to an outlet location.</p>}
          {!selection && (
            <div className="space-y-2 text-sm">
              <p>{floor.rooms.length === 1 ? "1 room" : `${floor.rooms.length} rooms`} · {floor.nodes.length === 1 ? "1 mesh node" : `${floor.nodes.length} mesh nodes`}</p>
              <p className="text-muted-foreground">{overlay === "estimate" ? gapSummary : (untested === 1 ? "1 room still needs a test." : `${untested} rooms still need a test.`)}</p>
              <p className="text-muted-foreground">{`Backhaul: ${plan.home.backhaul}. Wired hops use a solid line. Wireless hops are dashed.`}</p>
              <p className="text-muted-foreground">{untested > 0 ? "Next: test a priority room before you add hardware." : "Next: compare the room tests with the estimate."}</p>
              <button type="button" className="min-h-11 w-full rounded-xl border border-border text-sm font-medium" onClick={() => setSuggesting(true)}>Suggest placement</button>
            </div>
          )}
          {warnings.length > 0 && <ul className="space-y-1 text-xs text-muted-foreground">{warnings.map((note) => <li key={note}>{note}</li>)}</ul>}
          <Section title="Floor">
            <div className="grid grid-cols-2 gap-2">
              <NumberField label="Width (ft)" value={floor.widthFt} onChange={(value) => patchFloor((current) => ({ ...current, widthFt: clampDim(value) }))} />
              <NumberField label="Depth (ft)" value={floor.heightFt} onChange={(value) => patchFloor((current) => ({ ...current, heightFt: clampDim(value) }))} />
            </div>
            <div className="mt-2"><ImageButton onLoad={(imageDataUrl) => patchFloor((current) => ({ ...current, imageDataUrl }))} label="Upload floor plan" /></div>
            <p className="mt-1 text-xs text-muted-foreground">Images stay in this browser. Set the floor width to the real width the picture represents.</p>
            {floor.imageDataUrl && <button type="button" className="text-xs text-primary" onClick={() => patchFloor((current) => ({ ...current, imageDataUrl: null }))}>Remove image</button>}
          </Section>
          <div className="rounded-xl border border-border p-2 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Estimated coverage only</p>
            <div className="mt-2 h-2 rounded-full" style={{ background: "linear-gradient(90deg, #f87171, #facc15, #14b8a6)" }} />
            <p className="mt-1">Strong → weak. Colors are predictions, not dBm.</p>
          </div>
          {suggesting && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Placement ideas</p>
              {options.map((option) => (
                <button key={option.id} type="button" className="block w-full rounded-xl border border-border p-2 text-left text-sm" onClick={() => { patchFloor((current) => ({ ...current, nodes: option.nodes })); setSuggesting(false); }}>
                  <span className="font-medium">{option.title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{option.why}</span>
                </button>
              ))}
              <button type="button" className="text-xs text-muted-foreground" onClick={() => setSuggesting(false)}>Close</button>
            </div>
          )}
          {selection && <button type="button" className="text-sm text-destructive" onClick={removeSelection}>Delete selected</button>}
        </aside>
      </div>
      {message && <p className="px-3 py-2 text-sm text-destructive" role="alert">{message}</p>}
    </div>
  );

  function moveRoom(room: MeshRoom, x: number, y: number) {
    patchFloor((current) => ({
      ...current,
      rooms: current.rooms.map((item) => item.id === room.id ? { ...item, x: snapFt(x, current.widthFt), y: snapFt(y, current.heightFt) } : item),
    }));
  }
  function resizeRoom(room: MeshRoom, w: number, h: number) {
    patchFloor((current) => ({
      ...current,
      rooms: current.rooms.map((item) => item.id === room.id ? { ...item, w: Math.min(200, Math.max(2, w)), h: Math.min(200, Math.max(2, h)), points: undefined } : item),
    }));
  }
}

function hitTest(floor: MeshFloor, x: number, y: number): PlannerSelection {
  const near = (ax: number, ay: number, reach = 1.6) => Math.hypot(ax - x, ay - y) <= reach;
  const node = [...floor.nodes].reverse().find((item) => near(item.x, item.y));
  if (node) return { kind: "node", id: node.id };
  const outlet = [...floor.outlets].reverse().find((item) => near(item.x, item.y, 1.2));
  if (outlet) return { kind: "outlet", id: outlet.id };
  const wall = [...(floor.walls ?? [])].reverse().find((item) => distanceToSegment(x, y, item.x1, item.y1, item.x2, item.y2) < 0.8);
  if (wall) return { kind: "wall", id: wall.id };
  const room = [...floor.rooms].reverse().find((item) => {
    const points = roomPoints(item);
    return points.some((point, index) => {
      const next = points[(index + 1) % points.length];
      if (!next) return false;
      return x >= Math.min(point.x, next.x) - 0.2 && x <= Math.max(point.x, next.x) + 0.2 && y >= Math.min(point.y, next.y) - 0.2 && y <= Math.max(point.y, next.y) + 0.2 && distanceToSegment(x, y, point.x, point.y, next.x, next.y) < 8 && pointInPoly(item, x, y);
    }) || pointInPoly(item, x, y);
  });
  return room ? { kind: "room", id: room.id } : null;
}

function pointInPoly(room: MeshRoom, x: number, y: number): boolean {
  const points = roomPoints(room);
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const xi = points[i]?.x ?? 0;
    const yi = points[i]?.y ?? 0;
    const xj = points[j]?.x ?? 0;
    const yj = points[j]?.y ?? 0;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-9) + xi) inside = !inside;
  }
  return inside;
}

function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const length = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / length));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function clampDim(value: number): number {
  if (!Number.isFinite(value)) return 20;
  return Math.min(300, Math.max(8, Math.round(value)));
}

function exportPlan(plan: MeshPlan) {
  const blob = new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "mesh-plan.json";
  link.click();
  URL.revokeObjectURL(url);
}

async function readFloorImage(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("unreadable"));
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("unreadable"));
    img.src = dataUrl;
  });
  const scale = Math.min(1, 1000 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

function ImageButton({ onLoad, label = "Upload floor plan" }: { onLoad: (dataUrl: string) => void; label?: string }) {
  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-border px-3 text-sm">
      {label}
      <input type="file" accept="image/*" className="sr-only" onChange={async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
          onLoad(await readFloorImage(file));
        } catch {
          // The picture stays on this device only when the browser can read it.
        }
      }} />
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3><div className="mt-2 space-y-1">{children}</div></section>;
}

function ToolButton({ pressed, label, shortcut, onClick, children }: { pressed: boolean; label: string; shortcut: string; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" title={`${label} (${shortcut})`} aria-pressed={pressed} aria-keyshortcuts={shortcut} className={`min-h-11 rounded-xl px-3 text-sm ${pressed ? "bg-primary text-primary-foreground" : "border border-border"}`} onClick={onClick}>{children}</button>;
}

function IconButton({ label, shortcut, onClick, children }: { label: string; shortcut?: string; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" title={shortcut ? `${label} (${shortcut})` : label} aria-label={label} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border bg-card text-sm" onClick={onClick}>{children}</button>;
}

function SmallButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className="min-h-9 rounded-lg border border-border px-2 text-xs" onClick={onClick}>{children}</button>;
}

function MenuItem({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted" onClick={onClick}>{children}</button>;
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block text-xs">{label}
      <input className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm" inputMode="decimal" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function MaterialSelect({ value, onChange }: { value: WallMaterial; onChange: (value: WallMaterial) => void }) {
  return (
    <label className="block text-xs">Wall material
      <select className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm" value={value} onChange={(event) => onChange(event.target.value as WallMaterial)}>
        {MATERIALS.map((material) => <option key={material} value={material}>{material}</option>)}
      </select>
    </label>
  );
}
