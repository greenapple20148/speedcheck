"use client";

import {
  UTILIZATION_LABEL,
  formatEstimateMbps,
  formatPercent,
  headroomPercentLabel,
  recommendationTone,
  utilizationBarWidth,
  utilizationLevel,
  utilizationPercent,
  type BandwidthRecommendation,
  type MeasuredSpeed,
  type PlanParse,
  type UtilizationLevel,
} from "@/lib/calculators/bandwidth";
import { cn } from "@/lib/utils";

const LEVEL_STYLE: Record<UtilizationLevel, { bar: string; text: string }> = {
  comfortable: { bar: "bg-[#00866A]", text: "text-[#00866A]" },
  busy: { bar: "bg-[#F59E0B]", text: "text-[#B45309]" },
  near: { bar: "bg-[#F97316]", text: "text-[#C2410C]" },
  over: { bar: "bg-[#EF4444]", text: "text-[#B91C1C]" },
};

const TONE_CLASS = {
  good: "border-[#00866A]/30 bg-[#F0FDF4]",
  tight: "border-[#F59E0B]/50 bg-[#FFFBEB]",
  faster: "border-[#EF4444]/35 bg-[#FEF2F2]",
  incomplete: "border-[#E2E8F0] bg-[#F8FAFC]",
} as const;

