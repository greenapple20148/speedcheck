"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  chartSummarySentence,
  computeRangeStats,
  downsampleSeries,
  type HistoryRange,
} from "@/lib/speedtest/history-analytics";
import type { PlanSettings, StoredHistoryEntry } from "@/lib/speedtest/history-store";
import { format } from "date-fns";

interface HistoryChartProps {
  entries: StoredHistoryEntry[];
  plan: PlanSettings | null;
  range: HistoryRange;
}

export function HistoryChart({ entries, plan, range }: HistoryChartProps) {
  const chronological = useMemo(
    () =>
      [...entries].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [entries],
  );

  const chartData = useMemo(() => {
    const mapped = chronological.map((e) => ({
      t: new Date(e.createdAt).getTime(),
      label: format(new Date(e.createdAt), "MMM d HH:mm"),
      download: e.downloadMbps ?? null,
      upload: e.uploadMbps ?? null,
    }));
    return downsampleSeries(mapped).map((d) => ({ ...d, t: d.label }));
  }, [chronological]);

  const stats = computeRangeStats(chronological, plan?.downloadMbps ?? null);
  const summary = chartSummarySentence(chronological, stats);

  if (chronological.length < 2) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--surface-subtle)] p-6 text-center text-[14px] text-muted-foreground">
        Run at least two speed tests to see trends over time.
      </div>
    );
  }

  return (
    <div>
      <p className="sr-only">{summary}</p>
      <div className="mb-3 grid gap-2 text-[13px] sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Avg download" value={fmt(stats.avgDownload)} />
        <Stat label="Best download" value={fmt(stats.bestDownload)} />
        <Stat label="Worst download" value={fmt(stats.worstDownload)} />
        <Stat
          label="% of plan delivered"
          value={
            stats.planPercent != null
              ? `${stats.planPercent}%`
              : plan
                ? "—"
                : "Set your plan to see this"
          }
        />
      </div>
      <div
        className="h-[280px] w-full rounded-xl border border-[var(--card-border)] bg-card p-2"
        role="img"
        aria-label={summary}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
            <XAxis dataKey="t" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} unit=" Mbps" width={48} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="download"
              name="Download"
              stroke="var(--accent-teal)"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="upload"
              name="Upload"
              stroke="var(--muted-foreground)"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={{ r: 3, strokeDasharray: "" }}
              connectNulls
            />
            {plan && (
              <>
                <ReferenceLine
                  y={plan.downloadMbps}
                  stroke="var(--accent-teal)"
                  strokeDasharray="4 4"
                  label={{ value: "Plan down", position: "insideTopRight", fontSize: 10 }}
                />
                <ReferenceLine
                  y={plan.uploadMbps}
                  stroke="var(--muted-foreground)"
                  strokeDasharray="2 6"
                  label={{ value: "Plan up", position: "insideBottomRight", fontSize: 10 }}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--card-border)] bg-[var(--surface-subtle)] px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-lg font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function fmt(v: number | null): string {
  return v != null ? `${v.toFixed(1)} Mbps` : "—";
}
