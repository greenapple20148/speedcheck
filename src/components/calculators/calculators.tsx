"use client";

import { useEffect, useMemo, useState } from "react";
import {
  decimalMBpsToMbps,
  formatDuration,
  mbpsToDecimalMBps,
  mbpsToMebibytesPerSec,
  transferTimeSeconds,
  type ByteUnit,
} from "@/lib/calculators/units";
import { HOUSEHOLD_ACTIVITIES, householdDemand } from "@/lib/calculators/household";
import { trackEvent } from "@/lib/analytics/events";
import { readPrefs } from "@/lib/speedtest/history-store";

const SIZE_UNITS: ByteUnit[] = ["MB", "GB", "MiB", "GiB"];

export function TransferCalculator({ direction }: { direction: "download" | "upload" }) {
  const [size, setSize] = useState("1");
  const [unit, setUnit] = useState<ByteUnit>("GB");
  const [mbps, setMbps] = useState("100");
  const [efficiency, setEfficiency] = useState("0.9");

  useEffect(() => {
    setUnit(readPrefs().units === "binary" ? "GiB" : "GB");
  }, []);

  const result = useMemo(() => {
    const eff = efficiency.trim() === "" ? null : Number(efficiency);
    return transferTimeSeconds(Number(size), unit, Number(mbps), eff);
  }, [size, unit, mbps, efficiency]);

  return (
    <form
      className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        trackEvent("calculator_used", { calculator: `${direction}-time` });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm">
          File size
          <input className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" value={size} onChange={(e) => setSize(e.target.value)} inputMode="decimal" />
        </label>
        <label className="text-sm">
          Unit
          <select className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" value={unit} onChange={(e) => setUnit(e.target.value as ByteUnit)}>
            {SIZE_UNITS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          {direction === "download" ? "Download" : "Upload"} Mbps
          <input className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" value={mbps} onChange={(e) => setMbps(e.target.value)} inputMode="decimal" />
        </label>
      </div>
      <label className="mt-3 block text-sm">
        Optional efficiency (0–1)
        <input className="mt-1 w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2" value={efficiency} onChange={(e) => setEfficiency(e.target.value)} inputMode="decimal" />
      </label>
      <button type="submit" className="mt-4 min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">
        Calculate
      </button>
      {result.error && <p className="mt-3 text-sm text-destructive" role="alert">{result.error}</p>}
      {result.seconds != null && (
        <div className="mt-4 text-sm text-muted-foreground">
          <p className="text-2xl font-semibold text-foreground">{formatDuration(result.seconds)}</p>
          <p className="mt-1">Theoretical time at the full rate.</p>
          {result.adjustedSeconds != null && (
            <p className="mt-1">With the efficiency you entered: {formatDuration(result.adjustedSeconds)}.</p>
          )}
          <p className="mt-2">{result.formula}</p>
          <p className="mt-1">MB and GB are decimal (1,000). MiB and GiB are binary (1,024). Mbps stays in decimal megabits.</p>
        </div>
      )}
    </form>
  );
}

export function UnitConverter() {
  const [mbps, setMbps] = useState("100");
  const [mbs, setMbs] = useState("12.5");
  const value = Number(mbps);
  const back = Number(mbs);
  const mbpsOk = Number.isFinite(value);
  const mbsOk = Number.isFinite(back);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded-2xl border border-border bg-card p-4 shadow-soft">
        <h2 className="text-base font-semibold">Mbps to MB/s</h2>
        <label className="mt-3 block text-sm">
          Megabits per second
          <input className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" value={mbps} onChange={(e) => setMbps(e.target.value)} inputMode="decimal" />
        </label>
        <p className="mt-4 text-2xl font-semibold tabular-nums">
          {mbpsOk ? mbpsToDecimalMBps(value).toFixed(3) : "—"} <span className="text-base font-medium text-muted-foreground">MB/s</span>
        </p>
        <p className="text-sm text-muted-foreground">
          {mbpsOk ? mbpsToMebibytesPerSec(value).toFixed(3) : "—"} MiB/s
        </p>
        <p className="mt-2 text-sm text-muted-foreground">MB/s = Mbps ÷ 8. MiB/s = (Mbps × 1,000,000 ÷ 8) ÷ 1,048,576.</p>
      </section>
      <section className="rounded-2xl border border-border bg-card p-4 shadow-soft">
        <h2 className="text-base font-semibold">MB/s to Mbps</h2>
        <label className="mt-3 block text-sm">
          Decimal megabytes per second
          <input className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" value={mbs} onChange={(e) => setMbs(e.target.value)} inputMode="decimal" />
        </label>
        <p className="mt-4 text-2xl font-semibold tabular-nums">
          {mbsOk ? decimalMBpsToMbps(back).toFixed(2) : "—"} <span className="text-base font-medium text-muted-foreground">Mbps</span>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">Mbps = MB/s × 8, using decimal megabytes.</p>
      </section>
    </div>
  );
}

export function HouseholdPlanner() {
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [planDown, setPlanDown] = useState("300");
  const [planUp, setPlanUp] = useState("20");
  const numeric = Object.fromEntries(
    Object.entries(counts).map(([key, value]) => [key, Number(value) || 0]),
  );
  const demand = householdDemand(numeric);

  return (
    <form
      className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        trackEvent("calculator_used", { calculator: "household" });
      }}
    >
      <p className="text-sm text-muted-foreground">
        These are planning figures for simultaneous use, not a measurement of your line.
      </p>
      <ul className="mt-4 space-y-2">
        {HOUSEHOLD_ACTIVITIES.map((activity) => (
          <li key={activity.id} className="grid grid-cols-[1fr_6rem] items-center gap-3 text-sm">
            <span>
              {activity.label}
              <span className="block text-muted-foreground">
                {activity.downloadMbps} Mbps down · {activity.uploadMbps} Mbps up each
              </span>
            </span>
            <input
              aria-label={`${activity.label} count`}
              className="rounded-lg border border-border bg-background px-3 py-2"
              inputMode="numeric"
              value={counts[activity.id] ?? ""}
              onChange={(event) =>
                setCounts((current) => ({ ...current, [activity.id]: event.target.value }))
              }
            />
          </li>
        ))}
      </ul>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Plan download Mbps
          <input className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" value={planDown} onChange={(e) => setPlanDown(e.target.value)} />
        </label>
        <label className="text-sm">
          Plan upload Mbps
          <input className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" value={planUp} onChange={(e) => setPlanUp(e.target.value)} />
        </label>
      </div>
      <button type="submit" className="mt-4 min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">
        Estimate
      </button>
      <p className="mt-4 text-sm text-foreground">
        Combined planning load: {demand.downloadMbps.toFixed(1)} Mbps down and {demand.uploadMbps.toFixed(1)} Mbps up.
        {Number(planDown) > 0 &&
          ` That is about ${((demand.downloadMbps / Number(planDown)) * 100).toFixed(0)}% of the download plan you entered.`}
        {Number(planUp) > 0 &&
          ` Upload use is about ${((demand.uploadMbps / Number(planUp)) * 100).toFixed(0)}% of that upload plan.`}
      </p>
    </form>
  );
}
