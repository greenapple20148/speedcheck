"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Check, Copy, Info, RotateCcw } from "lucide-react";
import { readHistory } from "@/lib/speedtest/history-store";
import { cn } from "@/lib/utils";
import {
  UPLOAD_CALCULATOR_STORAGE_KEY,
  UPLOAD_PRESETS,
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
  parseStoredUploadInputs,
  parseUploadSearchParams,
  resetUploadInputs,
  serializeUploadQuery,
  uploadContextLine,
  uploadEstimateText,
  uploadSpeedComparisons,
  type UploadFields,
  type UploadPresetId,
  type UploadSizeUnit,
} from "@/lib/calculators/upload-time";

const cardClass =
  "min-w-0 rounded-2xl border border-[#E2E8F0] bg-white p-4 text-[#0F172A] shadow-soft [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-card [[data-theme=dark]_&]:text-foreground";
const mutedClass = "text-[#64748B] [[data-theme=dark]_&]:text-muted-foreground";
const fieldClass =
  "h-10 w-full min-w-0 rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-[var(--input-bg)] [[data-theme=dark]_&]:text-foreground";

const INITIAL_FIELDS: UploadFields = fieldsFromInputs(resetUploadInputs());

export function UploadInfoTip() {
  return (
    <Hint
      align="end"
      label="About this estimate"
      text="This estimates upload time from the file size and upload rate you enter. It does not upload the file or test your connection."
    />
  );
}

