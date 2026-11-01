"use client";

import { AdSlot } from "@/components/ads/ad-slot";
import { useMeshPlan } from "@/components/mesh/use-mesh-plan";
import { suggestNodeCount } from "@/lib/mesh/nodes";
import type { Construction } from "@/lib/mesh/types";

export function NodeCalculator() {
  const { plan, update, ready } = useMeshPlan();
  if (!ready || !plan) return <p className="text-sm text-muted-foreground">Loading your saved plan…</p>;
  const home = plan.home;
  const result = suggestNodeCount({
    area: home.area,
    unit: home.unit,
    floors: home.floors,
    construction: home.construction,
    devices: home.devices,
    wiredBackhaul: home.backhaul === "ethernet" || home.backhaul === "moca",
  });
  const set = (patch: Partial<typeof home>) => update({ ...plan, home: { ...home, ...patch } });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Home size
          <input className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" inputMode="decimal" value={home.area} onChange={(event) => set({ area: Number(event.target.value) })} />
        </label>
        <label className="text-sm">Unit
          <select className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" value={home.unit} onChange={(event) => set({ unit: event.target.value as typeof home.unit })}>
            <option value="sqft">Square feet</option>
            <option value="sqm">Square meters</option>
          </select>
        </label>
        <label className="text-sm">Floors
          <input className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" inputMode="numeric" value={home.floors} onChange={(event) => set({ floors: Number(event.target.value) })} />
        </label>
        <label className="text-sm">Construction
          <select className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" value={home.construction} onChange={(event) => set({ construction: event.target.value as Construction })}>
            <option value="wood">Wood frame, open</option>
            <option value="drywall">Drywall</option>
            <option value="mixed">Mixed</option>
            <option value="brick">Brick</option>
            <option value="concrete">Concrete</option>
          </select>
        </label>
        <label className="text-sm">Devices
          <input className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" inputMode="numeric" value={home.devices} onChange={(event) => set({ devices: Number(event.target.value) })} />
        </label>
        <label className="text-sm">ISP download Mbps (optional)
          <input className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" inputMode="decimal" value={home.ispMbps ?? ""} onChange={(event) => set({ ispMbps: event.target.value === "" ? null : Number(event.target.value) })} />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={home.backhaul === "ethernet"} onChange={(event) => set({ backhaul: event.target.checked ? "ethernet" : "unknown" })} />
        Ethernet is available between some rooms
      </label>
      <section className="rounded-2xl border border-border bg-card p-4" aria-live="polite">
        <p className="text-sm text-muted-foreground">Suggested starting count</p>
        <p className="text-4xl font-semibold tabular-nums text-foreground">{result.count}</p>
        {result.meshMayBeUnnecessary && <p className="mt-2 text-sm text-foreground">A mesh kit may be unnecessary. Test the far rooms with the router you have.</p>}
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {result.reasons.map((reason) => <li key={reason}>{reason}</li>)}
          {result.warnings.map((warning) => <li key={warning}>{warning}</li>)}
        </ul>
        <p className="mt-3 text-sm">Validate with a test beside the router and one in the farthest room. <a className="font-medium text-primary" href="/mesh-wifi/dead-zone-test">Open room tests</a>.</p>
      </section>
      <AdSlot slot="mesh-node-calculator" />
    </div>
  );
}
