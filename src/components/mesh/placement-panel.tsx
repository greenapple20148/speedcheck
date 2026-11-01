"use client";

import { placementOptions } from "@/lib/mesh/placement";
import { suggestNodeCount } from "@/lib/mesh/nodes";
import { useMeshPlan } from "@/components/mesh/use-mesh-plan";

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
      <p className="text-sm text-muted-foreground">These are four understandable layouts for {floor.name}, using a starting count of {suggestion.count}. They are not a proof of the best possible placement. Apply one, then drag nodes in the planner.</p>
      <ul className="space-y-3">
        {options.map((option) => (
          <li key={option.id} className="rounded-2xl border border-border bg-card p-4">
            <h2 className="text-base font-semibold">{option.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{option.why}</p>
            <p className="mt-2 text-sm">{option.nodes.map((node) => node.name).join(", ") || "No nodes"}</p>
            <button type="button" className="mt-3 min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground" onClick={() => update({
              ...plan,
              floors: plan.floors.map((item) => item.id === floor.id ? { ...item, nodes: option.nodes } : item),
            })}>Use this layout</button>
          </li>
        ))}
      </ul>
      <p className="text-sm"><a className="font-medium text-primary" href="/mesh-wifi/planner">Adjust the layout on the floor plan</a></p>
    </div>
  );
}