export function UtilizationBar({
  label,
  requiredMbps,
  planMbps,
}: {
  label: string;
  requiredMbps: number;
  planMbps: number | null;
}) {
  const percent = utilizationPercent(requiredMbps, planMbps);
  const level = percent == null ? null : utilizationLevel(percent);
  const width = percent == null ? 0 : utilizationBarWidth(percent);
  const style = level ? LEVEL_STYLE[level] : null;
  const available = planMbps == null ? "—" : formatEstimateMbps(planMbps);
  const valueText =
    percent == null || !style
      ? "Enter a plan speed greater than 0."
      : `${formatPercent(percent)}, ${UTILIZATION_LABEL[level!]}. ${formatEstimateMbps(requiredMbps)} Mbps required of ${available} Mbps available.`;

  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-[#0F172A]">{label}</h3>
        <p className={cn("text-sm font-semibold tabular-nums", style?.text ?? "text-[#64748B]")}>
          {percent == null ? "—" : formatPercent(percent)}
          <span className="ml-2 font-medium"> {level ? UTILIZATION_LABEL[level] : "Needs a plan speed"}</span>
        </p>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-[#E2E8F0]"
        role="meter"
        aria-label={`${label} utilization`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(width)}
        aria-valuetext={valueText}
      >
        <div
          className={cn("h-full rounded-full motion-safe:transition-[width] motion-safe:duration-200", style?.bar ?? "bg-transparent")}
          style={{ width: `${width}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-[#64748B]">
        <span className="font-medium text-[#0F172A]">{formatEstimateMbps(requiredMbps)}</span> required / {available} available Mbps
      </p>
    </div>
  );
}

export function PlanRecommendation({ recommendation }: { recommendation: BandwidthRecommendation }) {
  const tone = recommendationTone(recommendation.downloadAdvice, recommendation.uploadAdvice);
  const headroom = headroomPercentLabel();
  const hasLoad = recommendation.rawDownloadMbps > 0 || recommendation.rawUploadMbps > 0;
  return (
    <div className={cn("rounded-xl border px-3 py-3 motion-safe:transition-colors motion-safe:duration-200", TONE_CLASS[tone])}>
      <p className="text-sm font-semibold text-[#0F172A]">{recommendation.summary}</p>
      <p className="mt-1.5 text-sm text-[#334155]">
        Estimated load is {formatEstimateMbps(recommendation.rawDownloadMbps)} Mbps down and{" "}
        {formatEstimateMbps(recommendation.rawUploadMbps)} Mbps up.
      </p>
      {hasLoad && (
        <p className="mt-1 text-sm text-[#334155]">
          With {headroom}% headroom, the planning target is {formatEstimateMbps(recommendation.headroomDownloadMbps)} Mbps down
          and {formatEstimateMbps(recommendation.headroomUploadMbps)} Mbps up. Rounded up to a common plan size, that is about{" "}
          {formatEstimateMbps(recommendation.tierDownloadMbps)} Mbps down and {formatEstimateMbps(recommendation.tierUploadMbps)}{" "}
          Mbps up.
        </p>
      )}
      <p className="mt-1.5 text-xs text-[#64748B]">
        Planning estimate only. It is not a live modem measurement and it does not guarantee real-world speed.
      </p>
    </div>
  );
}

export function InternetPlanInputs({
  downloadInput,
  uploadInput,
  downloadPlan,
  uploadPlan,
  totalDownloadMbps,
  totalUploadMbps,
  recommendation,
  measured,
  planOrigin,
  onDownloadInput,
  onUploadInput,
  onUseMeasured,
}: {
  downloadInput: string;
  uploadInput: string;
  downloadPlan: PlanParse;
  uploadPlan: PlanParse;
  totalDownloadMbps: number;
  totalUploadMbps: number;
  recommendation: BandwidthRecommendation;
  measured: MeasuredSpeed | null;
  planOrigin: "default" | "saved" | "measured" | "edited";
  onDownloadInput: (value: string) => void;
  onUploadInput: (value: string) => void;
  onUseMeasured: () => void;
}) {
  return (
    <section className="rounded-2xl border border-[#E2E8F0] bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-4" aria-labelledby="plan-heading">
      <h2 id="plan-heading" className="font-heading text-base font-semibold text-[#0F172A]">
        Your Internet Plan
      </h2>
      {planOrigin === "saved" && (
        <p className="mt-1 text-xs text-[#64748B]">Started from the plan saved in this browser.</p>
      )}
      {planOrigin === "measured" && (
        <p className="mt-1 text-xs text-[#64748B]">
          Filled from your latest speed test. This is a measurement, not your subscribed plan.
        </p>
      )}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <PlanField
          id="plan-download"
          label="Download Mbps"
          value={downloadInput}
          error={downloadPlan.error}
          onChange={onDownloadInput}
        />
        <PlanField
          id="plan-upload"
          label="Upload Mbps"
          value={uploadInput}
          error={uploadPlan.error}
          onChange={onUploadInput}
        />
      </div>
      {measured && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-[#00866A] bg-white px-3 py-1.5 text-xs font-semibold text-[#00866A] motion-safe:transition-colors motion-safe:duration-200 hover:bg-[#F0FDF4]"
            onClick={onUseMeasured}
          >
            Use my latest speed test
          </button>
          <p className="text-xs text-[#64748B]">
            Latest saved result: {formatEstimateMbps(measured.downloadMbps)} Mbps down and{" "}
            {formatEstimateMbps(measured.uploadMbps)} Mbps up. This fills the fields only when you choose it.
          </p>
        </div>
      )}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <UtilizationBar label="Download" requiredMbps={totalDownloadMbps} planMbps={downloadPlan.value} />
        <UtilizationBar label="Upload" requiredMbps={totalUploadMbps} planMbps={uploadPlan.value} />
      </div>
      <div className="mt-4">
        <PlanRecommendation recommendation={recommendation} />
      </div>
    </section>
  );
}

function PlanField({
  id,
  label,
  value,
  error,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error: string | null;
  onChange: (value: string) => void;
}) {
  const errorId = `${id}-error`;
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="text-sm font-medium text-[#0F172A]">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "mt-1 w-full min-w-0 rounded-xl border bg-white px-3 py-2 text-sm text-[#0F172A] outline-none motion-safe:transition-colors motion-safe:duration-200",
          error ? "border-[#EF4444]" : "border-[#E2E8F0] focus:border-[#00866A]",
        )}
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-[#B91C1C]">
          {error}
        </p>
      )}
    </div>
  );
}