export function UploadTimeCalculator() {
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? "/upload-time-calculator";
  const query = searchParams.toString();
  const [fields, setFields] = useState<UploadFields>(INITIAL_FIELDS);
  const [ready, setReady] = useState(false);
  const [measuredUpload, setMeasuredUpload] = useState<number | null>(null);
  const [copied, setCopied] = useState<"copied" | "failed" | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    const parsed = parseUploadSearchParams(new URLSearchParams(query));
    if (parsed.status === "ok" && parsed.inputs) {
      setFields(fieldsFromInputs(parsed.inputs));
    } else {
      try {
        const raw = localStorage.getItem(UPLOAD_CALCULATOR_STORAGE_KEY);
        const stored = raw ? parseStoredUploadInputs(raw) : null;
        if (stored) setFields(fieldsFromInputs(stored));
      } catch {
        /* Keep the default inputs when storage is unavailable. */
      }
    }
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

  function choosePreset(id: Exclude<UploadPresetId, "custom">) {
    const next = applyPreset(id);
    setFields((current) => ({ ...current, size: String(next.size), unit: next.unit }));
  }

  function reset() {
    setFields(INITIAL_FIELDS);
    setCopied(null);
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

  const sizeErrorId = "upload-size-error";
  const speedErrorId = "upload-speed-error";
  const efficiencyErrorId = "upload-efficiency-error";
  const idealShare =
    evaluation.estimate && evaluation.estimate.realisticSeconds > 0
      ? Math.min(100, (evaluation.estimate.idealSeconds / evaluation.estimate.realisticSeconds) * 100)
      : 0;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)]">
      <section className={cardClass} aria-labelledby="upload-settings-heading">
        <h2 id="upload-settings-heading" className="text-base font-semibold">
          Upload Settings
        </h2>
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_5.75rem] gap-2">
          <label className="block text-sm font-medium" htmlFor="upload-file-size">
            File size
            <input
              id="upload-file-size"
              className={cn(fieldClass, "mt-1", evaluation.errors.size && "border-destructive")}
              value={fields.size}
              onChange={(event) => setFields((current) => ({ ...current, size: event.target.value }))}
              inputMode="decimal"
              autoComplete="off"
              aria-invalid={evaluation.errors.size ? true : undefined}
              aria-describedby={evaluation.errors.size ? sizeErrorId : undefined}
            />
          </label>
          <label className="block text-sm font-medium" htmlFor="upload-file-unit">
            Unit
            <select
              id="upload-file-unit"
              className={cn(fieldClass, "mt-1")}
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
          </label>
        </div>
        {evaluation.errors.size && (
          <p id={sizeErrorId} className="mt-1 text-sm text-destructive" role="alert">
            {evaluation.errors.size}
          </p>
        )}
        {evaluation.errors.unit && (
          <p className="mt-1 text-sm text-destructive" role="alert">
            {evaluation.errors.unit}
          </p>
        )}

        <label className="mt-3 block text-sm font-medium" htmlFor="upload-speed">
          Upload speed (Mbps)
          <input
            id="upload-speed"
            className={cn(fieldClass, "mt-1", evaluation.errors.speed && "border-destructive")}
            value={fields.speed}
            onChange={(event) => setFields((current) => ({ ...current, speed: event.target.value }))}
            inputMode="decimal"
            autoComplete="off"
            aria-invalid={evaluation.errors.speed ? true : undefined}
            aria-describedby={evaluation.errors.speed ? speedErrorId : undefined}
          />
        </label>
        {evaluation.errors.speed && (
          <p id={speedErrorId} className="mt-1 text-sm text-destructive" role="alert">
            {evaluation.errors.speed}
          </p>
        )}
        {measuredUpload != null && (
          <div className="mt-2">
            <button
              type="button"
              className="text-sm font-medium text-[#0c6b62] underline-offset-2 hover:underline [[data-theme=dark]_&]:text-[var(--accent-text)]"
              onClick={() =>
                setFields((current) => ({ ...current, speed: formatInputNumber(measuredUpload) }))
              }
            >
              Use my latest speed test ({formatMbpsValue(measuredUpload)} Mbps)
            </button>
            <p className={cn("mt-1 text-xs", mutedClass)}>
              Fills the upload speed from the newest saved upload measurement on this device.
            </p>
          </div>
        )}

        <div className="mt-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <label className="text-sm font-medium" htmlFor="upload-efficiency">
                Transfer Efficiency
              </label>
              <Hint
                label="About transfer efficiency"
                text="This accounts for protocol overhead and network conditions."
              />
            </div>
            <output className="text-sm font-semibold tabular-nums" htmlFor="upload-efficiency">
              {efficiencyLabel}
            </output>
          </div>
          <input
            id="upload-efficiency"
            className="mt-2 h-2 w-full cursor-pointer accent-[#00866A]"
            type="range"
            min={50}
            max={100}
            step={1}
            value={clampEfficiency(fields.efficiency)}
            aria-valuemin={50}
            aria-valuemax={100}
            aria-valuenow={clampEfficiency(fields.efficiency)}
            aria-valuetext={efficiencyLabel}
            aria-describedby={evaluation.errors.efficiency ? efficiencyErrorId : undefined}
            onChange={(event) => setFields((current) => ({ ...current, efficiency: event.target.value }))}
          />
          <div className={cn("mt-1 flex justify-between text-[11px]", mutedClass)}>
            <span>50%</span>
            <span>100%</span>
          </div>
          {evaluation.errors.efficiency && (
            <p id={efficiencyErrorId} className="mt-1 text-sm text-destructive" role="alert">
              {evaluation.errors.efficiency}
            </p>
          )}
        </div>

        <div className="mt-3">
          <p className="text-sm font-medium" id="upload-presets-label">
            Quick presets
          </p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="upload-presets-label">
            {UPLOAD_PRESETS.map((item) => {
              const active = preset === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={presetClass(active)}
                  aria-pressed={active}
                  onClick={() => choosePreset(item.id)}
                >
                  {item.label} {item.detail}
                </button>
              );
            })}
            <button type="button" className={presetClass(preset === "custom")} aria-pressed={preset === "custom"}>
              Custom
            </button>
          </div>
          <p className={cn("mt-2 text-xs", mutedClass)}>Example sizes you can edit.</p>
        </div>

        <button
          type="button"
          className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl border border-[#E2E8F0] px-3 text-sm font-medium hover:bg-[#F8FAFC] [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:hover:bg-[var(--bg-surface-hover)]"
          onClick={reset}
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Reset
        </button>
      </section>

      <section className={cardClass} aria-labelledby="upload-estimate-heading">
        <h2 id="upload-estimate-heading" className="text-base font-semibold">
          Upload Estimate
        </h2>
        {evaluation.estimate && evaluation.inputs ? (
          <div className="mt-3">
            <p className={cn("text-xs font-medium uppercase tracking-wide", mutedClass)}>Estimated upload time</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-[#00866A] sm:text-4xl [[data-theme=dark]_&]:text-[var(--accent-text)]">
              {formatUploadDuration(evaluation.estimate.realisticSeconds)}
            </p>
            <p className={cn("mt-1 text-sm", mutedClass)}>{uploadContextLine(evaluation.inputs)}</p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="min-w-0 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-[var(--bg-tertiary)]">
                <p className={cn("text-xs", mutedClass)}>Ideal transfer</p>
                <p className="mt-1 text-sm font-semibold tabular-nums">
                  {formatUploadDuration(evaluation.estimate.idealSeconds)}
                </p>
              </div>
              <div className="min-w-0 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-[var(--bg-tertiary)]">
                <p className={cn("text-xs", mutedClass)}>Effective upload speed</p>
                <p className="mt-1 text-sm font-semibold tabular-nums">
                  {formatMbpsValue(evaluation.estimate.effectiveMbps)} Mbps
                </p>
              </div>
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
              Estimated times for this file and efficiency. Estimate, not a live upload.
            </p>
            <table className="mt-2 w-full table-fixed text-sm">
              <caption className="sr-only">Estimated upload time at comparison speeds</caption>
              <thead className="sr-only">
                <tr>
                  <th scope="col">Speed</th>
                  <th scope="col">Relative time</th>
                  <th scope="col">Estimated time</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((row) => (
                  <tr
                    key={row.speedMbps}
                    className={cn(row.highlighted && "bg-[#F0FDFA] [[data-theme=dark]_&]:bg-[var(--bg-tertiary)]")}
                    aria-current={row.highlighted ? "true" : undefined}
                  >
                    <th scope="row" className="w-[34%] px-1 py-1 text-left text-xs font-medium">
                      <span className="block">{row.label}</span>
                      {row.highlighted && <span className="block text-[11px] font-medium text-[#0c6b62] [[data-theme=dark]_&]:text-[var(--accent-text)]">Your speed</span>}
                    </th>
                    <td className="px-1 py-1">
                      <div className="h-1.5 overflow-hidden rounded-full bg-[#E2E8F0] [[data-theme=dark]_&]:bg-[var(--donut-track)]" aria-hidden>
                        <div
                          className={cn(
                            "h-full rounded-full motion-safe:transition-[width] motion-safe:duration-200 motion-safe:ease-out",
                            row.highlighted ? "bg-[#00866A] [[data-theme=dark]_&]:bg-[var(--primary)]" : "bg-[#14B8A6]",
                          )}
                          style={{ width: `${barWidthPercent(row.seconds ?? 0, longest)}%` }}
                        />
                      </div>
                    </td>
                    <td className="w-[38%] px-1 py-1 text-right text-xs tabular-nums">
                      {row.seconds == null ? "—" : formatUploadDuration(row.seconds)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 className="mt-4 text-sm font-semibold">Ideal and estimated time</h3>
            <p className={cn("mt-1 text-xs", mutedClass)}>
              Ideal time is the upper bar. Estimated time is the lower bar and includes transfer efficiency.
            </p>
            <div className="mt-2 space-y-2">
              <div>
                <div className="flex items-baseline justify-between gap-3 text-xs">
                  <span>Ideal transfer</span>
                  <span className="tabular-nums">{formatUploadDuration(evaluation.estimate.idealSeconds)}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#E2E8F0] [[data-theme=dark]_&]:bg-[var(--donut-track)]" aria-hidden>
                  <div
                    className="h-full rounded-full bg-[#14B8A6] motion-safe:transition-[width] motion-safe:duration-200 motion-safe:ease-out"
                    style={{ width: `${idealShare}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-baseline justify-between gap-3 text-xs">
                  <span>Estimated time</span>
                  <span className="tabular-nums">{formatUploadDuration(evaluation.estimate.realisticSeconds)}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#E2E8F0] [[data-theme=dark]_&]:bg-[var(--donut-track)]" aria-hidden>
                  <div className="h-full w-full rounded-full bg-[#00866A] [[data-theme=dark]_&]:bg-[var(--primary)]" />
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#00866A] px-4 text-sm font-semibold text-white hover:bg-[#007A5E] disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => void copyEstimate()}
              >
                {copied === "copied" ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                {copied === "copied" ? "Copied" : "Copy estimate"}
              </button>
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
      </section>
    </div>
  );
}

function presetClass(active: boolean) {
  return cn(
    "max-w-full rounded-full border px-3 py-1.5 text-left text-xs font-semibold",
    active
      ? "border-[#007A5E] bg-[#007A5E] text-white"
      : "border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#14B8A6] [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-card [[data-theme=dark]_&]:text-foreground",
  );
}

function clampEfficiency(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 90;
  return Math.min(100, Math.max(50, parsed));
}

function Hint({ label, text, align = "start" }: { label: string; text: string; align?: "start" | "end" }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#64748B] hover:text-[#0F172A] [[data-theme=dark]_&]:text-muted-foreground"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={id}
        onClick={() => setOpen((current) => !current)}
      >
        <Info className="h-3.5 w-3.5" aria-hidden />
      </button>
      <span id={id} role="tooltip" className={open ? cn(hintClass, align === "end" ? "right-0" : "left-0") : "sr-only"}>
        {text}
      </span>
    </span>
  );
}

const hintClass =
  "absolute top-full z-20 mt-1 w-56 max-w-[min(14rem,calc(100vw-2rem))] rounded-xl border border-[#E2E8F0] bg-white p-2 text-left text-xs font-normal leading-5 text-[#0F172A] shadow-card [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-card [[data-theme=dark]_&]:text-foreground";
