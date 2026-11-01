"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { readHistory } from "@/lib/speedtest/history-store";
import { summarizeRoom } from "@/lib/mesh/measurements";
import { loadPlan } from "@/lib/mesh/store";
import { CHANGE_LABELS, compareSnapshots, type ChangeKind } from "@/lib/network-health/compare";
import { snapshotFromHistory, snapshotFromRoom, snapshotFromSpeedResult, type HealthSnapshot } from "@/lib/network-health/snapshot";
import { exportComparison, readComparisons, saveComparison, type SavedComparison } from "@/lib/network-health/store";

const SpeedTestDashboard = dynamic(
  () => import("@/components/speedtest/dashboard/speed-test-dashboard").then((mod) => mod.SpeedTestDashboard),
  { ssr: false, loading: () => <p className="text-sm text-muted-foreground">Loading the speed test…</p> },
);

const CHANGE_KINDS = Object.keys(CHANGE_LABELS) as ChangeKind[];

export function NetworkHealthCompare() {
  const [snapshots, setSnapshots] = useState<HealthSnapshot[]>([]);
  const [saved, setSaved] = useState<SavedComparison[]>([]);
  const [baselineId, setBaselineId] = useState("");
  const [followId, setFollowId] = useState("");
  const [changeKind, setChangeKind] = useState<ChangeKind>("mesh-move");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<SavedComparison | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    try {
      const history = readHistory().map(snapshotFromHistory);
      const plan = loadPlan();
      const rooms = plan.floors.flatMap((floor) => floor.rooms.flatMap((room) => {
        const measurement = summarizeRoom(plan.measurements, room.id);
        if (!measurement) return [];
        return [snapshotFromRoom({ ...measurement, roomLabel: `${floor.name} · ${room.name}` })];
      }));
      const next = [...history, ...rooms];
      setSnapshots(next);
      setSaved(readComparisons());
      setBaselineId(next[0]?.id ?? "");
      setFollowId(next[1]?.id ?? "");
    } catch {
      setError("Saved results could not be read on this device.");
    }
  }, []);

  const baseline = snapshots.find((item) => item.id === baselineId) ?? null;
  const followUp = snapshots.find((item) => item.id === followId) ?? null;
  const preview = useMemo(() => (baseline && followUp ? compareSnapshots(baseline, followUp) : null), [baseline, followUp]);

  const save = () => {
    if (!baseline) {
      setError("Choose a baseline measurement first.");
      return;
    }
    const result = saveComparison({ changeKind, note, baseline, followUp });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setSaved(readComparisons());
    setActive(result.comparison);
    setNote("");
  };

  const download = (comparison: SavedComparison) => {
    const blob = new Blob([exportComparison(comparison)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "network-health-comparison.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-w-0 space-y-6">
      <p className="text-sm text-muted-foreground">Comparisons stay in this browser. Leave out Wi-Fi passwords, account names, and addresses.</p>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      {snapshots.length === 0 ? (
        <p className="text-sm text-muted-foreground">No saved measurements yet. Run a test below, or use a room test you already saved. Nothing starts until you press Start.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <SelectList label="Baseline" snapshots={snapshots} value={baselineId} onChange={setBaselineId} />
          <SelectList label="Follow-up" snapshots={snapshots} value={followId} onChange={setFollowId} />
        </div>
      )}
      <div className="space-y-3">
        <button type="button" className="min-h-11 rounded-xl border border-border px-4 text-sm font-medium" onClick={() => setTesting(true)}>
          {baseline ? "Run follow-up test" : "Run a baseline test"}
        </button>
        {testing && (
          <div className="rounded-2xl border border-border p-3">
            <p className="mb-2 text-sm text-muted-foreground">Nothing runs until you press Start. The finished result is selected as the {baseline ? "follow-up" : "baseline"}. It is stored with a comparison only when you save.</p>
            <SpeedTestDashboard
              defaultMode="standard"
              onComplete={(result) => {
                const snapshot = snapshotFromSpeedResult(result);
                setSnapshots((current) => [snapshot, ...current.filter((item) => item.id !== snapshot.id)]);
                if (!baselineId) setBaselineId(snapshot.id);
                else setFollowId(snapshot.id);
                setTesting(false);
              }}
            />
          </div>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          What changed
          <select className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-2" value={changeKind} onChange={(event) => setChangeKind(event.target.value as ChangeKind)}>
            {CHANGE_KINDS.map((kind) => <option key={kind} value={kind}>{CHANGE_LABELS[kind]}</option>)}
          </select>
        </label>
        <label className="text-sm">
          Note
          <input className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-2" value={note} maxLength={160} onChange={(event) => setNote(event.target.value)} />
        </label>
      </div>
      <button type="button" className="min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground" onClick={save} disabled={!baseline}>
        Save comparison
      </button>
      {preview && <ComparisonTable title="Preview" metrics={preview.metrics} warnings={preview.warnings} />}
      {active && (
        <div className="space-y-3 print:block">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="min-h-11 rounded-xl border border-border px-4 text-sm" onClick={() => download(active)}>Export JSON</button>
            <button type="button" className="min-h-11 rounded-xl border border-border px-4 text-sm" onClick={() => window.print()}>Print</button>
          </div>
          <h2 className="text-base font-semibold">{CHANGE_LABELS[active.changeKind]}</h2>
          {active.note && <p className="text-sm text-muted-foreground">{active.note}</p>}
          {active.followUp ? (
            <ComparisonTable title="Saved result" metrics={compareSnapshots(active.baseline, active.followUp).metrics} warnings={compareSnapshots(active.baseline, active.followUp).warnings} />
          ) : (
            <p className="text-sm text-muted-foreground">A follow-up measurement has not been saved.</p>
          )}
        </div>
      )}
      {saved.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold">Saved on this device</h2>
          <ul className="mt-2 space-y-2">
            {saved.map((item) => (
              <li key={item.id}>
                <button type="button" className="w-full rounded-xl border border-border px-3 py-2 text-left text-sm" onClick={() => setActive(item)}>
                  {CHANGE_LABELS[item.changeKind]} · {item.followUp ? "Baseline and follow-up" : "Baseline only"}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function SelectList({ label, snapshots, value, onChange }: { label: string; snapshots: HealthSnapshot[]; value: string; onChange: (id: string) => void }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{label}</legend>
      <div className="mt-2 space-y-2">
        {snapshots.map((snapshot) => (
          <label key={`${label}-${snapshot.id}`} className="flex items-start gap-2 rounded-xl border border-border px-3 py-2 text-sm">
            <input type="radio" name={label} checked={value === snapshot.id} onChange={() => onChange(snapshot.id)} />
            <span>
              {snapshot.roomLabel ?? snapshot.endpointName ?? "Saved speed test"}
              <span className="mt-1 block text-xs text-muted-foreground">
                {snapshot.downloadMbps == null ? "Download not measured" : `${Math.round(snapshot.downloadMbps)} Mbps down`}
                {snapshot.loadedLatencyMs == null ? "" : ` · ${Math.round(snapshot.loadedLatencyMs)} ms loaded`}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ComparisonTable({ title, metrics, warnings }: { title: string; metrics: ReturnType<typeof compareSnapshots>["metrics"]; warnings: string[] }) {
  return (
    <section aria-label={title} className="space-y-3">
      <h2 className="text-sm font-semibold">{title}</h2>
      {warnings.map((warning) => <p key={warning} className="rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-sm">{warning}</p>)}
      <div className="w-full max-w-full overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-3">Metric</th>
              <th className="py-2 pr-3">Before</th>
              <th className="py-2 pr-3">After</th>
              <th className="py-2">Change</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric) => (
              <tr key={metric.id} className="border-b border-border">
                <th className="py-2 pr-3 font-medium">{metric.label}</th>
                <td className="py-2 pr-3">{formatValue(metric.before, metric.unit)}</td>
                <td className="py-2 pr-3">{formatValue(metric.after, metric.unit)}</td>
                <td className="py-2">{changeText(metric.percent, metric.direction)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatValue(value: number | null, unit: string): string {
  return value == null ? "Not measured" : `${Math.round(value * 10) / 10} ${unit}`;
}

function changeText(percent: number | null, direction: string): string {
  if (direction === "incomplete" || percent == null) return "Not comparable";
  if (direction === "unchanged") return "About the same";
  const rounded = Math.round(percent * 10) / 10;
  const magnitude = `${Math.abs(rounded)}%`;
  return direction === "improved" ? `${magnitude} improvement` : `${magnitude} regression`;
}
