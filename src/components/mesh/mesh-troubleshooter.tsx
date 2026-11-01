"use client";

import { useState } from "react";
import Link from "next/link";
import { AdSlot } from "@/components/ads/ad-slot";
import { useMeshPlan } from "@/components/mesh/use-mesh-plan";
import { meshSymptomLabel, troubleshootMesh, type MeshSymptom } from "@/lib/mesh/troubleshoot";

const SYMPTOMS = Object.keys({
  "slow-wifi": 1,
  "node-offline": 1,
  "weak-upstairs": 1,
  disconnects: 1,
  "distant-node": 1,
  "slow-backhaul": 1,
  gaming: 1,
  video: 1,
  "smart-home": 1,
  "below-plan": 1,
  "double-nat": 1,
  "after-firmware": 1,
}) as MeshSymptom[];

export function MeshTroubleshooter() {
  const { plan, ready } = useMeshPlan();
  const [symptoms, setSymptoms] = useState<MeshSymptom[]>([]);
  const [ran, setRan] = useState(false);
  if (!ready || !plan) return <p className="text-sm text-muted-foreground">Loading your saved plan…</p>;
  const nodes = plan.floors.reduce((sum, floor) => sum + floor.nodes.length, 0);
  const result = ran ? troubleshootMesh({
    symptoms,
    nodeCount: nodes,
    floors: plan.home.floors,
    wired: plan.home.backhaul === "ethernet" || plan.home.backhaul === "moca",
    measurements: plan.measurements,
  }) : [];

  return (
    <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); setRan(true); }}>
      <fieldset>
        <legend className="text-sm font-semibold">What is going wrong?</legend>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {SYMPTOMS.map((id) => (
            <li key={id}>
              <label className="flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm">
                <input type="checkbox" checked={symptoms.includes(id)} onChange={() => setSymptoms((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])} />
                {meshSymptomLabel(id)}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
      <button type="submit" className="min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Show checks</button>
      {ran && (
        <ol className="space-y-3">
          {result.map((item, index) => (
            <li key={item.id} className="rounded-2xl border border-border p-4 text-sm">
              <p className="font-semibold">{index + 1}. {item.cause}</p>
              <p className="mt-1 text-muted-foreground">Evidence: {item.evidence}</p>
              <p className="mt-1">Do this: {item.action}</p>
              <p className="mt-1 text-muted-foreground">Check: {item.validate}</p>
              <p className="mt-1 text-muted-foreground">Confidence: {item.confidence}</p>
              <Link href={item.guideHref} className="mt-2 inline-block font-medium text-primary">Related guide</Link>
            </li>
          ))}
        </ol>
      )}
      {ran && <AdSlot slot="mesh-troubleshooter" />}
    </form>
  );
}
