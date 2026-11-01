"use client";

import dynamic from "next/dynamic";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { applyDistanceCalibration, imageSettings } from "@/lib/mesh/calibration";
import { estimateCoverage } from "@/lib/mesh/coverage";
import { boundsOf, roomPoints, snapFt } from "@/lib/mesh/geometry";
import { hitTestFloor } from "@/lib/mesh/hit";
import { recordPast, redoStacks, undoStacks } from "@/lib/mesh/history";
import {
  backhaulCounts,
  compareLayouts,
  connectedParent,
  coverageShares,
  drawnWallsBetween,
  nearestCell,
  roomCoverage,
  roomsNeedingAttention,
} from "@/lib/mesh/insights";
import { appendRoomSample, roomSampleFromResult, summarizeRoom } from "@/lib/mesh/measurements";
import { canAddFloor, canDeleteFloor, duplicateFloor, emptyPlan, newId } from "@/lib/mesh/plan";
import { placementOptions } from "@/lib/mesh/placement";
import { sampleFloor } from "@/lib/mesh/sample-floor";
import { clearPlan, parseMeshPlan, savePlan } from "@/lib/mesh/store";
import { suggestPlacements } from "@/lib/mesh/suggestions";
import type { MeshFloor, MeshNode, MeshPlan, MeshRoom, WallMaterial, WifiBand } from "@/lib/mesh/types";
import { clientToViewFeet, fitView, matchAspect, panBy, scaleBarFeet, zoomView, type PlanView } from "@/lib/mesh/view";
import { spacingWarnings } from "@/lib/mesh/warnings";
import { useMeshPlan } from "@/components/mesh/use-mesh-plan";
import { PlannerCanvas, type PlannerOverlay, type PlannerSelection } from "@/components/mesh/planner-canvas";
import { downloadJson, downloadPlanPng, readFloorImage } from "@/components/mesh/planner-files";
import { PlannerInspector } from "@/components/mesh/planner-inspector";
import { PlannerSidebar } from "@/components/mesh/planner-sidebar";
import { PlannerToolbar, type PlannerTool } from "@/components/mesh/planner-toolbar";
import { RouterConnectionDialog } from "@/components/mesh/router-connection-dialog";

const SpeedTestDashboard = dynamic(
  () => import("@/components/speedtest/dashboard/speed-test-dashboard").then((mod) => mod.SpeedTestDashboard),
  { ssr: false, loading: () => <p className="text-xs text-[#64748B]">Loading the speed test…</p> },
);

type Tool = PlannerTool | "calibrate";
type Draft = { kind: "room" | "wall"; x: number; y: number; x2: number; y2: number } | null;
type Point = { x: number; y: number };
type Proposal =
  | { kind: "add"; node: MeshNode; title: string }
  | { kind: "replace"; nodes: MeshNode[]; title: string };
type Drag =
  | { kind: "node" | "outlet" | "room" | "wall" | "vertex"; id: string; index?: number }
  | { kind: "pan"; x: number; y: number; view: PlanView }
  | null;

const MATERIALS: WallMaterial[] = ["drywall", "wood", "brick", "concrete", "glass", "open"];

