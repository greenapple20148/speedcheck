import { describe, expect, it } from "vitest";
import {
  BANDWIDTH_ACTIVITIES,
  DEFAULT_PLAN_DOWNLOAD_MBPS,
  DEFAULT_PLAN_UPLOAD_MBPS,
  HOUSEHOLD_PRESETS,
  QUANTITY_MAX,
  buildRecommendation,
  clampQuantity,
  directionAdvice,
  emptyQuantities,
  estimateBandwidth,
  formatEstimateMbps,
  latestMeasuredSpeed,
  matchingPreset,
  parsePlanMbps,
  quantitiesFromPreset,
  quantityFromToggle,
  recommendedMbps,
  roundUpToPlanTier,
  stepQuantity,
  utilizationBarWidth,
  utilizationLevel,
  utilizationPercent,
  withQuantity,
} from "@/lib/calculators/bandwidth";
import { householdDemand } from "@/lib/calculators/household";

describe("bandwidth totals", () => {
  it("is zero when every quantity is zero", () => {
    const estimate = estimateBandwidth(emptyQuantities());
    expect(estimate.totalDownloadMbps).toBe(0);
    expect(estimate.totalUploadMbps).toBe(0);
    expect(estimate.byActivity.every((item) => item.quantity === 0)).toBe(true);
    const recommendation = buildRecommendation(0, 0, DEFAULT_PLAN_DOWNLOAD_MBPS, DEFAULT_PLAN_UPLOAD_MBPS);
    expect(recommendation.summary).toContain("Your plan looks good");
    expect(recommendation.tierDownloadMbps).toBe(0);
    expect(recommendation.tierUploadMbps).toBe(0);
  });

  it("multiplies one activity by its reference rate", () => {
    const quantities = withQuantity(emptyQuantities(), "hd", 1);
    expect(estimateBandwidth(quantities)).toMatchObject({
      totalDownloadMbps: 5,
      totalUploadMbps: 0.5,
    });
    expect(estimateBandwidth({ call: 1 })).toMatchObject({
      totalDownloadMbps: 3.8,
      totalUploadMbps: 3.8,
    });
  });

  it("adds several activities without binary drift", () => {
    const estimate = estimateBandwidth({ browse: 2, call: 1, hd: 1 });
    expect(estimate.totalDownloadMbps).toBe(14.8);
    expect(estimate.totalUploadMbps).toBe(6.3);
    expect(estimateBandwidth({ call: 3 }).totalDownloadMbps).toBe(11.4);
    expect(estimateBandwidth({ hd: 3 }).totalUploadMbps).toBe(1.5);
  });

  it("keeps householdDemand aligned with the estimator", () => {
    expect(householdDemand({ hd: 2, uhd: 1 })).toEqual({ downloadMbps: 35, uploadMbps: 2 });
  });
});

