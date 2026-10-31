"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatMbps, formatMs } from "@/lib/utils";

interface HistoryEntry {
  id: string;
  downloadMbps: number | null;
  uploadMbps: number | null;
  pingMs: number | null;
  jitterMs: number | null;
  mode: string;
  serverName?: string;
  createdAt: string;
}

export default function ResultsHistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("speedcheck_history");
      const parsed = JSON.parse(raw || "[]");
      setEntries(Array.isArray(parsed) ? parsed : []);
    } catch {
      setEntries([]);
    }
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        Results history
      </h1>
      <p className="mt-2 text-muted-foreground">
        Recent tests saved in this browser. Sign-in history requires Supabase configuration.
      </p>
      <Link
        href="/#speed-test"
        className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline"
      >
        ← Run a new test
      </Link>
      {entries.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
          No saved tests yet. Complete a speed test on the homepage to populate history.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {entries.map((e) => (
            <li
              key={e.id}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">
                  {new Date(e.createdAt).toLocaleString()}
                </span>
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  {e.mode}
                </span>
              </div>
              <p className="mt-2 text-sm">
                <span className="font-semibold text-foreground">
                  {formatMbps(e.downloadMbps)} down
                </span>
                {" · "}
                <span className="font-semibold text-foreground">
                  {formatMbps(e.uploadMbps)} up
                </span>
                {" · "}
                ping {formatMs(e.pingMs)} ms
              </p>
              {e.serverName && (
                <p className="mt-1 text-xs text-muted-foreground">Server: {e.serverName}</p>
              )}
              <Link
                href={`/results/${e.id}`}
                className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
              >
                View result
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
