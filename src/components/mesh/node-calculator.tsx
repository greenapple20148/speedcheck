"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type SelectHTMLAttributes } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BrickWall,
  Calculator,
  Check,
  ChevronDown,
  Gauge,
  Home,
  Info,
  Laptop,
  Layers,
  RotateCcw,
  Ruler,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { AdSlot } from "@/components/ads/ad-slot";
import { useMeshPlan } from "@/components/mesh/use-mesh-plan";
import {
  CONSTRUCTION_OPTIONS,
  FLOOR_OPTIONS,
  convertAreaInput,
  defaultNodeCalculatorDraft,
  draftFromHome,
  homePatch,
  ispFactorLine,
  recommendationCopy,
  validateNodeCalculatorDraft,
  wiredForSuggestion,
  type NodeCalculatorDraft,
} from "@/lib/mesh/node-calculator-form";
import { suggestNodeCount } from "@/lib/mesh/nodes";
import type { AreaUnit, Construction } from "@/lib/mesh/types";
import { cn } from "@/lib/utils";

const cardClass =
  "rounded-[20px] border border-[#E2E8F0] bg-white text-[#0F172A] shadow-[0_1px_2px_rgba(15,23,42,0.04),0_14px_36px_rgba(15,23,42,0.06)] [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-card [[data-theme=dark]_&]:text-foreground";
const mutedClass = "text-[#64748B] [[data-theme=dark]_&]:text-muted-foreground";
const labelClass = "text-sm font-medium text-[#0F172A] [[data-theme=dark]_&]:text-foreground";
const fieldClass =
  "h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none transition focus-visible:border-[#086B50] focus-visible:ring-2 focus-visible:ring-[#086B50]/30 [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-[var(--input-bg)] [[data-theme=dark]_&]:text-foreground";

const HOW_IT_WORKS = [
  "Enter your home and usage details",
  "Get a recommended starting node count",
  "Test your coverage and fine-tune placement",
];

