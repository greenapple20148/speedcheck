"use client";

import { AdSlot } from "@/components/ads/ad-slot";
import { useMeshPlan } from "@/components/mesh/use-mesh-plan";
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
        <select className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" value={plan.home.backhaul} onChange={(event) => update({ ...plan, home: { ...plan.home, backhaul: event.target.value as BackhaulChoice } })}>
          <option value="unknown">Not sure</option>
          <option value="ethernet">Ethernet</option>
          <option value="wireless-dedicated">Wireless, and the model says it has a dedicated hop</option>
          <option value="wireless-shared">Wireless on the same radios as my devices</option>
          <option value="moca">MoCA over coax</option>
          <option value="powerline">Powerline</option>
        </select>
      </label>
      <p className="text-muted-foreground">{outlets} Ethernet outlet{outlets === 1 ? "" : "s"} marked on the floor plan. {nodes} node{nodes === 1 ? "" : "s"} placed.</p>
      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="text-base font-semibold">{advice.title}</h2>
        <p className="mt-2 text-muted-foreground">{advice.why}</p>
        <p className="mt-2">{advice.caution}</p>
      </section>
      <AdSlot slot="mesh-backhaul" />
    </div>
  );
}
