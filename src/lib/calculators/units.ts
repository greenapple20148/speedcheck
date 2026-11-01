import { z } from "zod";

export type ByteUnit = "B" | "KB" | "MB" | "GB" | "TB" | "KiB" | "MiB" | "GiB" | "TiB";

const DECIMAL: Record<"B" | "KB" | "MB" | "GB" | "TB", number> = {
  B: 1,
  KB: 1_000,
  MB: 1_000_000,
  GB: 1_000_000_000,
  TB: 1_000_000_000_000,
};

const BINARY: Record<"B" | "KiB" | "MiB" | "GiB" | "TiB", number> = {
  B: 1,
  KiB: 1024,
  MiB: 1024 ** 2,
  GiB: 1024 ** 3,
  TiB: 1024 ** 4,
};

export function toBytes(value: number, unit: ByteUnit): number {
  if (unit === "B") return value;
  if (unit in DECIMAL) return value * DECIMAL[unit as keyof typeof DECIMAL];
  return value * BINARY[unit as keyof typeof BINARY];
}

/** Decimal megabytes per second from SI megabits per second. */
export function mbpsToDecimalMBps(mbps: number): number {
  return mbps / 8;
}

/** Binary mebibytes per second from SI megabits per second. */
export function mbpsToMebibytesPerSec(mbps: number): number {
  return (mbps * 1_000_000) / 8 / 1024 ** 2;
}

export function decimalMBpsToMbps(mbs: number): number {
  return mbs * 8;
}

const sizeSchema = z.number().finite().nonnegative().max(1e15);
const rateSchema = z.number().finite().positive().max(1e9);
const efficiencySchema = z.number().finite().gt(0).max(1);

export interface TransferTimeResult {
  seconds: number | null;
  adjustedSeconds: number | null;
  error: string | null;
  formula: string;
}

export function transferTimeSeconds(
  size: number,
  unit: ByteUnit,
  mbps: number,
  efficiency: number | null,
): TransferTimeResult {
  const formula =
    "time (seconds) = (file size in bits) / (megabits per second × 1,000,000)";
  const sizeOk = sizeSchema.safeParse(size);
  const rateOk = rateSchema.safeParse(mbps);
  if (!sizeOk.success) {
    return { seconds: null, adjustedSeconds: null, error: "Enter a file size between 0 and a reasonable maximum.", formula };
  }
  if (!rateOk.success) {
    return { seconds: null, adjustedSeconds: null, error: "Enter a transfer rate greater than 0.", formula };
  }
  const bits = toBytes(size, unit) * 8;
  const seconds = bits / (mbps * 1_000_000);
  if (!Number.isFinite(seconds)) {
    return { seconds: null, adjustedSeconds: null, error: "That combination is too large to calculate.", formula };
  }
  if (efficiency == null) {
    return { seconds, adjustedSeconds: null, error: null, formula };
  }
  const eff = efficiencySchema.safeParse(efficiency);
  if (!eff.success) {
    return {
      seconds,
      adjustedSeconds: null,
      error: "Efficiency must be between 0 and 1.",
      formula,
    };
  }
  return { seconds, adjustedSeconds: seconds / efficiency, error: null, formula };
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 2 : 1)} seconds`;
  const minutes = Math.floor(seconds / 60);
  const rem = seconds - minutes * 60;
  if (minutes < 60) return `${minutes} min ${rem.toFixed(0)} sec`;
  const hours = Math.floor(minutes / 60);
  const min = minutes - hours * 60;
  return `${hours} hr ${min} min`;
}

export const STREAMING_REFERENCE_MBPS = {
  sd: 3,
  hd: 5,
  fullHd: 10,
  uhd4k: 25,
} as const;

export const CALL_REFERENCE_MBPS = {
  zoom: { down: 3.8, up: 3.8, label: "Zoom group HD (planning figure)" },
  teams: { down: 4, up: 4, label: "Microsoft Teams HD (planning figure)" },
  meet: { down: 3.2, up: 3.2, label: "Google Meet 720p (planning figure)" },
} as const;
