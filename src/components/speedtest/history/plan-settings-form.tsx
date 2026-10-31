"use client";

import { useState } from "react";
import type { PlanSettings } from "@/lib/speedtest/history-store";
import { writePlan } from "@/lib/speedtest/history-store";

interface PlanSettingsFormProps {
  initial: PlanSettings | null;
  onChange: (plan: PlanSettings | null) => void;
}

export function PlanSettingsForm({ initial, onChange }: PlanSettingsFormProps) {
  const [download, setDownload] = useState(
    initial?.downloadMbps?.toString() ?? "",
  );
  const [upload, setUpload] = useState(initial?.uploadMbps?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const d = parseFloat(download);
    const u = parseFloat(upload || download);
    if (!Number.isFinite(d) || d <= 0 || d > 10_000) {
      setError("Enter a valid download speed in Mbps (1–10000).");
      return;
    }
    if (!Number.isFinite(u) || u <= 0 || u > 10_000) {
      setError("Enter a valid upload speed in Mbps.");
      return;
    }
    setError(null);
    const plan = { downloadMbps: d, uploadMbps: u };
    writePlan(plan);
    onChange(plan);
  };

  const clear = () => {
    setDownload("");
    setUpload("");
    setError(null);
    writePlan(null);
    onChange(null);
  };

  return (
    <form
      className="rounded-xl border border-[var(--card-border)] bg-[var(--surface-subtle)] p-4"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <h2 className="text-sm font-semibold text-foreground">Your plan (optional)</h2>
      <p className="mt-1 text-[13px] text-muted-foreground">
        Used for comparison lines on the chart. Stored only in this browser.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-[13px]">
          <span className="font-medium text-muted-foreground">Download (Mbps)</span>
          <input
            type="number"
            min={1}
            step={1}
            value={download}
            onChange={(e) => setDownload(e.target.value)}
            className="mt-1 min-h-[44px] w-full rounded-lg border border-[var(--card-border)] bg-card px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-teal)]"
          />
        </label>
        <label className="block text-[13px]">
          <span className="font-medium text-muted-foreground">Upload (Mbps)</span>
          <input
            type="number"
            min={1}
            step={1}
            value={upload}
            onChange={(e) => setUpload(e.target.value)}
            placeholder="Same as download"
            className="mt-1 min-h-[44px] w-full rounded-lg border border-[var(--card-border)] bg-card px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-teal)]"
          />
        </label>
      </div>
      {error && (
        <p className="mt-2 text-[13px] text-destructive" role="alert">
          {error}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="submit"
          className="min-h-[44px] rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Save plan
        </button>
        <button
          type="button"
          onClick={clear}
          className="min-h-[44px] rounded-full border border-[var(--card-border)] bg-card px-5 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-teal)]"
        >
          Clear
        </button>
      </div>
    </form>
  );
}
