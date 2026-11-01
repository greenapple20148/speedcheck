"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  decimalMBpsToMbps,
  formatDuration,
  mbpsToDecimalMBps,
  mbpsToMebibytesPerSec,
  transferTimeSeconds,
  type ByteUnit,
} from "@/lib/calculators/units";
import { trackEvent } from "@/lib/analytics/events";
import { readPrefs } from "@/lib/speedtest/history-store";
import { fieldControlClass } from "@/components/ui/field";

const SIZE_UNITS: ByteUnit[] = ["MB", "GB", "MiB", "GiB"];

export function TransferCalculator({ direction }: { direction: "download" | "upload" }) {
  const [size, setSize] = useState("1");
  const [unit, setUnit] = useState<ByteUnit>("GB");
  const [mbps, setMbps] = useState("100");
  const [efficiency, setEfficiency] = useState("0.9");
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUnit(readPrefs().units === "binary" ? "GiB" : "GB");
  }, []);

  const result = useMemo(() => {
    const eff = efficiency.trim() === "" ? null : Number(efficiency);
    return transferTimeSeconds(Number(size), unit, Number(mbps), eff);
  }, [size, unit, mbps, efficiency]);

  return (
    <form
      className="rounded-[20px] border border-border bg-card p-4 shadow-soft sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        trackEvent("calculator_used", { calculator: `${direction}-time` });
        resultRef.current?.focus();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-medium text-foreground">
          File size
          <input className={fieldControlClass} value={size} onChange={(e) => setSize(e.target.value)} inputMode="decimal" />
        </label>
        <label className="text-sm font-medium text-foreground">
          Unit
          <select className={fieldControlClass} value={unit} onChange={(e) => setUnit(e.target.value as ByteUnit)}>
            {SIZE_UNITS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-foreground">
          {direction === "download" ? "Download" : "Upload"} Mbps
          <input className={fieldControlClass} value={mbps} onChange={(e) => setMbps(e.target.value)} inputMode="decimal" />
        </label>
      </div>
      <label className="mt-3 block text-sm font-medium text-foreground">
        Optional efficiency (0–1)
        <input className={`${fieldControlClass} max-w-xs`} value={efficiency} onChange={(e) => setEfficiency(e.target.value)} inputMode="decimal" />
      </label>
      <button type="submit" className="mt-4 min-h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
        Calculate
      </button>
      <div ref={resultRef} tabIndex={-1} className="mt-4 text-sm text-muted-foreground outline-none">
      {result.error && <p className="text-sm text-destructive" role="alert">{result.error}</p>}
      {result.seconds != null && (
        <div>
          <p className="text-2xl font-semibold text-foreground">{formatDuration(result.seconds)}</p>
          <p className="mt-1">Theoretical time at the full rate.</p>
          {result.adjustedSeconds != null && (
            <p className="mt-1">With the efficiency you entered: {formatDuration(result.adjustedSeconds)}.</p>
          )}
          <p className="mt-2">{result.formula}</p>
          <p className="mt-1">MB and GB are decimal (1,000). MiB and GiB are binary (1,024). Mbps stays in decimal megabits.</p>
        </div>
      )}
      </div>
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
      <section className="rounded-[20px] border border-border bg-card p-4 shadow-soft">
        <h2 className="text-base font-semibold">Mbps to MB/s</h2>
        <label className="mt-3 block text-sm font-medium text-foreground">
          Megabits per second
          <input className={fieldControlClass} value={mbps} onChange={(e) => setMbps(e.target.value)} inputMode="decimal" />
        </label>
        <p className="mt-4 text-2xl font-semibold tabular-nums">
          {mbpsOk ? mbpsToDecimalMBps(value).toFixed(3) : "—"} <span className="text-base font-medium text-muted-foreground">MB/s</span>
        </p>
        <p className="text-sm text-muted-foreground">
          {mbpsOk ? mbpsToMebibytesPerSec(value).toFixed(3) : "—"} MiB/s
        </p>
        <p className="mt-2 text-sm text-muted-foreground">MB/s = Mbps ÷ 8. MiB/s = (Mbps × 1,000,000 ÷ 8) ÷ 1,048,576.</p>
      </section>
      <section className="rounded-[20px] border border-border bg-card p-4 shadow-soft">
        <h2 className="text-base font-semibold">MB/s to Mbps</h2>
        <label className="mt-3 block text-sm font-medium text-foreground">
          Decimal megabytes per second
          <input className={fieldControlClass} value={mbs} onChange={(e) => setMbs(e.target.value)} inputMode="decimal" />
        </label>
        <p className="mt-4 text-2xl font-semibold tabular-nums">
          {mbsOk ? decimalMBpsToMbps(back).toFixed(2) : "—"} <span className="text-base font-medium text-muted-foreground">Mbps</span>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">Mbps = MB/s × 8, using decimal megabytes.</p>
      </section>
    </div>
  );
}

export { BandwidthEstimator as HouseholdPlanner } from "@/components/calculators/bandwidth/bandwidth-estimator";
