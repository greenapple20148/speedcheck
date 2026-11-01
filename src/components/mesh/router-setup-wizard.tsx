"use client";

import { Check, Router } from "lucide-react";
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
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00866A]";
const PRIMARY = `inline-flex min-h-11 items-center justify-center rounded-[12px] bg-[#00866A] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${FOCUS}`;
const SECONDARY = `inline-flex min-h-11 items-center justify-center rounded-[12px] border border-[#E2E8F0] bg-white px-4 text-sm font-semibold text-[#0F172A] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${FOCUS}`;

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
    return <p className="mx-auto max-w-[960px] text-sm text-[#64748B]">Loading saved setup…</p>;
  }

  const gate = canContinue(state);
  const stepTitle = state.step === 3 ? "Check Your Wi-Fi Setup" : WIZARD_STEP_LABELS[state.step];
  const profile = connectionProfile(state.manufacturerId, state.modelId, state.unknownModel);

  function patch(next: RouterWizardState | null) {
    if (next) setState(next);
  }

  return (
    <div className="mx-auto w-full max-w-[960px] rounded-[16px] bg-[#F8FAFC] p-3 text-[#0F172A] sm:p-4">
      <p className="sr-only" aria-live="polite">
        Step {state.step + 1} of 4, {stepTitle}
      </p>
      <Stepper state={state} onStep={(target) => patch(goToStep(state, target))} />
      <section className="mt-3 rounded-[14px] border border-[#E2E8F0] bg-white p-3 sm:p-4" aria-labelledby="router-wizard-step-title">
        <h2 id="router-wizard-step-title" ref={headingRef} tabIndex={-1} className="font-heading text-lg font-semibold tracking-tight outline-none">
          {stepTitle}
        </h2>
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
        <div className="sticky bottom-0 z-10 -mx-3 mt-3 flex flex-wrap items-center gap-2 border-t border-[#E2E8F0] bg-white/95 px-3 py-2 backdrop-blur-sm sm:-mx-4 motion-reduce:transition-none">
          {state.step === 0 && gate.reason && (
            <p id="wizard-continue-reason" className="w-full text-xs text-[#64748B]">
              {gate.reason}
            </p>
          )}
          <button type="button" className={SECONDARY} disabled={state.step === 0} onClick={() => patch(backWizard(state))}>
            Back
          </button>
          {state.step < 3 && (
            <button
              type="button"
              className={PRIMARY}
              disabled={!gate.ok}
              aria-describedby={gate.reason ? "wizard-continue-reason" : undefined}
              onClick={() => patch(continueWizard(state))}
            >
              Continue
            </button>
          )}
        </div>
      </section>
      <Troubleshoot appManaged={!profile.showLocalAdmin && profile.method === "mobile-app"} />
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
      {notice && <p className="mt-2 text-xs text-[#64748B]" role="status">{notice}</p>}
      {!notice && resume === "saved" && <p className="mt-2 text-xs text-[#64748B]" role="status">Saved progress resumed on this device.</p>}
      {!notice && resume === "legacy" && (
        <p className="mt-2 text-xs text-[#64748B]" role="status">
          User-confirmed checklist marks from a saved mesh plan were restored.
        </p>
      )}
    </div>
  );
}

