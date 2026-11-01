export type TimeUnit = "seconds" | "milliseconds";
export type ZoneMode = "utc" | "local";

const DATE_RE =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?(Z|[+-]\d{2}:\d{2})?$/;

export function formatRelative(targetMs: number, nowMs: number): string {
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const seconds = Math.round((targetMs - nowMs) / 1000);
  const absSeconds = Math.abs(seconds);
  if (absSeconds < 60) return rtf.format(seconds, "second");
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 7) return rtf.format(days, "day");
  const weeks = Math.round(days / 7);
  if (Math.abs(weeks) < 5) return rtf.format(weeks, "week");
  const months = Math.round(days / 30);
  if (Math.abs(months) < 12) return rtf.format(months, "month");
  return rtf.format(Math.round(days / 365), "year");
}

export function formatUtc(ms: number): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "long",
    timeZone: "UTC",
  }).format(new Date(ms));
}

export function formatLocal(ms: number): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "long",
  }).format(new Date(ms));
}

export function unixToParts(raw: string, unit: TimeUnit, nowMs: number) {
  const trimmed = raw.trim();
  if (!/^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(trimmed)) {
    return { ok: false as const, error: "Enter a numeric Unix timestamp." };
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return { ok: false as const, error: "That timestamp is not a finite number." };
  const ms = unit === "seconds" ? value * 1000 : value;
  if (Math.abs(ms) > 8.64e15) {
    return { ok: false as const, error: "That timestamp is outside the range this page can format." };
  }
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return { ok: false as const, error: "That timestamp is not a valid time." };
  const abs = Math.abs(value);
  let hint: string | null = null;
  if (unit === "seconds" && abs >= 1e12) {
    hint = "This many digits usually means milliseconds. Switch the unit if the year looks wrong.";
  }
  if (unit === "milliseconds" && abs >= 1e8 && abs < 1e11) {
    hint = "This many digits usually means seconds. Switch the unit if the year looks wrong.";
  }
  const exact = date.getTime();
  return {
    ok: true as const,
    ms: exact,
    seconds: exact / 1000,
    isoUtc: date.toISOString(),
    utc: formatUtc(exact),
    local: formatLocal(exact),
    relative: formatRelative(exact, nowMs),
    hint,
  };
}

/**
 * If the text includes Z or an offset, that zone wins.
 * Otherwise UTC mode reads the clock time as UTC, and Local mode reads it in the browser timezone.
 */
export function dateToUnix(input: string, interpretation: ZoneMode) {
  const trimmed = input.trim();
  const match = DATE_RE.exec(trimmed);
  if (!match) {
    return { ok: false as const, error: "Use an ISO-8601 date such as 2023-11-14T22:13:20Z." };
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4] ?? "0");
  const minute = Number(match[5] ?? "0");
  const second = Number(match[6] ?? "0");
  const fraction = (match[7] ?? "0").padEnd(3, "0");
  const milli = Number(fraction);
  const zone = match[8];
  if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 60) {
    return { ok: false as const, error: "That date is not valid." };
  }
  let ms: number;
  if (zone || interpretation === "utc") {
    const iso = zone
      ? trimmed
      : `${match[1]}-${match[2]}-${match[3]}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}.${String(milli).padStart(3, "0")}Z`;
    ms = Date.parse(iso);
  } else {
    const local = new Date(year, month - 1, day, hour, minute, second, milli);
    if (local.getFullYear() !== year || local.getMonth() !== month - 1 || local.getDate() !== day) {
      return { ok: false as const, error: "That date is not valid." };
    }
    ms = local.getTime();
  }
  if (Number.isNaN(ms)) return { ok: false as const, error: "That date is not valid." };
  return { ok: true as const, ms, seconds: ms / 1000 };
}
