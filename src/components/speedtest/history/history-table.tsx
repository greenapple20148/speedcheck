"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import type { StoredHistoryEntry } from "@/lib/speedtest/history-store";
import { formatMbps, formatMs } from "@/lib/utils";

type SortKey = "createdAt" | "downloadMbps" | "uploadMbps" | "pingMs";

interface HistoryTableProps {
  entries: StoredHistoryEntry[];
  onDelete: (id: string) => void;
}

export function HistoryTable({ entries, onDelete }: HistoryTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = useMemo(() => {
    const list = [...entries];
    list.sort((a, b) => {
      const av =
        sortKey === "createdAt"
          ? new Date(a.createdAt).getTime()
          : (a[sortKey] as number | null) ?? -1;
      const bv =
        sortKey === "createdAt"
          ? new Date(b.createdAt).getTime()
          : (b[sortKey] as number | null) ?? -1;
      return sortAsc ? av - bv : bv - av;
    });
    return list;
  }, [entries, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  if (entries.length === 0) return null;

  return (
    <div className="panel overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-[14px]">
        <thead className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          <tr>
            <SortTh label="Date" active={sortKey === "createdAt"} asc={sortAsc} onClick={() => toggleSort("createdAt")} />
            <SortTh label="Download" active={sortKey === "downloadMbps"} asc={sortAsc} onClick={() => toggleSort("downloadMbps")} />
            <SortTh label="Upload" active={sortKey === "uploadMbps"} asc={sortAsc} onClick={() => toggleSort("uploadMbps")} />
            <SortTh label="Ping" active={sortKey === "pingMs"} asc={sortAsc} onClick={() => toggleSort("pingMs")} />
            <th className="px-3 py-2 font-medium">Jitter</th>
            <th className="px-3 py-2 font-medium">Grade</th>
            <th className="px-3 py-2 font-medium">Tag</th>
            <th className="px-3 py-2 font-medium"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((e) => (
            <tr key={e.id} className="border-t border-border hover:bg-[var(--surface-subtle)]">
              <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                {new Date(e.createdAt).toLocaleString()}
              </td>
              <td className="px-3 py-2 font-medium tabular-nums">{formatMbps(e.downloadMbps)} Mbps</td>
              <td className="px-3 py-2 tabular-nums">{formatMbps(e.uploadMbps)} Mbps</td>
              <td className="px-3 py-2 tabular-nums">{formatMs(e.pingMs)} ms</td>
              <td className="px-3 py-2 tabular-nums">{formatMs(e.jitterMs)} ms</td>
              <td className="px-3 py-2">{e.bufferbloatGrade ?? "—"}</td>
              <td className="px-3 py-2 capitalize">{e.connectionTag ?? "—"}</td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  {e.persisted ? (
                    <Link
                      href={`/results/${e.id}`}
                      className="text-sm font-medium text-[var(--accent-teal)] hover:underline"
                    >
                      View
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    aria-label={`Delete test from ${new Date(e.createdAt).toLocaleString()}`}
                    onClick={() => onDelete(e.id)}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-teal)]"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SortTh({
  label,
  active,
  asc,
  onClick,
}: {
  label: string;
  active: boolean;
  asc: boolean;
  onClick: () => void;
}) {
  return (
    <th className="px-3 py-2 font-medium">
      <button
        type="button"
        onClick={onClick}
        className="min-h-[44px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-teal)]"
      >
        {label}
        {active ? (asc ? " ↑" : " ↓") : ""}
      </button>
    </th>
  );
}
