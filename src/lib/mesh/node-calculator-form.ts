import { defaultHome } from "@/lib/mesh/plan";
import type { NodeSuggestion } from "@/lib/mesh/nodes";
import type { AreaUnit, BackhaulChoice, Construction, MeshHome } from "@/lib/mesh/types";

/** Same factor `areaSqFt` uses. Switching units keeps the physical size. */
const SQFT_PER_SQM = 10.7639;

export const NODE_AREA_MAX = 20_000;
export const NODE_DEVICES_MAX = 500;
export const NODE_ISP_MAX = 10_000;

export interface NodeCalculatorDraft {
  area: string;
  unit: AreaUnit;
  floors: number;
  construction: Construction;
  devices: string;
  ispMbps: string;
  ethernet: boolean;
}

export interface NodeCalculatorValue {
  area: number;
  unit: AreaUnit;
  floors: number;
  construction: Construction;
  devices: number;
  ispMbps: number | null;
  ethernet: boolean;
}

export type NodeCalculatorField = "area" | "devices" | "ispMbps";
export type NodeCalculatorErrors = Partial<Record<NodeCalculatorField, string>>;

export const CONSTRUCTION_OPTIONS: Array<{ value: Construction; label: string }> = [
  { value: "wood", label: "Wood frame, open" },
  { value: "drywall", label: "Drywall" },
  { value: "mixed", label: "Mixed" },
  { value: "brick", label: "Brick" },
  { value: "concrete", label: "Concrete" },
];

export const FLOOR_OPTIONS = [1, 2, 3, 4, 5, 6] as const;

export function defaultNodeCalculatorDraft(): NodeCalculatorDraft {
  return draftFromHome(defaultHome());
}

export function draftFromHome(home: MeshHome): NodeCalculatorDraft {
  return {
    area: String(home.area),
    unit: home.unit,
    floors: home.floors,
    construction: home.construction,
    devices: String(home.devices),
    ispMbps: home.ispMbps == null ? "" : String(home.ispMbps),
    ethernet: home.backhaul === "ethernet",
  };
}

export function convertAreaInput(area: string, from: AreaUnit, to: AreaUnit): string {
  if (from === to) return area;
  const value = parseDecimal(area);
  if (value == null || value <= 0) return area;
  const sqft = from === "sqm" ? value * SQFT_PER_SQM : value;
  const next = to === "sqm" ? sqft / SQFT_PER_SQM : sqft;
  const rounded = to === "sqft" ? Math.round(next) : Math.round(next * 10) / 10;
  return String(rounded);
}

export function validateNodeCalculatorDraft(
  draft: NodeCalculatorDraft,
): { ok: true; value: NodeCalculatorValue } | { ok: false; errors: NodeCalculatorErrors } {
  const errors: NodeCalculatorErrors = {};
  const area = parseDecimal(draft.area);
  if (!draft.area.trim()) errors.area = "Enter a home size.";
  else if (area == null) errors.area = "Enter a home size using digits only.";
  else if (area <= 0) errors.area = "Home size must be greater than zero.";
  else if (area > NODE_AREA_MAX) errors.area = "Home size must be 20,000 or less.";

  const devicesRaw = draft.devices.trim();
  let devices = 0;
  if (!devicesRaw) errors.devices = "Enter a device count.";
  else if (!/^\d+$/.test(devicesRaw)) errors.devices = "Enter a whole number of devices.";
  else if (Number(devicesRaw) > NODE_DEVICES_MAX) errors.devices = "Device count must be 500 or less.";
  else devices = Number(devicesRaw);

  const ispRaw = draft.ispMbps.trim();
  let ispMbps: number | null = null;
  if (ispRaw) {
    const isp = parseDecimal(ispRaw);
    if (isp == null) errors.ispMbps = "Enter a download speed, or leave this blank.";
    else if (isp > NODE_ISP_MAX) errors.ispMbps = "Download speed must be 10,000 Mbps or less.";
    else ispMbps = isp;
  }

  if (errors.area || errors.devices || errors.ispMbps) return { ok: false, errors };

  const floors = Math.min(6, Math.max(1, Math.floor(draft.floors) || 1));
  return {
    ok: true,
    value: {
      area: area as number,
      unit: draft.unit === "sqm" ? "sqm" : "sqft",
      floors,
      construction: draft.construction,
      devices,
      ispMbps,
      ethernet: draft.ethernet,
    },
  };
}

/** Fields this form owns. Other home settings, including a MoCA backhaul, stay put. */
export function homePatch(value: NodeCalculatorValue, currentBackhaul: BackhaulChoice): Pick<
  MeshHome,
  "area" | "unit" | "floors" | "construction" | "devices" | "ispMbps" | "backhaul"
> {
  let backhaul = currentBackhaul;
  if (value.ethernet) backhaul = "ethernet";
  else if (currentBackhaul === "ethernet") backhaul = "unknown";
  return {
    area: value.area,
    unit: value.unit,
    floors: value.floors,
    construction: value.construction,
    devices: value.devices,
    ispMbps: value.ispMbps,
    backhaul,
  };
}

export function wiredForSuggestion(value: NodeCalculatorValue, currentBackhaul: BackhaulChoice): boolean {
  return value.ethernet || (!value.ethernet && currentBackhaul === "moca");
}

export interface RecommendationCopy {
  title: string;
  body: string;
  badge: string;
}

export function recommendationCopy(result: NodeSuggestion): RecommendationCopy {
  if (result.meshMayBeUnnecessary) {
    return {
      title: "One router may be enough for this setup.",
      body: "A mesh kit may be unnecessary. Test the far rooms with the router you have.",
      badge: "Test the far rooms first",
    };
  }
  if (result.count === 1) {
    return {
      title: "Start with one node.",
      body: "Test the farthest rooms before you add a satellite.",
      badge: "Starting point",
    };
  }
  if (result.count === 2) {
    return {
      title: "A two-node kit is a starting point.",
      body: "Place the second node where it still reaches the first, then test the far rooms.",
      badge: "Starting point",
    };
  }
  if (result.count === 3) {
    return {
      title: "A three-node kit is a starting point.",
      body: "Place this set, test the farthest rooms, and add a node only where a room is still slow.",
      badge: "Starting point",
    };
  }
  return {
    title: "Start with four nodes.",
    body: "Measure each priority room before you buy more nodes.",
    badge: "Measure before adding more",
  };
}

export function ispFactorLine(ispMbps: number | null): string | null {
  if (ispMbps == null) return null;
  return `Entered download speed: ${ispMbps.toLocaleString("en-US")} Mbps. This starting count does not use plan speed.`;
}

function parseDecimal(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}
