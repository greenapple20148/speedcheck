"use client";

import { useEffect, useRef, useState } from "react";
import { Gauge, Info } from "lucide-react";
import { ActivitySelector } from "@/components/calculators/bandwidth/activity-selector";
import { BandwidthSummary } from "@/components/calculators/bandwidth/bandwidth-summary";
import { HouseholdPresets } from "@/components/calculators/bandwidth/household-presets";
import { InternetPlanInputs } from "@/components/calculators/bandwidth/internet-plan-panel";
import { trackEvent } from "@/lib/analytics/events";
import {
  DEFAULT_PLAN_DOWNLOAD_MBPS,
  DEFAULT_PLAN_UPLOAD_MBPS,
  buildRecommendation,
  emptyQuantities,
  estimateBandwidth,
  formatEstimateMbps,
  formatPlanInput,
  latestMeasuredSpeed,
  matchingPreset,
  parsePlanMbps,
  quantitiesFromPreset,
  quantityFromToggle,
  stepQuantity,
  withQuantity,
  type ActivityId,
  type MeasuredSpeed,
  type QuantityMap,
} from "@/lib/calculators/bandwidth";
import { readHistory, readPlan } from "@/lib/speedtest/history-store";

type PlanOrigin = "default" | "saved" | "measured" | "edited";

export function BandwidthEstimator() {
  const [quantities, setQuantities] = useState<QuantityMap>(() => emptyQuantities());
  const [downloadInput, setDownloadInput] = useState(String(DEFAULT_PLAN_DOWNLOAD_MBPS));
  const [uploadInput, setUploadInput] = useState(String(DEFAULT_PLAN_UPLOAD_MBPS));
  const [planOrigin, setPlanOrigin] = useState<PlanOrigin>("default");
  const [measured, setMeasured] = useState<MeasuredSpeed | null>(null);
  const planEdited = useRef(false);
  const tracked = useRef(false);

  useEffect(() => {
    const saved = readPlan();
    if (!planEdited.current && saved && saved.downloadMbps > 0 && saved.uploadMbps > 0) {
      setDownloadInput(formatPlanInput(saved.downloadMbps));
      setUploadInput(formatPlanInput(saved.uploadMbps));
      setPlanOrigin("saved");
    }
    setMeasured(latestMeasuredSpeed(readHistory()));
  }, []);

  const estimate = estimateBandwidth(quantities);
  const downloadPlan = parsePlanMbps(downloadInput);
  const uploadPlan = parsePlanMbps(uploadInput);
  const recommendation = buildRecommendation(
    estimate.totalDownloadMbps,
    estimate.totalUploadMbps,
    downloadPlan.value,
    uploadPlan.value,
  );
  const activePreset = matchingPreset(quantities);

  function trackUse() {
    if (tracked.current) return;
    tracked.current = true;
    trackEvent("calculator_used", { calculator: "household" });
  }

  function updatePlan(origin: PlanOrigin, download: string, upload: string) {
    planEdited.current = true;
    setPlanOrigin(origin);
    setDownloadInput(download);
    setUploadInput(upload);
  }

  return (
    <div id="bandwidth-usage-estimator" className="min-w-0 rounded-[18px] border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-[#0F172A] shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-4" style={{ colorScheme: "light" }}>
      <p className="sr-only" aria-live="polite">
        Estimated bandwidth {formatEstimateMbps(estimate.totalDownloadMbps)} Mbps download and{" "}
        {formatEstimateMbps(estimate.totalUploadMbps)} Mbps upload.
      </p>
      <header className="relative z-10 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0FDF4] text-[#00866A]" aria-hidden>
            <Gauge className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-heading text-xl font-semibold tracking-tight text-[#0F172A] sm:text-2xl">
              Bandwidth Usage Estimator
            </h1>
            <p className="mt-1 text-sm text-[#64748B]">
              Find out how much internet speed your household really needs.
            </p>
          </div>
        </div>
        <details className="group max-w-full shrink-0">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#0F172A] motion-safe:transition-colors motion-safe:duration-200 hover:border-[#14B8A6] group-open:border-[#00866A] group-open:bg-[#F0FDF4] [&::-webkit-details-marker]:hidden">
            <Info className="h-3.5 w-3.5 text-[#00866A]" aria-hidden />
            How it works
          </summary>
          <div className="mt-2 w-[min(18rem,calc(100vw-3rem))] rounded-xl border border-[#E2E8F0] bg-white p-3 text-sm leading-5 text-[#334155] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            These totals are planning estimates from reference rates. They are not a live measurement from your modem.
            <a href="#common-activity-bandwidth" className="mt-2 block font-medium text-[#00866A]">
              Read how the estimate works
            </a>
          </div>
        </details>
      </header>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="min-w-0 rounded-2xl border border-[#E2E8F0] bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-4" aria-labelledby="activities-heading">
          <ActivitySelector
            quantities={quantities}
            onStep={(id, direction) => {
              trackUse();
              setQuantities((current) => withQuantity(current, id, stepQuantity(current[id], direction)));
            }}
            onToggle={(id: ActivityId, enabled) => {
              trackUse();
              setQuantities((current) => withQuantity(current, id, quantityFromToggle(current[id], enabled)));
            }}
          />
          <HouseholdPresets
            activePreset={activePreset}
            onSelect={(id) => {
              trackUse();
              setQuantities(quantitiesFromPreset(id));
            }}
            onReset={() => {
              trackUse();
              setQuantities(emptyQuantities());
            }}
          />
        </section>
        <BandwidthSummary
          totalDownloadMbps={estimate.totalDownloadMbps}
          totalUploadMbps={estimate.totalUploadMbps}
        />
      </div>

      <div className="mt-4">
        <InternetPlanInputs
          downloadInput={downloadInput}
          uploadInput={uploadInput}
          downloadPlan={downloadPlan}
          uploadPlan={uploadPlan}
          totalDownloadMbps={estimate.totalDownloadMbps}
          totalUploadMbps={estimate.totalUploadMbps}
          recommendation={recommendation}
          measured={measured}
          planOrigin={planOrigin}
          onDownloadInput={(value) => updatePlan("edited", value, uploadInput)}
          onUploadInput={(value) => updatePlan("edited", downloadInput, value)}
          onUseMeasured={() => {
            if (!measured) return;
            trackUse();
            updatePlan("measured", formatPlanInput(measured.downloadMbps), formatPlanInput(measured.uploadMbps));
          }}
        />
      </div>
    </div>
  );
}
