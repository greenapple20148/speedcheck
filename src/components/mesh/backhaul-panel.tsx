"use client";

import { AdSlot } from "@/components/ads/ad-slot";
import { useMeshPlan } from "@/components/mesh/use-mesh-plan";
import { selectControlClass } from "@/components/ui/field";
import { adviseBackhaul } from "@/lib/mesh/backhaul";
import type { BackhaulChoice } from "@/lib/mesh/types";

export function BackhaulPanel() {
  const { plan, update, ready } = useMeshPlan();
  if (!ready || !plan) return <p className="text-sm text-muted-foreground">Loading your saved plan…</p>;
  const outlets = plan.floors.reduce((sum, floor) => sum + floor.outlets.length, 0);
  const nodes = plan.floors.reduce((sum, floor) => sum + floor.nodes.length, 0);
  const advice = adviseBackhaul({
    ethernetOutlets: outlets,
    coax: plan.home.coax,
    nodes: Math.max(nodes, 2),
    construction: plan.home.construction,
    current: plan.home.backhaul,
  });

  return (
    <div className="space-y-4 text-sm">
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={plan.home.coax} onChange={(event) => update({ ...plan, home: { ...plan.home, coax: event.target.checked } })} />
        Coax outlets are already in the rooms I care about
      </label>
      <label className="block">What are you using between nodes today?
        <select className={selectControlClass} value={plan.home.backhaul} onChange={(event) => update({ ...plan, home: { ...plan.home, backhaul: event.target.value as BackhaulChoice } })}>
          <option value="unknown">Not sure</option>
          <option value="ethernet">Ethernet</option>
          <option value="wireless-dedicated">Wireless, and the model says it has a dedicated hop</option>
          <option value="wireless-shared">Wireless on the same radios as my devices</option>
          <option value="moca">MoCA over coax</option>
          <option value="powerline">Powerline</option>
        </select>
      </label>
      <p className="text-muted-foreground">{outlets} Ethernet outlet{outlets === 1 ? "" : "s"} marked on the floor plan. {nodes} node{nodes === 1 ? "" : "s"} placed.</p>
      <section className="rounded-[20px] border border-[#E2E8E5] bg-white p-4 text-[#10231F] [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-card [[data-theme=dark]_&]:text-foreground">
        <h2 className="text-base font-semibold">{advice.title}</h2>
        <p className="mt-2 text-muted-foreground">{advice.why}</p>
        <p className="mt-2">{advice.caution}</p>
      </section>
      <AdSlot slot="mesh-backhaul" />
    </div>
  );
}
