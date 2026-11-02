"use client";

import { useState } from "react";
import { placementOptions, type PlacementOption } from "@/lib/mesh/placement";
import { suggestNodeCount } from "@/lib/mesh/nodes";
import { useMeshPlan } from "@/components/mesh/use-mesh-plan";
import { Button } from "@/components/ui/button";
import type { MeshFloor } from "@/lib/mesh/types";

export function PlacementPanel() {
  const { plan, update, ready } = useMeshPlan();
  const [appliedId, setAppliedId] = useState<string | null>(null);
  if (!ready || !plan) return <p className="text-sm text-muted-foreground">Loading your saved plan…</p>;
  const floor = plan.floors.find((item) => item.id === plan.activeFloorId) ?? plan.floors[0];
  const suggestion = suggestNodeCount({
    area: plan.home.area,
    unit: plan.home.unit,
    floors: plan.home.floors,
    construction: plan.home.construction,
    devices: plan.home.devices,
    wiredBackhaul: plan.home.backhaul === "ethernet",
  });
  const options = placementOptions(floor, suggestion.count);
  const applied = options.find((option) => option.id === appliedId);

  function applyLayout(option: PlacementOption) {
    update({
      ...plan!,
      floors: plan!.floors.map((item) => item.id === floor.id ? { ...item, nodes: option.nodes } : item),
    });
    setAppliedId(option.id);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-[#64748B] [[data-theme=dark]_&]:text-muted-foreground">These are four understandable layouts for {floor.name}, using a starting count of {suggestion.count}. They are not a proof of the best possible placement. Apply one, then drag nodes in the planner.</p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const selected = option.id === appliedId;
          return (
            <li key={option.id} className={`rounded-[20px] border bg-white p-4 text-[#10231F] [[data-theme=dark]_&]:bg-card [[data-theme=dark]_&]:text-foreground ${selected ? "border-[#006B53] ring-2 ring-[#006B53]/30 [[data-theme=dark]_&]:border-[var(--accent-text)]" : "border-[#E2E8E5] [[data-theme=dark]_&]:border-border"}`}>
              <h2 className="text-base font-semibold">{option.title}</h2>
              <p className="mt-1 text-sm leading-6 text-[#64748B] [[data-theme=dark]_&]:text-muted-foreground">{option.why}</p>
              <p className="mt-2 text-sm">{nodeSummary(floor, option)}</p>
              <Button type="button" className="mt-3" variant={selected ? "outline" : "default"} aria-pressed={selected} onClick={() => applyLayout(option)}>
                {selected ? "Using this layout" : "Use this layout"}
              </Button>
            </li>
          );
        })}
      </ul>
      <p className="text-sm" role="status">
        {applied
          ? <>Applied “{applied.title}” to {floor.name}. </>
          : floor.nodes.length === 0
            ? <>No layout is on {floor.name} yet. </>
            : null}
        <a className="font-medium text-[#006B53] hover:underline [[data-theme=dark]_&]:text-[var(--accent-text)]" href="/mesh-wifi/planner">Adjust the layout on the floor plan</a>
      </p>
    </div>
  );
}

function nodeSummary(floor: MeshFloor, option: PlacementOption): string {
  if (option.nodes.length === 0) return "No nodes";
  return option.nodes
    .map((node) => `${node.name} (${placeLabel(floor, node.x, node.y)})`)
    .join(", ");
}

function placeLabel(floor: MeshFloor, x: number, y: number): string {
  const horizontal = x < floor.widthFt * 0.4 ? "left" : x > floor.widthFt * 0.6 ? "right" : "center";
  const vertical = y < floor.heightFt * 0.4 ? "top" : y > floor.heightFt * 0.6 ? "bottom" : "middle";
  if (horizontal === "center" && vertical === "middle") return "center";
  if (horizontal === "center") return vertical;
  if (vertical === "middle") return horizontal;
  return `${vertical} ${horizontal}`;
}