function Stepper({ state, onStep }: { state: RouterWizardState; onStep: (step: number) => void }) {
  const label = state.step === 3 ? "Check Your Wi-Fi Setup" : WIZARD_STEP_LABELS[state.step];
  return (
    <div>
      <p className="mb-2 text-sm font-medium sm:hidden">
        Step {state.step + 1} of 4: {label}
      </p>
      <ol className="grid grid-cols-4 gap-1" aria-label="Setup steps">
        {WIZARD_STEP_LABELS.map((name, index) => {
          const current = state.step === index;
          const completed = index <= state.highestStep && !current;
          const enabled = canGoToStep(state, index);
          return (
            <li key={name} className="relative">
              {index < WIZARD_STEP_LABELS.length - 1 && (
                <span
                  className={cn("absolute left-1/2 top-4 h-px w-full", index < state.step ? "bg-[#00866A]" : "bg-[#E2E8F0]")}
                  aria-hidden="true"
                />
              )}
              <button
                type="button"
                className={cn("relative z-10 flex w-full flex-col items-center gap-1 rounded-[12px] px-1 py-1 text-center", FOCUS)}
                aria-current={current ? "step" : undefined}
                disabled={!enabled}
                onClick={() => onStep(index)}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold",
                    completed && "border-[#16A34A] bg-white text-[#16A34A]",
                    current && "border-[#00866A] bg-[#00866A] text-white",
                    !completed && !current && "border-[#E2E8F0] bg-white text-[#64748B]",
                  )}
                  aria-hidden="true"
                >
                  {completed ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span className="sr-only">{index + 1}. </span>
                <span className="hidden text-[11px] font-medium leading-tight sm:block">{name}</span>
                <span className="sr-only sm:hidden">{name}</span>
                {completed && <span className="text-[10px] font-medium text-[#16A34A]">Done</span>}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
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

  return (
    <div className="mt-3 space-y-3">
      <p className="text-sm text-[#64748B]">Find the model number on the label underneath your router.</p>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {brands.map((brand) => {
          const pressed = state.manufacturerId === brand.id;
          const monogram = manufacturerMonogram(brand.id);
          return (
            <li key={brand.id}>
              <button
                type="button"
                aria-pressed={pressed}
                className={cn(
                  "flex min-h-[4.5rem] w-full flex-col items-start justify-between rounded-[14px] border bg-white p-2.5 text-left",
                  FOCUS,
                  pressed ? "border-[#00866A]" : "border-[#E2E8F0]",
                )}
                onClick={() => onManufacturer(brand.id)}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F8FAFC] text-xs font-semibold text-[#00866A]" aria-hidden="true">
                  {monogram ?? <Router className="h-3.5 w-3.5" />}
                </span>
                <span className="text-sm font-medium leading-tight">{brand.name}</span>
                {pressed && <span className="text-[11px] font-medium text-[#00866A]">Selected</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {state.manufacturerId && (
        <div className="space-y-2">
          <label htmlFor="router-model-search" className="block text-xs font-medium">
            Search model or family
          </label>
          <input
            id="router-model-search"
            value={query}
            className={cn("w-full rounded-[12px] border border-[#E2E8F0] bg-white px-3 py-2 text-sm", FOCUS)}
            autoComplete="off"
            onChange={(event) => onQuery(event.target.value)}
          />
          <p className="text-xs text-[#64748B]">These choices are product families from the setup guide, not every exact model number.</p>
          <ul className="space-y-1.5" aria-label="Model or product family">
            {filtered.map((model) => {
              const pressed = state.modelId === model.id && !state.unknownModel;
              return (
                <li key={model.id}>
                  <button
                    type="button"
                    aria-pressed={pressed}
                    className={cn(
                      "flex min-h-11 w-full items-center justify-between rounded-[12px] border px-3 text-left text-sm",
                      FOCUS,
                      pressed ? "border-[#00866A] bg-white" : "border-[#E2E8F0] bg-white",
                    )}
                    onClick={() => onModel(model.id)}
                  >
                    <span>{model.label}</span>
                    <span className="text-xs text-[#64748B]">{pressed ? "Selected family" : "Product family"}</span>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && <li className="text-sm text-[#64748B]">No family matches that search.</li>}
          </ul>
          <button
            type="button"
            aria-pressed={state.unknownModel}
            className={cn(SECONDARY, "w-full", state.unknownModel && "border-[#00866A]")}
            onClick={onUnknown}
          >
            I don&apos;t know my router model
          </button>
          {state.unknownModel && (
            <div className="rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-sm">
              <p className="font-medium">General guidance</p>
              <p className="mt-1 text-[#64748B]">You can continue without a model. The steps below stay general.</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-[#64748B]">
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
                className={cn("w-full rounded-[12px] border border-[#E2E8F0] px-3 py-2 text-sm", FOCUS)}
                onChange={(event) => onExact(event.target.value)}
              />
              <p className="text-xs text-[#64748B]">
                You selected the {selected.label} family. Enter the exact model from the label if you see it. You can continue with general {selected.label} guidance either way. This assistant does not look up features for that model number.
              </p>
            </div>
          )}
        </div>
      )}
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

  return (
    <div className="mt-3 space-y-3">
      <p className="inline-flex rounded-full border border-[#E2E8F0] px-2 py-0.5 text-xs font-medium text-[#64748B]">{profile.methodLabel}</p>
      <p className="text-sm">{profile.headline}</p>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-[#64748B]">
        {profile.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      {profile.supportUrl && profile.supportLabel && (
        <a className={cn("inline-flex text-sm font-medium text-[#00866A]", FOCUS)} href={profile.supportUrl} target="_blank" rel="noopener noreferrer">
          {profile.supportLabel}
        </a>
      )}
      {profile.showLocalAdmin && (
        <div className="space-y-2">
          <p className="text-sm text-[#64748B]">
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
          {adminUrl && confirmed && <p className="break-all text-xs text-[#64748B]">The tab will open {adminUrl}</p>}
          {openedUrl && (
            <p className="text-sm" role="status">
              A new tab was requested. That does not connect MySpeedGauge to the router.
            </p>
          )}
          <details className="rounded-[12px] border border-[#E2E8F0] px-3 py-2">
            <summary className="cursor-pointer text-sm font-medium">How do I find my router address?</summary>
            <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Operating system">
              {ADDRESS_GUIDES.map((guide) => (
                <button
                  key={guide.id}
                  type="button"
                  aria-pressed={state.selectedOs === guide.id}
                  className={cn(SECONDARY, "min-h-9 px-3 text-xs", state.selectedOs === guide.id && "border-[#00866A]")}
                  onClick={() => onOs(guide.id)}
                >
                  {guide.title}
                </button>
              ))}
            </div>
            {selectedGuide ? (
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-[#64748B]">
                {selectedGuide.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-sm text-[#64748B]">Choose Windows, macOS, iPhone/iPad, or Android.</p>
            )}
          </details>
        </div>
      )}
      <p className="rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-sm">{SECURITY_NOTICE}</p>
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
  const tasks = tasksFor(state);
  return (
    <div className="mt-3 space-y-3">
      <p className="text-sm text-[#64748B]">Checked items are user-confirmed. This page does not measure them.</p>
      {CATEGORIES.map((category) => {
        const items = tasks.filter((item) => item.category === category);
        if (category === "advanced") {
          return (
            <details key={category} className="rounded-[14px] border border-[#E2E8F0] bg-white">
              <summary className="cursor-pointer px-3 py-3 font-heading text-sm font-semibold">Advanced</summary>
              <div className="space-y-2 px-3 pb-3">
                <p className="text-xs text-[#64748B]">
                  Model-specific wording appears only when the setup guide has it. Otherwise the text is general guidance.
                </p>
                {items.map((item) => (
                  <TaskRow key={`${item.category}-${item.id}`} task={item} checked={state.checkedIds.includes(item.id)} onToggle={onToggle} />
                ))}
              </div>
            </details>
          );
        }
        return (
          <section key={category} className="space-y-2 rounded-[14px] border border-[#E2E8F0] p-3" aria-labelledby={`router-cat-${category}`}>
            <h3 id={`router-cat-${category}`} className="font-heading text-sm font-semibold">{TASK_CATEGORY_LABELS[category]}</h3>
            {category === "network" && (
              <fieldset className="space-y-1">
                <legend className="text-sm font-medium">Does the ISP gateway also route?</legend>
                <p className="text-xs text-[#64748B]">This answer shows the double NAT check here when it may apply. It is not a measurement.</p>
                <IspOption name="Yes, it also routes" value="yes" current={state.ispRouting} onChange={onIsp} />
                <IspOption name="No, this router is the only one" value="no" current={state.ispRouting} onChange={onIsp} />
                <IspOption name="I'm not sure" value="unsure" current={state.ispRouting} onChange={onIsp} />
              </fieldset>
            )}
            {items.map((item) => (
              <TaskRow key={`${item.category}-${item.id}`} task={item} checked={state.checkedIds.includes(item.id)} onToggle={onToggle} />
            ))}
          </section>
        );
      })}
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
  const inputId = `${task.category}-${task.id}`;
  return (
    <div className="rounded-[12px] border border-[#E2E8F0] px-2.5 py-2">
      <div className="flex items-start gap-2">
        <input id={inputId} type="checkbox" className="mt-1" checked={checked} onChange={() => onToggle(task.id)} />
        <div>
          <label htmlFor={inputId} className="text-sm font-medium">{task.title}</label>
          <p className="text-[11px] font-medium text-[#64748B]">User-confirmed</p>
        </div>
      </div>
      <details className="mt-1">
        <summary className="cursor-pointer text-xs font-medium text-[#00866A]">Instructions</summary>
        <p className="mt-1 text-xs font-medium text-[#64748B]">{task.scopeLabel}</p>
        <p className="mt-1 text-sm text-[#64748B]">{task.instructions}</p>
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
  const tasks = tasksFor(state);
  const ids = uniqueTaskIds(tasks);
  const confirmedCount = ids.filter((id) => state.checkedIds.includes(id)).length;
  const remaining = ids.filter((id) => !state.checkedIds.includes(id));
  const appName = state.manufacturerId ? appNameFor(state.manufacturerId, state.modelId, state.unknownModel) : null;

  return (
    <div className="mt-3 space-y-3">
      <p className="text-sm text-[#64748B]">These checks are separate. A link does not run a test, and a checked task is only your confirmation.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Link href="/speed-test" className={cn("rounded-[14px] border border-[#E2E8F0] p-3", FOCUS)}>
          <span className="block text-sm font-semibold">Run Speed Test</span>
          <span className="mt-1 block text-xs text-[#64748B]">Opens the speed test. A run starts only when you press the button on that page.</span>
        </Link>
        <Link href="/mesh-wifi/planner" className={cn("rounded-[14px] border border-[#E2E8F0] p-3", FOCUS)}>
          <span className="block text-sm font-semibold">Check Mesh Coverage</span>
          <span className="mt-1 block text-xs text-[#64748B]">Opens the floor planner. Coverage colors there are an estimate.</span>
        </Link>
      </div>
      <div>
        <h3 className="text-sm font-semibold">Troubleshoot</h3>
        <ul className="mt-1 flex flex-wrap gap-2">
          {TOOL_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={cn("inline-flex min-h-11 items-center rounded-full border border-[#E2E8F0] px-3 text-xs font-medium", FOCUS)}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <section className="rounded-[14px] border border-[#E2E8F0] p-3" aria-labelledby="wizard-user-confirmed">
          <h3 id="wizard-user-confirmed" className="text-sm font-semibold">User-confirmed</h3>
          <p className="mt-1 text-sm text-[#64748B]">
            {manufacturer?.name ?? "No manufacturer selected"}
            {state.unknownModel ? " · model unknown" : family ? ` · ${family.label}` : ""}
            {appName ? ` · ${appName}` : ""}
          </p>
          {state.exactModel && (
            <p className="mt-1 text-xs text-[#64748B]">
              Exact model you entered: {state.exactModel}. This assistant does not look up features for that model number.
            </p>
          )}
          {!state.exactModel && family && !state.unknownModel && (
            <p className="mt-1 text-xs text-[#64748B]">Exact model not entered. Guidance stays general for this family.</p>
          )}
          <p className="mt-2 text-sm">{confirmedCount} of {ids.length} checklist items checked. These marks are your confirmations.</p>
          {remaining.length > 0 && (
            <>
              <h4 className="mt-2 text-xs font-semibold uppercase tracking-wide text-[#64748B]">Remaining checks</h4>
              <ul className="mt-1 list-disc pl-4 text-sm text-[#64748B]">
                {remaining.map((id) => (
                  <li key={id}>{tasks.find((item) => item.id === id)?.title ?? id}</li>
                ))}
              </ul>
            </>
          )}
        </section>
        <section className="rounded-[14px] border border-[#E2E8F0] p-3" aria-labelledby="wizard-measured">
          <h3 id="wizard-measured" className="text-sm font-semibold">Measured</h3>
          {measured === undefined && <p className="mt-1 text-sm text-[#64748B]">Looking for a saved speed test on this device.</p>}
          {measured === null && (
            <p className="mt-1 text-sm text-[#64748B]">
              No completed speed test is saved on this device yet. Use Run Speed Test to measure this connection. This page does not simulate a result.
            </p>
          )}
          {measured && (
            <p className="mt-1 text-sm text-[#64748B]">
              <span className="font-medium text-[#16A34A]">Measured</span>, from a saved speed test on this device ({formatWhen(measured.createdAt)}). Download {speedText(measured.downloadMbps)}, upload {speedText(measured.uploadMbps)}, latency {measured.pingMs == null ? "unavailable" : `${Math.round(measured.pingMs)} ms`}. This page did not connect to the router, and this result does not verify the router setup.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function Troubleshoot({ appManaged }: { appManaged: boolean }) {
  const topics = troubleshootingTopics(appManaged);
  return (
    <section className="mt-3 space-y-1.5" aria-label="Troubleshooting">
      <h2 className="px-1 text-sm font-semibold">Troubleshooting</h2>
      {topics.map((topic) => (
        <details key={topic.id} className="rounded-[12px] border border-[#E2E8F0] bg-white px-3 py-2">
          <summary className="cursor-pointer text-sm font-medium">{topic.title}</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-[#64748B]">
            {topic.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </details>
      ))}
    </section>
  );
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
