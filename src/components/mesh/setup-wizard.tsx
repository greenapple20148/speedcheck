"use client";

import { MESH_BRANDS } from "@/lib/mesh/catalog";
import type { Construction, MeshHome } from "@/lib/mesh/types";
import { useMeshPlan } from "@/components/mesh/use-mesh-plan";

const SETUP = [
  { id: "modem", label: "Connect the primary node to the modem or ONT with the cable from the quick start." },
  { id: "app", label: "Install the vendor app and create the network. Skip any step that the guide for your model does not show." },
  { id: "name", label: "Choose a network name. This site never asks for the Wi-Fi password." },
  { id: "pair", label: "Pair one satellite at a time, close to the primary node, then move it." },
  { id: "backhaul", label: "If a cable exists, use it only if the model guide says that port is for backhaul." },
  { id: "firmware", label: "Let the firmware update finish on every node before you judge the speed." },
  { id: "guest", label: "Add a guest network only after the main network is up." },
  { id: "devices", label: "Reconnect phones and laptops to the new name." },
];

export function SetupWizard() {
  const { plan, update, ready } = useMeshPlan();
  if (!ready || !plan) return <p className="text-sm text-muted-foreground">Loading your saved plan…</p>;
  const step = plan.wizardStep;
  const brand = MESH_BRANDS.find((item) => item.slug === plan.home.brandSlug) ?? MESH_BRANDS[MESH_BRANDS.length - 1];
  const setHome = (patch: Partial<MeshHome>) => update({ ...plan, home: { ...plan.home, ...patch } });

  return (
    <div className="space-y-4">
      <ol className="flex flex-wrap gap-2 text-sm" aria-label="Setup steps">
        {["System", "Home", "Install", "Check"].map((label, index) => (
          <li key={label}>
            <button type="button" className="min-h-11 rounded-full border border-border px-3" aria-current={step === index ? "step" : undefined} onClick={() => update({ ...plan, wizardStep: index })}>
              {index + 1}. {label}
            </button>
          </li>
        ))}
      </ol>
      {step === 0 && (
        <fieldset>
          <legend className="text-sm font-semibold">Which system are you installing?</legend>
          <p className="mt-1 text-sm text-muted-foreground">Models from the same brand do not share one setup. Use the official guide for the model on the label. The <a className="text-primary" href="/router-setup">router setup guide</a> also covers the login page, backhaul, and a speed test.</p>
          <ul className="mt-3 space-y-2">
            {MESH_BRANDS.map((item) => (
              <li key={item.slug}>
                <label className="flex min-h-11 items-center gap-2 text-sm">
                  <input type="radio" name="brand" checked={plan.home.brandSlug === item.slug} onChange={() => setHome({ brandSlug: item.slug })} />
                  {item.name}
                </label>
              </li>
            ))}
          </ul>
          {brand.supportUrl && (
            <p className="mt-3 text-sm">
              <a className="font-medium text-primary" href={brand.supportUrl} rel="noopener noreferrer" target="_blank">Official {brand.name} support</a>
              <span className="text-muted-foreground"> — reviewed {brand.reviewed}. Open the article for your model.</span>
            </p>
          )}
        </fieldset>
      )}
      {step === 1 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Home size
            <input className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" inputMode="decimal" value={plan.home.area} onChange={(event) => setHome({ area: Number(event.target.value) })} />
          </label>
          <label className="text-sm">Unit
            <select className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" value={plan.home.unit} onChange={(event) => setHome({ unit: event.target.value as MeshHome["unit"] })}>
              <option value="sqft">Square feet</option>
              <option value="sqm">Square meters</option>
            </select>
          </label>
          <label className="text-sm">Floors
            <input className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" inputMode="numeric" value={plan.home.floors} onChange={(event) => setHome({ floors: Number(event.target.value) })} />
          </label>
          <label className="text-sm">Construction
            <select className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" value={plan.home.construction} onChange={(event) => setHome({ construction: event.target.value as Construction })}>
              <option value="drywall">Drywall</option>
              <option value="wood">Wood</option>
              <option value="brick">Brick</option>
              <option value="concrete">Concrete</option>
              <option value="mixed">Mixed</option>
            </select>
          </label>
          <label className="text-sm">Devices
            <input className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" inputMode="numeric" value={plan.home.devices} onChange={(event) => setHome({ devices: Number(event.target.value) })} />
          </label>
          <label className="text-sm">Network name only
            <input className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" maxLength={32} value={plan.home.networkName} onChange={(event) => setHome({ networkName: event.target.value })} />
          </label>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-3 text-sm">
          <p>If the ISP gateway and the mesh primary node both route traffic, you have double NAT. Bridge the gateway or put the mesh system in access-point mode. Change one of those, not both, and follow the model guide.</p>
          <ul className="space-y-2">
            {SETUP.map((item) => (
              <li key={item.id}>
                <label className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" checked={plan.checkedSetup.includes(item.id)} onChange={() => {
                    const checked = plan.checkedSetup.includes(item.id)
                      ? plan.checkedSetup.filter((id) => id !== item.id)
                      : [...plan.checkedSetup, item.id];
                    update({ ...plan, checkedSetup: checked });
                  }} />
                  <span>{item.label.replace("the vendor app", brand.appName)}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-2 text-sm">
          <p>Install is ready to check when the nodes stay online in the vendor app. Then measure, instead of buying another node.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li><a className="text-primary" href="/speed-test">Speed test beside the primary node</a></li>
            <li><a className="text-primary" href="/mesh-wifi/dead-zone-test">Room-by-room test</a></li>
            <li><a className="text-primary" href="/bufferbloat-test">Latency under load</a></li>
          </ul>
        </div>
      )}
      <div className="flex gap-2">
        <button type="button" className="min-h-11 rounded-xl border border-border px-4 text-sm" disabled={step === 0} onClick={() => update({ ...plan, wizardStep: Math.max(0, step - 1) })}>Back</button>
        <button type="button" className="min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground" disabled={step === 3} onClick={() => update({ ...plan, wizardStep: Math.min(3, step + 1) })}>Next</button>
      </div>
    </div>
  );
}
