"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Check, Copy, RotateCcw } from "lucide-react";
import { CalculatorInput, calculatorControlClass } from "@/components/ui/calculator-input";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { MetricCard } from "@/components/ui/metric-card";
import { PresetSelector } from "@/components/ui/preset-selector";
import { ResultPanel } from "@/components/ui/result-panel";
import { selectControlClass } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { readHistory } from "@/lib/speedtest/history-store";
import { cn } from "@/lib/utils";
import {
  UPLOAD_CALCULATOR_STORAGE_KEY,
  UPLOAD_PRESETS,
  UPLOAD_RATE_UNITS,
  UPLOAD_SIZE_UNITS,
  applyPreset,
  barWidthPercent,
  evaluateUploadFields,
  fieldsFromInputs,
  formatEfficiencyPercent,
  formatInputNumber,
  formatMbpsValue,
  formatUploadDuration,
  latestMeasuredUploadMbps,
  matchingPreset,
  mbpsToRate,
  parsePositiveDecimal,
  parseStoredUploadInputs,
  parseUploadSearchParams,
  rateToMbps,
  resetUploadInputs,
  serializeUploadQuery,
  uploadContextLine,
  uploadEstimateText,
  uploadSpeedComparisons,
  type UploadFields,
  type UploadPresetId,
  type UploadRateUnit,
  type UploadSizeUnit,
} from "@/lib/calculators/upload-time";

const cardClass =
  "min-w-0 rounded-[20px] border border-[#E2E8E5] bg-white p-4 text-[#10231F] shadow-[0_1px_2px_rgba(16,35,31,0.04)] sm:p-5 [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-card [[data-theme=dark]_&]:text-foreground";
const mutedClass = "text-[#64748B] [[data-theme=dark]_&]:text-muted-foreground";

const INITIAL_FIELDS: UploadFields = fieldsFromInputs(resetUploadInputs());
const TABS = [
  { id: "calculator", label: "Calculator" },
  { id: "examples", label: "Examples" },
  { id: "learn", label: "Learn" },
] as const;

type UploadTab = (typeof TABS)[number]["id"];

const EFFICIENCY_HELP =
  "Transfer efficiency is an allowance you set, from 50% to 100%. Estimated time is the ideal time divided by that fraction. It is not a measured overhead, and it does not use download speed.";

