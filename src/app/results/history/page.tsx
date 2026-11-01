"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { HistoryChart } from "@/components/speedtest/history/history-chart";
import { HistoryTable } from "@/components/speedtest/history/history-table";
import { PlanSettingsForm } from "@/components/speedtest/history/plan-settings-form";
import {
  filterByRange,
  filterByTag,
  type HistoryRange,
} from "@/lib/speedtest/history-analytics";
import {
  clearHistory,
  deleteHistoryEntry,
  readHistory,
  readPlan,
  type PlanSettings,
} from "@/lib/speedtest/history-store";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

const RANGES: { id: HistoryRange; label: string }[] = [
  { id: "24h", label: "24 hours" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "all", label: "All" },
];

export default function ResultsHistoryPage() {
  const [entries, setEntries] = useState(() => readHistory());
  const [plan, setPlan] = useState<PlanSettings | null>(() => readPlan());
  const [range, setRange] = useState<HistoryRange>("7d");
  const [tagFilter, setTagFilter] = useState<"all" | "wifi" | "wired">("all");

  const refresh = useCallback(() => setEntries(readHistory()), []);

  const filtered = useMemo(() => {
    let list = filterByRange(entries, range);
    list = filterByTag(list, tagFilter);
    return list;
  }, [entries, range, tagFilter]);

  const forgetRemote = (ids: string[]) => {
    for (const id of ids) {
      void fetch(`/api/results/${id}`, { method: "DELETE" }).catch(() => undefined);
    }
  };

  const onDelete = (id: string) => {
    const entry = entries.find((item) => item.id === id);
    deleteHistoryEntry(id);
    if (entry?.persisted) forgetRemote([id]);
    refresh();
  };

  return (
    <div className="mx-auto max-w-[1120px] px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        Results history
      </h1>
      <p className="mt-2 text-muted-foreground">
        Tests saved in this browser. Compare trends with the speed you pay for.
      </p>
      <Link
        href="/speed-test"
        className="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold text-[var(--accent-teal)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-teal)]"
      >
        ← Run a new test
      </Link>

      <div className="mt-8 space-y-6">
        <PlanSettingsForm initial={plan} onChange={setPlan} />

        {entries.length === 0 ? (
          <EmptyState
            title="No saved tests yet"
            body="After a speed test, choose “Save result on this device,” or turn on automatic saving in Settings."
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Range</span>
              {RANGES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  aria-pressed={range === r.id}
                  onClick={() => setRange(r.id)}
                  className={cn(
                    "min-h-[44px] rounded-full px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-teal)]",
                    range === r.id
                      ? "bg-primary text-primary-foreground"
                      : "border border-[var(--card-border)] bg-card text-foreground",
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Connection</span>
              {(["all", "wifi", "wired"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={tagFilter === t}
                  onClick={() => setTagFilter(t)}
                  className={cn(
                    "min-h-[44px] rounded-full px-4 text-sm font-medium capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-teal)]",
                    tagFilter === t
                      ? "bg-primary text-primary-foreground"
                      : "border border-[var(--card-border)] bg-card text-foreground",
                  )}
                >
                  {t === "all" ? "All" : t}
                </button>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      "Delete all tests saved in this browser? This does not affect other devices.",
                    )
                  ) {
                    const remoteIds = readHistory()
                      .filter((entry) => entry.persisted)
                      .map((entry) => entry.id);
                    clearHistory();
                    forgetRemote(remoteIds);
                    refresh();
                  }
                }}
                className="min-h-[44px] rounded-full border border-[var(--card-border)] px-4 text-sm font-medium text-foreground hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-teal)]"
              >
                Delete all saved tests
              </button>
            </div>

            <HistoryChart entries={filtered} plan={plan} range={range} />

            <HistoryTable entries={filtered} onDelete={onDelete} />
          </>
        )}
      </div>
    </div>
  );
}
