"use client";

import { Check, Gamepad, Gauge, Network, Unplug, Video, WifiOff, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AdSlot } from "@/components/ads/ad-slot";
import { useMeshPlan } from "@/components/mesh/use-mesh-plan";
import { getMeshBrand } from "@/lib/mesh/catalog";
import { summarizeRoom } from "@/lib/mesh/measurements";
import { getRouterManufacturer } from "@/lib/mesh/router-admin";
import { ROUTER_WIZARD_STORAGE_KEY, parseRouterWizardState } from "@/lib/mesh/router-wizard";
import { meshSymptomLabel, type MeshSymptom } from "@/lib/mesh/troubleshoot";
import {
  COMPARISON_CAVEAT,
  SYMPTOM_CATEGORIES,
  WIFI_SESSION_KEY,
  advanceQueue,
  backSession,
  canContinue,
  compareLocations,
  continueSession,
  emptySession,
  finishSession,
  goToStep,
  knownFromContext,
  mapBackhaul,
  parseWifiSession,
  questionsFor,
  rankRecommendations,
  resetSelection,
  sampleFromMetrics,
  sessionIsMeaningful,
  toggleCategory,
  toggleSymptom,
  withAnswer,
  withRoomAssociation,
  withVerification,
  type AssistantContext,
  type DiagnosticQuestion,
  type LocationSample,
  type VerificationStatus,
  type WifiRecommendation,
  type WifiSession,
} from "@/lib/mesh/wifi-assistant";
import { readHistory, type StoredHistoryEntry } from "@/lib/speedtest/history-store";
import { cn } from "@/lib/utils";

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00866A]";
const PRIMARY = `inline-flex min-h-11 items-center justify-center rounded-[12px] bg-[#00866A] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${FOCUS}`;
const SECONDARY = `inline-flex min-h-11 items-center justify-center rounded-[12px] border border-[#E2E8F0] bg-white px-4 text-sm font-semibold text-[#0F172A] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${FOCUS}`;
const STEP_LABELS = ["Symptoms", "Diagnose", "Recommendations"] as const;
const STEP_TITLES = ["Find What's Slowing Down Your Wi-Fi", "Diagnose", "Recommendations"] as const;

const ICONS: Record<string, LucideIcon> = {
  gauge: Gauge,
  "wifi-off": WifiOff,
  gamepad: Gamepad,
  video: Video,
  unplug: Unplug,
  network: Network,
};

const VERIFY_OPTIONS: Array<{ value: VerificationStatus; label: string }> = [
  { value: "fixed", label: "Yes, fixed" },
  { value: "improved", label: "Improved somewhat" },
  { value: "unchanged", label: "No change" },
  { value: "worse", label: "Got worse" },
  { value: "untried", label: "Haven't tried yet" },
];

