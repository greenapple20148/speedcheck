import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSpeedParts(
  value: number | null | undefined,
  digits = 1,
): { amount: string; unit: "Mbps" | "Gbps" } | null {
  if (value == null || Number.isNaN(value)) return null;
  if (value >= 1000) {
    return { amount: (value / 1000).toFixed(2), unit: "Gbps" };
  }
  return { amount: value.toFixed(digits), unit: "Mbps" };
}

export function formatMbps(value: number | null | undefined, digits = 1): string {
  const parts = formatSpeedParts(value, digits);
  if (!parts) return "—";
  return parts.unit === "Gbps" ? `${parts.amount} Gbps` : parts.amount;
}

export function formatMs(value: number | null | undefined, digits = 0): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toFixed(digits);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
