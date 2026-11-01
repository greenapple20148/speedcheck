import { describe, expect, it } from "vitest";
import { suggestNodeCount } from "@/lib/mesh/nodes";
import {
  convertAreaInput,
  defaultNodeCalculatorDraft,
  homePatch,
  recommendationCopy,
  validateNodeCalculatorDraft,
  wiredForSuggestion,
} from "@/lib/mesh/node-calculator-form";

describe("node calculator form", () => {
  it("keeps the existing one-node result for the default home", () => {
    const parsed = validateNodeCalculatorDraft(defaultNodeCalculatorDraft());
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const result = suggestNodeCount({
      area: parsed.value.area,
      unit: parsed.value.unit,
      floors: parsed.value.floors,
      construction: parsed.value.construction,
      devices: parsed.value.devices,
      wiredBackhaul: wiredForSuggestion(parsed.value, "unknown"),
    });
    expect(result.count).toBe(1);
    expect(result.meshMayBeUnnecessary).toBe(true);
    expect(recommendationCopy(result).body).toContain("A mesh kit may be unnecessary");
    expect(recommendationCopy(result).badge).not.toMatch(/enough|guaranteed/i);
  });

  it("converts square feet and square meters without changing the node count", () => {
    const sqm = convertAreaInput("1200", "sqft", "sqm");
    const back = convertAreaInput(sqm, "sqm", "sqft");
    expect(back).toBe("1200");
    const feet = validateNodeCalculatorDraft({ ...defaultNodeCalculatorDraft(), area: "1200", unit: "sqft" });
    const meters = validateNodeCalculatorDraft({ ...defaultNodeCalculatorDraft(), area: sqm, unit: "sqm" });
    expect(feet.ok && meters.ok).toBe(true);
    if (!feet.ok || !meters.ok) return;
    const left = suggestNodeCount({ ...feet.value, wiredBackhaul: false });
    const right = suggestNodeCount({ ...meters.value, wiredBackhaul: false });
    expect(right.count).toBe(left.count);
  });

  it("rejects empty, zero, and oversized values", () => {
    const base = defaultNodeCalculatorDraft();
    expect(validateNodeCalculatorDraft({ ...base, area: "" }).ok).toBe(false);
    expect(validateNodeCalculatorDraft({ ...base, area: "0" }).ok).toBe(false);
    expect(validateNodeCalculatorDraft({ ...base, area: "-20" }).ok).toBe(false);
    expect(validateNodeCalculatorDraft({ ...base, area: "20001" }).ok).toBe(false);
    expect(validateNodeCalculatorDraft({ ...base, devices: "1.5" }).ok).toBe(false);
    expect(validateNodeCalculatorDraft({ ...base, devices: "501" }).ok).toBe(false);
    expect(validateNodeCalculatorDraft({ ...base, ispMbps: "nope" }).ok).toBe(false);
    expect(validateNodeCalculatorDraft({ ...base, ispMbps: "10001" }).ok).toBe(false);
    const blankSpeed = validateNodeCalculatorDraft({ ...base, ispMbps: "" });
    expect(blankSpeed.ok && blankSpeed.ok ? blankSpeed.value.ispMbps : null).toBeNull();
  });

  it("resets calculator fields and leaves a MoCA backhaul in place", () => {
    const parsed = validateNodeCalculatorDraft(defaultNodeCalculatorDraft());
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(homePatch(parsed.value, "moca").backhaul).toBe("moca");
    expect(homePatch({ ...parsed.value, ethernet: true }, "unknown").backhaul).toBe("ethernet");
    expect(homePatch(parsed.value, "ethernet").backhaul).toBe("unknown");
  });
});
