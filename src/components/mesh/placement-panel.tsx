"use client";

import { placementOptions } from "@/lib/mesh/placement";
import { suggestNodeCount } from "@/lib/mesh/nodes";
import { useMeshPlan } from "@/components/mesh/use-mesh-plan";
import { Button } from "@/components/ui/button";

export function PlacementPanel() {
  const { plan, update, ready } = useMeshPlan();
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

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-[#64748B] [[data-theme=dark]_&]:text-muted-foreground">These are four understandable layouts for {floor.name}, using a starting count of {suggestion.count}. They are not a proof of the best possible placement. Apply one, then drag nodes in the planner.</p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <li key={option.id} className="rounded-[20px] border border-[#E2E8E5] bg-white p-4 text-[#10231F] [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-card [[data-theme=dark]_&]:text-foreground">
            <h2 className="text-base font-semibold">{option.title}</h2>
            <p className="mt-1 text-sm leading-6 text-[#64748B] [[data-theme=dark]_&]:text-muted-foreground">{option.why}</p>
            <p className="mt-2 text-sm">{option.nodes.map((node) => node.name).join(", ") || "No nodes"}</p>
            <Button type="button" className="mt-3" onClick={() => update({
              ...plan,
              floors: plan.floors.map((item) => item.id === floor.id ? { ...item, nodes: option.nodes } : item),
            })}>Use this layout</Button>
          </li>
        ))}
      </ul>
      <p className="text-sm"><a className="font-medium text-[#006B53] hover:underline [[data-theme=dark]_&]:text-[var(--accent-text)]" href="/mesh-wifi/planner">Adjust the layout on the floor plan</a></p>
    </div>
  );
}
