"use client";

import { historyDeltaPercent } from "@/lib/speedtest/run-state";
import type { StoredHistoryEntry } from "@/lib/speedtest/history-store";
import { formatMbps, formatMs } from "@/lib/utils";

function deltaText(current: number | null, previous: number | null, label: string): string | null {
  const pct = historyDeltaPercent(current, previous);
  if (pct == null) return null;
  if (Math.abs(pct) < 1) return `${label} about the same as the previous test`;
  const direction = pct > 0 ? "higher" : "lower";
  return `${label} ${Math.abs(pct).toFixed(0)}% ${direction} than the previous test`;
}

interface LocalHistoryProps {
  entries: StoredHistoryEntry[];
  onClear: () => void;
}

export function LocalHistory({ entries, onClear }: LocalHistoryProps) {
  const latest = entries[0];
  const previous = entries[1];
  const comparison = latest
    ? [
        deltaText(latest.downloadMbps, previous?.downloadMbps ?? null, "Download"),
        deltaText(latest.uploadMbps, previous?.uploadMbps ?? null, "Upload"),
      ].filter((line): line is string => Boolean(line))
    : [];

  return (
    <section className="mt-3 rounded-2xl border border-[var(--sd-border)] bg-[var(--sd-card)] px-3 py-3" aria-labelledby="local-history">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 id="local-history" className="text-sm font-semibold text-[var(--sd-text)]">
            Recent tests on this device
          </h3>
          <p className="mt-0.5 text-[12px] text-[var(--sd-muted)]">
            Local browser history. Not synced to an account.
          </p>
        </div>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex min-h-11 items-center rounded-xl border border-[var(--sd-border)] px-3 text-[13px] font-semibold text-[var(--sd-text)] hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00866A]"
          >
            Clear local results
          </button>
        )}
      </div>
      {entries.length === 0 ? (
        <p className="mt-2 text-[13px] text-[var(--sd-muted)]">No saved tests on this device yet.</p>
      ) : (
        <ul className="mt-2 divide-y divide-[var(--sd-border)]">
          {entries.slice(0, 5).map((entry) => (
            <li key={entry.id} className="py-2 text-[12px] text-[var(--sd-muted)]">
              <p className="font-medium text-[var(--sd-text)]">
                {new Date(entry.createdAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
                <span className="ml-2 font-normal capitalize">{entry.mode}</span>
              </p>
              <p className="mt-0.5 tabular-nums">
                {entry.downloadMbps != null ? `${formatMbps(entry.downloadMbps)} Mbps down` : "Download not measured"}
                {" · "}
                {entry.uploadMbps != null ? `${formatMbps(entry.uploadMbps)} Mbps up` : "Upload not measured"}
                {" · "}
                {entry.pingMs != null ? `${formatMs(entry.pingMs)} ms` : "Latency not measured"}
                {" · "}
                {entry.jitterMs != null ? `${formatMs(entry.jitterMs)} ms jitter` : "Jitter not measured"}
              </p>
              {entry.serverName ? <p className="mt-0.5">Server {entry.serverName}</p> : null}
            </li>
          ))}
        </ul>
      )}
      {comparison.length > 0 && (
        <p className="mt-2 text-[12px] text-[var(--sd-muted)]">{comparison.join(". ")}.</p>
      )}
    </section>
  );
}