describe("saturation and utilization", () => {
  it("flags upload saturation on its own", () => {
    const estimate = estimateBandwidth({ backup: 3 });
    expect(estimate).toMatchObject({ totalDownloadMbps: 3, totalUploadMbps: 30 });
    expect(utilizationPercent(estimate.totalUploadMbps, 20)).toBe(150);
    expect(utilizationLevel(150)).toBe("over");
    expect(directionAdvice(estimate.totalUploadMbps, 20)).toBe("faster");
    expect(directionAdvice(estimate.totalDownloadMbps, 300)).toBe("good");
    expect(buildRecommendation(3, 30, 300, 20).summary).toBe("Consider a faster upload plan.");
  });

  it("flags download saturation on its own", () => {
    const estimate = estimateBandwidth({ uhd: 13 });
    expect(estimate.totalDownloadMbps).toBe(325);
    expect(estimate.totalUploadMbps).toBe(13);
    const recommendation = buildRecommendation(325, 13, 300, 50);
    expect(recommendation.downloadAdvice).toBe("faster");
    expect(recommendation.uploadAdvice).toBe("good");
    expect(recommendation.summary).toBe("Consider a faster download plan.");
  });

  it("keeps the real percentage when utilization is above 100%", () => {
    expect(utilizationPercent(50, 20)).toBe(250);
    expect(utilizationBarWidth(250)).toBe(100);
    expect(utilizationBarWidth(40)).toBe(40);
    expect(utilizationBarWidth(0)).toBe(0);
    expect(utilizationLevel(100)).toBe("near");
    expect(utilizationLevel(90)).toBe("near");
    expect(utilizationLevel(89.9)).toBe("busy");
    expect(utilizationLevel(70)).toBe("busy");
    expect(utilizationLevel(69.9)).toBe("comfortable");
    const recommendation = buildRecommendation(50, 2, 40, 1);
    expect(recommendation.summary).toBe("Consider a faster download plan. Consider a faster upload plan.");
  });

  it("calls upload tight before the plan is full", () => {
    const estimate = estimateBandwidth(quantitiesFromPreset("wfh"));
    expect(estimate).toMatchObject({ totalDownloadMbps: 10.8, totalUploadMbps: 15.8 });
    const recommendation = buildRecommendation(10.8, 15.8, 300, 20);
    expect(utilizationPercent(15.8, 20)).toBe(79);
    expect(recommendation.uploadAdvice).toBe("tight");
    expect(recommendation.downloadAdvice).toBe("good");
    expect(recommendation.summary).toBe("Upload is getting tight.");
    expect(buildRecommendation(80, 5, 100, 50).summary).toBe("Download is getting tight.");
  });
});

describe("plan inputs", () => {
  it("accepts only positive finite numbers", () => {
    expect(parsePlanMbps("300")).toEqual({ value: 300, error: null });
    expect(parsePlanMbps(" 19.75 ")).toEqual({ value: 19.75, error: null });
    expect(parsePlanMbps("+20")).toEqual({ value: 20, error: null });
    expect(parsePlanMbps(".5").value).toBe(0.5);
    for (const raw of ["", "0", "0.0", "-5", "abc", "Infinity", "NaN", "1e2", "300 Mbps"]) {
      const parsed = parsePlanMbps(raw);
      expect(parsed.value).toBeNull();
      expect(parsed.error).toBeTruthy();
    }
    expect(utilizationPercent(10, null)).toBeNull();
    expect(utilizationPercent(10, 0)).toBeNull();
    expect(utilizationPercent(10, Number.POSITIVE_INFINITY)).toBeNull();
    expect(buildRecommendation(10, 10, null, 20).downloadAdvice).toBeNull();
    expect(buildRecommendation(10, 10, null, 20).uploadAdvice).toBe("good");
    expect(buildRecommendation(10, 10, null, 20).summary).toMatch(/greater than 0/);
  });
});

describe("quantity bounds", () => {
  it("stays inside 0 to 50 and toggles between idle and one", () => {
    expect(stepQuantity(0, -1)).toBe(0);
    expect(stepQuantity(QUANTITY_MAX, 1)).toBe(50);
    expect(stepQuantity(2, 1)).toBe(3);
    expect(quantityFromToggle(0, true)).toBe(1);
    expect(quantityFromToggle(4, true)).toBe(4);
    expect(quantityFromToggle(4, false)).toBe(0);
    expect(clampQuantity(51)).toBe(50);
    expect(clampQuantity(-5)).toBe(0);
    expect(clampQuantity(Number.NaN)).toBe(0);
    expect(clampQuantity(3.9)).toBe(3);
    expect(estimateBandwidth({ uhd: 100, browse: -2 }).totalDownloadMbps).toBe(1250);
  });
});

