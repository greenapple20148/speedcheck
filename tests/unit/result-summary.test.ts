import { describe, expect, it } from "vitest";
import { buildResultSummaryTier } from "@/lib/speedtest/result-summary";

describe("buildResultSummaryTier", () => {
  it("maps download tiers", () => {
    expect(buildResultSummaryTier(1200)?.headline).toBe("Gigabit-class connection");
    expect(buildResultSummaryTier(250)?.headline).toBe("Fast connection");
    expect(buildResultSummaryTier(50)?.headline).toBe("Good for everyday use");
    expect(buildResultSummaryTier(10)?.headline).toBe("Limited speed");
  });
});
