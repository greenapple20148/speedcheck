"use client";

import { useState } from "react";
import { AdSlot } from "@/components/ads/ad-slot";
import { suggestWifiGeneration } from "@/lib/mesh/wifi-generation";

export function WifiCompare() {
  const [wifi7, setWifi7] = useState(false);
  const [ghz, setGhz] = useState(false);
  const [busy, setBusy] = useState(false);
  const advice = suggestWifiGeneration({ wifi7Devices: wifi7, needs6GHz: ghz, manyDevices: busy });

  return (
    <div className="space-y-4 text-sm">
      <label className="flex items-center gap-2"><input type="checkbox" checked={wifi7} onChange={(event) => setWifi7(event.target.checked)} /> I already own Wi-Fi 7 phones or laptops</label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={ghz} onChange={(event) => setGhz(event.target.checked)} /> I want the 6 GHz band</label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={busy} onChange={(event) => setBusy(event.target.checked)} /> More than about 25 devices are online together</label>
      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="text-base font-semibold">{advice.title}</h2>
        <p className="mt-2 text-muted-foreground">{advice.why}</p>
      </section>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="py-2 pr-3">Generation</th>
              <th className="py-2 pr-3">Bands people actually use</th>
              <th className="py-2">Practical limit</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border"><td className="py-2 pr-3">Wi-Fi 5</td><td className="py-2 pr-3">2.4 and 5 GHz</td><td className="py-2">Fine for light use. Busy homes feel it first.</td></tr>
            <tr className="border-b border-border"><td className="py-2 pr-3">Wi-Fi 6</td><td className="py-2 pr-3">2.4 and 5 GHz</td><td className="py-2">Better with many devices. Still stops at walls.</td></tr>
            <tr className="border-b border-border"><td className="py-2 pr-3">Wi-Fi 6E</td><td className="py-2 pr-3">Adds 6 GHz</td><td className="py-2">6 GHz needs new clients and does not cross the house as easily.</td></tr>
            <tr><td className="py-2 pr-3">Wi-Fi 7</td><td className="py-2 pr-3">2.4, 5, and 6 GHz, wider channels on supported gear</td><td className="py-2">The headline rate needs a Wi-Fi 7 client and a clean path.</td></tr>
          </tbody>
        </table>
      </div>
      <AdSlot slot="mesh-wifi-compare" />
    </div>
  );
}