describe("headroom recommendations", () => {
  it("scales by 25% and rounds up to a practical tier", () => {
    expect(recommendedMbps(40)).toBe(50);
    expect(roundUpToPlanTier(50)).toBe(50);
    expect(roundUpToPlanTier(51.25)).toBe(75);
    expect(recommendedMbps(0)).toBe(0);
    expect(roundUpToPlanTier(0)).toBe(0);
    expect(recommendedMbps(3.8)).toBe(4.75);
    expect(roundUpToPlanTier(4.75)).toBe(25);
    const recommendation = buildRecommendation(40, 18, 300, 50);
    expect(recommendation.headroomDownloadMbps).toBe(50);
    expect(recommendation.headroomUploadMbps).toBe(22.5);
    expect(recommendation.tierDownloadMbps).toBe(50);
    expect(recommendation.tierUploadMbps).toBe(25);
    expect(recommendation.rawDownloadMbps).toBe(40);
    expect(utilizationPercent(18, 20)).toBe(90);
    expect(directionAdvice(18, 20)).toBe("tight");
    expect(recommendation.summary).toBe("Your plan looks good for these activities.");
    expect(formatEstimateMbps(19.75)).toBe("19.75");
    expect(formatEstimateMbps(3.8)).toBe("3.8");
    expect(formatEstimateMbps(10)).toBe("10");
  });

  it("uses the published reference rates", () => {
    const rates = Object.fromEntries(BANDWIDTH_ACTIVITIES.map((activity) => [activity.id, activity]));
    expect(rates.browse).toMatchObject({ downloadMbps: 3, uploadMbps: 1 });
    expect(rates.hd).toMatchObject({ downloadMbps: 5, uploadMbps: 0.5 });
    expect(rates.uhd).toMatchObject({ downloadMbps: 25, uploadMbps: 1 });
    expect(rates.call).toMatchObject({ downloadMbps: 3.8, uploadMbps: 3.8 });
    expect(rates.backup).toMatchObject({ downloadMbps: 1, uploadMbps: 10 });
  });
});

describe("presets and reset", () => {
  it("names the household presets", () => {
    expect(HOUSEHOLD_PRESETS.map((preset) => preset.name)).toEqual([
      "Light browsing",
      "Work from home",
      "Family streaming",
      "Gaming household",
      "Heavy usage",
    ]);
  });

  it("applies a preset and reset clears every quantity", () => {
    const family = quantitiesFromPreset("family");
    expect(matchingPreset(family)).toBe("family");
    expect(estimateBandwidth(family)).toMatchObject({ totalDownloadMbps: 41, totalUploadMbps: 4 });

    const edited = withQuantity(family, "hd", stepQuantity(family.hd, 1));
    expect(matchingPreset(edited)).toBeNull();
    expect(estimateBandwidth(edited).totalDownloadMbps).toBe(46);

    const reset = emptyQuantities();
    expect(matchingPreset(reset)).toBeNull();
    expect(estimateBandwidth(reset).totalDownloadMbps).toBe(0);

    const heavy = estimateBandwidth(quantitiesFromPreset("heavy"));
    expect(heavy).toMatchObject({ totalDownloadMbps: 80.6, totalUploadMbps: 24.6 });
    const heavyPlan = buildRecommendation(heavy.totalDownloadMbps, heavy.totalUploadMbps, 300, 20);
    expect(heavyPlan.headroomDownloadMbps).toBe(100.75);
    expect(heavyPlan.tierDownloadMbps).toBe(150);
    expect(heavyPlan.tierUploadMbps).toBe(50);
    expect(heavyPlan.summary).toBe("Consider a faster upload plan.");
  });
});

describe("latest measured speed", () => {
  it("skips incomplete rows and does not invent a plan", () => {
    expect(
      latestMeasuredSpeed([
        { downloadMbps: null, uploadMbps: 5, createdAt: "2026-11-02T00:00:00.000Z" },
        { downloadMbps: 10, uploadMbps: 0, createdAt: "2026-11-03T00:00:00.000Z" },
        { downloadMbps: 40, uploadMbps: 5, createdAt: "2026-11-01T00:00:00.000Z" },
        { downloadMbps: 80, uploadMbps: 8, createdAt: "2026-11-01T12:00:00.000Z" },
      ]),
    ).toEqual({ downloadMbps: 80, uploadMbps: 8, createdAt: "2026-11-01T12:00:00.000Z" });
    expect(latestMeasuredSpeed([])).toBeNull();
    expect(DEFAULT_PLAN_DOWNLOAD_MBPS).toBe(300);
    expect(DEFAULT_PLAN_UPLOAD_MBPS).toBe(20);
  });
});