export function UploadTimeTabs({
  calculator,
  examples,
  learn,
}: {
  calculator: ReactNode;
  examples: ReactNode;
  learn: ReactNode;
}) {
  const [tab, setTab] = useState<UploadTab>("calculator");
  const panels = { calculator, examples, learn };

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? (index + 1) % TABS.length
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? (index - 1 + TABS.length) % TABS.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? TABS.length - 1
              : null;
    if (next == null) return;
    event.preventDefault();
    const id = TABS[next].id;
    setTab(id);
    document.getElementById(`upload-tab-${id}`)?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label="Upload time calculator sections" className="mb-4 flex flex-wrap gap-2">
        {TABS.map((item, index) => {
          const selected = tab === item.id;
          return (
            <button
              key={item.id}
              id={`upload-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`upload-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              className={cn(
                "inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006B53]",
                selected
                  ? "bg-[#006B53] text-white"
                  : "text-[#64748B] hover:bg-[#EAF8F1] hover:text-[#10231F] [[data-theme=dark]_&]:text-muted-foreground [[data-theme=dark]_&]:hover:bg-card [[data-theme=dark]_&]:hover:text-foreground",
              )}
              onClick={() => setTab(item.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {TABS.map((item) => (
        <div
          key={item.id}
          id={`upload-panel-${item.id}`}
          role="tabpanel"
          aria-labelledby={`upload-tab-${item.id}`}
          hidden={tab !== item.id}
        >
          {panels[item.id]}
        </div>
      ))}
    </div>
  );
}

export function UploadTimeCalculator() {
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? "/upload-time-calculator";
  const query = searchParams.toString();
  const [fields, setFields] = useState<UploadFields>(INITIAL_FIELDS);
  const [rateUnit, setRateUnit] = useState<UploadRateUnit>("Mbps");
  const [rateText, setRateText] = useState(INITIAL_FIELDS.speed);
  const [ready, setReady] = useState(false);
  const [measuredUpload, setMeasuredUpload] = useState<number | null>(null);
  const [copied, setCopied] = useState<"copied" | "failed" | null>(null);
  const loadedRef = useRef(false);
  const resultRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    const parsed = parseUploadSearchParams(new URLSearchParams(query));
    let next = INITIAL_FIELDS;
    if (parsed.status === "ok" && parsed.inputs) {
      next = fieldsFromInputs(parsed.inputs);
    } else {
      try {
        const raw = localStorage.getItem(UPLOAD_CALCULATOR_STORAGE_KEY);
        const stored = raw ? parseStoredUploadInputs(raw) : null;
        if (stored) next = fieldsFromInputs(stored);
      } catch {
        /* Keep the default inputs when storage is unavailable. */
      }
    }
    setFields(next);
    setRateUnit("Mbps");
    setRateText(next.speed);
    try {
      setMeasuredUpload(latestMeasuredUploadMbps(readHistory()));
    } catch {
      setMeasuredUpload(null);
    }
    setReady(true);
  }, [query]);

  useEffect(() => {
    if (!ready) return;
    const evaluation = evaluateUploadFields(fields);
    if (!evaluation.inputs) return;
    try {
      localStorage.setItem(
        UPLOAD_CALCULATOR_STORAGE_KEY,
        JSON.stringify({
          size: evaluation.inputs.size,
          unit: evaluation.inputs.unit,
          speed: evaluation.inputs.speedMbps,
          efficiency: evaluation.inputs.efficiencyPercent,
        }),
      );
    } catch {
      /* Persistence is optional. */
    }
    const nextQuery = serializeUploadQuery(evaluation.inputs);
    const nextUrl = `${pathname}?${nextQuery}`;
    if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [fields, pathname, ready]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(null), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const evaluation = evaluateUploadFields(fields);
  const preset = evaluation.inputs ? matchingPreset(evaluation.inputs.size, evaluation.inputs.unit) : "custom";
  const comparisons = evaluation.inputs ? uploadSpeedComparisons(evaluation.inputs) : [];
  const longest = Math.max(0, ...comparisons.map((row) => row.seconds ?? 0));
  const efficiencyNumber = Number(fields.efficiency);
  const efficiencyLabel = Number.isFinite(efficiencyNumber) ? formatEfficiencyPercent(efficiencyNumber) : "—";

  function choosePreset(id: UploadPresetId) {
    if (id === "custom") return;
    const next = applyPreset(id);
    setFields((current) => ({ ...current, size: String(next.size), unit: next.unit }));
  }

  function reset() {
    setFields(INITIAL_FIELDS);
    setRateUnit("Mbps");
    setRateText(INITIAL_FIELDS.speed);
    setCopied(null);
  }

  function focusResult() {
    const node = resultRef.current;
    if (!node) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
    node.focus({ preventScroll: true });
  }

  function changeRate(text: string) {
    setRateText(text);
    if (text.trim() === "") {
      setFields((current) => ({ ...current, speed: "" }));
      return;
    }
    const parsed = parsePositiveDecimal(text);
    if (parsed == null) {
      setFields((current) => ({ ...current, speed: text }));
      return;
    }
    setFields((current) => ({ ...current, speed: formatInputNumber(rateToMbps(parsed, rateUnit)) }));
  }

  function changeRateUnit(next: UploadRateUnit) {
    const parsed = parsePositiveDecimal(rateText);
    const mbps = parsed == null ? Number(fields.speed) : rateToMbps(parsed, rateUnit);
    setRateUnit(next);
    if (Number.isFinite(mbps) && mbps > 0) {
      setRateText(formatInputNumber(mbpsToRate(mbps, next)));
      setFields((current) => ({ ...current, speed: formatInputNumber(mbps) }));
    }
  }

  function useMeasuredUpload() {
    if (measuredUpload == null) return;
    const text = formatInputNumber(measuredUpload);
    setRateUnit("Mbps");
    setRateText(text);
    setFields((current) => ({ ...current, speed: text }));
  }

  async function copyEstimate() {
    if (!evaluation.inputs || !evaluation.estimate) return;
    const pageUrl = `${window.location.origin}${pathname}?${serializeUploadQuery(evaluation.inputs)}`;
    const text = uploadEstimateText(evaluation.inputs, evaluation.estimate, pageUrl);
    try {
      await navigator.clipboard.writeText(text);
      setCopied("copied");
    } catch {
      setCopied("failed");
    }
  }

  return (
    <form
      className="grid items-start gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]"
      onSubmit={(event) => {
        event.preventDefault();
        focusResult();
      }}
    >
      <section className={cardClass} aria-labelledby="upload-settings-heading">
        <h2 id="upload-settings-heading" className="text-base font-semibold">
          Upload Settings
        </h2>
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_7.25rem] gap-2">
          <CalculatorInput id="upload-file-size" label="File size" error={evaluation.errors.size}>
            <input
              id="upload-file-size"
              className={cn(calculatorControlClass, evaluation.errors.size && "border-destructive")}
              value={fields.size}
              onChange={(event) => setFields((current) => ({ ...current, size: event.target.value }))}
              inputMode="decimal"
              autoComplete="off"
              aria-invalid={evaluation.errors.size ? true : undefined}
              aria-describedby={evaluation.errors.size ? "upload-file-size-error" : undefined}
            />
          </CalculatorInput>
          <div className="min-w-0">
            <label htmlFor="upload-file-unit" className="text-sm font-medium text-[#10231F] [[data-theme=dark]_&]:text-foreground">
              Unit
            </label>
            <select
              id="upload-file-unit"
              className={selectControlClass}
              value={fields.unit}
              onChange={(event) =>
                setFields((current) => ({ ...current, unit: event.target.value as UploadSizeUnit }))
              }
            >
              {UPLOAD_SIZE_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
            {evaluation.errors.unit && (
              <p className="mt-1 text-sm text-destructive" role="alert">
                {evaluation.errors.unit}
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_7.25rem] gap-2">
          <CalculatorInput
            id="upload-speed"
            label="Upload speed"
            error={evaluation.errors.speed}
            hint="Saved and shared as Mbps. Kbps and Gbps are converted before the estimate."
          >
            <input
              id="upload-speed"
              className={cn(calculatorControlClass, evaluation.errors.speed && "border-destructive")}
              value={rateText}
              onChange={(event) => changeRate(event.target.value)}
              inputMode="decimal"
              autoComplete="off"
              aria-invalid={evaluation.errors.speed ? true : undefined}
              aria-describedby={evaluation.errors.speed ? "upload-speed-error" : undefined}
            />
          </CalculatorInput>
          <div className="min-w-0">
            <label htmlFor="upload-speed-unit" className="text-sm font-medium text-[#10231F] [[data-theme=dark]_&]:text-foreground">
              Speed unit
            </label>
            <select
              id="upload-speed-unit"
              className={selectControlClass}
              value={rateUnit}
              onChange={(event) => changeRateUnit(event.target.value as UploadRateUnit)}
            >
              {UPLOAD_RATE_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
        </div>
        {measuredUpload != null && (
          <div className="mt-2">
            <button
              type="button"
              className="text-sm font-medium text-[#006B53] underline-offset-2 hover:underline [[data-theme=dark]_&]:text-[var(--accent-text)]"
              onClick={useMeasuredUpload}
            >
              Use my latest speed test ({formatMbpsValue(measuredUpload)} Mbps)
            </button>
            <p className={cn("mt-1 text-xs", mutedClass)}>
              Fills the upload speed from the newest saved upload measurement on this device. It does not change a subscribed plan.
            </p>
          </div>
        )}

        <div className="mt-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <label className="text-sm font-medium" htmlFor="upload-efficiency">
                Transfer efficiency
              </label>
              <HelpTooltip label="About transfer efficiency" text={EFFICIENCY_HELP} />
            </div>
            <div className="flex items-center gap-1">
              <label className="sr-only" htmlFor="upload-efficiency-number">
                Transfer efficiency percent
              </label>
              <input
                id="upload-efficiency-number"
                className={cn(
                  calculatorControlClass,
                  "mt-0 h-9 w-16 px-2 text-right tabular-nums",
                  evaluation.errors.efficiency && "border-destructive",
                )}
                value={fields.efficiency}
                onChange={(event) => setFields((current) => ({ ...current, efficiency: event.target.value }))}
                inputMode="decimal"
                aria-invalid={evaluation.errors.efficiency ? true : undefined}
                aria-describedby={evaluation.errors.efficiency ? "upload-efficiency-error" : undefined}
              />
              <span className={cn("text-sm font-semibold tabular-nums", mutedClass)} aria-hidden>
                %
              </span>
            </div>
          </div>
          <input
            id="upload-efficiency"
            className="mt-2 h-2 w-full cursor-pointer accent-[#006B53]"
            type="range"
            min={50}
            max={100}
            step={1}
            value={Math.round(clampEfficiency(fields.efficiency))}
            aria-valuemin={50}
            aria-valuemax={100}
            aria-valuenow={Math.round(clampEfficiency(fields.efficiency))}
            aria-valuetext={efficiencyLabel}
            aria-describedby={evaluation.errors.efficiency ? "upload-efficiency-error" : undefined}
            onChange={(event) => setFields((current) => ({ ...current, efficiency: event.target.value }))}
          />
          <div className={cn("mt-1 flex justify-between text-[11px]", mutedClass)}>
            <span>50%</span>
            <span>100%</span>
          </div>
          {evaluation.errors.efficiency && (
            <p id="upload-efficiency-error" className="mt-1 text-sm text-destructive" role="alert">
              {evaluation.errors.efficiency}
            </p>
          )}
        </div>

        <div className="mt-4">
          <PresetSelector
            labelId="upload-presets-label"
            label="Quick presets"
            hint="Example sizes you can edit. They do not change the upload speed."
            value={preset}
            options={[
              ...UPLOAD_PRESETS.map((item) => ({ id: item.id, label: item.label, detail: item.detail })),
              { id: "custom" as const, label: "Custom" },
            ]}
            onSelect={choosePreset}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={reset}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            Reset
          </Button>
          <Button type="submit">Calculate upload time</Button>
        </div>
      </section>

      <ResultPanel ref={resultRef} title="Estimated upload time" titleId="upload-estimate-heading">
        {evaluation.estimate && evaluation.inputs ? (
          <div className="mt-3">
            <p className="font-heading text-4xl font-semibold tabular-nums tracking-tight text-[#006B53] sm:text-5xl [[data-theme=dark]_&]:text-[var(--accent-text)]">
              {formatUploadDuration(evaluation.estimate.realisticSeconds)}
            </p>
            <p className={cn("mt-2 text-sm", mutedClass)}>{uploadContextLine(evaluation.inputs)}</p>
            <p className={cn("mt-1 text-xs", mutedClass)}>Estimate, not a live upload.</p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <MetricCard label="Ideal transfer" value={formatUploadDuration(evaluation.estimate.idealSeconds)} />
              <MetricCard
                label="Effective upload speed"
                value={`${formatMbpsValue(evaluation.estimate.effectiveMbps)} Mbps`}
              />
            </div>

            {evaluation.estimate.warnings.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-[#92400E] [[data-theme=dark]_&]:text-[var(--warning)]" role="status">
                {evaluation.estimate.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            )}

            <h3 className="mt-4 text-sm font-semibold">Speed comparison</h3>
            <p className={cn("mt-1 text-xs", mutedClass)}>
              Estimated times for this file and efficiency, using the same calculation.
            </p>
            <ul className="mt-2 space-y-1.5">
              {comparisons.map((row) => (
                <li
                  key={row.speedMbps}
                  className={cn(
                    "grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-2 rounded-xl px-2 py-1.5 text-xs",
                    row.highlighted && "bg-white [[data-theme=dark]_&]:bg-card",
                  )}
                  aria-current={row.highlighted ? "true" : undefined}
                >
                  <span className="font-medium">
                    {row.label}
                    {row.highlighted ? <span className="mt-0.5 block text-[11px] font-medium text-[#006B53] [[data-theme=dark]_&]:text-[var(--accent-text)]">Yours</span> : null}
                  </span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-[#E2E8E5] [[data-theme=dark]_&]:bg-[var(--donut-track)]" aria-hidden>
                    <span
                      className={cn(
                        "block h-full rounded-full motion-safe:transition-[width] motion-safe:duration-200 motion-safe:ease-out",
                        row.highlighted ? "bg-[#006B53] [[data-theme=dark]_&]:bg-[var(--primary)]" : "bg-[#009B78]",
                      )}
                      style={{ width: `${barWidthPercent(row.seconds ?? 0, longest)}%` }}
                    />
                  </span>
                  <span className="text-right tabular-nums">
                    {row.seconds == null ? "—" : formatUploadDuration(row.seconds)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button type="button" onClick={() => void copyEstimate()}>
                {copied === "copied" ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                {copied === "copied" ? "Copied" : "Copy estimate"}
              </Button>
              {copied === "failed" && (
                <p className="text-sm text-destructive" role="alert">
                  Could not copy the estimate.
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className={cn("mt-3 text-sm", mutedClass)}>Enter a file size and upload speed to see an estimate.</p>
        )}
      </ResultPanel>
    </form>
  );
}

function clampEfficiency(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 90;
  return Math.min(100, Math.max(50, parsed));
}
