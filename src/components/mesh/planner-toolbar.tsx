"use client";

import {
  Hand,
  Link2,
  Magnet,
  Maximize2,
  MousePointer2,
  PenLine,
  Plug,
  Redo2,
  RotateCcw,
  Router,
  Ruler,
  Square,
  Undo2,
  Wifi,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

export type PlannerTool = "select" | "pan" | "room" | "wall" | "router" | "node" | "outlet" | "connect" | "measure";

export function PlannerToolbar({
  tool,
  snap,
  canUndo,
  canRedo,
  onTool,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onFit,
  onSnap,
}: {
  tool: PlannerTool | "calibrate";
  snap: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onTool: (tool: PlannerTool) => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onSnap: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-[#E2E8F0] bg-white px-2 py-1.5">
      <Group>
        <ToolButton pressed={tool === "select"} label="Select" shortcut="V" onClick={() => onTool("select")} icon={<MousePointer2 className="h-3.5 w-3.5" />} />
        <ToolButton pressed={tool === "pan"} label="Pan" shortcut="H" onClick={() => onTool("pan")} icon={<Hand className="h-3.5 w-3.5" />} />
      </Group>
      <Group>
        <ToolButton pressed={tool === "room"} label="Room" shortcut="R" onClick={() => onTool("room")} icon={<Square className="h-3.5 w-3.5" />} />
        <ToolButton pressed={tool === "wall"} label="Wall" shortcut="W" onClick={() => onTool("wall")} icon={<PenLine className="h-3.5 w-3.5" />} />
      </Group>
      <Group>
        <ToolButton pressed={tool === "router"} label="Router" shortcut="P" onClick={() => onTool("router")} icon={<Router className="h-3.5 w-3.5" />} />
        <ToolButton pressed={tool === "node"} label="Mesh node" shortcut="N" onClick={() => onTool("node")} icon={<Wifi className="h-3.5 w-3.5" />} />
        <ToolButton pressed={tool === "outlet"} label="Outlet" shortcut="O" onClick={() => onTool("outlet")} icon={<Plug className="h-3.5 w-3.5" />} />
      </Group>
      <Group>
        <ToolButton pressed={tool === "connect"} label="Connect" shortcut="C" onClick={() => onTool("connect")} icon={<Link2 className="h-3.5 w-3.5" />} />
        <ToolButton pressed={tool === "measure"} label="Measure" shortcut="M" onClick={() => onTool("measure")} icon={<Ruler className="h-3.5 w-3.5" />} />
      </Group>
      <Group>
        <IconAction label="Undo" shortcut="⌘Z" disabled={!canUndo} onClick={onUndo} icon={<Undo2 className="h-3.5 w-3.5" />} />
        <IconAction label="Redo" shortcut="⇧⌘Z" disabled={!canRedo} onClick={onRedo} icon={<Redo2 className="h-3.5 w-3.5" />} />
      </Group>
      <Group>
        <IconAction label="Reset view" onClick={onFit} icon={<RotateCcw className="h-3.5 w-3.5" />} />
        <IconAction label="Zoom out" onClick={onZoomOut} icon={<ZoomOut className="h-3.5 w-3.5" />} />
        <IconAction label="Zoom in" onClick={onZoomIn} icon={<ZoomIn className="h-3.5 w-3.5" />} />
        <IconAction label="Fit to screen" onClick={onFit} icon={<Maximize2 className="h-3.5 w-3.5" />} />
        <ToolButton pressed={snap} label="Snap" shortcut="G" onClick={onSnap} icon={<Magnet className="h-3.5 w-3.5" />} />
      </Group>
    </div>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-0.5">{children}</div>;
}

function ToolButton({ pressed, label, shortcut, onClick, icon }: { pressed: boolean; label: string; shortcut: string; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button
      type="button"
      title={`${label} (${shortcut})`}
      aria-label={label === "Mesh node" ? "Add mesh node" : label === "Router" ? "Add router" : label === "Outlet" ? "Add outlet" : label === "Room" ? "Draw room" : label === "Wall" ? "Draw wall" : label === "Connect" ? "Connect devices" : label === "Measure" ? "Measure distance" : label}
      aria-pressed={pressed}
      aria-keyshortcuts={shortcut}
      className={`inline-flex h-8 items-center gap-1 rounded-md px-1.5 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00866A] ${pressed ? "bg-[#00866A] text-white" : "text-[#0F172A] hover:bg-white"}`}
      onClick={onClick}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function IconAction({ label, shortcut, disabled, onClick, icon }: { label: string; shortcut?: string; disabled?: boolean; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button
      type="button"
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-label={label}
      disabled={disabled}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#0F172A] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00866A] disabled:opacity-40"
      onClick={onClick}
    >
      {icon}
    </button>
  );
}