export function FloorPlanner() {
  const { plan, update, ready } = useMeshPlan();
  const history = useRef<{ past: MeshPlan[]; future: MeshPlan[] }>({ past: [], future: [] });
  const [historyRev, setHistoryRev] = useState(0);
  const [band, setBand] = useState<WifiBand>("5");
  const [overlay, setOverlay] = useState<PlannerOverlay>("estimate");
  const [tool, setTool] = useState<Tool>("select");
  const [selection, setSelection] = useState<PlannerSelection>(null);
  const [draft, setDraft] = useState<Draft>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [testing, setTesting] = useState(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [wide, setWide] = useState(true);
  const [snap, setSnap] = useState(true);
  const [opacity, setOpacity] = useState(0.62);
  const [layers, setLayers] = useState({ coverage: true, rooms: true, nodes: true, walls: true, outlets: true });
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [pinned, setPinned] = useState<Point | null>(null);
  const [measure, setMeasure] = useState<{ a: Point; b: Point | null } | null>(null);
  const [calibrate, setCalibrate] = useState<{ a: Point; b: Point | null } | null>(null);
  const [knownDistance, setKnownDistance] = useState("10");
  const [linkFrom, setLinkFrom] = useState<string | null>(null);
  const [hover, setHover] = useState<Point | null>(null);
  const [settled, setSettled] = useState<MeshPlan | null>(null);
  const [view, setView] = useState<PlanView | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const planRef = useRef(plan);
  const viewRef = useRef(view);
  const snapRef = useRef(snap);
  const draftRef = useRef(draft);
  const beforeDrag = useRef<MeshPlan | null>(null);
  const drag = useRef<Drag>(null);
  const dragging = useRef(false);
  const applyRef = useRef<(x: number, y: number) => void>(() => {});
  const moveRef = useRef<Point | null>(null);
  const rafRef = useRef(0);
  const actionsRef = useRef({ undo: () => {}, redo: () => {}, remove: () => {}, place: (_kind: "router" | "node" | "outlet") => {} });

  const floor = plan?.floors.find((item) => item.id === plan.activeFloorId) ?? plan?.floors[0];
  planRef.current = plan;
  viewRef.current = view;
  snapRef.current = snap;
  draftRef.current = draft;

  useEffect(() => {
    if (!plan || dragging.current) return;
    setSettled(plan);
  }, [plan]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => {
      setWide(mq.matches);
      if (!mq.matches) {
        setLeftOpen(false);
        setRightOpen(false);
      }
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    const current = floor;
    if (!el || !current) return;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    setView(fitView(current.widthFt, current.heightFt, rect.width / rect.height));
  }, [floor?.id, floor?.widthFt, floor?.heightFt]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      if (rect.height < 2 || rect.width < 2) return;
      const aspect = rect.width / rect.height;
      const current = planRef.current?.floors.find((item) => item.id === planRef.current?.activeFloorId) ?? planRef.current?.floors[0];
      setView((existing) => {
        if (!existing && current) return fitView(current.widthFt, current.heightFt, aspect);
        if (!existing) return existing;
        return matchAspect(existing, aspect);
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [floor?.id]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      const current = viewRef.current;
      const svg = svgRef.current;
      if (!current || !svg) return;
      event.preventDefault();
      const anchor = clientToViewFeet(event.clientX, event.clientY, svg.getBoundingClientRect(), current);
      setView(zoomView(current, event.deltaY > 0 ? 1 / 1.12 : 1.12, anchor.x, anchor.y));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [floor?.id]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const settledFloor = settled?.floors.find((item) => item.id === settled.activeFloorId) ?? settled?.floors[0];
  const currentCells = useMemo(() => {
    if (!settled || !settledFloor) return [];
    return coverageFor(settled, settledFloor, settledFloor.nodes, band);
  }, [settled, settledFloor, band]);
  const proposedNodes = useMemo(() => {
    if (!proposal || !settledFloor) return null;
    if (proposal.kind === "replace") return proposal.nodes;
    return [...settledFloor.nodes, proposal.node];
  }, [proposal, settledFloor]);
  const proposedCells = useMemo(() => {
    if (!settled || !settledFloor || !proposedNodes) return null;
    return coverageFor(settled, settledFloor, proposedNodes, band);
  }, [settled, settledFloor, proposedNodes, band]);
  const shownCells = proposedCells ?? currentCells;
  const deferredCells = useDeferredValue(currentCells);
  const suggestions = useMemo(() => {
    if (!settled || !settledFloor || deferredCells.length === 0) return [];
    const index = Math.max(0, settled.floors.findIndex((item) => item.id === settledFloor.id));
    return suggestPlacements({
      floor: settledFloor,
      floorIndex: index,
      nodeFloors: settled.floors.flatMap((level, levelIndex) => level.nodes.map((node) => ({ node, floorIndex: levelIndex }))),
      band,
      cells: deferredCells,
      cellFt: 2,
    });
  }, [settled, settledFloor, deferredCells, band]);

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
      if (key === "h") setTool("pan");
      if (key === "r") setTool("room");
      if (key === "w") setTool("wall");
      if (key === "p") actionsRef.current.place("router");
      if (key === "n") actionsRef.current.place("node");
      if (key === "o") actionsRef.current.place("outlet");
      if (key === "m") setTool("measure");
      if (key === "c") setTool("connect");
      if (key === "g") setSnap((value) => !value);
      if (key === "escape") {
        setSelection(null);
        setPinned(null);
        setMeasure(null);
        setLinkFrom(null);
        setCalibrate(null);
        setTool("select");
      }
      if (key === "backspace" || key === "delete") actionsRef.current.remove();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const writePlan = (next: MeshPlan, record: boolean) => {
    const previous = planRef.current;
    if (record && previous) {
      history.current.past = recordPast(history.current.past, previous);
      history.current.future = [];
      setHistoryRev((value) => value + 1);
    }
    planRef.current = next;
    update(next);
  };
  const undoPlan = () => {
    const current = planRef.current;
    if (!current) return;
    const step = undoStacks(history.current.past, current, history.current.future);
    if (!step) return;
    history.current = { past: step.past, future: step.future };
    planRef.current = step.present;
    update(step.present);
    setProposal(null);
    setHistoryRev((value) => value + 1);
  };
  const redoPlan = () => {
    const current = planRef.current;
    if (!current) return;
    const step = redoStacks(history.current.past, current, history.current.future);
    if (!step) return;
    history.current = { past: step.past, future: step.future };
    planRef.current = step.present;
    update(step.present);
    setProposal(null);
    setHistoryRev((value) => value + 1);
  };
  const patchFloor = (mutator: (current: MeshFloor) => MeshFloor, record = true) => {
    const current = planRef.current;
    if (!current) return;
    const active = current.floors.find((item) => item.id === current.activeFloorId) ?? current.floors[0];
    if (!active) return;
    const nextFloor = mutator(active);
    if (nextFloor === active) return;
    writePlan({ ...current, floors: current.floors.map((item) => (item.id === active.id ? nextFloor : item)) }, record);
  };
  const quantize = (value: number, max: number) => {
    if (!Number.isFinite(value)) return 0;
    const grid = snapRef.current ? 1 : 0.1;
    const snapped = Math.round(value / grid) * grid;
    return Math.min(max, Math.max(0, Math.round(snapped * 10) / 10));
  };
  const feetFrom = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    const currentView = viewRef.current;
    const current = planRef.current;
    const active = current?.floors.find((item) => item.id === current.activeFloorId) ?? current?.floors[0];
    if (!svg || !currentView || !active) return { raw: { x: 0, y: 0 }, point: { x: 0, y: 0 } };
    const raw = clientToViewFeet(clientX, clientY, svg.getBoundingClientRect(), currentView);
    return { raw, point: { x: quantize(raw.x, active.widthFt), y: quantize(raw.y, active.heightFt) } };
  };
  const placeDevice = (kind: "router" | "node" | "outlet", at: Point | null) => {
    let created: { kind: "node" | "outlet"; id: string } | null = null;
    patchFloor((current) => {
      if (kind === "outlet") {
        if (current.outlets.length >= 30) return current;
        const id = newId();
        created = { kind: "outlet", id };
        const point = at ?? { x: snapFt(current.widthFt / 3, current.widthFt), y: snapFt(current.heightFt / 3, current.heightFt) };
        return { ...current, outlets: [...current.outlets, { id, x: point.x, y: point.y }] };
      }
      if (current.nodes.length >= 12) return current;
      const id = newId();
      created = { kind: "node", id };
      const index = current.nodes.length;
      const hasPrimary = current.nodes.some((node) => node.role === "primary");
      const point = at ?? {
        x: snapFt(current.widthFt * (0.35 + (index % 4) * 0.12), current.widthFt),
        y: snapFt(current.heightFt * (0.4 + (index % 3) * 0.12), current.heightFt),
      };
      const primary = !hasPrimary && (kind === "router" || kind === "node");
      return {
        ...current,
        nodes: [...current.nodes, {
          id,
          name: primary ? "Primary" : kind === "router" ? `Router ${index + 1}` : `Node ${index + 1}`,
          x: point.x,
          y: point.y,
          role: primary || kind === "router" ? "primary" : "satellite",
          link: primary || kind === "router" ? "wired" : "wireless",
          band,
        }],
      };
    });
    if (created) setSelection(created);
    setTool(kind);
  };
  const removeSelection = () => {
    const currentSelection = selection;
    if (!currentSelection) return;
    patchFloor((current) => ({
      ...current,
      rooms: currentSelection.kind === "room" ? current.rooms.filter((item) => item.id !== currentSelection.id) : current.rooms,
      nodes: currentSelection.kind === "node" ? current.nodes.filter((item) => item.id !== currentSelection.id) : current.nodes,
      outlets: currentSelection.kind === "outlet" ? current.outlets.filter((item) => item.id !== currentSelection.id) : current.outlets,
      walls: currentSelection.kind === "wall" ? (current.walls ?? []).filter((item) => item.id !== currentSelection.id) : current.walls,
    }));
    setSelection(null);
  };
  const fit = () => {
    const current = planRef.current?.floors.find((item) => item.id === planRef.current?.activeFloorId) ?? planRef.current?.floors[0];
    const el = stageRef.current;
    if (!current || !el) return;
    const rect = el.getBoundingClientRect();
    setView(fitView(current.widthFt, current.heightFt, rect.width / Math.max(rect.height, 1)));
  };
  actionsRef.current = { undo: undoPlan, redo: redoPlan, remove: removeSelection, place: (kind) => placeDevice(kind, null) };

  applyRef.current = (clientX, clientY) => {
    const { point } = feetFrom(clientX, clientY);
    const currentDrag = drag.current;
    if (draftRef.current) {
      setDraft({ ...draftRef.current, x2: point.x, y2: point.y });
      return;
    }
    if (!currentDrag) {
      if ((tool === "measure" && measure && !measure.b) || (tool === "calibrate" && calibrate && !calibrate.b)) setHover(point);
      return;
    }
    if (currentDrag.kind === "pan") {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const dx = -((clientX - currentDrag.x) / Math.max(rect.width, 1)) * currentDrag.view.width;
      const dy = -((clientY - currentDrag.y) / Math.max(rect.height, 1)) * currentDrag.view.height;
      setView(panBy(currentDrag.view, dx, dy));
      return;
    }
    dragging.current = true;
    patchFloor((current) => {
      if (currentDrag.kind === "node") return { ...current, nodes: current.nodes.map((node) => node.id === currentDrag.id ? { ...node, ...point } : node) };
      if (currentDrag.kind === "outlet") return { ...current, outlets: current.outlets.map((outlet) => outlet.id === currentDrag.id ? { ...outlet, ...point } : outlet) };
      if (currentDrag.kind === "wall") {
        const wall = (current.walls ?? []).find((item) => item.id === currentDrag.id);
        if (!wall) return current;
        const dx = point.x - (wall.x1 + wall.x2) / 2;
        const dy = point.y - (wall.y1 + wall.y2) / 2;
        return {
          ...current,
          walls: (current.walls ?? []).map((item) => item.id === wall.id ? {
            ...item,
            x1: quantize(item.x1 + dx, current.widthFt),
            y1: quantize(item.y1 + dy, current.heightFt),
            x2: quantize(item.x2 + dx, current.widthFt),
            y2: quantize(item.y2 + dy, current.heightFt),
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
            const points = room.points.map((vertex) => ({ x: quantize(vertex.x + dx, current.widthFt), y: quantize(vertex.y + dy, current.heightFt) }));
            return { ...room, points, ...boundsOf(points) };
          }
          return { ...room, x: quantize(room.x + dx, current.widthFt), y: quantize(room.y + dy, current.heightFt) };
        }),
      };
    }, false);
  };

  if (!ready || !plan || !floor) {
    return <div className="flex h-full items-center justify-center text-sm text-[#64748B]">Loading your saved plan…</div>;
  }

  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    const { raw, point } = feetFrom(event.clientX, event.clientY);
    const active = planRef.current?.floors.find((item) => item.id === planRef.current?.activeFloorId) ?? floor;
    if (tool === "pan") {
      const currentView = viewRef.current;
      if (!currentView) return;
      drag.current = { kind: "pan", x: event.clientX, y: event.clientY, view: currentView };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    if (tool === "room" || tool === "wall") {
      setDraft({ kind: tool, x: point.x, y: point.y, x2: point.x, y2: point.y });
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    if (tool === "router" || tool === "node" || tool === "outlet") {
      placeDevice(tool, point);
      return;
    }
    if (tool === "measure") {
      setMeasure((current) => (!current || current.b ? { a: point, b: null } : { ...current, b: point }));
      return;
    }
    if (tool === "calibrate") {
      setCalibrate((current) => (!current || current.b ? { a: point, b: null } : { ...current, b: point }));
      return;
    }
    if (tool === "connect") {
      const hit = hitTestFloor(active, raw.x, raw.y, reachFor(viewRef.current));
      if (hit?.kind === "node") connectNodes(hit.id);
      return;
    }
    const handle = (event.target as SVGElement | null)?.getAttribute?.("data-handle");
    if (handle && selection?.kind === "room") {
      beforeDrag.current = planRef.current;
      drag.current = { kind: "vertex", id: selection.id, index: Number(handle.split(":")[1]) };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    const hit = hitTestFloor(active, raw.x, raw.y, reachFor(viewRef.current));
    setPinned(point);
    if (hit) {
      setSelection(hit);
      beforeDrag.current = planRef.current;
      drag.current = { kind: hit.kind, id: hit.id };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    setSelection(null);
  };
  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    moveRef.current = { x: event.clientX, y: event.clientY };
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const point = moveRef.current;
      if (point) applyRef.current(point.x, point.y);
    });
  };
  const onPointerUp = () => {
    const currentDraft = draftRef.current;
    const active = planRef.current?.floors.find((item) => item.id === planRef.current?.activeFloorId) ?? floor;
    if (currentDraft) {
      const width = Math.abs(currentDraft.x2 - currentDraft.x);
      const height = Math.abs(currentDraft.y2 - currentDraft.y);
      if (currentDraft.kind === "room" && width >= 3 && height >= 3 && active.rooms.length < 40) {
        const created: MeshRoom = {
          id: newId(),
          name: `Room ${active.rooms.length + 1}`,
          x: Math.min(currentDraft.x, currentDraft.x2),
          y: Math.min(currentDraft.y, currentDraft.y2),
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
      if (currentDraft.kind === "wall" && Math.hypot(width, height) >= 2 && (active.walls ?? []).length < 80) {
        const id = newId();
        patchFloor((current) => ({
          ...current,
          walls: [...(current.walls ?? []), { id, x1: currentDraft.x, y1: currentDraft.y, x2: currentDraft.x2, y2: currentDraft.y2, material: "drywall", opening: false }],
        }));
        setSelection({ kind: "wall", id });
        setTool("select");
      }
    }
    if (beforeDrag.current && planRef.current && beforeDrag.current !== planRef.current) {
      history.current.past = recordPast(history.current.past, beforeDrag.current);
      history.current.future = [];
      setHistoryRev((value) => value + 1);
    }
    beforeDrag.current = null;
    drag.current = null;
    dragging.current = false;
    setDraft(null);
    if (planRef.current) setSettled(planRef.current);
  };
  const connectNodes = (id: string) => {
    if (!linkFrom) {
      setLinkFrom(id);
      setSelection({ kind: "node", id });
      return;
    }
    if (linkFrom === id) {
      setLinkFrom(null);
      return;
    }
    const source = linkFrom;
    patchFloor((current) => {
      const from = current.nodes.find((node) => node.id === source);
      const to = current.nodes.find((node) => node.id === id);
      if (!from || !to) return current;
      const childId = from.role === "primary" && to.role !== "primary" ? to.id : from.id;
      const parentId = childId === to.id ? from.id : to.id;
      return { ...current, nodes: current.nodes.map((node) => node.id === childId ? { ...node, parentId } : node) };
    });
    setLinkFrom(null);
    setTool("select");
  };
  const chooseTool = (next: PlannerTool) => {
    setCalibrate(null);
    setLinkFrom(null);
    if (next === "router" || next === "node" || next === "outlet") placeDevice(next, null);
    else setTool(next);
  };
  const acceptProposal = () => {
    if (!proposal) return;
    if (proposal.kind === "add") {
      patchFloor((current) => current.nodes.length >= 12 || current.nodes.some((node) => node.id === proposal.node.id) ? current : { ...current, nodes: [...current.nodes, proposal.node] });
    } else {
      patchFloor((current) => ({ ...current, nodes: proposal.nodes }));
    }
    setProposal(null);
  };
  const previewSuggestion = (suggestion: { node: MeshNode; reason: string }) => {
    setProposal({ kind: "add", node: suggestion.node, title: suggestion.reason });
    setRightOpen(true);
  };
  const comparePlacement = () => {
    const option = placementOptions(floor, Math.max(floor.nodes.length, 2)).find((item) => item.id === "coverage");
    if (!option) return;
    setProposal({
      kind: "replace",
      title: option.title,
      nodes: option.nodes.map((node, index) => ({ ...node, link: index === 0 ? "wired" : "wireless", band })),
    });
    setRightOpen(true);
  };
  const loadImage = async (file: File) => {
    try {
      const imageDataUrl = await readFloorImage(file);
      patchFloor((current) => ({ ...current, imageDataUrl }));
      setMessage(null);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "";
      setMessage(reason === "pdf" ? "PDF floor plans are not supported. Use a PNG, JPEG, or WebP image." : reason === "large" ? "That image is too large to keep in this browser." : "This browser could not read that image.");
    }
  };
  const applyCalibration = () => {
    if (!calibrate?.b) {
      setMessage("Click two points on the floor plan first.");
      return;
    }
    const result = applyDistanceCalibration(floor, calibrate.a, calibrate.b, Number(knownDistance));
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    writePlan({ ...plan, floors: plan.floors.map((item) => item.id === floor.id ? result.floor : item) }, true);
    setCalibrate(null);
    setTool("select");
    setMessage("Floor scale updated from the two points. Coverage is still an estimate.");
  };

  const selectedRoom = selection?.kind === "room" ? floor.rooms.find((room) => room.id === selection.id) : undefined;
  const selectedNode = selection?.kind === "node" ? floor.nodes.find((node) => node.id === selection.id) : undefined;
  const selectedWall = selection?.kind === "wall" ? (floor.walls ?? []).find((wall) => wall.id === selection.id) : undefined;
  const selectedOutlet = selection?.kind === "outlet" ? floor.outlets.find((outlet) => outlet.id === selection.id) : undefined;
  const shares = coverageShares(currentCells);
  const comparison = proposal && proposedNodes && proposedCells
    ? compareLayouts({ nodes: floor.nodes, shares: coverageShares(currentCells) }, { nodes: proposedNodes, shares: coverageShares(proposedCells) })
    : null;
  const parentLink = selectedNode ? connectedParent(selectedNode, floor.nodes) : null;
  const roomSummary = selectedRoom ? summarizeRoom(plan.measurements, selectedRoom.id) : null;
  const nearby = selectedRoom
    ? floor.nodes
      .map((node) => ({ name: node.name, distanceFt: Math.hypot(node.x - (selectedRoom.x + selectedRoom.w / 2), node.y - (selectedRoom.y + selectedRoom.h / 2)) }))
      .sort((a, b) => a.distanceFt - b.distanceFt)
      .slice(0, 3)
    : [];
  const fadedIds = proposal?.kind === "replace" ? floor.nodes.map((node) => node.id) : [];
  const previewIds = proposal?.kind === "replace" ? proposal.nodes.map((node) => node.id) : proposal?.kind === "add" ? [proposal.node.id] : [];
  const canvasFloor: MeshFloor = proposal?.kind === "replace"
    ? { ...floor, nodes: [...floor.nodes, ...proposal.nodes] }
    : proposal?.kind === "add"
      ? { ...floor, nodes: [...floor.nodes, proposal.node] }
      : floor;
  const probeCell = pinned ? nearestCell(shownCells, pinned.x, pinned.y) : null;
  const probeNearest = pinned ? closestNode(canvasFloor.nodes.filter((node) => !fadedIds.includes(node.id)), pinned) : null;
  const probe = pinned && view ? {
    left: ((pinned.x - view.x) / view.width) * 100,
    top: ((pinned.y - view.y) / view.height) * 100,
    level: probeCell?.level ?? null,
    nearest: probeNearest?.node.name ?? null,
    distanceFt: probeNearest?.distanceFt ?? null,
    walls: probeNearest ? drawnWallsBetween(floor.walls ?? [], probeNearest.node.x, probeNearest.node.y, pinned.x, pinned.y) : 0,
  } : null;
  const networkNodes = plan.floors.reduce((sum, level) => sum + level.nodes.length, 0);
  const empty = floor.rooms.length === 0 && floor.nodes.length === 0 && !(floor.walls ?? []).length && !floor.imageDataUrl;
  const measureEnd = measure?.b ?? (tool === "measure" ? hover : null) ?? measure?.a ?? null;
  const calibrateEnd = calibrate?.b ?? (tool === "calibrate" ? hover : null) ?? calibrate?.a ?? null;
  const measureLine = measure && measureEnd ? { x: measure.a.x, y: measure.a.y, x2: measureEnd.x, y2: measureEnd.y } : null;
  const calibrateLine = calibrate && calibrateEnd ? { x: calibrate.a.x, y: calibrate.a.y, x2: calibrateEnd.x, y2: calibrateEnd.y } : null;
  const canUndo = historyRev >= 0 && history.current.past.length > 0;
  const canRedo = historyRev >= 0 && history.current.future.length > 0;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] shadow-sm">
      <header className="flex flex-wrap items-center gap-2 border-b border-[#E2E8F0] bg-white px-3 py-2">
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-base font-semibold leading-5">Mesh Coverage Planner</h1>
          <p className="text-[11px] text-[#64748B]">Floor plan and estimated coverage. Saved on this device.</p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <HeaderButton onClick={() => setLeftOpen((open) => !open)}>{wide ? "Floors" : leftOpen ? "Close floors" : "Floors"}</HeaderButton>
          <HeaderButton onClick={() => setRightOpen((open) => !open)}>{wide ? "Inspector" : rightOpen ? "Close inspector" : "Inspector"}</HeaderButton>
          <HeaderButton onClick={comparePlacement}>Compare layouts</HeaderButton>
          <label className="inline-flex h-8 cursor-pointer items-center rounded-md border border-[#E2E8F0] bg-white px-2 text-xs font-medium">
            Import floor plan
            <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void loadImage(file); }} />
          </label>
          <div className="relative">
            <HeaderButton onClick={() => setMenu((open) => !open)}>Export</HeaderButton>
            {menu && (
              <>
                <button type="button" className="fixed inset-0 z-20 cursor-default" aria-label="Close menu" onClick={() => setMenu(false)} />
                <div className="absolute right-0 z-30 mt-1 w-44 rounded-lg border border-[#E2E8F0] bg-white p-1 shadow-lg">
                  <MenuItem onClick={() => { void downloadPlanPng(floor, currentCells, band, opacity); setMenu(false); }}>Export PNG</MenuItem>
                  <MenuItem onClick={() => { downloadJson(plan); setMenu(false); }}>Export JSON</MenuItem>
                  <label className="block cursor-pointer rounded-md px-2 py-1.5 text-xs hover:bg-[#F8FAFC]">
                    Import JSON
                    <input type="file" accept="application/json" className="sr-only" onChange={async (event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      setMenu(false);
                      if (!file) return;
                      try {
                        const parsed = parseMeshPlan(JSON.parse(await file.text()));
                        if (!parsed.ok) setMessage(parsed.error);
                        else {
                          history.current = { past: recordPast(history.current.past, plan), future: [] };
                          setHistoryRev((value) => value + 1);
                          setProposal(null);
                          setSelection(null);
                          update(parsed.plan);
                          setMessage(null);
                        }
                      } catch {
                        setMessage("That file is not valid JSON.");
                      }
                    }} />
                  </label>
                  <MenuItem onClick={() => {
                    setMenu(false);
                    if (window.confirm("Delete the mesh plan saved in this browser and start over?")) {
                      clearPlan();
                      history.current = { past: [], future: [] };
                      setHistoryRev((value) => value + 1);
                      setProposal(null);
                      setSelection(null);
                      update(emptyPlan());
                    }
                  }}>Reset plan</MenuItem>
                </div>
              </>
            )}
          </div>
          <HeaderButton onClick={() => { savePlan(plan); setMessage("Saved on this device."); }}>Save project</HeaderButton>
          <RouterConnectionDialog className="inline-flex h-8 items-center rounded-md border border-[#E2E8F0] bg-white px-2 text-xs font-medium text-[#0F172A]" />
        </div>
      </header>
      <PlannerToolbar
        tool={tool}
        snap={snap}
        canUndo={canUndo}
        canRedo={canRedo}
        onTool={chooseTool}
        onUndo={undoPlan}
        onRedo={redoPlan}
        onZoomIn={() => view && setView(zoomView(view, 1.2, view.x + view.width / 2, view.y + view.height / 2))}
        onZoomOut={() => view && setView(zoomView(view, 1 / 1.2, view.x + view.width / 2, view.y + view.height / 2))}
        onFit={fit}
        onSnap={() => setSnap((value) => !value)}
      />
      <div className="relative flex min-h-0 flex-1">
        {leftOpen && (
          <aside className={`${wide ? "static" : "absolute inset-y-0 left-0 z-20 shadow-lg"} flex w-60 shrink-0 flex-col border-r border-[#E2E8F0] bg-[#F8FAFC]`}>
            <PlannerSidebar
              plan={plan}
              floor={floor}
              layers={layers}
              calibrating={tool === "calibrate"}
              knownDistance={knownDistance}
              onKnownDistance={setKnownDistance}
              onApplyCalibration={applyCalibration}
              onCancelCalibration={() => { setCalibrate(null); setTool("select"); }}
              onStartCalibration={() => { setTool("calibrate"); setCalibrate(null); }}
              onProjectName={(value) => writePlan({ ...plan, home: { ...plan.home, networkName: value } }, true)}
              onSelectFloor={(id) => { writePlan({ ...plan, activeFloorId: id }, true); setSelection(null); setProposal(null); }}
              onAddFloor={() => {
                if (!canAddFloor(plan.floors.length)) return;
                const created = { ...floor, id: newId(), name: `Floor ${plan.floors.length + 1}`, rooms: [], nodes: [], outlets: [], walls: [], imageDataUrl: null, image: undefined };
                writePlan({ ...plan, floors: [...plan.floors, created], activeFloorId: created.id, home: { ...plan.home, floors: plan.floors.length + 1 } }, true);
                setSelection(null);
                setProposal(null);
              }}
              onDuplicateFloor={() => {
                if (!canAddFloor(plan.floors.length)) return;
                const copy = duplicateFloor(floor);
                writePlan({ ...plan, floors: [...plan.floors, copy], activeFloorId: copy.id, home: { ...plan.home, floors: plan.floors.length + 1 } }, true);
                setSelection(null);
              }}
              onDeleteFloor={() => {
                if (!canDeleteFloor(plan.floors.length)) return;
                if (!window.confirm(`Delete ${floor.name}? This floor’s rooms and nodes will be removed from the plan on this device.`)) return;
                const floors = plan.floors.filter((item) => item.id !== floor.id);
                writePlan({ ...plan, floors, activeFloorId: floors[0]?.id ?? floor.id, home: { ...plan.home, floors: floors.length } }, true);
                setSelection(null);
                setProposal(null);
              }}
              onRenameFloor={(value) => patchFloor((current) => ({ ...current, name: value }))}
              onFloorSize={(width, height) => patchFloor((current) => ({ ...current, widthFt: clampDim(width), heightFt: clampDim(height) }))}
              onSelectEquipment={(kind, id) => { setSelection({ kind, id }); setRightOpen(true); }}
              onToggleLayer={(key) => setLayers((current) => ({ ...current, [key]: !current[key] }))}
              onImageFile={(file) => void loadImage(file)}
              onImagePatch={(patch) => patchFloor((current) => ({ ...current, image: { ...imageSettings(current), ...patch } }), false)}
              onRemoveImage={() => patchFloor((current) => ({ ...current, imageDataUrl: null }))}
              onSample={() => {
                if ((floor.rooms.length || floor.nodes.length) && !window.confirm("Replace this floor with the sample plan?")) return;
                const next = sampleFloor(floor.id, floor.name);
                writePlan({ ...plan, floors: plan.floors.map((item) => item.id === floor.id ? next : item) }, true);
              }}
            />
          </aside>
        )}
        {!wide && (leftOpen || rightOpen) && <button type="button" className="absolute inset-0 z-10 bg-[#0F172A]/20" aria-label="Close panel" onClick={() => { setLeftOpen(false); setRightOpen(false); }} />}
        <div className="flex min-w-0 flex-1 flex-col">
          <div ref={stageRef} className={`relative min-h-0 flex-1 ${cursorFor(tool)}`}>
            {view && (
              <PlannerCanvas
                floor={canvasFloor}
                cells={shownCells}
                overlay={overlay}
                measurements={plan.measurements}
                view={view}
                showCoverage={layers.coverage}
                showRooms={layers.rooms}
                showNodes={layers.nodes}
                showWalls={layers.walls}
                showOutlets={layers.outlets}
                selection={selection}
                draft={draft}
                measure={measureLine}
                calibrate={calibrateLine}
                fadedIds={fadedIds}
                previewIds={previewIds}
                heatmapOpacity={opacity}
                scaleFeet={scaleBarFeet(view.width)}
                probe={overlay === "estimate" ? probe : null}
                svgRef={svgRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onCloseProbe={() => setPinned(null)}
              />
            )}
            {empty && tool === "select" && !draft && (
              <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center px-4">
                <div className="pointer-events-auto max-w-sm rounded-xl border border-[#E2E8F0] bg-white/95 p-3 shadow-md">
                  <p className="text-sm font-semibold">Start with your home layout</p>
                  <p className="mt-1 text-xs text-[#64748B]">Draw rooms, or open a sample and move the nodes. Colors are an estimate.</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <button type="button" className="h-8 rounded-md bg-[#00866A] px-2 text-xs font-semibold text-white" onClick={() => writePlan({ ...plan, floors: plan.floors.map((item) => item.id === floor.id ? sampleFloor(floor.id, floor.name) : item) }, true)}>Use sample floor plan</button>
                    <button type="button" className="h-8 rounded-md border border-[#E2E8F0] px-2 text-xs" onClick={() => setTool("room")}>Draw room</button>
                  </div>
                </div>
              </div>
            )}
            {proposal && <p className="pointer-events-none absolute left-2 top-2 rounded-md bg-white/95 px-2 py-1 text-[11px] text-[#0F172A] shadow-sm">Previewing a proposed layout. Estimated coverage, not a guaranteed result.</p>}
            {linkFrom && <p className="pointer-events-none absolute left-2 top-2 rounded-md bg-white/95 px-2 py-1 text-[11px] shadow-sm">Click the device this node links to.</p>}
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-[#E2E8F0] bg-white px-3 py-1.5 text-[11px] text-[#64748B]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-16 rounded-full" style={{ background: "linear-gradient(90deg, #EF4444, #F97316, #EAB308, #84CC16, #00866A)" }} />
              <span>Strong</span><span>Moderate</span><span>Weak</span><span>Very weak</span>
            </div>
            <div className="flex items-center gap-1" role="group" aria-label="Frequency">
              {(["2.4", "5", "6"] as const).map((item) => (
                <button key={item} type="button" aria-pressed={band === item} className={`h-6 rounded-md px-1.5 ${band === item ? "bg-[#00866A] text-white" : "border border-[#E2E8F0] text-[#0F172A]"}`} onClick={() => setBand(item)}>{item} GHz</button>
              ))}
            </div>
            <label className="flex items-center gap-1">Opacity
              <input type="range" min={0.15} max={0.9} step={0.05} value={opacity} aria-label="Heatmap opacity" onChange={(event) => setOpacity(Number(event.target.value))} />
            </label>
            <label className="ml-auto">
              <span className="sr-only">Coverage view</span>
              <select className="select-chevron-on-light rounded-md border border-[#E2E8F0] bg-white py-0.5 pl-2 text-[11px] text-[#0F172A] outline-none focus-visible:ring-2 focus-visible:ring-ring" value={overlay} aria-label="Coverage view" onChange={(event) => setOverlay(event.target.value as PlannerOverlay)}>
                <option value="estimate">Estimate</option>
                <option value="download">Measured download</option>
                <option value="latency">Measured latency</option>
                <option value="compare">Room comparison</option>
              </select>
            </label>
            <p className="basis-full text-center text-[#64748B]">
              {overlay === "estimate"
                ? "Estimated coverage — not a measured Wi-Fi signal map."
                : overlay === "download"
                  ? "Measured download by room. This is throughput, not signal strength."
                  : overlay === "latency"
                    ? "Measured latency by room. This is not a Wi-Fi signal reading."
                    : "Room comparison uses saved download tests. This is throughput, not signal strength."}
            </p>
          </div>
        </div>
        {rightOpen && (
          <aside className={`${wide ? "static" : "absolute inset-y-0 right-0 z-20 shadow-lg"} flex w-[300px] max-w-full shrink-0 flex-col border-l border-[#E2E8F0] bg-[#F8FAFC]`}>
            <PlannerInspector
              floor={floor}
              nodeCount={networkNodes}
              roomCount={floor.rooms.length}
              acceptableShare={networkNodes === 0 ? null : shares.acceptableShare}
              shares={networkNodes === 0 ? null : shares.shares}
              attention={roomsNeedingAttention(floor.rooms, currentCells)}
              backhaul={backhaulCounts(floor.nodes)}
              suggestions={suggestions}
              comparison={comparison}
              proposalTitle={proposal?.title ?? null}
              previewAt={proposal?.kind === "add" ? proposal.node : null}
              selectionKind={selection?.kind ?? null}
              selectedNode={selectedNode}
              selectedRoom={selectedRoom}
              selectedWall={selectedWall}
              selectedOutlet={selectedOutlet}
              roomCoverage={selectedRoom ? roomCoverage(selectedRoom, shownCells) : null}
              nearby={nearby}
              parentDistance={parentLink ? { name: parentLink.node.name, distanceFt: parentLink.distanceFt } : null}
              warnings={selectedNode ? spacingWarnings(floor.nodes, selectedNode.band ?? band).filter((note) => note.includes(selectedNode.name)) : []}
              materials={MATERIALS}
              onPreviewSuggestion={previewSuggestion}
              onApplySuggestion={(suggestion) => {
                patchFloor((current) => current.nodes.length >= 12 || current.nodes.some((item) => item.id === suggestion.node.id) ? current : { ...current, nodes: [...current.nodes, suggestion.node] });
                setProposal(null);
              }}
              onAcceptProposal={acceptProposal}
              onDiscardProposal={() => setProposal(null)}
              onRenameNode={(value) => patchFloor((current) => ({ ...current, nodes: current.nodes.map((node) => node.id === selectedNode?.id ? { ...node, name: value } : node) }))}
              onRole={(role) => patchFloor((current) => ({ ...current, nodes: current.nodes.map((node) => node.id === selectedNode?.id ? { ...node, role } : node) }))}
              onBand={(next) => patchFloor((current) => ({ ...current, nodes: current.nodes.map((node) => node.id === selectedNode?.id ? { ...node, band: next } : node) }))}
              onLink={(link) => patchFloor((current) => ({ ...current, nodes: current.nodes.map((node) => node.id === selectedNode?.id ? { ...node, link } : node) }))}
              onParent={(parentId) => patchFloor((current) => ({ ...current, nodes: current.nodes.map((node) => node.id === selectedNode?.id ? { ...node, parentId: parentId || undefined } : node) }))}
              onMoveNode={(x, y) => patchFloor((current) => ({ ...current, nodes: current.nodes.map((node) => node.id === selectedNode?.id ? { ...node, x: quantize(x, current.widthFt), y: quantize(y, current.heightFt) } : node) }))}
              onRenameRoom={(value) => patchFloor((current) => ({ ...current, rooms: current.rooms.map((room) => room.id === selectedRoom?.id ? { ...room, name: value } : room) }))}
              onRoomMaterial={(material) => patchFloor((current) => ({ ...current, rooms: current.rooms.map((room) => room.id === selectedRoom?.id ? { ...room, material } : room) }))}
              onRoomFlag={(flag) => patchFloor((current) => ({ ...current, rooms: current.rooms.map((room) => room.id === selectedRoom?.id ? { ...room, [flag]: !room[flag] } : room) }))}
              onRoomSize={(w, h) => patchFloor((current) => ({ ...current, rooms: current.rooms.map((room) => room.id === selectedRoom?.id ? { ...room, w: Math.min(200, Math.max(2, w)), h: Math.min(200, Math.max(2, h)), points: undefined } : room) }))}
              onEditCorners={() => selectedRoom && patchFloor((current) => ({ ...current, rooms: current.rooms.map((room) => room.id === selectedRoom.id ? { ...room, points: roomPoints(room) } : room) }))}
              onWallMaterial={(material) => patchFloor((current) => ({ ...current, walls: (current.walls ?? []).map((wall) => wall.id === selectedWall?.id ? { ...wall, material } : wall) }))}
              onWallOpening={() => patchFloor((current) => ({ ...current, walls: (current.walls ?? []).map((wall) => wall.id === selectedWall?.id ? { ...wall, opening: !wall.opening } : wall) }))}
              onDelete={removeSelection}
              onTestRoom={() => setTesting(true)}
              testing={testing}
              roomTest={selectedRoom && testing ? (
                <div className="space-y-1">
                  <p className="text-[11px] text-[#64748B]">Stand in {selectedRoom.name}. Nothing runs until you press Start. The result is throughput, not signal strength.</p>
                  <SpeedTestDashboard defaultMode="standard" onComplete={(result) => {
                    const latest = planRef.current;
                    if (!latest || !selectedRoom) return;
                    update({ ...latest, measurements: appendRoomSample(latest.measurements, roomSampleFromResult(selectedRoom.id, result)) });
                  }} />
                </div>
              ) : null}
              roomSummary={roomSummary ? `Median download ${roomSummary.downloadMbps == null ? "not measured" : `${Math.round(roomSummary.downloadMbps * 10) / 10} Mbps`} from ${roomSummary.sampleCount} saved ${roomSummary.sampleCount === 1 ? "test" : "tests"}. This is throughput, separate from the coverage estimate.` : null}
            />
          </aside>
        )}
      </div>
      {message && <p className="border-t border-[#E2E8F0] px-3 py-1.5 text-xs text-[#0F172A]" role="status">{message}</p>}
    </div>
  );
}

function coverageFor(source: MeshPlan, active: MeshFloor, nodes: MeshNode[], band: WifiBand) {
  const floorIndex = Math.max(0, source.floors.findIndex((item) => item.id === active.id));
  return estimateCoverage({
    widthFt: active.widthFt,
    heightFt: active.heightFt,
    floorIndex,
    rooms: active.rooms,
    walls: active.walls ?? [],
    band,
    cellFt: 2,
    nodeFloors: source.floors.flatMap((level, levelIndex) => {
      const list = level.id === active.id ? nodes : level.nodes;
      return list.map((node) => ({ node, floorIndex: levelIndex }));
    }),
  });
}

function reachFor(view: PlanView | null) {
  const node = Math.max(1.4, (view?.width ?? 40) / 28);
  return { node, outlet: node * 0.75, wall: Math.max(0.7, node * 0.45) };
}

function closestNode(nodes: MeshNode[], point: Point): { node: MeshNode; distanceFt: number } | null {
  let best: MeshNode | null = null;
  let distanceFt = Number.POSITIVE_INFINITY;
  for (const node of nodes) {
    const distance = Math.hypot(node.x - point.x, node.y - point.y);
    if (distance < distanceFt) {
      distanceFt = distance;
      best = node;
    }
  }
  return best ? { node: best, distanceFt } : null;
}

function clampDim(value: number): number {
  if (!Number.isFinite(value)) return 20;
  return Math.min(300, Math.max(8, Math.round(value)));
}

function cursorFor(tool: Tool): string {
  if (tool === "pan") return "cursor-grab";
  if (tool === "room" || tool === "wall" || tool === "measure" || tool === "calibrate") return "cursor-crosshair";
  if (tool === "router" || tool === "node" || tool === "outlet") return "cursor-copy";
  return "cursor-default";
}

function HeaderButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button type="button" className="inline-flex h-8 items-center rounded-md border border-[#E2E8F0] bg-white px-2 text-xs font-medium text-[#0F172A] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00866A]" onClick={onClick}>{children}</button>;
}

function MenuItem({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button type="button" className="block w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-[#F8FAFC]" onClick={onClick}>{children}</button>;
}
