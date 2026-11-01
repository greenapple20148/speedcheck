"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  StatusBar,
  Toolbar,
  ToolButton,
  Workspace,
  trackTool,
  useCopyFlag,
} from "@/components/dev-tools/chrome";
import { dateToUnix, unixToParts, type TimeUnit, type ZoneMode } from "@/lib/dev-tools/timestamp";

export function UnixTimestampTool() {
  const [unit, setUnit] = useState<TimeUnit>("seconds");
  const [raw, setRaw] = useState("1700000000");
  const [now, setNow] = useState<number | null>(null);
  const [zone, setZone] = useState<ZoneMode>("utc");
  const [dateText, setDateText] = useState("2023-11-14T22:13:20Z");
  const { copied, copy } = useCopyFlag();

  useEffect(() => {
    setNow(Date.now());
  }, []);

  const converted = now == null ? null : unixToParts(raw, unit, now);
  const fromDate = dateToUnix(dateText, zone);

  return (
    <Workspace>
      <p className="mb-3 text-sm leading-6 text-[var(--dt-muted)]">
        Seconds and milliseconds are different units. 1700000000 seconds and 1700000000000 milliseconds are the same instant. 1700000000 milliseconds is in 1970.
      </p>
      <Toolbar>
        <ToolButton tone={unit === "seconds" ? "primary" : "ghost"} onClick={() => setUnit("seconds")}>
          Seconds
        </ToolButton>
        <ToolButton tone={unit === "milliseconds" ? "primary" : "ghost"} onClick={() => setUnit("milliseconds")}>
          Milliseconds
        </ToolButton>
        <ToolButton
          tone="ghost"
          onClick={() => {
            const current = Date.now();
            setNow(current);
            setRaw(unit === "seconds" ? String(Math.floor(current / 1000)) : String(current));
            trackTool("unix-timestamp", "convert");
          }}
        >
          Use current time
        </ToolButton>
        <ToolButton
          tone="ghost"
          disabled={!converted?.ok}
          onClick={() => converted?.ok && void copy(String(converted.seconds), "unix-timestamp")}
        >
          {copied ? "Copied" : "Copy seconds"}
        </ToolButton>
        <ToolButton
          tone="ghost"
          disabled={!converted?.ok}
          onClick={() => converted?.ok && void copy(String(converted.ms), "unix-timestamp")}
        >
          Copy milliseconds
        </ToolButton>
      </Toolbar>
      <label className="block text-sm text-[var(--dt-muted)]">
        Unix timestamp ({unit})
        <input
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
          inputMode="decimal"
          className="dt-mono mt-1 h-11 w-full rounded-xl border border-[var(--dt-border)] bg-[var(--dt-inset)] px-3 text-sm text-[var(--dt-text)] outline-none focus:border-[var(--dt-accent)]"
        />
      </label>
      {converted && !converted.ok ? <Alert>{converted.error}</Alert> : null}
      {converted?.ok && converted.hint ? <Alert>{converted.hint}</Alert> : null}
      {converted?.ok ? (
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <Info label="UTC" value={converted.utc} />
          <Info label="Local" value={converted.local} />
          <Info label="ISO-8601" value={converted.isoUtc} />
          <Info label="Relative" value={converted.relative} />
          <Info label="Seconds" value={String(converted.seconds)} />
          <Info label="Milliseconds" value={String(converted.ms)} />
        </dl>
      ) : null}
      <div className="mt-6 border-t border-[var(--dt-border)] pt-4">
        <h2 className="font-heading text-lg font-semibold text-[var(--dt-text)]">Date to Unix</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <ToolButton tone={zone === "utc" ? "primary" : "ghost"} onClick={() => setZone("utc")}>
            UTC
          </ToolButton>
          <ToolButton tone={zone === "local" ? "primary" : "ghost"} onClick={() => setZone("local")}>
            Local
          </ToolButton>
        </div>
        <label className="mt-3 block text-sm text-[var(--dt-muted)]">
          ISO-8601
          <input
            value={dateText}
            onChange={(event) => setDateText(event.target.value)}
            className="dt-mono mt-1 h-11 w-full rounded-xl border border-[var(--dt-border)] bg-[var(--dt-inset)] px-3 text-sm text-[var(--dt-text)] outline-none focus:border-[var(--dt-accent)]"
            spellCheck={false}
          />
        </label>
        {!fromDate.ok ? <Alert>{fromDate.error}</Alert> : null}
        {fromDate.ok ? (
          <p className="mt-3 text-sm text-[var(--dt-text)]">
            {fromDate.seconds} seconds · {fromDate.ms} milliseconds
          </p>
        ) : null}
      </div>
      <StatusBar>
        {now == null ? "Reading the current time…" : `Clock read at ${new Date(now).toISOString()}.`} A timezone in the date wins over the UTC or Local switch.
      </StatusBar>
    </Workspace>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-[var(--dt-border)] bg-[var(--dt-pale)] p-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--dt-muted)]">{label}</dt>
      <dd className="mt-1 break-words text-sm text-[var(--dt-text)]">{value}</dd>
    </div>
  );
}