export function NodeCalculator() {
  const { plan, update, ready } = useMeshPlan();
  const [draft, setDraft] = useState<NodeCalculatorDraft>(defaultNodeCalculatorDraft);
  const [hydrated, setHydrated] = useState(false);
  const editedRef = useRef(false);
  const resultRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ready || !plan || hydrated) return;
    if (!editedRef.current) setDraft(draftFromHome(plan.home));
    setHydrated(true);
  }, [ready, plan, hydrated]);

  const parsed = validateNodeCalculatorDraft(draft);
  const errors = parsed.ok ? {} : parsed.errors;
  const backhaul = plan?.home.backhaul ?? "unknown";
  const result = parsed.ok
    ? suggestNodeCount({
        area: parsed.value.area,
        unit: parsed.value.unit,
        floors: parsed.value.floors,
        construction: parsed.value.construction,
        devices: parsed.value.devices,
        wiredBackhaul: wiredForSuggestion(parsed.value, backhaul),
      })
    : null;
  const copy = result ? recommendationCopy(result) : null;
  const factors = result
    ? [...result.reasons, ...result.warnings, ...(parsed.ok ? [ispFactorLine(parsed.value.ispMbps)] : [])].filter(
        (line): line is string => Boolean(line),
      )
    : [];

  function commit(next: NodeCalculatorDraft) {
    editedRef.current = true;
    setDraft(next);
    if (!ready || !plan) return;
    const checked = validateNodeCalculatorDraft(next);
    if (!checked.ok) return;
    update({ ...plan, home: { ...plan.home, ...homePatch(checked.value, plan.home.backhaul) } });
  }

  useEffect(() => {
    if (!hydrated || !editedRef.current || !ready || !plan) return;
    const checked = validateNodeCalculatorDraft(draft);
    if (!checked.ok) return;
    update({ ...plan, home: { ...plan.home, ...homePatch(checked.value, plan.home.backhaul) } });
    editedRef.current = false;
  }, [hydrated, ready, plan, draft, update]);

  function focusResult() {
    const node = resultRef.current;
    if (!node) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
    node.focus({ preventScroll: true });
  }

  const unitLabel = draft.unit === "sqm" ? "sq m" : "sq ft";

  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-2 h-36 overflow-hidden">
        <svg className="h-full w-full text-[#D1FAE5] [[data-theme=dark]_&]:text-[#134E4A]/40" viewBox="0 0 1200 160" preserveAspectRatio="none">
          <path fill="currentColor" d="M0 80C160 20 280 20 440 70C620 128 760 20 980 48C1080 60 1140 40 1200 24V0H0Z" opacity="0.85" />
          <path fill="currentColor" d="M0 120C200 70 360 150 560 100C780 44 920 110 1200 70V160H0Z" opacity="0.45" />
        </svg>
      </div>

      <header className="relative mx-auto mb-5 max-w-3xl text-center">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-[#064E3B] sm:text-4xl [[data-theme=dark]_&]:text-foreground">
          How many mesh nodes do I need?
        </h1>
        <p className={cn("mx-auto mt-2 max-w-2xl text-sm leading-6 sm:text-base", mutedClass)}>
          Get a personalized recommendation for your home. Enter a few details to estimate the right number of mesh nodes for reliable Wi-Fi coverage.
        </p>
      </header>

      <form
        className="relative grid items-start gap-5 lg:grid-cols-[minmax(0,1.86fr)_minmax(0,1fr)]"
        onSubmit={(event) => {
          event.preventDefault();
          focusResult();
        }}
      >
        <section className={cn(cardClass, "p-4 sm:p-5")} aria-labelledby="home-setup-heading">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DCFCE7] text-[#086B50] [[data-theme=dark]_&]:bg-[#134E4A]/50 [[data-theme=dark]_&]:text-[#5EEAD4]">
              <Wifi className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 id="home-setup-heading" className="text-lg font-semibold">Your Home Setup</h2>
              <p className={cn("text-sm", mutedClass)}>Tell us about your space and usage.</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label={`Home size (${unitLabel})`} icon={Home} error={errors.area} htmlFor="mesh-home-size">
              <input
                id="mesh-home-size"
                className={cn(fieldClass, errors.area && "border-[#DC2626]")}
                inputMode="decimal"
                aria-invalid={Boolean(errors.area)}
                aria-describedby={errors.area ? "mesh-home-size-error" : undefined}
                value={draft.area}
                onChange={(event) => commit({ ...draft, area: event.target.value })}
              />
            </Field>
            <Field label="Unit" icon={Ruler} htmlFor="mesh-unit">
              <Select
                id="mesh-unit"
                value={draft.unit}
                onChange={(event) => {
                  const unit = event.target.value as AreaUnit;
                  commit({ ...draft, unit, area: convertAreaInput(draft.area, draft.unit, unit) });
                }}
              >
                <option value="sqft">Square feet</option>
                <option value="sqm">Square meters</option>
              </Select>
            </Field>
            <Field
              label="Floors"
              icon={Layers}
              htmlFor="mesh-floors"
              hint="Each floor after the first adds 45 percent to the planning area. The starting count still stops at four until you measure a room."
              hintLabel="How floors change the estimate"
            >
              <Select
                id="mesh-floors"
                value={String(draft.floors)}
                onChange={(event) => commit({ ...draft, floors: Number(event.target.value) })}
              >
                {FLOOR_OPTIONS.map((floor) => (
                  <option key={floor} value={floor}>{floor}</option>
                ))}
              </Select>
            </Field>
            <Field
              label="Construction"
              icon={BrickWall}
              htmlFor="mesh-construction"
              hint="Heavier walls use a smaller planning area per node. Wood and drywall allow more area than brick or concrete. This is a planning assumption, not a measured signal."
              hintLabel="How construction changes the estimate"
              hintAlign="end"
            >
              <Select
                id="mesh-construction"
                value={draft.construction}
                onChange={(event) => commit({ ...draft, construction: event.target.value as Construction })}
              >
                {CONSTRUCTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Devices (approx.)" icon={Laptop} error={errors.devices} htmlFor="mesh-devices">
              <input
                id="mesh-devices"
                className={cn(fieldClass, errors.devices && "border-[#DC2626]")}
                inputMode="numeric"
                aria-invalid={Boolean(errors.devices)}
                aria-describedby={errors.devices ? "mesh-devices-error" : undefined}
                value={draft.devices}
                onChange={(event) => commit({ ...draft, devices: event.target.value })}
              />
            </Field>
            <Field
              label="ISP download Mbps (optional)"
              icon={Gauge}
              error={errors.ispMbps}
              htmlFor="mesh-isp"
              hint="Optional. Saved with your plan for other tools. This starting count uses home size, floors, and construction, not download speed."
              hintLabel="How download speed is used"
              hintAlign="end"
            >
              <input
                id="mesh-isp"
                className={cn(fieldClass, errors.ispMbps && "border-[#DC2626]")}
                inputMode="decimal"
                placeholder="e.g. 300"
                aria-invalid={Boolean(errors.ispMbps)}
                aria-describedby={errors.ispMbps ? "mesh-isp-error" : undefined}
                value={draft.ispMbps}
                onChange={(event) => commit({ ...draft, ispMbps: event.target.value })}
              />
            </Field>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              id="mesh-ethernet"
              type="checkbox"
              className="h-4 w-4 rounded border-[#CBD5E1] accent-[#086B50] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086B50]"
              checked={draft.ethernet}
              onChange={(event) => commit({ ...draft, ethernet: event.target.checked })}
            />
            <label htmlFor="mesh-ethernet" className="text-sm">Ethernet is available between some rooms</label>
            <Hint
              label="How Ethernet changes the estimate"
              text="Ethernet between rooms does not shrink each radio’s coverage, and it does not change this starting count. It keeps the link between nodes off the same airtime as phones and laptops."
            />
          </div>

          <div className="mt-4 flex flex-col items-center gap-2">
            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#086B50] px-6 text-sm font-semibold text-white transition hover:bg-[#064E3B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086B50] sm:w-auto"
            >
              <Calculator className="h-4 w-4" aria-hidden />
              Calculate Mesh Nodes
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium hover:bg-[#F0FDF4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086B50] [[data-theme=dark]_&]:hover:bg-white/5", mutedClass)}
              onClick={() => commit(defaultNodeCalculatorDraft())}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Reset to defaults
            </button>
          </div>
        </section>

        <aside className={cn(cardClass, "p-4 sm:p-5")} aria-labelledby="coverage-guide-heading">
          <h2 id="coverage-guide-heading" className="sr-only">Coverage guide</h2>
          <CoverageSketch count={result?.count ?? 1} />
          <p className={cn("mt-2 text-center text-xs", mutedClass)}>Illustration only. Not a measured coverage map.</p>
          <div className="mt-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#DCFCE7] text-[#086B50] [[data-theme=dark]_&]:bg-[#134E4A]/50 [[data-theme=dark]_&]:text-[#5EEAD4]">
                <Wifi className="h-3.5 w-3.5" aria-hidden />
              </span>
              How it works
            </h3>
            <ol className="mt-3 space-y-0">
              {HOW_IT_WORKS.map((step, index) => (
                <li key={step} className="relative flex gap-3 pb-4 last:pb-0">
                  {index < HOW_IT_WORKS.length - 1 && (
                    <span aria-hidden className="absolute bottom-0 left-[11px] top-6 w-px bg-[#86EFAC] [[data-theme=dark]_&]:bg-[#134E4A]" />
                  )}
                  <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#086B50] text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <span className="pt-0.5 text-sm leading-5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </form>

      <section
        ref={resultRef}
        id="mesh-node-recommendation"
        tabIndex={-1}
        aria-labelledby="mesh-recommendation-heading"
        className="mt-5 scroll-mt-24 rounded-[20px] border border-[#BBF7D0] bg-[#F0FDF4] p-4 outline-none focus-visible:ring-2 focus-visible:ring-[#086B50] sm:p-5 [[data-theme=dark]_&]:border-[#134E4A] [[data-theme=dark]_&]:bg-[#10241C]"
      >
        <h2 id="mesh-recommendation-heading" className="sr-only">Recommendation</h2>
        {!result && (
          <p className="text-sm text-[#0F172A] [[data-theme=dark]_&]:text-foreground" role="alert">
            Fix the highlighted fields to see a starting count. An empty or invalid home size does not produce a recommendation.
          </p>
        )}
        {result && copy && (
          <div className="grid items-center gap-5 lg:grid-cols-[150px_minmax(0,1.1fr)_minmax(0,1fr)]">
            <NodePods count={result.count} />
            <div aria-live="polite">
              <p className={cn("text-sm font-medium", mutedClass)}>Recommended starting count</p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <p className="text-5xl font-semibold tabular-nums leading-none text-[#064E3B] [[data-theme=dark]_&]:text-foreground">
                  {result.count}
                  <span className="sr-only"> {result.count === 1 ? "node" : "nodes"}</span>
                </p>
                <p className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#166534] [[data-theme=dark]_&]:bg-[#134E4A] [[data-theme=dark]_&]:text-[#BBF7D0]">
                  <Check className="h-3.5 w-3.5" aria-hidden />
                  {copy.badge}
                </p>
              </div>
              <p className="mt-3 text-sm font-medium text-[#0F172A] [[data-theme=dark]_&]:text-foreground">{copy.title}</p>
              <p className={cn("mt-1 text-sm leading-6", mutedClass)}>{copy.body}</p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/mesh-wifi/dead-zone-test"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#086B50] bg-white px-4 text-sm font-semibold text-[#086B50] transition hover:bg-[#ECFDF5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086B50] [[data-theme=dark]_&]:border-[#5EEAD4] [[data-theme=dark]_&]:bg-transparent [[data-theme=dark]_&]:text-[#5EEAD4]"
                >
                  <Wifi className="h-4 w-4" aria-hidden />
                  Open room tests
                </Link>
                <Link href="/mesh-wifi" className="inline-flex items-center gap-1 text-sm font-medium text-[#086B50] hover:underline [[data-theme=dark]_&]:text-[#5EEAD4]">
                  Learn more about Mesh Wi-Fi
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            </div>
            <ul className="space-y-2">
              {factors.map((factor) => {
                const sentence = factor.charAt(0).toUpperCase() + factor.slice(1);
                return (
                <li key={factor} className="flex items-start gap-2 text-sm leading-5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#16A34A]" aria-hidden />
                  <span>{sentence}</span>
                </li>
              );
              })}
            </ul>
          </div>
        )}
      </section>
      <AdSlot slot="mesh-node-calculator" />
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  htmlFor,
  error,
  hint,
  hintLabel,
  hintAlign = "start",
  children,
}: {
  label: string;
  icon: LucideIcon;
  htmlFor: string;
  error?: string;
  hint?: string;
  hintLabel?: string;
  hintAlign?: "start" | "end";
  children: ReactNode;
}) {
  const errorId = `${htmlFor}-error`;
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5">
        <Icon className="h-4 w-4 text-[#086B50] [[data-theme=dark]_&]:text-[#5EEAD4]" aria-hidden />
        <label htmlFor={htmlFor} className={labelClass}>{label}</label>
        {hint && <Hint label={hintLabel ?? `About ${label}`} text={hint} align={hintAlign} />}
      </div>
      {children}
      {error && (
        <p id={errorId} className="mt-1 text-xs text-[#B91C1C] [[data-theme=dark]_&]:text-[#FCA5A5]">
          {error}
        </p>
      )}
    </div>
  );
}

function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} className={cn(fieldClass, "appearance-none pr-9", className)}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" aria-hidden />
    </div>
  );
}

