"use client";

import { useEffect, useState } from "react";
import { MATERIAL_DB } from "@/lib/mesh/assumptions";
import { wallLength } from "@/lib/mesh/geometry";
import { coverageLabel, COVERAGE_LEGEND, formatShare, type LayoutComparison, type RoomAttention, type RoomCoverage } from "@/lib/mesh/insights";
import type { PlacementSuggestion } from "@/lib/mesh/suggestions";
import type { MeshFloor, MeshNode, MeshRoom, MeshWall, WallMaterial, WifiBand } from "@/lib/mesh/types";

type Tab = "overview" | "device" | "room" | "suggestions";

export function PlannerInspector({
  floor,
  nodeCount,
  roomCount,
  acceptableShare,
  shares,
  attention,
  backhaul,
  suggestions,
  comparison,
  proposalTitle,
  previewAt,
  selectionKind,
  selectedNode,
  selectedRoom,
  selectedWall,
  selectedOutlet,
  roomCoverage,
  nearby,
  parentDistance,
  warnings,
  materials,
  onPreviewSuggestion,
  onApplySuggestion,
  onAcceptProposal,
  onDiscardProposal,
  onRenameNode,
  onRole,
  onBand,
  onLink,
  onParent,
  onMoveNode,
  onRenameRoom,
  onRoomMaterial,
  onRoomFlag,
  onRoomSize,
  onEditCorners,
  onWallMaterial,
  onWallOpening,
  onDelete,
  onTestRoom,
  testing,
  roomTest,
  roomSummary,
}: {
  floor: MeshFloor;
  nodeCount: number;
  roomCount: number;
  acceptableShare: number | null;
  shares: Record<"strong" | "moderate" | "weak" | "dead", number> | null;
  attention: RoomAttention[];
  backhaul: { wired: number; wireless: number };
  suggestions: PlacementSuggestion[];
  comparison: LayoutComparison | null;
  proposalTitle: string | null;
  previewAt: { x: number; y: number } | null;
  selectionKind: "node" | "room" | "wall" | "outlet" | null;
  selectedNode?: MeshNode;
  selectedRoom?: MeshRoom;
  selectedWall?: MeshWall;
  selectedOutlet?: { id: string; x: number; y: number };
  roomCoverage: RoomCoverage | null;
  nearby: Array<{ name: string; distanceFt: number }>;
  parentDistance: { name: string; distanceFt: number } | null;
  warnings: string[];
  materials: WallMaterial[];
  onPreviewSuggestion: (suggestion: PlacementSuggestion) => void;
  onApplySuggestion: (suggestion: PlacementSuggestion) => void;
  onAcceptProposal: () => void;
  onDiscardProposal: () => void;
  onRenameNode: (value: string) => void;
  onRole: (role: "primary" | "satellite") => void;
  onBand: (band: WifiBand) => void;
  onLink: (link: "wired" | "wireless") => void;
  onParent: (parentId: string) => void;
  onMoveNode: (x: number, y: number) => void;
  onRenameRoom: (value: string) => void;
  onRoomMaterial: (material: WallMaterial) => void;
  onRoomFlag: (flag: "priority" | "problem") => void;
  onRoomSize: (w: number, h: number) => void;
  onEditCorners: () => void;
  onWallMaterial: (material: WallMaterial) => void;
  onWallOpening: () => void;
  onDelete: () => void;
  onTestRoom: () => void;
  testing: boolean;
  roomTest: React.ReactNode;
  roomSummary: string | null;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const selectionKey = `${selectionKind ?? ""}:${selectedNode?.id ?? ""}:${selectedRoom?.id ?? ""}:${selectedWall?.id ?? ""}:${selectedOutlet?.id ?? ""}`;
  useEffect(() => {
    if (selectionKind === "room") setTab("room");
    else if (selectionKind) setTab("device");
  }, [selectionKey, selectionKind]);
  return (
    <div className="flex h-full flex-col overflow-auto p-3 text-[#0F172A]">
      <div className="grid grid-cols-4 gap-1 rounded-lg border border-[#E2E8F0] bg-white p-0.5 text-[11px]">
        {(["overview", "device", "room", "suggestions"] as const).map((item) => (
          <button key={item} type="button" aria-pressed={tab === item} className={`h-7 rounded-md capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00866A] ${tab === item ? "bg-[#00866A] text-white" : "text-[#64748B] hover:bg-[#F8FAFC]"}`} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </div>
      {comparison && (
        <div className="mt-3 rounded-lg border border-[#E2E8F0] bg-white p-2.5 text-xs">
          <p className="font-semibold">Proposed layout</p>
          <p className="mt-1 text-[#64748B]">{proposalTitle}</p>
          <ul className="mt-2 space-y-1 text-[#334155]">
            <li>{deltaText(comparison.acceptablePointDelta, "Acceptable area")}</li>
            <li>{deltaText(comparison.weakPointDelta, "Weak or very weak area")}</li>
            <li>Nodes: {comparison.nodeCount.current} to {comparison.nodeCount.proposed}</li>
            <li>Backhaul hops: {comparison.backhaul.current.wired} wired, {comparison.backhaul.current.wireless} wireless to {comparison.backhaul.proposed.wired} wired, {comparison.backhaul.proposed.wireless} wireless</li>
          </ul>
          <p className="mt-2 text-[10px] leading-4 text-[#64748B]">Same coverage estimate as the heatmap. Not a guaranteed improvement.</p>
          <div className="mt-2 flex gap-1">
            <button type="button" className="h-7 rounded-md bg-[#00866A] px-2 text-[11px] font-semibold text-white" onClick={onAcceptProposal}>Accept</button>
            <button type="button" className="h-7 rounded-md border border-[#E2E8F0] px-2 text-[11px]" onClick={onDiscardProposal}>Discard</button>
          </div>
        </div>
      )}
      {tab === "overview" && (
        <div className="mt-3 space-y-3">
          <section className="rounded-lg border border-[#E2E8F0] bg-white p-3">
            <h2 className="text-xs font-semibold">Coverage summary</h2>
            {nodeCount === 0 || !shares || acceptableShare == null ? (
              <p className="mt-2 text-xs text-[#64748B]">Add a router or mesh node to estimate this floor. No percentage is shown until the model has a node to score.</p>
            ) : (
              <div className="mt-2 flex items-center gap-3">
                <Donut shares={shares} center={formatShare(acceptableShare) ?? "—"} />
                <ul className="space-y-1 text-[11px]">
                  {COVERAGE_LEGEND.map((item) => (
                    <li key={item.level} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                      {item.label}
                      <span className="text-[#64748B]">{formatShare(shares[item.level])}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mt-2 text-[10px] leading-4 text-[#64748B]">Acceptable means strong or moderate. The share is of modeled floor area: inside drawn rooms, or the whole floor when no rooms are drawn.</p>
          </section>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Stat label="Mesh nodes" value={String(floor.nodes.length)} />
            <Stat label="Rooms" value={String(roomCount)} />
            <Stat label="Wired hops" value={String(backhaul.wired)} />
            <Stat label="Wireless hops" value={String(backhaul.wireless)} />
          </div>
          <section className="rounded-lg border border-[#E2E8F0] bg-white p-3 text-xs">
            <h2 className="font-semibold">Rooms to review</h2>
            {attention.length === 0 ? <p className="mt-1 text-[#64748B]">No drawn room is marked as a problem, and none is mostly weak in this estimate.</p> : (
              <ul className="mt-1 space-y-1">
                {attention.map((room) => (
                  <li key={room.id}><span className="font-medium">{room.name}.</span> <span className="text-[#64748B]">{room.reason}</span></li>
                ))}
              </ul>
            )}
          </section>
          {suggestions[0] && <SuggestionCard suggestion={suggestions[0]} previewing={sameSpot(suggestions[0], previewAt)} onPreview={onPreviewSuggestion} onApply={onApplySuggestion} />}
          <About />
        </div>
      )}
      {tab === "device" && (
        <div className="mt-3 space-y-2 text-xs">
          {!selectedNode && !selectedWall && !selectedOutlet && <p className="text-[#64748B]">Select a router, mesh node, wall, or outlet.</p>}
          {selectedNode && (
            <>
              <label className="block text-[11px] text-[#64748B]">Name
                <input className={fieldClass} value={selectedNode.name} onChange={(event) => onRenameNode(event.target.value.slice(0, 40))} />
              </label>
              <label className="block text-[11px] text-[#64748B]">Type
                <select className={fieldClass} value={selectedNode.role} onChange={(event) => onRole(event.target.value as "primary" | "satellite")}>
                  <option value="primary">Primary router</option>
                  <option value="satellite">Mesh node</option>
                </select>
              </label>
              <p className="text-[#64748B]">Floor: {floor.name}</p>
              <div className="grid grid-cols-2 gap-2">
                <NumberField label="X (ft)" value={selectedNode.x} onChange={(value) => onMoveNode(value, selectedNode.y)} />
                <NumberField label="Y (ft)" value={selectedNode.y} onChange={(value) => onMoveNode(selectedNode.x, value)} />
              </div>
              <label className="block text-[11px] text-[#64748B]">Backhaul
                <select className={fieldClass} value={selectedNode.link ?? "wireless"} onChange={(event) => onLink(event.target.value as "wired" | "wireless")}>
                  <option value="wireless">Wireless</option>
                  <option value="wired">Wired</option>
                </select>
              </label>
              <label className="block text-[11px] text-[#64748B]">Connected parent
                <select className={fieldClass} value={selectedNode.parentId ?? ""} onChange={(event) => onParent(event.target.value)}>
                  <option value="">Nearest node</option>
                  {floor.nodes.filter((node) => node.id !== selectedNode.id).map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}
                </select>
              </label>
              {parentDistance && <p className="text-[#64748B]">About {Math.round(parentDistance.distanceFt)} ft from {parentDistance.name}. Distance is from the plan, not a signal reading.</p>}
              <p className="text-[11px] leading-4 text-[#64748B]">The planner does not estimate link speed or dBm. Drag the marker to move it.</p>
              <label className="block text-[11px] text-[#64748B]">Planning band
                <select className={fieldClass} value={selectedNode.band ?? "5"} onChange={(event) => onBand(event.target.value as WifiBand)}>
                  <option value="2.4">2.4 GHz</option>
                  <option value="5">5 GHz</option>
                  <option value="6">6 GHz</option>
                </select>
              </label>
            </>
          )}
          {selectedWall && (
            <>
              <p>Wall, about {wallLength(selectedWall).toFixed(0)} ft</p>
              <MaterialSelect materials={materials} value={selectedWall.material} onChange={onWallMaterial} />
              <label className="flex items-center gap-2"><input type="checkbox" checked={selectedWall.opening} onChange={onWallOpening} /> Door or opening</label>
            </>
          )}
          {selectedOutlet && <p>Outlet at {selectedOutlet.x} ft, {selectedOutlet.y} ft. Drag it on the plan to move it.</p>}
          {warnings.map((note) => <p key={note} className="text-[11px] text-[#64748B]">{note}</p>)}
          {(selectedNode || selectedWall || selectedOutlet) && <button type="button" className="text-xs text-red-700" onClick={onDelete}>Delete</button>}
        </div>
      )}
      {tab === "room" && (
        <div className="mt-3 space-y-2 text-xs">
          {!selectedRoom && <p className="text-[#64748B]">Select a room on the plan.</p>}
          {selectedRoom && (
            <>
              <label className="block text-[11px] text-[#64748B]">Name
                <input className={fieldClass} value={selectedRoom.name} onChange={(event) => onRenameRoom(event.target.value.slice(0, 80))} />
              </label>
              <p className="text-[#64748B]">{Math.round(selectedRoom.w)} × {Math.round(selectedRoom.h)} ft</p>
              <div className="grid grid-cols-2 gap-2">
                <NumberField label="Width" value={selectedRoom.w} onChange={(value) => onRoomSize(value, selectedRoom.h)} />
                <NumberField label="Depth" value={selectedRoom.h} onChange={(value) => onRoomSize(selectedRoom.w, value)} />
              </div>
              <MaterialSelect materials={materials} value={selectedRoom.material} onChange={onRoomMaterial} />
              <p>{roomCoverage?.level ? `Estimated coverage in this room: ${coverageLabel(roomCoverage.level)}.` : "This room is not in the modeled area yet."}</p>
              <p className="text-[11px] text-[#64748B]">The category is the most common cell in the room. It is an estimate, not a measured signal.</p>
              {nearby.length > 0 && (
                <ul className="text-[#64748B]">
                  {nearby.map((node) => <li key={node.name}>Nearby {node.name}, about {Math.round(node.distanceFt)} ft from the room center.</li>)}
                </ul>
              )}
              <label className="flex items-center gap-2"><input type="checkbox" checked={selectedRoom.priority} onChange={() => onRoomFlag("priority")} /> Priority room</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={selectedRoom.problem} onChange={() => onRoomFlag("problem")} /> Problem room</label>
              <button type="button" className="text-[#00866A]" onClick={onEditCorners}>Edit corners</button>
              <button type="button" className="block h-8 w-full rounded-md bg-[#00866A] text-[11px] font-semibold text-white" onClick={onTestRoom}>Test this room</button>
              {roomSummary && <p className="text-[#64748B]">{roomSummary}</p>}
              {testing && roomTest}
              <button type="button" className="text-xs text-red-700" onClick={onDelete}>Delete</button>
            </>
          )}
        </div>
      )}
      {tab === "suggestions" && (
        <div className="mt-3 space-y-2">
          {suggestions.length === 0 ? <p className="text-xs text-[#64748B]">No placement idea from this floor yet. Draw rooms or add a node and the estimate will look for weak area.</p> : suggestions.map((suggestion) => (
            <SuggestionCard key={suggestion.id} suggestion={suggestion} previewing={sameSpot(suggestion, previewAt)} onPreview={onPreviewSuggestion} onApply={onApplySuggestion} />
          ))}
        </div>
      )}
    </div>
  );
}

function SuggestionCard({ suggestion, previewing, onPreview, onApply }: { suggestion: PlacementSuggestion; previewing: boolean; onPreview: (suggestion: PlacementSuggestion) => void; onApply: (suggestion: PlacementSuggestion) => void }) {
  return (
    <article className="rounded-lg border border-[#E2E8F0] bg-white p-2.5 text-xs">
      <p className="font-semibold">{suggestion.roomName ? `${suggestion.roomName} · ` : ""}{suggestion.node.x} ft, {suggestion.node.y} ft</p>
      <p className="mt-1 text-[#334155]">{suggestion.reason}</p>
      <p className="mt-1 text-[#64748B]">{deltaText(suggestion.acceptablePointDelta, "Acceptable area")}</p>
      <p className="mt-1 text-[11px] leading-4 text-[#64748B]">{suggestion.tradeoff}</p>
      <div className="mt-2 flex gap-1">
        <button type="button" className="h-7 rounded-md border border-[#E2E8F0] px-2 text-[11px]" onClick={() => onPreview(suggestion)}>{previewing ? "Previewing" : "Preview"}</button>
        <button type="button" className="h-7 rounded-md bg-[#00866A] px-2 text-[11px] font-semibold text-white disabled:opacity-40" disabled={!previewing} onClick={() => onApply(suggestion)}>Apply</button>
      </div>
    </article>
  );
}

function Donut({ shares, center }: { shares: Record<"strong" | "moderate" | "weak" | "dead", number>; center: string }) {
  let cursor = 0;
  const parts = COVERAGE_LEGEND.map((item) => {
    const start = cursor;
    cursor += (shares[item.level] ?? 0) * 100;
    return `${item.color} ${start}% ${cursor}%`;
  });
  return (
    <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 rounded-full" style={{ background: `conic-gradient(${parts.join(", ")})` }} aria-hidden>
      <div className="absolute inset-[7px] flex items-center justify-center rounded-full bg-white text-sm font-semibold">{center}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-[#E2E8F0] bg-white px-2 py-1.5"><p className="text-[10px] text-[#64748B]">{label}</p><p className="font-semibold">{value}</p></div>;
}

function About() {
  return (
    <section className="rounded-lg border border-[#CCFBF1] bg-[#F0FDFA] p-3 text-[11px] leading-4 text-[#134E4A]">
      <h2 className="font-semibold">About this estimate</h2>
      <p className="mt-1">Colors use distance, a typical loss when the path enters a room, drawn walls, the selected band, and an extra penalty for a node on another floor. 6 GHz drops faster in this model than 5 GHz, and 5 GHz drops faster than 2.4 GHz. This is not a measured signal map and it does not report dBm or throughput.</p>
    </section>
  );
}

function sameSpot(suggestion: PlacementSuggestion, previewAt: { x: number; y: number } | null): boolean {
  return previewAt != null && previewAt.x === suggestion.node.x && previewAt.y === suggestion.node.y;
}

function deltaText(points: number | null, label: string): string {
  if (points == null) return `${label}: the estimate does not have a difference to show yet.`;
  const rounded = Math.round(points * 10) / 10;
  const sign = rounded > 0 ? "+" : "";
  return `${label}: ${sign}${rounded} percentage points. Estimated, not guaranteed.`;
}

const fieldClass = "mt-1 w-full rounded-md border border-[#E2E8F0] bg-white px-2 py-1 text-xs text-[#0F172A] outline-none focus-visible:ring-2 focus-visible:ring-[#00866A]";

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block text-[11px] text-[#64748B]">{label}
      <input className={fieldClass} inputMode="decimal" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function MaterialSelect({ materials, value, onChange }: { materials: WallMaterial[]; value: WallMaterial; onChange: (value: WallMaterial) => void }) {
  return (
    <label className="block text-[11px] text-[#64748B]">Material
      <select className={fieldClass} value={value} onChange={(event) => onChange(event.target.value as WallMaterial)}>
        {materials.map((material) => <option key={material} value={material}>{MATERIAL_DB[material].label}</option>)}
      </select>
    </label>
  );
}
