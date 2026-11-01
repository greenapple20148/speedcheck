"use client";

import { cloneElement, isValidElement, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactElement, type ReactNode } from "react";
import Link from "next/link";
import { BookOpen, Calculator, Info, Layers, RotateCcw } from "lucide-react";
import { trackEvent } from "@/lib/analytics/events";
import {
  DOWNLOAD_PRESETS,
  DOWNLOAD_SCENARIOS,
  DOWNLOAD_SIZE_UNITS,
  DOWNLOAD_SPEED_UNITS,
  computeDownloadEstimate,
  defaultDownloadInputs,
  evaluateDownloadFields,
  fieldsFromInputs,
  formatDownloadDuration,
  formatRateMbps,
  presetEstimate,
  type DownloadFields,
  type DownloadPreset,
  type DownloadSizeUnit,
  type DownloadSpeedUnit,
} from "@/lib/calculators/download-time";
import { readPrefs } from "@/lib/speedtest/history-store";
import { cn } from "@/lib/utils";

type TabId = "calculator" | "examples" | "learn";

const TABS: Array<{ id: TabId; label: string; icon: typeof Calculator }> = [
  { id: "calculator", label: "Calculator", icon: Calculator },
  { id: "examples", label: "Examples", icon: Layers },
  { id: "learn", label: "Learn", icon: BookOpen },
];

const cardClass =
  "rounded-[20px] border border-[#E2E8E5] bg-white text-[#10231F] shadow-[0_1px_2px_rgba(16,35,31,0.04),0_14px_32px_rgba(16,35,31,0.05)] [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-card [[data-theme=dark]_&]:text-foreground";
const mutedClass = "text-[#64748B] [[data-theme=dark]_&]:text-muted-foreground";
const fieldClass =
  "h-11 w-full min-w-0 rounded-xl border border-[#E2E8E5] bg-white px-3 text-sm text-[#10231F] outline-none focus-visible:ring-2 focus-visible:ring-[#006B53] [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-[var(--input-bg)] [[data-theme=dark]_&]:text-foreground [[data-theme=dark]_&]:focus-visible:ring-ring";

