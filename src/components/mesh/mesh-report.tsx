"use client";

import { getMeshBrand } from "@/lib/mesh/catalog";
import { adviseBackhaul } from "@/lib/mesh/backhaul";
import { suggestNodeCount } from "@/lib/mesh/nodes";
import { useMeshPlan } from "@/components/mesh/use-mesh-plan";

export function MeshReport() {
  const { plan, ready } = useMeshPlan();
  if (!ready || !plan) return <p className="text-sm text-muted-foreground">Loading your saved plan…</p>;
  const brand = getMeshBrand(plan.home.brandSlug);
  const suggestion = suggestNodeCount({
    area: plan.home.area,
    unit: plan.home.unit,
    floors: plan.home.floors,
    construction: plan.home.construction,
    devices: plan.home.devices,
    wiredBackhaul: plan.home.backhaul === "ethernet",
  });
  const advice = adviseBackhaul({
    ethernetOutlets: plan.floors.reduce((sum, floor) => sum + floor.outlets.length, 0),
    coax: plan.home.coax,
    nodes: suggestion.count,
    construction: plan.home.construction,
    current: plan.home.backhaul,
  });

  return (
    <article className="space-y-4 text-sm">
      <button type="button" className="min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground print:hidden" onClick={() => window.print()}>Print or save as PDF</button>
      <p>Use the browser print dialog and choose Save as PDF. This report stays on this device.</p>
      <section>
        <h2 className="text-base font-semibold">Home</h2>
        <p>{plan.home.area} {plan.home.unit}, {plan.home.floors} floor(s), {plan.home.construction}. Starting node count: {suggestion.count}. System: {brand?.name ?? "Not selected"}.</p>
        {plan.home.networkName && <p>Network name: {plan.home.networkName}. The password is not stored.</p>}
      </section>
      {plan.floors.map((floor) => (
        <section key={floor.id}>
          <h2 className="text-base font-semibold">{floor.name}</h2>
          <p>{floor.widthFt} by {floor.heightFt} ft. Nodes: {floor.nodes.map((node) => `${node.name} (${node.x}, ${node.y})`).join("; ") || "none placed"}.</p>
          <p>Rooms: {floor.rooms.map((room) => room.name).join(", ") || "none drawn"}.</p>
        </section>
      ))}
      <section>
        <h2 className="text-base font-semibold">Backhaul</h2>
        <p>{advice.title}. {advice.why}</p>
        <p>{advice.caution}</p>
      </section>
      <section>
        <h2 className="text-base font-semibold">Room measurements</h2>
        {plan.measurements.length === 0 ? <p>No room test has been saved.</p> : (
          <ul className="list-disc pl-5">
            {plan.measurements.map((row) => {
              const named = plan.floors.flatMap((floor) => floor.rooms.filter((room) => room.id === row.roomId).map((room) => `${floor.name}: ${room.name}`))[0] ?? "Removed room";
              return <li key={`${row.roomId}-${row.testedAt}`}>{named}: {row.downloadMbps ?? "—"} / {row.uploadMbps ?? "—"} Mbps, latency {row.pingMs ?? "—"} ms, jitter {row.jitterMs ?? "—"} ms, {row.endpointName ?? "endpoint not named"}, {row.testedAt}.</li>;
            })}
          </ul>
        )}
      </section>
      <section>
        <h2 className="text-base font-semibold">Limits</h2>
        <p>Coverage colors in the planner are estimates, not a measured signal map. Room speeds are throughput to the test server. This report cannot see router settings, channel use, or which node a device joined.</p>
      </section>
    </article>
  );
}
