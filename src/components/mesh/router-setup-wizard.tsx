"use client";

import { Check, ChevronDown, Router, Search, Shield, Wifi } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { GatewayAddressInput } from "@/components/mesh/gateway-address-input";
import { loadPlan } from "@/lib/mesh/store";
import { getRouterManufacturer, parseGatewayAddress } from "@/lib/mesh/router-admin";
import {
  ADDRESS_GUIDES,
  SECURITY_NOTICE,
  TASK_CATEGORY_LABELS,
  WIZARD_STEP_LABELS,
  appNameFor,
  backWizard,
  canContinue,
  canGoToStep,
  connectionProfile,
  continueWizard,
  emptyWizardState,
  goToStep,
  latestMeasuredResult,
  manufacturerMonogram,
  modelFamilies,
  wizardManufacturers,
  openableAdminUrl,
  readWizardState,
  selectManufacturer,
  selectModel,
  selectUnknownModel,
  startOverState,
  tasksFor,
  toggleCheck,
  troubleshootingTopics,
  uniqueTaskIds,
  withExactModel,
  withGateway,
  withIspRouting,
  withOs,
  writeWizardState,
  type IspRouting,
  type MeasuredSpeedSnapshot,
  type RouterWizardState,
  type WizardOs,
  type WizardTask,
  type WizardTaskCategory,
} from "@/lib/mesh/router-wizard";
import { readHistory } from "@/lib/speedtest/history-store";
import { cn } from "@/lib/utils";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086B50]";
const PRIMARY = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#086B50] px-4 text-sm font-semibold text-white hover:bg-[#064E3B] disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`;
const SECONDARY = `inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`;

const TOOL_LINKS = [
  { href: "/network-health", label: "Network health" },
  { href: "/dns-speed-test", label: "DNS timing" },
  { href: "/ping-test", label: "Latency" },
  { href: "/jitter-test", label: "Jitter" },
  { href: "/packet-loss-test", label: "Request loss" },
  { href: "/wifi-speed-test", label: "Wi-Fi speed test" },
  { href: "/internet-troubleshooter", label: "Internet troubleshooter" },
  { href: "/mesh-wifi/troubleshooter", label: "Mesh troubleshooter" },
] as const;

const CATEGORIES: WizardTaskCategory[] = ["network", "mesh", "security", "advanced"];

