"use client";

import { imageSettings } from "@/lib/mesh/calibration";
import { canAddFloor, canDeleteFloor } from "@/lib/mesh/plan";
import type { MeshFloor, MeshPlan } from "@/lib/mesh/types";

export function PlannerSidebar({
  plan,
  floor,
  layers,
  calibrating,
  knownDistance,
  onKnownDistance,
  onApplyCalibration,
  onCancelCalibration,
  onStartCalibration,
  onProjectName,
  onSelectFloor,
  onAddFloor,
  onDuplicateFloor,
  onDeleteFloor,
  onRenameFloor,
  onFloorSize,
  onSelectEquipment,
  onToggleLayer,
  onImageFile,
  onImagePatch,
  onRemoveImage,
  onSample,
}: {
  plan: MeshPlan;
  floor: MeshFloor;
  layers: { coverage: boolean; rooms: boolean; nodes: boolean; walls: boolean; outlets: boolean };
  calibrating: boolean;
  knownDistance: string;
  onKnownDistance: (value: string) => void;
  onApplyCalibration: () => void;
  onCancelCalibration: () => void;
  onStartCalibration: () => void;
  onProjectName: (value: string) => void;
  onSelectFloor: (id: string) => void;
  onAddFloor: () => void;
  onDuplicateFloor: () => void;
  onDeleteFloor: () => void;
  onRenameFloor: (value: string) => void;
  onFloorSize: (width: number, height: number) => void;
  onSelectEquipment: (kind: "node" | "outlet", id: string) => void;
  onToggleLayer: (key: keyof typeof layers) => void;
  onImageFile: (file: File) => void;
  onImagePatch: (patch: { opacity?: number; rotation?: number; scale?: number }) => void;
  onRemoveImage: () => void;
  onSample: () => void;
}) {
  const image = imageSettings(floor);
  const layerLabels = [
    ["coverage", "Coverage heatmap"],
    ["rooms", "Rooms & labels"],
    ["nodes", "Devices & links"],
    ["walls", "Walls"],
    ["outlets", "Outlets"],
  ] as const;
  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-3 text-[#0F172A]">
      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">Project</h2>
        <input className={fieldClass} aria-label="Project name" value={plan.home.networkName} placeholder="Saved on this device" onChange={(event) => onProjectName(event.target.value.slice(0, 32))} />
      </section>
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">Floors</h2>
        </div>
        <ul className="mt-2 space-y-1">
          {plan.floors.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                aria-label={`${item.name}, ${item.rooms.length} rooms`}
                aria-pressed={item.id === floor.id}
                className={`w-full rounded-lg px-2 py-1.5 text-left text-xs hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00866A] ${item.id === floor.id ? "bg-[#00866A]/10 text-[#00866A]" : ""}`}
                onClick={() => onSelectFloor(item.id)}
              >
                <span className="block font-medium">{item.name}</span>
                <span className="text-[11px] text-[#64748B]">{item.rooms.length === 1 ? "1 room" : `${item.rooms.length} rooms`}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex flex-wrap gap-1">
          <SmallButton disabled={!canAddFloor(plan.floors.length)} onClick={onAddFloor}>Add floor</SmallButton>
          <SmallButton disabled={!canAddFloor(plan.floors.length)} onClick={onDuplicateFloor}>Duplicate</SmallButton>
          <SmallButton disabled={!canDeleteFloor(plan.floors.length)} onClick={onDeleteFloor}>Delete</SmallButton>
        </div>
        <label className="mt-2 block text-[11px] text-[#64748B]">Rename
          <input className={fieldClass} aria-label="Floor name" value={floor.name} onChange={(event) => onRenameFloor(event.target.value.slice(0, 40))} />
        </label>
      </section>
      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">Equipment</h2>
        <ul className="mt-2 space-y-1">
          {floor.nodes.map((node) => (
            <li key={node.id}>
              <button type="button" className="w-full rounded-lg px-2 py-1 text-left text-xs hover:bg-white" onClick={() => onSelectEquipment("node", node.id)}>
                {node.role === "primary" ? "Router" : "Mesh node"} · {node.name}
              </button>
            </li>
          ))}
          {floor.outlets.map((outlet, index) => (
            <li key={outlet.id}>
              <button type="button" className="w-full rounded-lg px-2 py-1 text-left text-xs hover:bg-white" onClick={() => onSelectEquipment("outlet", outlet.id)}>Outlet {index + 1}</button>
            </li>
          ))}
          {floor.nodes.length === 0 && floor.outlets.length === 0 && <li className="text-[11px] text-[#64748B]">Nothing placed on this floor yet.</li>}
        </ul>
      </section>
      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">Layers</h2>
        <div className="mt-2 space-y-1">
          {layerLabels.map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={layers[key]} onChange={() => onToggleLayer(key)} /> {label}
            </label>
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">Floor plan</h2>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <NumberField label="Width (ft)" value={floor.widthFt} onChange={(value) => onFloorSize(value, floor.heightFt)} />
          <NumberField label="Depth (ft)" value={floor.heightFt} onChange={(value) => onFloorSize(floor.widthFt, value)} />
        </div>
        <label className="mt-2 inline-flex h-8 cursor-pointer items-center rounded-md border border-[#E2E8F0] bg-white px-2 text-xs">
          Import floor plan
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) onImageFile(file);
            }}
          />
        </label>
        {floor.imageDataUrl && (
          <div className="mt-2 space-y-2">
            <label className="block text-[11px] text-[#64748B]">Image opacity
              <input className="mt-1 w-full" type="range" min={0.1} max={1} step={0.05} value={image.opacity} aria-label="Floor plan opacity" onChange={(event) => onImagePatch({ opacity: Number(event.target.value) })} />
            </label>
            <label className="block text-[11px] text-[#64748B]">Image scale
              <input className="mt-1 w-full" type="range" min={0.25} max={2.5} step={0.05} value={image.scale} aria-label="Floor plan scale" onChange={(event) => onImagePatch({ scale: Number(event.target.value) })} />
            </label>
            <div className="flex flex-wrap gap-1">
              {[0, 90, 180, 270].map((degrees) => (
                <SmallButton key={degrees} onClick={() => onImagePatch({ rotation: degrees })}>{degrees}°</SmallButton>
              ))}
            </div>
            {calibrating ? (
              <div className="rounded-lg border border-[#E2E8F0] bg-white p-2 text-xs">
                <p>Click two points on the plan, then enter the real distance.</p>
                <label className="mt-2 block text-[11px] text-[#64748B]">Known distance (ft)
                  <input className={fieldClass} inputMode="decimal" aria-label="Known distance" value={knownDistance} onChange={(event) => onKnownDistance(event.target.value)} />
                </label>
                <div className="mt-2 flex gap-1">
                  <SmallButton onClick={onApplyCalibration}>Apply scale</SmallButton>
                  <SmallButton onClick={onCancelCalibration}>Cancel</SmallButton>
                </div>
              </div>
            ) : (
              <SmallButton onClick={onStartCalibration}>Calibrate scale</SmallButton>
            )}
            <button type="button" className="block text-[11px] text-[#00866A]" onClick={onRemoveImage}>Remove image</button>
            <p className="text-[10px] leading-4 text-[#64748B]">The image stays in this browser. Calibration rescales the floor so the two points match the distance you enter.</p>
          </div>
        )}
        <button type="button" className="mt-2 text-[11px] text-[#00866A]" onClick={onSample}>Use sample floor plan</button>
      </section>
    </div>
  );
}

const fieldClass = "mt-1 w-full rounded-md border border-[#E2E8F0] bg-white px-2 py-1 text-xs text-[#0F172A] outline-none focus-visible:ring-2 focus-visible:ring-[#00866A]";

function SmallButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" disabled={disabled} className="h-7 rounded-md border border-[#E2E8F0] bg-white px-2 text-[11px] font-medium text-[#0F172A] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00866A] disabled:opacity-40" onClick={onClick}>
      {children}
    </button>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block text-[11px] text-[#64748B]">{label}
      <input className={fieldClass} inputMode="decimal" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}