function Hint({ label, text, align = "start" }: { label: string; text: string; align?: "start" | "end" }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[#64748B] hover:text-[#0F172A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086B50] [[data-theme=dark]_&]:text-muted-foreground"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={id}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
      >
        <Info className="h-3.5 w-3.5" aria-hidden />
      </button>
      <span
        id={id}
        role="tooltip"
        className={open
          ? cn(
              "absolute top-full z-20 mt-1 w-64 max-w-[min(16rem,calc(100vw-2rem))] rounded-xl border border-[#E2E8F0] bg-white p-2 text-left text-xs font-normal leading-5 text-[#0F172A] shadow-card [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-card [[data-theme=dark]_&]:text-foreground",
              align === "end" ? "right-0" : "left-0",
            )
          : "sr-only"}
      >
        {text}
      </span>
    </span>
  );
}

function CoverageSketch({ count }: { count: number }) {
  const shown = Math.min(count, 3);
  const spots = shown === 1
    ? [{ x: 160, y: 104 }]
    : shown === 2
      ? [{ x: 118, y: 108 }, { x: 206, y: 96 }]
      : [{ x: 104, y: 110 }, { x: 160, y: 96 }, { x: 216, y: 110 }];
  return (
    <svg viewBox="0 0 320 176" className="h-auto w-full" aria-hidden>
      <rect width="320" height="176" rx="16" className="fill-[#F0FDF4] [[data-theme=dark]_&]:fill-[#0C1F18]" />
      <ellipse cx="38" cy="142" rx="16" ry="6" fill="#BBF7D0" />
      <circle cx="32" cy="124" r="14" fill="#86EFAC" />
      <circle cx="46" cy="128" r="10" fill="#4ADE80" />
      <ellipse cx="284" cy="142" rx="16" ry="6" fill="#BBF7D0" />
      <circle cx="278" cy="124" r="14" fill="#86EFAC" />
      <circle cx="292" cy="128" r="10" fill="#4ADE80" />
      <path d="M78 132 V86 L160 42 L242 86 V132 Z" fill="#FFFFFF" stroke="#A7F3D0" strokeWidth="2" />
      <rect x="96" y="96" width="28" height="18" rx="3" fill="#ECFDF5" stroke="#6EE7B7" />
      <rect x="196" y="96" width="28" height="18" rx="3" fill="#ECFDF5" stroke="#6EE7B7" />
      <rect x="146" y="104" width="28" height="28" rx="3" fill="#D1FAE5" />
      <rect x="128" y="122" width="22" height="10" rx="4" fill="#A7F3D0" />
      {spots.map((spot) => (
        <g key={`${spot.x}-${spot.y}`}>
          <circle cx={spot.x} cy={spot.y} r="28" fill="#86EFAC" opacity="0.28" />
          <circle cx={spot.x} cy={spot.y} r="16" fill="#4ADE80" opacity="0.22" />
          <circle cx={spot.x} cy={spot.y + 2} r="7" fill="#FFFFFF" stroke="#086B50" strokeWidth="1.6" />
          <path d={`M${spot.x - 4} ${spot.y - 4} a6 6 0 0 1 8 0`} fill="none" stroke="#086B50" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

function NodePods({ count }: { count: number }) {
  const shown = Math.min(count, 3);
  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 160 120" className="h-28 w-40" aria-hidden>
        <ellipse cx="80" cy="102" rx="52" ry="10" fill="#BBF7D0" />
        {Array.from({ length: shown }, (_, index) => {
          const x = shown === 1 ? 80 : 36 + index * ((88) / (shown - 1));
          const y = shown === 3 && index === 1 ? 22 : 36;
          const width = shown === 1 ? 52 : 36;
          const height = shown === 1 ? 44 : 34;
          return (
            <g key={index}>
              <rect x={x - width / 2} y={y} width={width} height={height} rx="14" fill="#FFFFFF" stroke="#86EFAC" strokeWidth="2" />
              <rect x={x - width / 4} y={y + 10} width={width / 2} height="6" rx="3" fill="#A7F3D0" />
              <circle cx={x} cy={y + height - 12} r="3.5" fill="#086B50" />
            </g>
          );
        })}
      </svg>
      {count > 3 && (
        <p className={cn("text-center text-xs", mutedClass)}>Drawing shows three nodes for a {count}-node starting count.</p>
      )}
    </div>
  );
}