export function RouterSetupWizard() {
  const [state, setState] = useState<RouterWizardState | null>(null);
  const [resume, setResume] = useState<"saved" | "legacy" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [measured, setMeasured] = useState<MeasuredSpeedSnapshot | null | undefined>(undefined);
  const [query, setQuery] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [openedUrl, setOpenedUrl] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const announced = useRef(false);
  const step = state?.step;

  useEffect(() => {
    const loaded = readWizardState(loadPlan().checkedSetup);
    setState(loaded.state);
    setResume(loaded.resume);
    setMeasured(latestMeasuredResult(readHistory()));
  }, []);

  useEffect(() => {
    if (!state) return;
    writeWizardState(state);
  }, [state]);

  useEffect(() => {
    if (step == null) return;
    if (!announced.current) {
      announced.current = true;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  if (!state) {
    return <p className="text-sm text-muted-foreground">Loading saved setup…</p>;
  }

  const gate = canContinue(state);
  const stepTitle = state.step === 3 ? "Check Your Wi-Fi Setup" : WIZARD_STEP_LABELS[state.step];
  const profile = connectionProfile(state.manufacturerId, state.modelId, state.unknownModel);

  function patch(next: RouterWizardState | null) {
    if (next) setState(next);
  }

  return (
    <div className="text-foreground">
      <p className="sr-only" aria-live="polite">
        Step {state.step + 1} of 4, {stepTitle}
      </p>
      <Stepper state={state} onStep={(target) => patch(goToStep(state, target))} />
      <section className="panel mt-4 p-3 sm:p-5" aria-labelledby="router-wizard-step-title">
        <h2
          id="router-wizard-step-title"
          ref={headingRef}
          tabIndex={-1}
          className="font-heading text-lg font-semibold tracking-tight outline-none sm:text-xl"
        >
          {stepTitle}
        </h2>
        <div key={state.step} className="motion-safe:animate-fade-up motion-reduce:animate-none">
          {state.step === 0 && (
            <DeviceStep
              state={state}
              query={query}
              onQuery={setQuery}
              onManufacturer={(id) => {
                setConfirmed(false);
                setOpenedUrl(null);
                setQuery("");
                patch(selectManufacturer(state, id));
              }}
              onModel={(id) => {
                setConfirmed(false);
                setOpenedUrl(null);
                patch(selectModel(state, id));
              }}
              onUnknown={() => {
                setConfirmed(false);
                setOpenedUrl(null);
                patch(selectUnknownModel(state));
              }}
              onExact={(value) => patch(withExactModel(state, value))}
            />
          )}
          {state.step === 1 && (
            <ConnectStep
              state={state}
              confirmed={confirmed}
              openedUrl={openedUrl}
              onGateway={(value) => {
                setConfirmed(false);
                setOpenedUrl(null);
                patch(withGateway(state, value));
              }}
              onConfirm={setConfirmed}
              onOs={(os) => patch(withOs(state, os))}
              onOpen={() => {
                const url = openableAdminUrl(state.manufacturerId, state.modelId, state.unknownModel, state.gateway);
                if (!url || !confirmed) return;
                window.open(url, "_blank", "noopener,noreferrer");
                setOpenedUrl(url);
              }}
            />
          )}
          {state.step === 2 && (
            <ConfigureStep
              state={state}
              onToggle={(id) => patch(toggleCheck(state, id))}
              onIsp={(value) => patch(withIspRouting(state, value))}
            />
          )}
          {state.step === 3 && <VerifyStep state={state} measured={measured} />}
        </div>
        <div className="sticky bottom-3 z-10 mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-border bg-card/95 py-3">
          {state.step === 0 && gate.reason && (
            <p id="wizard-continue-reason" className="mr-auto text-xs text-muted-foreground">
              {gate.reason}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={SECONDARY} disabled={state.step === 0} onClick={() => patch(backWizard(state))}>
              Back
            </button>
            {state.step < 3 ? (
              <button
                type="button"
                className={PRIMARY}
                disabled={!gate.ok}
                aria-describedby={gate.reason ? "wizard-continue-reason" : undefined}
                onClick={() => patch(continueWizard(state))}
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                className={PRIMARY}
                onClick={() => patch({ ...state, completed: true })}
              >
                Finish
              </button>
            )}
          </div>
        </div>
      </section>
      {state.step !== 1 && <Troubleshoot appManaged={!profile.showLocalAdmin && profile.method === "mobile-app"} />}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className={SECONDARY} onClick={() => {
          setNotice("Setup progress was cleared on this device.");
          setResume(null);
          setConfirmed(false);
          setOpenedUrl(null);
          setQuery("");
          setState(startOverState());
        }}>
          Start over
        </button>
        <button type="button" className={SECONDARY} onClick={() => {
          setNotice("Saved setup progress was cleared. Router checks saved with a mesh plan can appear again on the next visit.");
          setResume(null);
          setConfirmed(false);
          setOpenedUrl(null);
          setQuery("");
          setState(emptyWizardState());
        }}>
          Clear saved progress
        </button>
      </div>
      {notice && <p className="mt-2 text-xs text-muted-foreground" role="status">{notice}</p>}
      {!notice && resume === "saved" && <p className="mt-2 text-xs text-muted-foreground" role="status">Saved progress resumed on this device.</p>}
      {!notice && resume === "legacy" && (
        <p className="mt-2 text-xs text-muted-foreground" role="status">
          User-confirmed checklist marks from a saved mesh plan were restored.
        </p>
      )}
    </div>
  );
}

function Stepper({ state, onStep }: { state: RouterWizardState; onStep: (step: number) => void }) {
  return (
    <ol className="grid grid-cols-4 gap-1" aria-label="Setup steps">
      {WIZARD_STEP_LABELS.map((name, index) => {
        const current = state.step === index;
        const completed = index < state.step;
        const enabled = canGoToStep(state, index);
        return (
          <li key={name} className="relative">
            {index < WIZARD_STEP_LABELS.length - 1 && (
              <span
                className={cn("absolute left-[calc(50%+18px)] right-[calc(-50%+18px)] top-4 h-0.5", index < state.step ? "bg-[#086B50]" : "bg-border")}
                aria-hidden="true"
              />
            )}
            <button
              type="button"
              className={cn("relative z-10 flex w-full flex-col items-center gap-1 rounded-xl px-1 py-1 text-center", FOCUS)}
              aria-current={current ? "step" : undefined}
              aria-label={`${index + 1}. ${name}${completed ? ", completed" : ""}`}
              disabled={!enabled}
              onClick={() => onStep(index)}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold",
                  completed && "border-[#16A34A] bg-[#F0FDF4] text-[#16A34A]",
                  current && "border-[#086B50] bg-[#086B50] text-white",
                  !completed && !current && "border-border bg-card text-muted-foreground",
                )}
                aria-hidden="true"
              >
                {completed ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <span className={cn("text-[11px] font-medium leading-tight sm:text-xs", current ? "text-foreground" : "text-muted-foreground")}>
                {name}
              </span>
              {completed && <span className="text-[10px] font-medium text-[#16A34A]">Done</span>}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function DeviceStep({
  state,
  query,
  onQuery,
  onManufacturer,
  onModel,
  onUnknown,
  onExact,
}: {
  state: RouterWizardState;
  query: string;
  onQuery: (value: string) => void;
  onManufacturer: (id: string) => void;
  onModel: (id: string) => void;
  onUnknown: () => void;
  onExact: (value: string) => void;
}) {
  const families = state.manufacturerId ? modelFamilies(state.manufacturerId) : [];
  const filtered = families.filter((model) => model.label.toLowerCase().includes(query.trim().toLowerCase()));
  const selected = families.find((model) => model.id === state.modelId);
  const brands = wizardManufacturers();
  const brand = state.manufacturerId ? getRouterManufacturer(state.manufacturerId) : undefined;

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="min-w-0 space-y-4">
        <p className="text-sm font-medium">Select your router or mesh system</p>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {brands.map((item) => {
            const pressed = state.manufacturerId === item.id;
            const monogram = manufacturerMonogram(item.id);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  aria-pressed={pressed}
                  className={cn(
                    "flex min-h-[4.25rem] w-full flex-col items-center justify-center gap-1 rounded-xl border bg-card px-2 py-2 text-center",
                    FOCUS,
                    pressed ? "border-[#086B50] ring-1 ring-[#00866A]" : "border-border",
                  )}
                  onClick={() => onManufacturer(item.id)}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-[#00866A]" aria-hidden="true">
                    {monogram ?? <Router className="h-3.5 w-3.5" />}
                  </span>
                  <span className="text-xs font-semibold leading-tight sm:text-sm">{item.name}</span>
                  {pressed && <span className="text-[10px] font-medium text-[#00866A]">Selected</span>}
                </button>
              </li>
            );
          })}
        </ul>
        {state.manufacturerId && (
          <div className="space-y-2">
            <label htmlFor="router-model-search" className="block text-sm font-medium">
              Select model or family
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                id="router-model-search"
                value={query}
                placeholder={`Search ${brand?.name ?? "models"}`}
                className={cn("w-full rounded-xl border border-border bg-card py-2 pl-9 pr-3 text-sm", FOCUS)}
                autoComplete="off"
                onChange={(event) => onQuery(event.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">These choices are product families from the setup guide, not every exact model number.</p>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2" aria-label="Model or product family">
              {filtered.map((model) => {
                const pressed = state.modelId === model.id && !state.unknownModel;
                return (
                  <li key={model.id}>
                    <button
                      type="button"
                      aria-pressed={pressed}
                      className={cn(
                        "flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border px-3 text-left text-sm",
                        FOCUS,
                        pressed ? "border-[#086B50] bg-[#F0FDF4] text-[#0F172A]" : "border-border bg-card",
                      )}
                      onClick={() => onModel(model.id)}
                    >
                      <span className="font-medium">{model.label}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{pressed ? "Selected family" : "Product family"}</span>
                    </button>
                  </li>
                );
              })}
              {filtered.length === 0 && <li className="text-sm text-muted-foreground">No family matches that search.</li>}
            </ul>
            <button
              type="button"
              aria-pressed={state.unknownModel}
              className={cn("text-sm font-medium text-[#00866A] underline-offset-2 hover:underline", FOCUS, state.unknownModel && "underline")}
              onClick={onUnknown}
            >
              I don&apos;t know my router model
            </button>
            {state.unknownModel && (
              <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm">
                <p className="font-medium">General guidance</p>
                <p className="mt-1 text-muted-foreground">You can continue without a model. The steps below stay general for this brand.</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
                  <li>Look at the label underneath your router.</li>
                  <li>Read the model number printed on that label. It is separate from the Wi-Fi name.</li>
                  <li>If you find it, choose the closest product family. If you cannot, continue with general guidance.</li>
                </ol>
              </div>
            )}
            {selected && !state.unknownModel && (
              <div className="space-y-1">
                <label htmlFor="router-exact-model" className="block text-xs font-medium">
                  Exact model on the label (optional)
                </label>
                <input
                  id="router-exact-model"
                  value={state.exactModel}
                  maxLength={80}
                  autoComplete="off"
                  className={cn("w-full rounded-xl border border-border bg-card px-3 py-2 text-sm", FOCUS)}
                  onChange={(event) => onExact(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  You selected the {selected.label} family. A typed model number is a label only. This assistant does not look up features for that number.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      <aside className="space-y-3">
        <div className="rounded-2xl border border-border bg-muted/30 p-4 text-center">
          <DeviceMark id={state.manufacturerId} />
          <p className="mt-3 text-sm font-semibold">{brand?.name ?? "Choose a brand"}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {state.unknownModel
              ? "Model unknown. Guidance stays general."
              : selected
                ? `${selected.label} is a product family, not one exact model.`
                : "Select a family, or continue without a model."}
          </p>
          {state.exactModel && <p className="mt-2 text-xs text-muted-foreground">Label you entered: {state.exactModel}</p>}
        </div>
        <div className="rounded-2xl border border-border p-3 text-left">
          <p className="text-sm font-semibold">Find your model</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Look on the label underneath the router. The model number is separate from the Wi-Fi name.</p>
        </div>
      </aside>
    </div>
  );
}

function ConnectStep({
  state,
  confirmed,
  openedUrl,
  onGateway,
  onConfirm,
  onOs,
  onOpen,
}: {
  state: RouterWizardState;
  confirmed: boolean;
  openedUrl: string | null;
  onGateway: (value: string) => void;
  onConfirm: (value: boolean) => void;
  onOs: (os: WizardOs) => void;
  onOpen: () => void;
}) {
  const profile = connectionProfile(state.manufacturerId, state.modelId, state.unknownModel);
  const parsed = state.gateway.trim() ? parseGatewayAddress(state.gateway) : null;
  const adminUrl = openableAdminUrl(state.manufacturerId, state.modelId, state.unknownModel, state.gateway);
  const selectedGuide = ADDRESS_GUIDES.find((guide) => guide.id === state.selectedOs);
  const brand = state.manufacturerId ? getRouterManufacturer(state.manufacturerId) : undefined;
  const cards = profile.steps.slice(0, 3);

  return (
    <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0 space-y-4">
        <div className="flex items-start gap-3">
          <DeviceMark id={state.manufacturerId} compact />
          <div>
            <p className="inline-flex rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{profile.methodLabel}</p>
            <p className="mt-1 text-sm font-semibold">Connect and access your router</p>
            <p className="mt-1 text-sm text-muted-foreground">{profile.headline}</p>
          </div>
        </div>
        <ol className="space-y-2">
          {cards.map((step, index) => (
            <li key={step} className="flex gap-3 rounded-xl border border-border bg-card p-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#086B50] text-xs font-semibold text-white" aria-hidden="true">
                {index + 1}
              </span>
              <p className="text-sm leading-5">{step}</p>
            </li>
          ))}
        </ol>
        <ConnectionSketch appName={profile.appName} localAdmin={profile.showLocalAdmin} brand={brand?.name ?? "Router"} />
        <div className="flex flex-wrap gap-2">
          {profile.supportUrl && profile.supportLabel && (
            <a className={PRIMARY} href={profile.supportUrl} target="_blank" rel="noopener noreferrer">
              {profile.supportLabel}
            </a>
          )}
        </div>
        {profile.showLocalAdmin && (
          <div className="space-y-2 rounded-xl border border-border p-3">
            <p className="text-sm font-medium">Open Router Administration</p>
            <p className="text-xs text-muted-foreground">
              {profile.gatewaySuggestions.length
                ? "Addresses below are already listed for this brand. This page did not detect your gateway."
                : "Enter the address from the router label. This page did not detect your gateway."}
            </p>
            <GatewayAddressInput
              value={state.gateway}
              suggestions={profile.gatewaySuggestions}
              error={parsed && !parsed.ok ? parsed.error : null}
              warning={parsed?.ok && !parsed.typicalLocalGateway ? "This is a valid address, and it is outside the usual private gateway ranges. Confirm it before opening." : null}
              onChange={onGateway}
            />
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={confirmed}
                disabled={!adminUrl}
                onChange={(event) => onConfirm(event.target.checked)}
              />
              <span>Open this address in a new tab. MySpeedGauge is not connecting to the router and will not ask for its password.</span>
            </label>
            <button type="button" className={PRIMARY} disabled={!adminUrl || !confirmed} onClick={onOpen}>
              Open Router Administration
            </button>
            {adminUrl && confirmed && <p className="break-all text-xs text-muted-foreground">The tab will open {adminUrl}</p>}
            {openedUrl && (
              <p className="text-sm" role="status">
                A new tab was requested. That does not connect MySpeedGauge to the router.
              </p>
            )}
            <details className="rounded-xl border border-border px-3 py-2">
              <summary className="cursor-pointer text-sm font-medium">How do I find my router address?</summary>
              <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Operating system">
                {ADDRESS_GUIDES.map((guide) => (
                  <button
                    key={guide.id}
                    type="button"
                    aria-pressed={state.selectedOs === guide.id}
                    className={cn(SECONDARY, "min-h-9 px-3 text-xs", state.selectedOs === guide.id && "border-[#086B50]")}
                    onClick={() => onOs(guide.id)}
                  >
                    {guide.title}
                  </button>
                ))}
              </div>
              {selectedGuide ? (
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                  {selectedGuide.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">Choose Windows, macOS, iPhone/iPad, or Android.</p>
              )}
            </details>
          </div>
        )}
      </div>
      <aside className="space-y-3">
        <div className="rounded-2xl border border-border p-3">
          <h3 className="text-sm font-semibold">Need help?</h3>
          <Troubleshoot appManaged={!profile.showLocalAdmin && profile.method === "mobile-app"} compact />
        </div>
        <p className="rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] px-3 py-3 text-sm text-[#14532D]">
          {SECURITY_NOTICE}
        </p>
      </aside>
    </div>
  );
}

function ConfigureStep({
  state,
  onToggle,
  onIsp,
}: {
  state: RouterWizardState;
  onToggle: (id: string) => void;
  onIsp: (value: IspRouting) => void;
}) {
  const tasks = applicableTasks(state, tasksFor(state));
  const brand = state.manufacturerId ? getRouterManufacturer(state.manufacturerId) : undefined;
  const family = brand?.models.find((model) => model.id === state.modelId);
  const [open, setOpen] = useState<WizardTaskCategory[]>(["network"]);
  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-border bg-muted/30 p-3">
        <p className="text-sm font-semibold">Your mesh network (example)</p>
        <TopologySketch label={family?.label ?? brand?.name ?? "Primary"} />
        <p className="mt-2 text-xs leading-5 text-muted-foreground">Illustrative network layout. Not a live view.</p>
        {brand && (
          <p className="mt-2 text-xs text-muted-foreground">
            Selected: {brand.name}
            {state.unknownModel ? ", model unknown" : family ? `, ${family.label} family` : ""}
            {state.exactModel ? `. Label entered: ${state.exactModel}.` : ""}
          </p>
        )}
      </aside>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Checked items are user-confirmed. This page does not measure them. Optional tasks can stay unchecked.</p>
        {CATEGORIES.map((category) => {
          const items = tasks.filter((item) => item.category === category);
          if (items.length === 0 && category !== "network") return null;
          const done = items.filter((item) => state.checkedIds.includes(item.id)).length;
          return (
            <details
              key={category}
              open={open.includes(category)}
              className="rounded-2xl border border-border bg-card"
              onToggle={(event) => {
                const isOpen = event.currentTarget.open;
                setOpen((current) => {
                  const has = current.includes(category);
                  if (isOpen === has) return current;
                  return isOpen ? [...current, category] : current.filter((item) => item !== category);
                });
              }}
            >
              <summary className={cn("flex cursor-pointer list-none items-center gap-3 px-3 py-3 [&::-webkit-details-marker]:hidden", FOCUS)}>
                <CategoryIcon category={category} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{TASK_CATEGORY_LABELS[category]}</span>
                  <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-[#086B50]"
                      style={{ width: items.length ? `${Math.round((done / items.length) * 100)}%` : "0%" }}
                    />
                  </span>
                </span>
                <span className="text-xs font-medium text-muted-foreground">{done} of {items.length}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </summary>
              <div className="space-y-2 px-3 pb-3">
                {category === "network" && (
                  <fieldset className="space-y-1 rounded-xl border border-border px-3 py-2">
                    <legend className="px-1 text-sm font-medium">Does the ISP gateway also route?</legend>
                    <p className="text-xs text-muted-foreground">This answer shows the double NAT check when it may apply. It is not a measurement.</p>
                    <IspOption name="Yes, it also routes" value="yes" current={state.ispRouting} onChange={onIsp} />
                    <IspOption name="No, this router is the only one" value="no" current={state.ispRouting} onChange={onIsp} />
                    <IspOption name="I'm not sure" value="unsure" current={state.ispRouting} onChange={onIsp} />
                  </fieldset>
                )}
                {category === "advanced" && (
                  <p className="text-xs text-muted-foreground">
                    Tasks already listed above are not repeated here. Model-specific wording appears only when the setup guide has it.
                  </p>
                )}
                {items.map((item) => (
                  <TaskRow key={item.id} task={item} checked={state.checkedIds.includes(item.id)} onToggle={onToggle} />
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}

function IspOption({
  name,
  value,
  current,
  onChange,
}: {
  name: string;
  value: IspRouting;
  current: IspRouting | null;
  onChange: (value: IspRouting) => void;
}) {
  return (
    <label className="flex min-h-11 items-center gap-2 text-sm">
      <input type="radio" name="isp-routing" checked={current === value} onChange={() => onChange(value)} />
      {name}
    </label>
  );
}

function TaskRow({ task, checked, onToggle }: { task: WizardTask; checked: boolean; onToggle: (id: string) => void }) {
  const inputId = `task-${task.id}`;
  return (
    <div className={cn("rounded-xl border px-3 py-2", checked ? "border-[#086B50]/50 bg-[#F0FDF4] text-[#0F172A]" : "border-border")}>
      <div className="flex items-start gap-2">
        <input id={inputId} type="checkbox" className="mt-1" checked={checked} onChange={() => onToggle(task.id)} />
        <div className="min-w-0 flex-1">
          <label htmlFor={inputId} className="text-sm font-medium">{task.title}</label>
          <p className="text-[11px] font-medium text-muted-foreground">{checked ? "Checked by you" : "Not checked"}</p>
        </div>
      </div>
      <details className="mt-1">
        <summary className={cn("cursor-pointer text-xs font-medium text-[#00866A]", FOCUS)}>Instructions</summary>
        <p className="mt-1 text-xs font-medium text-muted-foreground">{task.scopeLabel}</p>
        <p className="mt-1 text-sm text-muted-foreground">{task.instructions}</p>
        {task.helpUrl && task.helpLabel && (
          <a className={cn("mt-1 inline-flex text-xs font-medium text-[#00866A]", FOCUS)} href={task.helpUrl} target="_blank" rel="noopener noreferrer">
            {task.helpLabel}
          </a>
        )}
      </details>
    </div>
  );
}

function VerifyStep({ state, measured }: { state: RouterWizardState; measured: MeasuredSpeedSnapshot | null | undefined }) {
  const manufacturer = state.manufacturerId ? getRouterManufacturer(state.manufacturerId) : undefined;
  const family = manufacturer?.models.find((model) => model.id === state.modelId);
  const tasks = applicableTasks(state, tasksFor(state));
  const ids = uniqueTaskIds(tasks);
  const confirmedCount = ids.filter((id) => state.checkedIds.includes(id)).length;
  const appName = state.manufacturerId ? appNameFor(state.manufacturerId, state.modelId, state.unknownModel) : null;
  const ready = ids.length > 0 && confirmedCount === ids.length;

  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-[#14532D]">
        <p className="text-sm font-semibold">{ready ? "Checklist marked" : confirmedCount > 0 ? "Setup nearly complete" : "Ready to review"}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {manufacturer?.name ?? "No manufacturer selected"}
          {state.unknownModel ? "" : family ? ` · ${family.label}` : ""} setup progress is what you confirmed. It is not an automatic verification.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-3">
          <section className="rounded-2xl border border-border p-4" aria-labelledby="wizard-user-confirmed">
            <h3 id="wizard-user-confirmed" className="text-sm font-semibold">Setup summary</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Device</dt>
                <dd className="text-right font-medium">
                  {manufacturer?.name ?? "Not selected"}
                  {state.unknownModel ? " · model unknown" : family ? ` · ${family.label}` : ""}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Completed tasks</dt>
                <dd className="font-medium">{confirmedCount} of {ids.length}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Status</dt>
                <dd><span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">User-confirmed</span></dd>
              </div>
            </dl>
            {appName && <p className="mt-2 text-xs text-muted-foreground">Managed in the {appName}. This site cannot see that app.</p>}
            {state.exactModel && (
              <p className="mt-2 text-xs text-muted-foreground">
                Exact model you entered: {state.exactModel}. This assistant does not look up features for that model number.
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">Open Configure to see each unchecked task. Those marks stay user-confirmed.</p>
            <MeasuredLine measured={measured} />
          </section>
          <section aria-labelledby="wizard-next">
            <h3 id="wizard-next" className="text-sm font-semibold">Next steps</h3>
            <ul className="mt-2 space-y-2">
              <li>
                <Link href="/speed-test" className={cn("flex items-center justify-between rounded-xl border border-border px-3 py-3", FOCUS)}>
                  <span>
                    <span className="block text-sm font-semibold">Run Speed Test</span>
                    <span className="block text-xs text-muted-foreground">Opens the speed test. A run starts only when you press Start on that page.</span>
                  </span>
                  <ChevronDown className="h-4 w-4 -rotate-90 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
              <li>
                <Link href="/mesh-wifi/planner" className={cn("flex items-center justify-between rounded-xl border border-border px-3 py-3", FOCUS)}>
                  <span>
                    <span className="block text-sm font-semibold">Check Mesh Coverage</span>
                    <span className="block text-xs text-muted-foreground">Opens the floor planner. Coverage colors there are an estimate.</span>
                  </span>
                  <ChevronDown className="h-4 w-4 -rotate-90 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
              <li>
                <Link href="/network-health" className={cn("flex items-center justify-between rounded-xl border border-border px-3 py-3", FOCUS)}>
                  <span>
                    <span className="block text-sm font-semibold">Network Diagnostics</span>
                    <span className="block text-xs text-muted-foreground">Latency, jitter, DNS, and saved measurements. Nothing starts from this page.</span>
                  </span>
                  <ChevronDown className="h-4 w-4 -rotate-90 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            </ul>
            <ul className="mt-2 flex flex-wrap gap-2">
              {TOOL_LINKS.filter((link) => link.href !== "/network-health").map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={cn("inline-flex min-h-11 items-center rounded-full border border-border px-3 text-xs font-medium", FOCUS)}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
        <aside className="rounded-2xl border border-border p-4">
          <h3 className="text-sm font-semibold">What&apos;s next?</h3>
          <ul className="mt-3 space-y-2">
            {CATEGORIES.map((category) => {
              const items = tasks.filter((item) => item.category === category);
              if (items.length === 0) return null;
              const done = items.every((item) => state.checkedIds.includes(item.id));
              const count = items.filter((item) => state.checkedIds.includes(item.id)).length;
              return (
                <li key={category} className="flex items-start gap-2 text-sm">
                  <span
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                      done ? "border-[#16A34A] text-[#16A34A]" : "border-border text-transparent",
                    )}
                    aria-hidden="true"
                  >
                    <Check className="h-3 w-3" />
                  </span>
                  <span>
                    <span className="block font-medium">{TASK_CATEGORY_LABELS[category]}</span>
                    <span className="block text-xs text-muted-foreground">{count} of {items.length} checked by you</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <a href="#router-mesh-guide" className={cn(SECONDARY, "mt-4 w-full")}>
            View setup guide
          </a>
        </aside>
      </div>
    </div>
  );
}

function MeasuredLine({ measured }: { measured: MeasuredSpeedSnapshot | null | undefined }) {
  return (
    <div className="mt-3 border-t border-border pt-3" aria-labelledby="wizard-measured">
      <h3 id="wizard-measured" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Measured</h3>
      {measured === undefined && <p className="mt-1 text-sm text-muted-foreground">Looking for a saved speed test on this device.</p>}
      {measured === null && (
        <p className="mt-1 text-sm text-muted-foreground">
          No completed speed test is saved on this device yet. Run a Speed Test when you want a measurement. This page does not invent one.
        </p>
      )}
      {measured && (
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="font-medium text-[#16A34A]">Measured</span> from a saved speed test ({formatWhen(measured.createdAt)}). Download {speedText(measured.downloadMbps)}, upload {speedText(measured.uploadMbps)}, latency {measured.pingMs == null ? "unavailable" : `${Math.round(measured.pingMs)} ms`}. This result does not verify the router setup.
        </p>
      )}
    </div>
  );
}

function Troubleshoot({ appManaged, compact = false }: { appManaged: boolean; compact?: boolean }) {
  const topics = troubleshootingTopics(appManaged);
  return (
    <section className={cn(compact ? "mt-2 space-y-1" : "mt-3 space-y-1.5")} aria-label="Troubleshooting">
      {!compact && <h2 className="px-1 text-sm font-semibold">Troubleshooting</h2>}
      {topics.map((topic) => (
        <details key={topic.id} className="rounded-xl border border-border bg-card px-3 py-2">
          <summary className={cn("cursor-pointer text-sm font-medium", FOCUS)}>{topic.title}</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            {topic.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </details>
      ))}
    </section>
  );
}

function CategoryIcon({ category }: { category: WizardTaskCategory }) {
  const className = "h-4 w-4 text-[#00866A]";
  if (category === "mesh") return <Wifi className={className} aria-hidden="true" />;
  if (category === "security") return <Shield className={className} aria-hidden="true" />;
  return <Router className={className} aria-hidden="true" />;
}

function DeviceMark({ id, compact = false }: { id: string | null; compact?: boolean }) {
  const monogram = id ? manufacturerMonogram(id) : null;
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-2xl bg-muted font-semibold text-[#00866A]",
        compact ? "h-10 w-10 text-sm" : "mx-auto h-16 w-16 text-lg",
      )}
      aria-hidden="true"
    >
      {monogram ?? <Router className={compact ? "h-4 w-4" : "h-6 w-6"} />}
    </span>
  );
}

function ConnectionSketch({ appName, localAdmin, brand }: { appName: string | null; localAdmin: boolean; brand: string }) {
  return (
    <div className="flex items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-5" aria-hidden="true">
      <div className="w-28 rounded-[1.4rem] border-2 border-border bg-card p-2 shadow-card">
        <div className="rounded-xl bg-muted px-2 py-4 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Illustration</p>
          <p className="mt-1 text-xs font-semibold text-foreground">{localAdmin && !appName ? brand : appName ?? brand}</p>
          <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
            {localAdmin ? "Admin page opens only after you choose an address." : "Use the official app. This page does not sign in."}
          </p>
        </div>
      </div>
    </div>
  );
}

function TopologySketch({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 220 150" className="mt-2 h-auto w-full text-muted-foreground" role="img" aria-label="Example of a primary router and two satellites. Not a live network map.">
      <path d="M40 118 L110 48 L180 118 Z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M70 118 V78 H150 V118" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="110" cy="78" r="10" fill="#00866A" />
      <text x="110" y="102" textAnchor="middle" fontSize="9" fill="currentColor">Primary</text>
      <text x="110" y="114" textAnchor="middle" fontSize="8" fill="currentColor">{shortLabel(label)}</text>
      <circle cx="58" cy="118" r="7" fill="#14B8A6" />
      <text x="58" y="136" textAnchor="middle" fontSize="8" fill="currentColor">Node</text>
      <circle cx="162" cy="118" r="7" fill="#14B8A6" />
      <text x="162" y="136" textAnchor="middle" fontSize="8" fill="currentColor">Node</text>
      <path d="M68 112 Q110 96 152 112" fill="none" stroke="#00866A" strokeDasharray="3 3" strokeWidth="1.5" />
    </svg>
  );
}

function shortLabel(value: string): string {
  return value.length > 16 ? `${value.slice(0, 15)}…` : value;
}

function applicableTasks(
  state: { ispRouting: IspRouting | null },
  tasks: WizardTask[],
): WizardTask[] {
  return dedupedTasks(tasks).filter((task) => task.id !== "router:nat" || state.ispRouting !== "no");
}

function dedupedTasks(tasks: WizardTask[]): WizardTask[] {
  const seen = new Set<string>();
  return tasks.filter((task) => {
    if (seen.has(task.id)) return false;
    seen.add(task.id);
    return true;
  });
}

function speedText(value: number | null): string {
  if (value == null) return "unavailable";
  return `${value >= 100 ? value.toFixed(0) : value.toFixed(1)} Mbps`;
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "a saved test";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
