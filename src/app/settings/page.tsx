"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import {
  readPrefs,
  writePrefs,
  type LocalPreferences,
} from "@/lib/speedtest/history-store";
import { PlanSettingsForm } from "@/components/speedtest/history/plan-settings-form";
import { readPlan, type PlanSettings } from "@/lib/speedtest/history-store";

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<LocalPreferences | null>(null);
  const [plan, setPlan] = useState<PlanSettings | null>(null);

  useEffect(() => {
    setPrefs(readPrefs());
    setPlan(readPlan());
  }, []);

  if (!prefs) {
    return <p className="px-4 py-10 text-sm text-muted-foreground">Loading settings…</p>;
  }

  const update = (next: LocalPreferences) => {
    setPrefs(next);
    writePrefs(next);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs items={[{ label: "Settings" }]} />
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">Settings</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        These preferences stay in this browser. Tests still run if you never create an account.
      </p>
      <label className="mt-6 flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={prefs.saveHistory}
          onChange={(event) => update({ ...prefs, saveHistory: event.target.checked })}
        />
        Automatically save completed tests on this device
      </label>
      <p className="mt-1 text-sm text-muted-foreground">
        Off by default. You can still press “Save result on this device” after a test.{" "}
        <Link href="/history" className="text-primary hover:underline">
          Review or delete saved tests
        </Link>
        .
      </p>
      <fieldset className="mt-6">
        <legend className="text-sm font-medium">Calculator units</legend>
        <div className="mt-2 flex gap-2">
          {(["decimal", "binary"] as const).map((units) => (
            <button
              key={units}
              type="button"
              aria-pressed={prefs.units === units}
              onClick={() => update({ ...prefs, units })}
              className={`min-h-11 rounded-full px-4 text-sm ${
                prefs.units === units ? "bg-primary text-primary-foreground" : "border border-border"
              }`}
            >
              {units === "decimal" ? "Decimal (MB)" : "Binary (MiB)"}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="mt-8">
        <PlanSettingsForm initial={plan} onChange={setPlan} />
      </div>
    </div>
  );
}
