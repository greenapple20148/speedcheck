import { SQFT_PER_NODE } from "@/lib/mesh/assumptions";
import { areaSqFt } from "@/lib/mesh/plan";
import type { Construction } from "@/lib/mesh/types";

export interface NodeSuggestion {
  count: number;
  rawCount: number;
  meshMayBeUnnecessary: boolean;
  reasons: string[];
  warnings: string[];
}

export function suggestNodeCount(input: {
  area: number;
  unit: "sqft" | "sqm";
  floors: number;
  construction: Construction;
  devices: number;
  wiredBackhaul: boolean;
}): NodeSuggestion {
  const floors = Math.min(6, Math.max(1, Math.floor(input.floors) || 1));
  const sqft = areaSqFt(input.area, input.unit);
  const perNode = SQFT_PER_NODE[input.construction];
  const vertical = 1 + (floors - 1) * 0.45;
  const rawCount = sqft <= 0 ? 1 : Math.max(1, Math.ceil((sqft * vertical) / perNode));
  const count = Math.min(rawCount, 4);
  const reasons = [
    `Planning area is about ${Math.round(sqft).toLocaleString("en-US")} sq ft across ${floors} floor${floors === 1 ? "" : "s"}.`,
    `${input.construction} construction uses about ${perNode.toLocaleString("en-US")} sq ft per node in this model, before the floor penalty.`,
  ];
  const warnings: string[] = [];
  if (rawCount > count) {
    warnings.push(
      `The area scales to about ${rawCount} nodes. Start with ${count}, measure each priority room, and add a node only where a room is actually slow. Extra nodes can overlap and interfere.`,
    );
  }
  if (input.devices > 30) {
    reasons.push(
      `${input.devices} devices do not by themselves require another node. A busy room should be retested before you add hardware.`,
    );
  }
  if (input.wiredBackhaul) {
    reasons.push(
      "Ethernet between nodes does not shrink each radio’s coverage. It does keep the link between nodes off the same airtime as phones and laptops.",
    );
  }
  const meshMayBeUnnecessary = count === 1 && floors === 1 && sqft > 0 && sqft < 1600 && (input.construction === "wood" || input.construction === "drywall");
  if (meshMayBeUnnecessary) {
    reasons.push("A single router may be enough. Walk the far rooms with a speed test before buying satellites.");
  }
  return { count, rawCount, meshMayBeUnnecessary, reasons, warnings };
}