export function DownloadTimeCalculator() {
  const [fields, setFields] = useState<DownloadFields>(() => fieldsFromInputs(defaultDownloadInputs()));
  const [tab, setTab] = useState<TabId>("calculator");
  const resultRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({});
  const ready = useRef(false);

  useEffect(() => {
    if (ready.current) return;
    ready.current = true;
    if (readPrefs().units === "binary") {
      setFields((current) => ({ ...current, unit: "GiB" }));
    }
  }, []);

  const evaluation = useMemo(() => evaluateDownloadFields(fields), [fields]);
  const estimate = evaluation.estimate;
  const typedEfficiency = Number(fields.efficiency);
  const exampleEfficiency = typedEfficiency >= 1 && typedEfficiency <= 100 ? typedEfficiency : null;

  function selectTab(next: TabId, focus = false) {
    setTab(next);
    if (focus) requestAnimationFrame(() => tabRefs.current[next]?.focus());
  }

  function onTabKey(event: KeyboardEvent) {
    const index = TABS.findIndex((item) => item.id === tab);
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    if (event.key === "Home") selectTab(TABS[0].id, true);
    else if (event.key === "End") selectTab(TABS[TABS.length - 1].id, true);
    else {
      const delta = event.key === "ArrowRight" ? 1 : -1;
      selectTab(TABS[(index + delta + TABS.length) % TABS.length].id, true);
    }
  }

  function applyPreset(preset: DownloadPreset) {
    setFields((current) => ({
      ...current,
      size: String(preset.size),
      unit: preset.unit,
      speed: String(preset.speed),
      speedUnit: preset.speedUnit,
    }));
    selectTab("calculator");
    requestAnimationFrame(() => resultRef.current?.focus());
  }

  return (
    <section className={cn(cardClass, "p-4 sm:p-5")} aria-label="Download time calculator">
      <div role="tablist" aria-label="Calculator sections" className="flex flex-wrap gap-2" onKeyDown={onTabKey}>
        {TABS.map((item) => {
          const selected = tab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              ref={(node) => {
                tabRefs.current[item.id] = node;
              }}
              id={`download-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`download-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              className={cn(
                "inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006B53]",
                selected
                  ? "bg-[#006B53] text-white [[data-theme=dark]_&]:bg-[var(--primary)] [[data-theme=dark]_&]:text-[var(--primary-foreground)]"
                  : "bg-[#F4F7F5] text-[#10231F] hover:bg-[#E7F3EE] [[data-theme=dark]_&]:bg-[var(--bg-tertiary)] [[data-theme=dark]_&]:text-foreground",
              )}
              onClick={() => selectTab(item.id)}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === "calculator" && (
        <div role="tabpanel" id="download-panel-calculator" aria-labelledby="download-tab-calculator" className="mt-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              trackEvent("calculator_used", { calculator: "download-time" });
              resultRef.current?.focus();
            }}
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Field label="File size" error={evaluation.errors.size} htmlFor="download-size">
                <input id="download-size" className={fieldClass} inputMode="decimal" value={fields.size} onChange={(event) => setFields((current) => ({ ...current, size: event.target.value }))} />
              </Field>
              <Field label="Unit" error={evaluation.errors.unit} htmlFor="download-unit">
                <select id="download-unit" className={fieldClass} value={fields.unit} onChange={(event) => setFields((current) => ({ ...current, unit: event.target.value as DownloadSizeUnit }))}>
                  {DOWNLOAD_SIZE_UNITS.map((unit) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </Field>
              <Field label="Download speed" error={evaluation.errors.speed ?? evaluation.errors.speedUnit} htmlFor="download-speed">
                <div className="flex gap-2">
                  <input id="download-speed" className={fieldClass} inputMode="decimal" value={fields.speed} onChange={(event) => setFields((current) => ({ ...current, speed: event.target.value }))} />
                  <select aria-label="Speed unit" className={cn(fieldClass, "w-[6.5rem] shrink-0")} value={fields.speedUnit} onChange={(event) => setFields((current) => ({ ...current, speedUnit: event.target.value as DownloadSpeedUnit }))}>
                    {DOWNLOAD_SPEED_UNITS.map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </Field>
              <EfficiencyControl
                value={fields.efficiency}
                error={evaluation.errors.efficiency}
                onChange={(efficiency) => setFields((current) => ({ ...current, efficiency }))}
              />
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#006B53] px-5 text-sm font-semibold text-white hover:bg-[#064E3B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006B53] focus-visible:ring-offset-2 [[data-theme=dark]_&]:bg-[var(--primary)] [[data-theme=dark]_&]:text-[var(--primary-foreground)]">
                <Calculator className="h-4 w-4" aria-hidden />
                Calculate Download Time
              </button>
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#E2E8E5] bg-white px-5 text-sm font-semibold text-[#10231F] hover:bg-[#F4F7F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006B53] [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-transparent [[data-theme=dark]_&]:text-foreground"
                onClick={() => setFields(fieldsFromInputs(defaultDownloadInputs()))}
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
                Reset
              </button>
            </div>
          </form>

          <div
            ref={resultRef}
            tabIndex={-1}
            aria-live="polite"
            className="mt-4 rounded-[18px] border border-[#D7EBE3] bg-[#F3FBF7] p-4 outline-none [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-[var(--bg-tertiary)]"
          >
            {estimate && evaluation.inputs ? (
              <ResultSummary inputs={evaluation.inputs} estimate={estimate} />
            ) : (
              <p className={cn("text-sm", mutedClass)}>Enter a file size and a download speed above zero to see an estimate.</p>
            )}
          </div>

          <details className="mt-3 rounded-2xl border border-[#E2E8E5] [[data-theme=dark]_&]:border-border">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-2">Formula & details</span>
            </summary>
            <div className={cn("space-y-2 px-4 pb-4 text-sm leading-6", mutedClass)}>
              <p>Time in seconds = file size in bits ÷ effective speed in bits per second.</p>
              <p>Effective speed = download speed × efficiency. At 90%, the estimate is the full-speed time divided by 0.90.</p>
              <p>KB, MB, GB, and TB count by 1,000. KiB, MiB, GiB, and TiB count by 1,024. Kbps, Mbps, and Gbps are decimal bits: 1 Mbps is 1,000,000 bits per second, and 1 Gbps is 1,000 Mbps.</p>
              <p>This is a planning estimate. It does not download the file or measure the connection.</p>
            </div>
          </details>

          <div className="mt-4">
            <h2 className="text-sm font-semibold">Common examples</h2>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {DOWNLOAD_PRESETS.map((preset) => (
                <li key={preset.id}>
                  <PresetButton preset={preset} efficiencyPercent={exampleEfficiency} onApply={applyPreset} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === "examples" && (
        <div role="tabpanel" id="download-panel-examples" aria-labelledby="download-tab-examples" className="mt-4">
          <p className={cn("text-sm leading-6", mutedClass)}>
            These scenarios use the same estimate as the calculator, at the efficiency currently entered. Applying one fills the calculator.
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {DOWNLOAD_SCENARIOS.map((preset) => (
              <li key={preset.id}>
                <PresetButton preset={preset} efficiencyPercent={exampleEfficiency} onApply={applyPreset} detailed />
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "learn" && (
        <div role="tabpanel" id="download-panel-learn" aria-labelledby="download-tab-learn" className="mt-4 space-y-4 text-sm leading-6">
          <section>
            <h2 className="text-base font-semibold">Mbps and MB/s are different units</h2>
            <p className={cn("mt-1", mutedClass)}>
              Mbps is megabits per second. MB/s is megabytes per second. A byte is 8 bits, so 100 Mbps is 12.5 MB/s when both use powers of 1,000. Internet plans are usually quoted in Mbps. The <Link className="font-medium text-[#006B53] underline-offset-2 hover:underline [[data-theme=dark]_&]:text-[var(--accent-text)]" href="/mbps-to-mbs">Mbps converter</Link> shows both decimal and binary rates.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold">Why a real download takes longer</h2>
            <p className={cn("mt-1", mutedClass)}>
              The full-speed time assumes every bit is file data and the rate never dips. Protocol overhead, Wi-Fi retries, other devices, a busy route, and a slow server all add time. Network efficiency is an allowance you choose for that gap. It is not a reading from your network.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold">What to check next</h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {[
                ["/speed-test", "Speed test"],
                ["/wifi-speed-test", "Wi-Fi speed test"],
                ["/upload-time-calculator", "Upload time"],
                ["/guides/why-is-my-internet-slow", "Why downloads slow down"],
                ["/guides/how-to-improve-wifi-speed", "Improve Wi-Fi"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="inline-flex min-h-10 items-center rounded-full border border-[#E2E8E5] px-3 text-sm font-medium text-[#006B53] hover:bg-[#F3FBF7] [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:text-[var(--accent-text)]">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </section>
  );
}

function ResultSummary({
  inputs,
  estimate,
}: {
  inputs: { efficiencyPercent: number };
  estimate: NonNullable<ReturnType<typeof computeDownloadEstimate>>;
}) {
  const long = estimate.estimatedSeconds >= 6 * 60 * 60;
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] lg:items-center">
      <div>
        <p className={cn("text-sm font-medium", mutedClass)}>Estimated download time</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-[#006B53] tabular-nums sm:text-4xl [[data-theme=dark]_&]:text-[var(--accent-text)]">
          {formatDownloadDuration(estimate.estimatedSeconds)}
        </p>
        <p className={cn("mt-1 text-sm", mutedClass)}>Includes {formatPercent(inputs.efficiencyPercent)} efficiency. This is an estimate, not a timed download.</p>
      </div>
      <Metric label="Theoretical time" value={formatDownloadDuration(estimate.theoreticalSeconds)} hint="At the full entered speed" />
      <Metric label="Effective speed" value={formatRateMbps(estimate.effectiveMbps)} hint="Download speed × efficiency" />
      {long && (
        <p className={cn("text-sm lg:col-span-3", mutedClass)}>
          This assumes the download rate stays constant until the file finishes.
        </p>
      )}
    </div>
  );
}

function formatPercent(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${text}%`;
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div>
      <p className={cn("text-sm font-medium", mutedClass)}>{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
      <p className={cn("text-xs", mutedClass)}>{hint}</p>
    </div>
  );
}

function PresetButton({
  preset,
  efficiencyPercent,
  onApply,
  detailed = false,
}: {
  preset: DownloadPreset;
  efficiencyPercent: number | null;
  onApply: (preset: DownloadPreset) => void;
  detailed?: boolean;
}) {
  const estimate = efficiencyPercent == null ? null : presetEstimate(preset, efficiencyPercent);
  return (
    <button
      type="button"
      className="flex h-full w-full min-w-0 flex-col items-start rounded-2xl border border-[#E2E8E5] bg-white px-3 py-2.5 text-left hover:border-[#006B53] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006B53] [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-transparent"
      onClick={() => onApply(preset)}
    >
      <span className="text-sm font-semibold">{preset.label}</span>
      {detailed && <span className={cn("mt-0.5 text-xs", mutedClass)}>{preset.detail}</span>}
      <span className="mt-1 text-sm font-medium tabular-nums text-[#006B53] [[data-theme=dark]_&]:text-[var(--accent-text)]">
        {estimate ? formatDownloadDuration(estimate.estimatedSeconds) : "—"}
      </span>
    </button>
  );
}

function EfficiencyControl({
  value,
  error,
  onChange,
}: {
  value: string;
  error: string | null;
  onChange: (value: string) => void;
}) {
  const parsed = Number(value);
  const slider = Number.isFinite(parsed) ? Math.min(100, Math.max(1, parsed)) : 90;
  const errorId = useId();
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1">
        <label htmlFor="download-efficiency" className="text-sm font-medium">Network efficiency</label>
        <Hint label="About network efficiency" text="Efficiency is an allowance for overhead. 90% divides the full-speed time by 0.90. It is not a measured loss from your connection." />
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          id="download-efficiency-slider"
          className="h-11 min-w-0 flex-1 accent-[#006B53]"
          type="range"
          min={1}
          max={100}
          step={1}
          value={slider}
          aria-label="Network efficiency percent"
          aria-valuemin={1}
          aria-valuemax={100}
          aria-valuenow={Math.round(slider)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
        <div className="relative w-[4.75rem] shrink-0">
          <input
            id="download-efficiency"
            className={cn(fieldClass, "pr-7 text-right")}
            inputMode="decimal"
            value={value}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => onChange(event.target.value)}
          />
          <span className={cn("pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs", mutedClass)}>%</span>
        </div>
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-xs text-destructive" role="alert">{error}</p>
      )}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error: string | null;
  children: ReactNode;
}) {
  const errorId = useId();
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<{ "aria-describedby"?: string; "aria-invalid"?: boolean }>, {
        "aria-describedby": error ? errorId : undefined,
        "aria-invalid": error ? true : undefined,
      })
    : children;
  return (
    <div className="min-w-0">
      <label htmlFor={htmlFor} className="text-sm font-medium">{label}</label>
      <div className="mt-1.5">{control}</div>
      {error && (
        <p id={errorId} className="mt-1 text-xs text-destructive" role="alert">{error}</p>
      )}
    </div>
  );
}

function Hint({ label, text }: { label: string; text: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        className={cn("inline-flex h-6 w-6 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-[#006B53]", mutedClass)}
        aria-label={label}
        aria-expanded={open}
        aria-describedby={id}
        onClick={() => setOpen((current) => !current)}
      >
        <Info className="h-3.5 w-3.5" aria-hidden />
      </button>
      <span id={id} role="tooltip" className={open ? "absolute left-0 top-full z-20 mt-1 w-56 rounded-xl border border-[#E2E8E5] bg-white p-2 text-left text-xs font-normal leading-5 text-[#10231F] shadow-card [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-card [[data-theme=dark]_&]:text-foreground" : "sr-only"}>
        {text}
      </span>
    </span>
  );
}

export function DownloadHeroArt() {
  return (
    <svg viewBox="0 0 220 140" className="hidden h-32 w-full max-w-[220px] lg:block" aria-hidden>
      <rect x="18" y="28" width="150" height="96" rx="16" fill="#E7F6F0" />
      <rect x="34" y="42" width="118" height="68" rx="8" fill="#FFFFFF" stroke="#D7EBE3" />
      <path d="M93 58v28M93 86l-10-12M93 86l10-12" fill="none" stroke="#006B53" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="150" y="18" width="52" height="28" rx="14" fill="#006B53" />
      <text x="176" y="36" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontFamily="inherit">GB</text>
      <rect x="158" y="54" width="48" height="24" rx="12" fill="#FFFFFF" stroke="#D7EBE3" />
      <text x="182" y="70" textAnchor="middle" fill="#006B53" fontSize="11" fontFamily="inherit">MB</text>
      <rect x="154" y="86" width="52" height="24" rx="12" fill="#FFFFFF" stroke="#D7EBE3" />
      <text x="180" y="102" textAnchor="middle" fill="#006B53" fontSize="11" fontFamily="inherit">TB</text>
    </svg>
  );
}