export function MeshTroubleshooter() {
  const { plan, ready } = useMeshPlan();
  const [session, setSession] = useState<WifiSession | null>(null);
  const [history, setHistory] = useState<StoredHistoryEntry[] | null>(null);
  const [routerSupport, setRouterSupport] = useState<{ name: string | null; url: string | null } | null>(null);
  const [resume, setResume] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [editingSaved, setEditingSaved] = useState<string[]>([]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const announced = useRef(false);
  const step = session?.step;

  useEffect(() => {
    let next = emptySession();
    let restored = false;
    let invalid = false;
    try {
      const raw = window.localStorage.getItem(WIFI_SESSION_KEY);
      if (raw) {
        const parsed = parseWifiSession(JSON.parse(raw));
        if (parsed.ok) {
          next = parsed.session;
          restored = sessionIsMeaningful(parsed.session);
        } else {
          window.localStorage.removeItem(WIFI_SESSION_KEY);
          invalid = true;
        }
      }
    } catch {
      window.localStorage.removeItem(WIFI_SESSION_KEY);
      invalid = true;
    }
    setSession(next);
    setResume(restored);
    setRejected(invalid);

    const support = { name: null as string | null, url: null as string | null };
    try {
      const raw = window.localStorage.getItem(ROUTER_WIZARD_STORAGE_KEY);
      if (raw) {
        const parsed = parseRouterWizardState(JSON.parse(raw));
        if (parsed.ok && parsed.state.manufacturerId) {
          const guide = getRouterManufacturer(parsed.state.manufacturerId);
          if (guide?.supportUrl) {
            support.name = guide.name;
            support.url = guide.supportUrl;
          }
        }
      }
    } catch {
      support.name = null;
      support.url = null;
    }
    setRouterSupport(support);
    setHistory(readHistory());
  }, []);

  useEffect(() => {
    if (!session) return;
    const parsed = parseWifiSession(session);
    if (!parsed.ok) return;
    window.localStorage.setItem(WIFI_SESSION_KEY, JSON.stringify(parsed.session));
  }, [session]);

  useEffect(() => {
    if (step == null) return;
    if (!announced.current) {
      announced.current = true;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  if (!session || !ready || !plan || !history || !routerSupport) {
    return <p className="text-sm text-[#64748B]">Loading saved session…</p>;
  }

  const meshBrand = plan.home.brandSlug !== "generic" ? getMeshBrand(plan.home.brandSlug) : undefined;
  const supportUrl = meshBrand?.supportUrl || routerSupport.url || null;
  const supportName = meshBrand?.name ?? routerSupport.name;
  const nodes = plan.floors.flatMap((floor) => floor.nodes);
  const context: AssistantContext = {
    nodeCount: nodes.length,
    satelliteCount: nodes.filter((node) => node.role === "satellite").length,
    floors: plan.home.floors,
    backhaul: mapBackhaul(plan.home.backhaul),
    wired: plan.home.backhaul === "ethernet" || plan.home.backhaul === "moca",
    ispMbps: plan.home.ispMbps,
    brandName: supportName,
    supportUrl,
    supportLabel: supportUrl && supportName ? `Official ${supportName} support` : null,
    rooms: plan.floors.flatMap((floor) => floor.rooms.map((room) => ({
      id: room.id,
      name: room.name,
      floorName: floor.name,
      problem: room.problem,
    }))),
    measurements: plan.measurements,
  };
  const known = knownFromContext(context);
  const questions = questionsFor(session.symptoms, known, session.answers);
  const ranked = rankRecommendations({ symptoms: session.symptoms, answers: session.answers, context });
  const queue = advanceQueue(ranked, session.verifications);
  const gate = canContinue(session);
  const savedVisible = questions.saved.filter((item) => !editingSaved.includes(item.id));
  const editing = questions.saved.filter((item) => editingSaved.includes(item.id));

  function patch(next: WifiSession) {
    setSession(next);
  }

  function startNew() {
    setEditingSaved([]);
    setResume(false);
    patch(emptySession());
  }

  function clearSaved() {
    window.localStorage.removeItem(WIFI_SESSION_KEY);
    startNew();
  }

  return (
    <div className="w-full min-w-0 rounded-[16px] bg-[#F8FAFC] p-3 text-[#0F172A] sm:p-4">
      <p className="sr-only" aria-live="polite">
        Step {session.step + 1} of 3, {STEP_LABELS[session.step]}
      </p>
      {(resume || rejected) && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-[12px] border border-[#E2E8F0] bg-white px-3 py-2">
          <p className="min-w-0 flex-1 text-sm text-[#64748B]">
            {rejected ? "Saved session could not be read, so this is a new diagnosis." : "Saved session restored."}
          </p>
          <button type="button" className={SECONDARY} onClick={startNew}>Start new diagnosis</button>
          <button type="button" className={SECONDARY} onClick={clearSaved}>Clear saved session</button>
        </div>
      )}
      <Stepper session={session} onStep={(target) => patch(goToStep(session, target))} />
      <section className="mt-3 min-w-0 rounded-[14px] border border-[#E2E8F0] bg-white p-3 shadow-sm sm:p-4" aria-labelledby="wifi-step-heading">
        <h3 id="wifi-step-heading" ref={headingRef} tabIndex={-1} className="font-heading text-lg font-semibold tracking-tight outline-none">
          {STEP_TITLES[session.step]}
        </h3>
        {session.step === 0 && (
          <SymptomStep session={session} onCategory={(id) => patch(toggleCategory(session, id))} onSymptom={(id) => patch(toggleSymptom(session, id))} />
        )}
        {session.step === 1 && (
          <QuestionStep
            session={session}
            ask={[...editing.map((item) => item.question), ...questions.ask]}
            saved={savedVisible}
            notes={questions.fromSymptoms}
            onAnswer={(id, value) => patch(withAnswer(session, id, value))}
            onEdit={(id) => setEditingSaved((current) => current.includes(id) ? current : [...current, id])}
          />
        )}
        {session.step === 2 && (
          <RecommendationStep
            session={session}
            queue={queue}
            context={context}
            history={history}
            onVerify={(id, status) => patch(withVerification(session, id, status))}
            onFinish={() => patch(finishSession(session))}
            onRooms={(patchRooms) => patch(withRoomAssociation(session, patchRooms))}
          />
        )}
        <div className="sticky bottom-0 z-10 -mx-3 mt-3 flex flex-wrap items-center gap-2 border-t border-[#E2E8F0] bg-white/95 px-3 py-2 sm:-mx-4 motion-reduce:transition-none">
          {session.step === 0 && gate.reason && (
            <p id="wifi-continue-reason" className="w-full text-xs text-[#64748B]">{gate.reason}</p>
          )}
          <button type="button" className={SECONDARY} disabled={session.step === 0} onClick={() => patch(backSession(session))}>Back</button>
          {session.step === 0 && (
            <button type="button" className={SECONDARY} onClick={() => patch(resetSelection(session))}>Reset selection</button>
          )}
          {session.step < 2 && (
            <button type="button" className={PRIMARY} disabled={!gate.ok} aria-describedby={gate.reason ? "wifi-continue-reason" : undefined} onClick={() => patch(continueSession(session))}>
              Continue
            </button>
          )}
        </div>
      </section>
      <p className="mt-3 text-sm text-[#64748B]">This assistant cannot see router settings, which node a device joined, firmware, or backhaul quality.</p>
      {session.step === 2 && <AdSlot slot="mesh-troubleshooter" />}
    </div>
  );
}

function Stepper({ session, onStep }: { session: WifiSession; onStep: (step: number) => void }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium sm:hidden">Step {session.step + 1} of 3: {STEP_LABELS[session.step]}</p>
      <ol className="grid grid-cols-3 gap-1" aria-label="Troubleshooting steps">
        {STEP_LABELS.map((name, index) => {
          const current = session.step === index;
          const completed = index <= session.highestStep && !current;
          const enabled = index <= session.highestStep;
          return (
            <li key={name}>
              <button
                type="button"
                className={cn("flex min-h-11 w-full flex-col items-center justify-center gap-1 rounded-[12px] px-1 py-1 text-center", FOCUS)}
                aria-current={current ? "step" : undefined}
                disabled={!enabled}
                onClick={() => onStep(index)}
              >
                <span className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold",
                  completed && "border-[#16A34A] bg-white text-[#16A34A]",
                  current && "border-[#00866A] bg-[#00866A] text-white",
                  !completed && !current && "border-[#E2E8F0] bg-white text-[#64748B]",
                )} aria-hidden="true">
                  {completed ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span className="text-[11px] font-medium leading-tight">{name}</span>
                {completed && <span className="text-[10px] font-medium text-[#16A34A]">Done</span>}
                {current && <span className="sr-only">Current step</span>}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function SymptomStep({ session, onCategory, onSymptom }: {
  session: WifiSession;
  onCategory: (id: string) => void;
  onSymptom: (id: MeshSymptom) => void;
}) {
  return (
    <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {SYMPTOM_CATEGORIES.map((category) => {
        const open = session.openCategories.includes(category.id);
        const Icon = ICONS[category.icon] ?? Gauge;
        return (
          <li key={category.id} className="min-w-0 rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] p-2">
            <button
              type="button"
              className={cn("flex min-h-11 w-full items-start gap-2 rounded-[12px] px-2 py-2 text-left", FOCUS, open && "bg-white ring-2 ring-[#00866A]")}
              aria-pressed={open}
              onClick={() => onCategory(category.id)}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#00866A]" aria-hidden="true" />
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-heading text-sm font-semibold">{category.label}</span>
                  {open && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#00866A]">
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      Selected
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-xs leading-5 text-[#64748B]">{category.description}</span>
              </span>
            </button>
            {open && (
              <fieldset className="mt-2 space-y-1">
                <legend className="sr-only">{category.label} symptoms</legend>
                {category.symptoms.map((id) => (
                  <label key={id} className="flex min-h-11 items-center gap-2 rounded-[10px] bg-white px-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#00866A]"
                      checked={session.symptoms.includes(id)}
                      onChange={() => onSymptom(id)}
                    />
                    {meshSymptomLabel(id)}
                  </label>
                ))}
              </fieldset>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function QuestionStep({ session, ask, saved, notes, onAnswer, onEdit }: {
  session: WifiSession;
  ask: DiagnosticQuestion[];
  saved: Array<{ id: string; prompt: string; label: string }>;
  notes: Array<{ id: string; text: string }>;
  onAnswer: (id: string, value: string) => void;
  onEdit: (id: string) => void;
}) {
  return (
    <div className="mt-3 space-y-3">
      <p className="text-sm text-[#64748B]">Answer what you know. Every question can be skipped.</p>
      {notes.map((note) => (
        <p key={note.id} className="rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-sm">{note.text}</p>
      ))}
      {saved.map((item) => (
        <div key={item.id} className="rounded-[12px] border border-[#E2E8F0] px-3 py-2">
          <p className="text-sm font-medium">{item.prompt}</p>
          <p className="mt-1 text-sm text-[#64748B]">{item.label}</p>
          <button type="button" className={cn(SECONDARY, "mt-2")} onClick={() => onEdit(item.id)}>Change</button>
        </div>
      ))}
      {ask.map((question) => (
        <QuestionControl key={question.id} question={question} value={session.answers[question.id] ?? ""} onChange={(value) => onAnswer(question.id, value)} />
      ))}
    </div>
  );
}

function QuestionControl({ question, value, onChange }: {
  question: DiagnosticQuestion;
  value: string;
  onChange: (value: string) => void;
}) {
  const typed = value === "skip" || value === "not-sure" ? "" : value;
  return (
    <fieldset className="min-w-0 rounded-[12px] border border-[#E2E8F0] px-3 py-2">
      <legend className="px-1 text-sm font-medium">{question.prompt}</legend>
      {question.kind === "choice" ? (
        <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
          {question.options.map((option) => (
            <label key={option.value} className="flex min-h-11 items-center gap-2 rounded-[10px] px-1 text-sm">
              <input
                type="radio"
                name={`wifi-${question.id}`}
                className="h-4 w-4 accent-[#00866A]"
                checked={value === option.value}
                onChange={() => onChange(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            type="text"
            inputMode={question.kind === "number" ? "numeric" : "text"}
            maxLength={question.kind === "number" ? 5 : 40}
            value={typed}
            aria-label={question.prompt}
            className={cn("min-h-11 w-full min-w-0 rounded-[10px] border border-[#E2E8F0] px-3 text-sm sm:max-w-xs", FOCUS)}
            onChange={(event) => onChange(event.target.value)}
          />
          <button type="button" className={SECONDARY} aria-pressed={value === "not-sure"} onClick={() => onChange(value === "not-sure" ? "" : "not-sure")}>Not sure</button>
        </div>
      )}
      <button type="button" className={cn(SECONDARY, "mt-2")} aria-pressed={value === "skip"} onClick={() => onChange(value === "skip" ? "" : "skip")}>
        {value === "skip" ? "Skipped" : "Skip"}
      </button>
    </fieldset>
  );
}

function RecommendationStep({ session, queue, context, history, onVerify, onFinish, onRooms }: {
  session: WifiSession;
  queue: ReturnType<typeof advanceQueue>;
  context: AssistantContext;
  history: StoredHistoryEntry[];
  onVerify: (id: string, status: VerificationStatus) => void;
  onFinish: () => void;
  onRooms: (patch: Partial<WifiSession["rooms"]>) => void;
}) {
  const latest = history.find((entry) => entry.downloadMbps != null || entry.uploadMbps != null || entry.pingMs != null || entry.jitterMs != null);
  return (
    <div className="mt-3 min-w-0 space-y-3">
      {latest && (
        <p className="rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-sm text-[#64748B]">
          Latest saved speed test: {metricText("Download", latest.downloadMbps, "Mbps")}, {metricText("upload", latest.uploadMbps, "Mbps")}, {metricText("latency", latest.pingMs, "ms")}, {metricText("jitter", latest.jitterMs, "ms")}. This page did not start that test.
        </p>
      )}
      {session.completed && queue.status === "fixed" ? (
        <Completion item={queue.item} finished />
      ) : queue.status === "fixed" ? (
        <div className="space-y-3">
          <Completion item={queue.item} finished={false} />
          <button type="button" className={PRIMARY} onClick={onFinish}>Finish</button>
        </div>
      ) : queue.status === "exhausted" ? (
        <div className="rounded-[12px] border border-[#E2E8F0] p-3 text-sm">
          <p className="font-medium">These checks are marked.</p>
          <p className="mt-1 text-[#64748B]">None is marked fixed. You can start a new diagnosis or run a speed test yourself.</p>
          <Link href="/speed-test" className={cn("mt-2 inline-flex min-h-11 items-center font-medium text-[#00866A]", FOCUS)}>Run a speed test</Link>
        </div>
      ) : (
        <div className="space-y-3">
          <RecommendationCard item={queue.current} active verification={session.verifications[queue.current.id] ?? ""} onVerify={onVerify} />
          {queue.also.map((item) => (
            <RecommendationCard key={item.id} item={item} active={false} verification="" onVerify={onVerify} />
          ))}
        </div>
      )}
      <RoomCompare session={session} context={context} history={history} onRooms={onRooms} />
    </div>
  );
}

function Completion({ item, finished }: { item: WifiRecommendation; finished: boolean }) {
  return (
    <div className="rounded-[12px] border border-[#E2E8F0] p-3">
      <p className="font-heading font-semibold">{finished ? "Session finished." : "You marked this check as fixed."}</p>
      <p className="mt-1 text-sm">Possible cause: {item.possibleCause}</p>
      <p className="mt-2 text-sm text-[#64748B]">Run a speed test when you want to confirm the change. This page will not start it.</p>
      <Link href="/speed-test" className={cn("mt-2 inline-flex min-h-11 items-center font-medium text-[#00866A]", FOCUS)}>Run a confirming speed test</Link>
    </div>
  );
}

function RecommendationCard({ item, active, verification, onVerify }: {
  item: WifiRecommendation;
  active: boolean;
  verification: string;
  onVerify: (id: string, status: VerificationStatus) => void;
}) {
  return (
    <article className="min-w-0 rounded-[12px] border border-[#E2E8F0] p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Recommendation {item.priority}</p>
      <h4 className="font-heading mt-1 text-base font-semibold">{item.title}</h4>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[#64748B]">Possible cause</p>
      <p className="mt-1 text-sm">{item.possibleCause}</p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[#64748B]">Why this may be happening</p>
      <p className="mt-1 text-sm text-[#334155]">{item.why}</p>
      {item.supportingEvidence.map((line) => (
        <p key={line} className="mt-2 break-words text-sm">{line}</p>
      ))}
      {item.missingEvidence.map((line) => (
        <p key={line} className="mt-2 break-words text-sm">{line}</p>
      ))}
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[#64748B]">Worth checking</p>
      <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">
        {item.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[#64748B]">How to verify</p>
      <p className="mt-1 text-sm">{item.verification}</p>
      <Link href={item.toolHref} className={cn("mt-2 inline-flex min-h-11 items-center font-medium text-[#00866A]", FOCUS)}>{item.toolLabel}</Link>
      {item.supportHref && item.supportLabel && (
        <a className={cn("mt-1 flex min-h-11 items-center text-sm font-medium text-[#00866A]", FOCUS)} href={item.supportHref} target="_blank" rel="noopener noreferrer">{item.supportLabel}</a>
      )}
      {active && (
        <fieldset className="mt-3">
          <legend className="text-sm font-medium">Did this improve the problem?</legend>
          <div className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-2">
            {VERIFY_OPTIONS.map((option) => (
              <label key={option.value} className="flex min-h-11 items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={`verify-${item.id}`}
                  className="h-4 w-4 accent-[#00866A]"
                  checked={verification === option.value}
                  onChange={() => onVerify(item.id, option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </article>
  );
}

function RoomCompare({ session, context, history, onRooms }: {
  session: WifiSession;
  context: AssistantContext;
  history: StoredHistoryEntry[];
  onRooms: (patch: Partial<WifiSession["rooms"]>) => void;
}) {
  const rooms = roomChoices(context);
  const tests = history.filter((entry) => entry.downloadMbps != null || entry.uploadMbps != null || entry.pingMs != null || entry.jitterMs != null).slice(0, 8);
  const sampleA = sideSample("a", session, context, history, rooms);
  const sampleB = sideSample("b", session, context, history, rooms);
  const comparison = sampleA && sampleB ? compareLocations(sampleA, sampleB) : null;
  return (
    <section className="min-w-0 rounded-[12px] border border-[#E2E8F0] p-3" aria-labelledby="room-compare-heading">
      <h4 id="room-compare-heading" className="font-heading text-base font-semibold">Compare two locations</h4>
      <p className="mt-1 text-sm text-[#64748B]">{COMPARISON_CAVEAT}</p>
      <p className="mt-1 text-sm text-[#64748B]">Use a room test or speed test you already saved. Nothing starts from this page.</p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <LocationFields side="a" label="Location A" session={session} rooms={rooms} tests={tests} onRooms={onRooms} />
        <LocationFields side="b" label="Location B" session={session} rooms={rooms} tests={tests} onRooms={onRooms} />
      </div>
      {rooms.length === 0 && tests.length === 0 && (
        <p className="mt-3 text-sm">
          No saved room test or speed test is on this device.{" "}
          <Link href="/speed-test" className="font-medium text-[#00866A]">Open the speed test</Link>
          {" "}or{" "}
          <Link href="/mesh-wifi/dead-zone-test" className="font-medium text-[#00866A]">open the room test</Link>
          . Start it there when you are ready.
        </p>
      )}
      {comparison && sampleA && sampleB && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SampleCard sample={sampleA} />
          <SampleCard sample={sampleB} />
          <div className="sm:col-span-2">
            <p className="text-sm font-medium">Location A minus location B</p>
            <ul className="mt-1 space-y-1 text-sm text-[#334155]">
              <li>Download: {deltaText(comparison.downloadDeltaMbps, "Mbps")}</li>
              <li>Upload: {deltaText(comparison.uploadDeltaMbps, "Mbps")}</li>
              <li>Latency: {deltaText(comparison.pingDeltaMs, "ms")}</li>
              <li>Jitter: {deltaText(comparison.jitterDeltaMs, "ms")}</li>
            </ul>
            {sampleA.downloadMbps != null && sampleB.downloadMbps != null && (
              <DownloadBars a={sampleA} b={sampleB} />
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function LocationFields({ side, label, session, rooms, tests, onRooms }: {
  side: "a" | "b";
  label: string;
  session: WifiSession;
  rooms: Array<{ id: string; label: string }>;
  tests: StoredHistoryEntry[];
  onRooms: (patch: Partial<WifiSession["rooms"]>) => void;
}) {
  const labelKey = side === "a" ? "aLabel" : "bLabel";
  const roomKey = side === "a" ? "aRoomId" : "bRoomId";
  const historyKey = side === "a" ? "aHistoryId" : "bHistoryId";
  return (
    <div className="min-w-0 space-y-2">
      <label className="block text-sm font-medium" htmlFor={`room-label-${side}`}>{label}</label>
      <input
        id={`room-label-${side}`}
        type="text"
        maxLength={40}
        value={session.rooms[labelKey]}
        className={cn("min-h-11 w-full rounded-[10px] border border-[#E2E8F0] px-3 text-sm", FOCUS)}
        onChange={(event) => onRooms({ [labelKey]: event.target.value })}
      />
      {rooms.length > 0 && (
        <label className="block text-sm">
          <span className="text-[#64748B]">Saved room</span>
          <select
            className={cn("mt-1 min-h-11 w-full rounded-[10px] border border-[#E2E8F0] bg-white px-2 text-sm", FOCUS)}
            value={session.rooms[roomKey] ?? ""}
            onChange={(event) => onRooms({ [roomKey]: event.target.value || null, [historyKey]: null })}
          >
            <option value="">None</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>{room.label}</option>
            ))}
          </select>
        </label>
      )}
      {tests.length > 0 && (
        <label className="block text-sm">
          <span className="text-[#64748B]">Saved speed test</span>
          <select
            className={cn("mt-1 min-h-11 w-full rounded-[10px] border border-[#E2E8F0] bg-white px-2 text-sm", FOCUS)}
            value={session.rooms[historyKey] ?? ""}
            onChange={(event) => onRooms({ [historyKey]: event.target.value || null, [roomKey]: null })}
          >
            <option value="">None</option>
            {tests.map((entry) => (
              <option key={entry.id} value={entry.id}>{historyOptionLabel(entry)}</option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}

function SampleCard({ sample }: { sample: LocationSample }) {
  return (
    <div className="rounded-[12px] bg-[#F8FAFC] p-3 text-sm">
      <p className="font-medium">{sample.label || "Unlabeled location"}</p>
      <ul className="mt-1 space-y-1 text-[#334155]">
        <li>Download: {metricText("", sample.downloadMbps, "Mbps")}</li>
        <li>Upload: {metricText("", sample.uploadMbps, "Mbps")}</li>
        <li>Latency: {metricText("", sample.pingMs, "ms")}</li>
        <li>Jitter: {metricText("", sample.jitterMs, "ms")}</li>
      </ul>
    </div>
  );
}

function DownloadBars({ a, b }: { a: LocationSample; b: LocationSample }) {
  const left = a.downloadMbps ?? 0;
  const right = b.downloadMbps ?? 0;
  const max = Math.max(left, right, 0.1);
  return (
    <div className="mt-3 space-y-2" aria-hidden="true">
      <Bar label={a.label || "Location A"} value={left} max={max} />
      <Bar label={b.label || "Location B"} value={right} max={max} />
    </div>
  );
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-xs text-[#64748B]">{label}</p>
      <div className="mt-1 h-2 rounded-full bg-[#E2E8F0]">
        <div className="h-2 rounded-full bg-[#00866A]" style={{ width: `${Math.max(4, (value / max) * 100)}%` }} />
      </div>
    </div>
  );
}

function roomChoices(context: AssistantContext): Array<{ id: string; label: string }> {
  const ids = [...new Set(context.measurements.map((row) => row.roomId))];
  return ids.flatMap((id) => {
    const summary = summarizeRoom(context.measurements, id);
    if (!summary) return [];
    const room = context.rooms.find((item) => item.id === id);
    return [{ id, label: room ? `${room.floorName}: ${room.name}` : "Saved room" }];
  });
}

function sideSample(
  side: "a" | "b",
  session: WifiSession,
  context: AssistantContext,
  history: StoredHistoryEntry[],
  rooms: Array<{ id: string; label: string }>,
): LocationSample | null {
  const label = side === "a" ? session.rooms.aLabel : session.rooms.bLabel;
  const roomId = side === "a" ? session.rooms.aRoomId : session.rooms.bRoomId;
  const historyId = side === "a" ? session.rooms.aHistoryId : session.rooms.bHistoryId;
  if (roomId) {
    const summary = summarizeRoom(context.measurements, roomId);
    if (!summary) return null;
    const room = rooms.find((item) => item.id === roomId);
    return sampleFromMetrics(label || room?.label || "Saved room", summary);
  }
  if (historyId) {
    const entry = history.find((item) => item.id === historyId);
    if (!entry) return null;
    return sampleFromMetrics(label || "Saved test", entry);
  }
  return null;
}

function historyOptionLabel(entry: StoredHistoryEntry): string {
  const when = new Date(entry.createdAt);
  const stamp = Number.isNaN(when.getTime()) ? "Saved test" : when.toLocaleDateString();
  const down = entry.downloadMbps == null ? "download not saved" : `${Math.round(entry.downloadMbps)} Mbps down`;
  return `${stamp}, ${down}`;
}

function metricText(name: string, value: number | null, unit: string): string {
  const amount = value == null ? "not saved" : unit === "Mbps" ? `${Math.round(value * 10) / 10} ${unit}` : `${Math.round(value)} ${unit}`;
  return name ? `${name} ${amount}` : amount;
}

function deltaText(value: number | null, unit: string): string {
  if (value == null) return "Not saved";
  const rounded = unit === "Mbps" ? Math.round(value * 10) / 10 : Math.round(value);
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded} ${unit}`;
}
