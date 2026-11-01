"use client";

import {
  Activity,
  ArrowRight,
  Check,
  ClipboardList,
  Download,
  Gamepad,
  Gauge,
  MapPin,
  Monitor,
  Network,
  SlidersHorizontal,
  Timer,
  Unplug,
  Upload,
  Video,
  Wifi,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type RefObject } from "react";
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
  type QuestionPlan,
  type VerificationStatus,
  type WifiRecommendation,
  type WifiSession,
} from "@/lib/mesh/wifi-assistant";
import { readHistory, type StoredHistoryEntry } from "@/lib/speedtest/history-store";
import { cn } from "@/lib/utils";

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006B53] [[data-theme=dark]_&]:focus-visible:outline-[var(--ring)]";
const PRIMARY = `inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-[#006B53] px-4 text-sm font-semibold text-white hover:bg-[#064E3B] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${FOCUS} [[data-theme=dark]_&]:bg-[var(--primary)] [[data-theme=dark]_&]:text-[var(--primary-foreground)]`;
const SECONDARY = `inline-flex min-h-11 items-center justify-center rounded-full border border-[#E2E8E5] bg-white px-4 text-sm font-semibold text-[#10231F] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${FOCUS} [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-transparent [[data-theme=dark]_&]:text-foreground`;
const STEP_LABELS = ["Symptoms", "Diagnose", "Recommendations"] as const;
const STEP_TITLES = ["What are you seeing?", "Diagnose the issue", "Recommendations"] as const;
const CARD = "min-w-0 rounded-[20px] border border-[#E2E8E5] bg-white text-[#10231F] [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-card [[data-theme=dark]_&]:text-foreground";
const MUTED = "text-[#64748B] [[data-theme=dark]_&]:text-muted-foreground";
const INPUT = `min-h-11 w-full min-w-0 rounded-xl border border-[#E2E8E5] bg-white px-3 text-sm text-[#10231F] [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-[var(--input-bg)] [[data-theme=dark]_&]:text-foreground ${FOCUS}`;

const ICONS: Record<string, LucideIcon> = {
  gauge: Gauge,
  "wifi-off": WifiOff,
  gamepad: Gamepad,
  video: Video,
  unplug: Unplug,
  network: Network,
};

const QUESTION_GROUPS: Array<{ id: string; label: string; icon: LucideIcon; questionIds: string[] }> = [
  { id: "where", label: "Where it happens", icon: MapPin, questionIds: ["where", "weak-room", "other-floor"] },
  { id: "connection", label: "Connection type", icon: Wifi, questionIds: ["connection", "ethernet-compare", "ethernet-faster", "ethernet-helps-gaming", "backhaul"] },
  {
    id: "seeing",
    label: "What you're seeing",
    icon: Monitor,
    questionIds: ["when", "near-primary", "slow-near-router", "faster-near-primary", "multiple-devices", "vendor-weak", "latency-during-transfers", "gaming-pattern", "which-devices", "app-offline"],
  },
  { id: "details", label: "More details", icon: SlidersHorizontal, questionIds: ["obstructions", "isp-plan", "node-count", "after-update"] },
];

const VERIFY_OPTIONS: Array<{ value: VerificationStatus; label: string }> = [
  { value: "fixed", label: "Yes, fixed" },
  { value: "improved", label: "Improved somewhat" },
  { value: "unchanged", label: "No change" },
  { value: "worse", label: "Got worse" },
  { value: "untried", label: "Haven't tried yet" },
];

const METRICS = [
  { key: "downloadMbps", label: "Download", unit: "Mbps", icon: Download },
  { key: "uploadMbps", label: "Upload", unit: "Mbps", icon: Upload },
  { key: "pingMs", label: "Latency", unit: "ms", icon: Timer },
  { key: "jitterMs", label: "Jitter", unit: "ms", icon: Activity },
] as const;

type FlowItem = {
  id: string;
  question: DiagnosticQuestion;
  savedLabel: string | null;
  savedValue: string | null;
};

type ShownSample = LocationSample & {
  source: "room" | "history";
  testedAt: string | null;
};

export function MeshTroubleshooter() {
  const { plan, ready } = useMeshPlan();
  const [session, setSession] = useState<WifiSession | null>(null);
  const [history, setHistory] = useState<StoredHistoryEntry[] | null>(null);
  const [routerSupport, setRouterSupport] = useState<{ name: string | null; url: string | null } | null>(null);
  const [resume, setResume] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [cursorId, setCursorId] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const questionRef = useRef<HTMLHeadingElement>(null);
  const announced = useRef(false);
  const questionMoved = useRef(false);
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
    if (step === 1) questionRef.current?.focus();
    else headingRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (step !== 1) return;
    if (!questionMoved.current) {
      questionMoved.current = true;
      return;
    }
    questionRef.current?.focus();
  }, [cursorId, step]);

  if (!session || !ready || !plan || !history || !routerSupport) {
    return <p className={cn("text-sm", MUTED)}>Loading saved session…</p>;
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
  const flow = buildFlow(questions);
  const found = cursorId ? flow.findIndex((item) => item.id === cursorId) : -1;
  const index = found >= 0 ? found : 0;
  const currentQuestion = flow[index] ?? null;
  const ranked = rankRecommendations({ symptoms: session.symptoms, answers: session.answers, context });
  const queue = advanceQueue(ranked, session.verifications);
  const gate = canContinue(session);

  function patch(next: WifiSession) {
    setSession(next);
  }

  function startNew() {
    setCursorId(null);
    setResume(false);
    patch(emptySession());
  }

  function clearSaved() {
    window.localStorage.removeItem(WIFI_SESSION_KEY);
    startNew();
  }

  function onContinue() {
    if (session!.step === 0) {
      setCursorId(null);
      patch(continueSession(session!));
      return;
    }
    if (session!.step !== 1) return;
    const next = flow[index + 1];
    if (!next) {
      patch(continueSession(session!));
      return;
    }
    setCursorId(next.id);
  }

  function onBack() {
    if (session!.step === 1 && index > 0) {
      setCursorId(flow[index - 1].id);
      return;
    }
    patch(backSession(session!));
  }

  function onSkip() {
    if (!currentQuestion) return;
    const skipped = withAnswer(session!, currentQuestion.id, "skip");
    const next = flow[index + 1];
    if (!next) {
      patch(continueSession(skipped));
      return;
    }
    patch(skipped);
    setCursorId(next.id);
  }

  const lede = session.step === 0
    ? "Select every symptom that fits. You can choose more than one."
    : session.step === 1
      ? "Answer a few questions about what you're seeing. You can skip any question."
      : "These checks come from your symptoms and answers. They are possible next steps, not a confirmed cause.";

  return (
    <div className="w-full min-w-0 text-[#10231F] [[data-theme=dark]_&]:text-foreground">
      <p className="sr-only" aria-live="polite">
        Step {session.step + 1} of 3, {STEP_LABELS[session.step]}
      </p>
      {(resume || rejected) && (
        <div className={cn(CARD, "mb-3 flex flex-wrap items-center gap-2 px-3 py-2")}>
          <p className={cn("min-w-0 flex-1 text-sm", MUTED)}>
            {rejected ? "Saved session could not be read, so this is a new diagnosis." : "Saved session restored."}
          </p>
          <button type="button" className={SECONDARY} onClick={startNew}>Start new diagnosis</button>
          <button type="button" className={SECONDARY} onClick={clearSaved}>Clear saved session</button>
        </div>
      )}
      <Stepper session={session} onStep={(target) => patch(goToStep(session, target))} />
      <section className={cn(CARD, "mt-3 shadow-[0_1px_2px_rgba(16,35,31,0.04)]")} aria-labelledby="wifi-step-heading">
        <div className="px-3 pb-4 pt-3 sm:px-4 sm:pt-4">
          <h2 id="wifi-step-heading" ref={headingRef} tabIndex={-1} className="scroll-mt-24 font-heading text-lg font-semibold tracking-tight text-[#10231F] outline-none [[data-theme=dark]_&]:text-foreground">
            {STEP_TITLES[session.step]}
          </h2>
          <p className={cn("mt-1 text-sm", MUTED)}>{lede}</p>
          {session.step === 0 && (
            <SymptomStep session={session} onCategory={(id) => patch(toggleCategory(session, id))} onSymptom={(id) => patch(toggleSymptom(session, id))} />
          )}
          {session.step === 1 && (
            <DiagnoseStep
              flow={flow}
              index={index}
              session={session}
              notes={questions.fromSymptoms}
              questionRef={questionRef}
              onAnswer={(id, value) => patch(withAnswer(session, id, value))}
              onJump={(id) => setCursorId(id)}
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
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-[#E2E8E5] bg-white px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-4 [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-card">
          {session.step === 0 && gate.reason && (
            <p id="wifi-continue-reason" className={cn("w-full text-xs", MUTED)}>{gate.reason}</p>
          )}
          {session.step === 1 && currentQuestion?.question.optional && (
            <button type="button" className={SECONDARY} aria-describedby="wifi-skip-note" onClick={onSkip}>
              Skip
            </button>
          )}
          <p id="wifi-skip-note" className="sr-only">Skipping leaves the question unanswered. It does not answer no.</p>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {session.step === 0 && (
              <button type="button" className={SECONDARY} onClick={() => patch(resetSelection(session))}>Reset selection</button>
            )}
            <button type="button" className={SECONDARY} disabled={session.step === 0} onClick={onBack}>Back</button>
            {session.step < 2 && (
              <button
                type="button"
                className={PRIMARY}
                disabled={session.step === 0 && !gate.ok}
                aria-describedby={session.step === 0 && gate.reason ? "wifi-continue-reason" : undefined}
                onClick={onContinue}
              >
                Continue
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </section>
      <p className={cn("mt-3 text-sm", MUTED)}>
        This assistant cannot see router settings, which node a device joined, firmware, or backhaul quality. A speed test does not reveal RSSI, which node a device joined, or backhaul quality.
      </p>
      {session.step === 2 && <AdSlot slot="mesh-troubleshooter" />}
    </div>
  );
}

function Stepper({ session, onStep }: { session: WifiSession; onStep: (step: number) => void }) {
  return (
    <div>
      <p className={cn("mb-2 text-sm font-medium sm:hidden", MUTED)}>Step {session.step + 1} of 3: {STEP_LABELS[session.step]}</p>
      <ol className="relative grid grid-cols-3" aria-label="Troubleshooting steps">
        <span className="absolute left-[16%] right-[16%] top-4 h-px bg-[#E2E8E5] [[data-theme=dark]_&]:bg-border" aria-hidden="true" />
        {STEP_LABELS.map((name, index) => {
          const current = session.step === index;
          const done = index < session.step;
          const enabled = index <= session.highestStep;
          return (
            <li key={name} className="relative min-w-0">
              <button
                type="button"
                className={cn("flex min-h-11 w-full flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 text-center", FOCUS)}
                aria-current={current ? "step" : undefined}
                disabled={!enabled}
                onClick={() => onStep(index)}
              >
                <span className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold",
                  done && "border-[#009B78] bg-[#EAF8F1] text-[#006B53] [[data-theme=dark]_&]:border-[var(--gold-primary)] [[data-theme=dark]_&]:bg-[#10241C] [[data-theme=dark]_&]:text-[var(--accent-text)]",
                  current && "border-[#006B53] bg-[#006B53] text-white [[data-theme=dark]_&]:border-[var(--primary)] [[data-theme=dark]_&]:bg-[var(--primary)] [[data-theme=dark]_&]:text-[var(--primary-foreground)]",
                  !done && !current && "border-[#E2E8E5] bg-white text-[#64748B] [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-card [[data-theme=dark]_&]:text-muted-foreground",
                )} aria-hidden="true">
                  {done ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span className="text-[11px] font-medium leading-tight sm:text-xs">{name}</span>
                {done && <span className="text-[10px] font-semibold text-[#006B53] [[data-theme=dark]_&]:text-[var(--accent-text)]">Done</span>}
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
        const selectedCount = category.symptoms.filter((id) => session.symptoms.includes(id)).length;
        return (
          <li key={category.id} className={cn(
            "min-w-0 rounded-2xl border p-2",
            open
              ? "border-[#009B78] bg-[#EAF8F1] [[data-theme=dark]_&]:border-[var(--gold-primary)] [[data-theme=dark]_&]:bg-[#10241C]"
              : "border-[#E2E8E5] bg-[#FAFBF8] [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-transparent",
          )}>
            <button
              type="button"
              className={cn("flex min-h-11 w-full items-start gap-2 rounded-xl px-2 py-2 text-left", FOCUS)}
              aria-pressed={open}
              onClick={() => onCategory(category.id)}
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#006B53] [[data-theme=dark]_&]:bg-card [[data-theme=dark]_&]:text-[var(--accent-text)]">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-heading text-sm font-semibold">{category.label}</span>
                  {selectedCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#006B53] [[data-theme=dark]_&]:text-[var(--accent-text)]">
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      {selectedCount} selected
                    </span>
                  )}
                </span>
                <span className={cn("mt-0.5 block text-xs leading-5", MUTED)}>{category.description}</span>
              </span>
            </button>
            {open && (
              <fieldset className="mt-1 space-y-1 px-1 pb-1">
                <legend className="sr-only">{category.label} symptoms</legend>
                {category.symptoms.map((id) => {
                  const checked = session.symptoms.includes(id);
                  return (
                    <label key={id} className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-2 text-sm",
                      checked
                        ? "border-[#009B78] bg-white [[data-theme=dark]_&]:border-[var(--gold-primary)] [[data-theme=dark]_&]:bg-card"
                        : "border-transparent bg-white/70 [[data-theme=dark]_&]:bg-transparent",
                    )}>
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[#006B53]"
                        checked={checked}
                        onChange={() => onSymptom(id)}
                      />
                      {meshSymptomLabel(id)}
                    </label>
                  );
                })}
              </fieldset>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function DiagnoseStep({ flow, index, session, notes, questionRef, onAnswer, onJump }: {
  flow: FlowItem[];
  index: number;
  session: WifiSession;
  notes: Array<{ id: string; text: string }>;
  questionRef: RefObject<HTMLHeadingElement | null>;
  onAnswer: (id: string, value: string) => void;
  onJump: (id: string) => void;
}) {
  const current = flow[index] ?? null;
  return (
    <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[14.5rem_minmax(0,1fr)] lg:items-start">
      <ol className="min-w-0 space-y-1" aria-label="Question groups">
        {QUESTION_GROUPS.map((group, groupIndex) => {
          const indexes = flow.flatMap((item, itemIndex) => groupOf(item.id) === group.id ? [itemIndex] : []);
          const state = indexes.length === 0 ? "empty" : indexes.includes(index) ? "active" : indexes.every((itemIndex) => itemIndex < index) ? "done" : "upcoming";
          const Icon = group.icon;
          return (
            <li key={group.id}>
              <button
                type="button"
                className={cn(
                  "flex min-h-11 w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm",
                  FOCUS,
                  state === "active" && "bg-[#EAF8F1] font-semibold text-[#006B53] [[data-theme=dark]_&]:bg-[#10241C] [[data-theme=dark]_&]:text-[var(--accent-text)]",
                  state === "done" && "text-[#10231F] [[data-theme=dark]_&]:text-foreground",
                  state === "upcoming" && MUTED,
                  state === "empty" && "cursor-not-allowed opacity-60",
                )}
                aria-current={state === "active" ? "true" : undefined}
                disabled={state === "empty"}
                onClick={() => {
                  const first = flow.find((item) => groupOf(item.id) === group.id);
                  if (first) onJump(first.id);
                }}
              >
                <span className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                  state === "done" && "border-[#009B78] bg-[#EAF8F1] text-[#006B53] [[data-theme=dark]_&]:border-[var(--gold-primary)] [[data-theme=dark]_&]:bg-[#10241C] [[data-theme=dark]_&]:text-[var(--accent-text)]",
                  state === "active" && "border-[#006B53] bg-[#006B53] text-white [[data-theme=dark]_&]:border-[var(--primary)] [[data-theme=dark]_&]:bg-[var(--primary)] [[data-theme=dark]_&]:text-[var(--primary-foreground)]",
                  state !== "done" && state !== "active" && "border-[#E2E8E5] text-[#64748B] [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:text-muted-foreground",
                )} aria-hidden="true">
                  {state === "done" ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                </span>
                <span className="min-w-0">
                  <span className="block leading-tight">{groupIndex + 1}. {group.label}</span>
                  <span className={cn("block text-[11px] font-medium", state === "active" ? "" : MUTED)}>
                    {state === "empty" ? "No questions" : state === "done" ? "Done" : state === "active" ? "Current" : "Upcoming"}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="min-w-0">
        {notes.map((note) => (
          <p key={note.id} className="mb-2 rounded-xl border border-[#E2E8E5] bg-[#FAFBF8] px-3 py-2 text-sm [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-[var(--bg-tertiary)]">{note.text}</p>
        ))}
        {current ? (
          <QuestionControl
            item={current}
            position={index + 1}
            total={flow.length}
            value={session.answers[current.id] ?? ""}
            questionRef={questionRef}
            onChange={(value) => onAnswer(current.id, value)}
          />
        ) : (
          <p className={cn("text-sm", MUTED)}>No extra questions for these symptoms. Continue to the recommendations.</p>
        )}
      </div>
    </div>
  );
}

function QuestionControl({ item, position, total, value, questionRef, onChange }: {
  item: FlowItem;
  position: number;
  total: number;
  value: string;
  questionRef: RefObject<HTMLHeadingElement | null>;
  onChange: (value: string) => void;
}) {
  const question = item.question;
  const typed = value === "skip" || value === "not-sure" ? "" : value;
  const promptId = `wifi-q-${question.id}`;
  return (
    <div className="min-w-0">
      <p className={cn("text-xs font-semibold uppercase tracking-wide", MUTED)}>Question {position} of {total}</p>
      <h3 id={promptId} ref={questionRef} tabIndex={-1} className="mt-1 scroll-mt-24 font-heading text-base font-semibold text-[#10231F] outline-none [[data-theme=dark]_&]:text-foreground">
        {question.prompt}
      </h3>
      {value === "skip" && (
        <p className="mt-1 text-sm text-[#006B53] [[data-theme=dark]_&]:text-[var(--accent-text)]">You skipped this question.</p>
      )}
      {item.savedLabel && value === "" && (
        <p className={cn("mt-1 text-sm", MUTED)}>
          Saved on this device: {item.savedLabel} Continue keeps it. Skip does not use it.
        </p>
      )}
      {question.kind === "choice" ? (
        <div role="radiogroup" aria-labelledby={promptId} className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {question.options.map((option) => {
            const selected = value === option.value;
            return (
              <label key={option.value} className={cn(
                "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 text-sm",
                selected
                  ? "border-[#009B78] bg-[#EAF8F1] font-medium [[data-theme=dark]_&]:border-[var(--gold-primary)] [[data-theme=dark]_&]:bg-[#10241C]"
                  : "border-[#E2E8E5] bg-white hover:border-[#009B78] [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-transparent",
              )}>
                <input
                  type="radio"
                  name={`wifi-${question.id}`}
                  className="h-4 w-4 shrink-0 accent-[#006B53]"
                  checked={selected}
                  onChange={() => onChange(option.value)}
                />
                {option.label}
              </label>
            );
          })}
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="text"
            inputMode={question.kind === "number" ? "numeric" : "text"}
            maxLength={question.kind === "number" ? 5 : 40}
            value={typed}
            aria-labelledby={promptId}
            placeholder={item.savedValue && value === "" ? item.savedValue : undefined}
            className={cn(INPUT, "sm:max-w-xs")}
            onChange={(event) => onChange(event.target.value)}
          />
          <button type="button" className={SECONDARY} aria-pressed={value === "not-sure"} onClick={() => onChange(value === "not-sure" ? "" : "not-sure")}>
            Not sure
          </button>
        </div>
      )}
    </div>
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
  const active = queue.status === "active" ? queue.current : null;
  return (
    <div className="mt-3 min-w-0 space-y-3">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(240px,0.8fr)]">
        <div className="min-w-0">
          {session.completed && queue.status === "fixed" ? (
            <Completion item={queue.item} finished />
          ) : queue.status === "fixed" ? (
            <div className="space-y-3">
              <Completion item={queue.item} finished={false} />
              <button type="button" className={PRIMARY} onClick={onFinish}>Finish</button>
            </div>
          ) : queue.status === "exhausted" ? (
            <div className="rounded-2xl border border-[#E2E8E5] p-3 text-sm [[data-theme=dark]_&]:border-border">
              <p className="font-medium">These checks are marked.</p>
              <p className={cn("mt-1", MUTED)}>None is marked fixed. You can start a new diagnosis or run a speed test yourself.</p>
              <Link href="/speed-test" className={cn("mt-2 inline-flex min-h-11 items-center font-medium text-[#006B53] [[data-theme=dark]_&]:text-[var(--accent-text)]", FOCUS)}>Run a speed test</Link>
            </div>
          ) : (
            <RecommendationBody item={queue.current} />
          )}
        </div>
        <div className="min-w-0 space-y-3">
          <SavedSpeedPanel history={history} />
          {active && (
            <Feedback itemId={active.id} verification={session.verifications[active.id] ?? ""} onVerify={onVerify} />
          )}
        </div>
      </div>
      {queue.status === "active" && queue.also.map((item) => (
        <RecommendationBody key={item.id} item={item} />
      ))}
      <RoomCompare session={session} context={context} history={history} onRooms={onRooms} />
    </div>
  );
}

function Completion({ item, finished }: { item: WifiRecommendation; finished: boolean }) {
  return (
    <div className="rounded-2xl border border-[#E2E8E5] p-3 [[data-theme=dark]_&]:border-border">
      <p className="font-heading font-semibold">{finished ? "Session finished." : "You marked this check as fixed."}</p>
      <p className="mt-1 text-sm">Possible cause: {item.possibleCause}</p>
      <p className={cn("mt-2 text-sm", MUTED)}>Run a speed test when you want to confirm the change. This page will not start it.</p>
      <Link href="/speed-test" className={cn("mt-2 inline-flex min-h-11 items-center font-medium text-[#006B53] [[data-theme=dark]_&]:text-[var(--accent-text)]", FOCUS)}>Run a confirming speed test</Link>
    </div>
  );
}

function RecommendationBody({ item }: { item: WifiRecommendation }) {
  const extra = [...item.supportingEvidence, ...item.missingEvidence];
  return (
    <article className="min-w-0 rounded-2xl border border-[#E2E8E5] p-3 [[data-theme=dark]_&]:border-border">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#006B53] [[data-theme=dark]_&]:text-[var(--accent-text)]">Recommendation {item.priority}</p>
      <h3 className="font-heading mt-1 text-base font-semibold text-[#10231F] [[data-theme=dark]_&]:text-foreground">{item.title}</h3>
      <p className={cn("mt-3 text-xs font-semibold uppercase tracking-wide", MUTED)}>Possible cause</p>
      <p className="mt-1 text-sm">{item.possibleCause}</p>
      <p className={cn("mt-3 text-xs font-semibold uppercase tracking-wide", MUTED)}>Why this may be happening</p>
      <p className="mt-1 text-sm">{item.why}</p>
      <p className={cn("mt-3 text-xs font-semibold uppercase tracking-wide", MUTED)}>Worth checking</p>
      <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">
        {item.steps.map((step) => (
          <li key={step} className="break-words">{step}</li>
        ))}
      </ol>
      <p className={cn("mt-3 text-xs font-semibold uppercase tracking-wide", MUTED)}>How to verify</p>
      <p className="mt-1 text-sm">{item.verification}</p>
      <Link href={item.toolHref} className={cn(PRIMARY, "mt-3 w-fit")}>
        {item.toolLabel}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
      {item.supportHref && item.supportLabel && (
        <a className={cn("mt-1 flex min-h-11 items-center text-sm font-medium text-[#006B53] [[data-theme=dark]_&]:text-[var(--accent-text)]", FOCUS)} href={item.supportHref} target="_blank" rel="noopener noreferrer">{item.supportLabel}</a>
      )}
      {extra.length > 0 && (
        <details className="mt-3 rounded-xl border border-[#E2E8E5] px-3 py-2 [[data-theme=dark]_&]:border-border">
          <summary className="cursor-pointer text-sm font-medium">Extra detail</summary>
          <div className="mt-2 space-y-2">
            {extra.map((line) => (
              <p key={line} className="break-words text-sm">{line}</p>
            ))}
          </div>
        </details>
      )}
    </article>
  );
}

function Feedback({ itemId, verification, onVerify }: {
  itemId: string;
  verification: string;
  onVerify: (id: string, status: VerificationStatus) => void;
}) {
  return (
    <fieldset className="rounded-2xl border border-[#E2E8E5] p-3 [[data-theme=dark]_&]:border-border">
      <legend className="px-1 text-sm font-semibold">Did this improve the problem?</legend>
      <div className="mt-2 grid grid-cols-1 gap-1.5">
        {VERIFY_OPTIONS.map((option) => {
          const selected = verification === option.value;
          return (
            <label key={option.value} className={cn(
              "flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm",
              selected
                ? "border-[#009B78] bg-[#EAF8F1] [[data-theme=dark]_&]:border-[var(--gold-primary)] [[data-theme=dark]_&]:bg-[#10241C]"
                : "border-[#E2E8E5] [[data-theme=dark]_&]:border-border",
            )}>
              <input
                type="radio"
                name={`verify-${itemId}`}
                className="h-4 w-4 accent-[#006B53]"
                checked={selected}
                onChange={() => onVerify(itemId, option.value)}
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function SavedSpeedPanel({ history }: { history: StoredHistoryEntry[] }) {
  const latest = latestSpeedTest(history);
  return (
    <section className="rounded-2xl border border-[#E2E8E5] p-3 [[data-theme=dark]_&]:border-border" aria-labelledby="saved-speed-heading">
      <h3 id="saved-speed-heading" className="font-heading text-base font-semibold text-[#10231F] [[data-theme=dark]_&]:text-foreground">Latest saved speed test</h3>
      {!latest ? (
        <div className="mt-2">
          <p className="text-sm">No speed test is saved on this device.</p>
          <Link href="/speed-test" className={cn("mt-2 inline-flex min-h-11 items-center font-medium text-[#006B53] [[data-theme=dark]_&]:text-[var(--accent-text)]", FOCUS)}>Open the speed test</Link>
          <p className={cn("mt-1 text-sm", MUTED)}>Opening that page does not start a test. Start it there when you are ready.</p>
        </div>
      ) : (
        <div className="mt-2">
          <dl className="grid grid-cols-2 gap-2">
            {METRICS.map((metric) => {
              const Icon = metric.icon;
              const value = finiteMetric(latest[metric.key]);
              return (
                <div key={metric.key} className="rounded-xl bg-[#EAF8F1] px-2.5 py-2 [[data-theme=dark]_&]:bg-[var(--bg-tertiary)]">
                  <dt className={cn("flex items-center gap-1 text-xs", MUTED)}>
                    <Icon className="h-3.5 w-3.5 shrink-0 text-[#006B53] [[data-theme=dark]_&]:text-[var(--accent-text)]" aria-hidden="true" />
                    {metric.label}
                  </dt>
                  <dd className="mt-0.5 text-sm font-semibold tabular-nums">{formatMetric(value, metric.unit)}</dd>
                </div>
              );
            })}
          </dl>
          <p className={cn("mt-2 text-xs", MUTED)}>Saved {formatStamp(latest.createdAt)}</p>
          <p className={cn("mt-1 text-xs leading-5", MUTED)}>
            This app does not know the room for this speed test. It was not recorded as a test of the problem room. A speed test does not show RSSI, which node a device joined, or backhaul quality.
          </p>
        </div>
      )}
    </section>
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
    <section className="min-w-0 rounded-2xl border border-[#E2E8E5] p-3 [[data-theme=dark]_&]:border-border" aria-labelledby="room-compare-heading">
      <h3 id="room-compare-heading" className="font-heading flex items-center gap-2 text-base font-semibold text-[#10231F] [[data-theme=dark]_&]:text-foreground">
        <ClipboardList className="h-4 w-4 text-[#006B53] [[data-theme=dark]_&]:text-[var(--accent-text)]" aria-hidden="true" />
        Compare two locations
      </h3>
      <p className={cn("mt-1 text-sm", MUTED)}>{COMPARISON_CAVEAT}</p>
      <p className={cn("mt-1 text-sm", MUTED)}>Use a room test or speed test you already saved. Nothing starts from this page.</p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <LocationFields side="a" label="Location A" placeholder="e.g., Living room, Office" session={session} rooms={rooms} tests={tests} onRooms={onRooms} />
        <LocationFields side="b" label="Location B" placeholder="e.g., Bedroom, Upstairs" session={session} rooms={rooms} tests={tests} onRooms={onRooms} />
      </div>
      {rooms.length === 0 && tests.length === 0 && (
        <p className="mt-3 text-sm">
          No saved room test or speed test is on this device.{" "}
          <Link href="/speed-test" className="font-medium text-[#006B53] [[data-theme=dark]_&]:text-[var(--accent-text)]">Open the speed test</Link>
          {" "}or{" "}
          <Link href="/mesh-wifi/dead-zone-test" className="font-medium text-[#006B53] [[data-theme=dark]_&]:text-[var(--accent-text)]">open the room test</Link>
          . Start it there when you are ready.
        </p>
      )}
      {!comparison && (rooms.length > 0 || tests.length > 0) && (
        <p className={cn("mt-3 text-sm", MUTED)}>Choose a saved room test or speed test for each location to compare them. Nothing is estimated.</p>
      )}
      {comparison && sampleA && sampleB && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SampleCard sample={sampleA} />
            <SampleCard sample={sampleB} />
          </div>
          <div>
            <p className="text-sm font-medium">Location A minus location B</p>
            <ul className="mt-1 space-y-1 text-sm">
              {METRICS.map((metric) => (
                <li key={metric.key}>
                  {metric.label}: {formatDelta(comparisonValue(comparison, metric.key), metric.unit, sampleB[metric.key])}
                </li>
              ))}
            </ul>
            <CompareBars a={sampleA} b={sampleB} />
          </div>
        </div>
      )}
    </section>
  );
}

function LocationFields({ side, label, placeholder, session, rooms, tests, onRooms }: {
  side: "a" | "b";
  label: string;
  placeholder: string;
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
        placeholder={placeholder}
        value={session.rooms[labelKey]}
        className={INPUT}
        onChange={(event) => onRooms({ [labelKey]: event.target.value })}
      />
      {rooms.length > 0 && (
        <label className="block text-sm">
          <span className={MUTED}>Saved room</span>
          <select
            className={cn(INPUT, "mt-1")}
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
          <span className={MUTED}>Saved speed test</span>
          <select
            className={cn(INPUT, "mt-1")}
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

function SampleCard({ sample }: { sample: ShownSample }) {
  return (
    <div className="rounded-xl bg-[#FAFBF8] p-3 text-sm [[data-theme=dark]_&]:bg-[var(--bg-tertiary)]">
      <p className="font-medium">{sample.label || "Unlabeled location"}</p>
      <p className={cn("mt-1 text-xs leading-5", MUTED)}>
        {sample.source === "room"
          ? `Room known from a saved room test: ${sample.label || "Saved room"}.`
          : "This saved speed test has no room. It was not recorded in the problem room."}
      </p>
      {sample.testedAt && <p className={cn("text-xs", MUTED)}>Saved {formatStamp(sample.testedAt)}</p>}
      <ul className="mt-2 space-y-1">
        {METRICS.map((metric) => (
          <li key={metric.key}>{metric.label}: {formatMetric(sample[metric.key], metric.unit)}</li>
        ))}
      </ul>
    </div>
  );
}

function CompareBars({ a, b }: { a: LocationSample; b: LocationSample }) {
  const rows = METRICS.flatMap((metric) => {
    const left = a[metric.key];
    const right = b[metric.key];
    if (left == null || right == null) return [];
    return [{ label: metric.label, left, right, aLabel: a.label || "Location A", bLabel: b.label || "Location B" }];
  });
  if (rows.length === 0) return null;
  return (
    <div className="mt-3 space-y-3" aria-hidden="true">
      {rows.map((row) => {
        const max = Math.max(row.left, row.right, 0.1);
        return (
          <div key={row.label} className="min-w-0">
            <p className={cn("text-xs", MUTED)}>{row.label}</p>
            <Bar label={row.aLabel} value={row.left} max={max} />
            <Bar label={row.bLabel} value={row.right} max={max} />
          </div>
        );
      })}
    </div>
  );
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="mt-1 min-w-0">
      <p className={cn("truncate text-xs", MUTED)}>{label}</p>
      <div className="mt-1 h-2 rounded-full bg-[#E2E8E5] [[data-theme=dark]_&]:bg-border">
        <div className="h-2 rounded-full bg-[#006B53] [[data-theme=dark]_&]:bg-[var(--primary)]" style={{ width: `${Math.max(4, (value / max) * 100)}%` }} />
      </div>
    </div>
  );
}

function buildFlow(plan: QuestionPlan): FlowItem[] {
  const ask = new Map(plan.ask.map((question) => [question.id, question]));
  const saved = new Map(plan.saved.map((item) => [item.id, item]));
  const seen = new Set<string>();
  const items: FlowItem[] = [];
  const push = (id: string) => {
    if (seen.has(id)) return;
    const question = ask.get(id);
    const known = saved.get(id);
    if (!question && !known) return;
    seen.add(id);
    items.push({
      id,
      question: question ?? known!.question,
      savedLabel: known?.label ?? null,
      savedValue: known?.value ?? null,
    });
  };
  for (const group of QUESTION_GROUPS) {
    for (const id of group.questionIds) push(id);
  }
  for (const question of plan.ask) push(question.id);
  for (const item of plan.saved) push(item.id);
  return items;
}

function groupOf(questionId: string): string {
  return QUESTION_GROUPS.find((group) => group.questionIds.includes(questionId))?.id ?? "details";
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
): ShownSample | null {
  const label = side === "a" ? session.rooms.aLabel : session.rooms.bLabel;
  const roomId = side === "a" ? session.rooms.aRoomId : session.rooms.bRoomId;
  const historyId = side === "a" ? session.rooms.aHistoryId : session.rooms.bHistoryId;
  if (roomId) {
    const summary = summarizeRoom(context.measurements, roomId);
    if (!summary) return null;
    const room = rooms.find((item) => item.id === roomId);
    return {
      ...sampleFromMetrics(label || room?.label || "Saved room", summary),
      source: "room",
      testedAt: summary.testedAt,
    };
  }
  if (historyId) {
    const entry = history.find((item) => item.id === historyId);
    if (!entry) return null;
    return {
      ...sampleFromMetrics(label || "Saved test", entry),
      source: "history",
      testedAt: entry.createdAt,
    };
  }
  return null;
}

function latestSpeedTest(history: StoredHistoryEntry[]): StoredHistoryEntry | null {
  const usable = history.filter((entry) => finiteMetric(entry.downloadMbps) != null || finiteMetric(entry.uploadMbps) != null || finiteMetric(entry.pingMs) != null || finiteMetric(entry.jitterMs) != null);
  if (usable.length === 0) return null;
  return usable.reduce((best, entry) => {
    const bestTime = Date.parse(best.createdAt);
    const time = Date.parse(entry.createdAt);
    if (Number.isNaN(time)) return best;
    if (Number.isNaN(bestTime) || time > bestTime) return entry;
    return best;
  });
}

function historyOptionLabel(entry: StoredHistoryEntry): string {
  const stamp = formatStamp(entry.createdAt);
  const down = entry.downloadMbps == null ? "download not saved" : `${Math.round(entry.downloadMbps)} Mbps down`;
  return `${stamp}, ${down}`;
}

function finiteMetric(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatMetric(value: number | null, unit: string): string {
  if (value == null) return "Not saved";
  if (unit === "Mbps") return `${Math.round(value * 10) / 10} Mbps`;
  return `${Math.round(value)} ${unit}`;
}

function formatStamp(iso: string | null | undefined): string {
  if (!iso) return "Time not saved";
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return "Time not saved";
  return when.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function comparisonValue(comparison: ReturnType<typeof compareLocations>, key: (typeof METRICS)[number]["key"]): number | null {
  if (key === "downloadMbps") return comparison.downloadDeltaMbps;
  if (key === "uploadMbps") return comparison.uploadDeltaMbps;
  if (key === "pingMs") return comparison.pingDeltaMs;
  return comparison.jitterDeltaMs;
}

function formatDelta(value: number | null, unit: string, base: number | null): string {
  if (value == null) return "Not saved";
  const rounded = unit === "Mbps" ? Math.round(value * 10) / 10 : Math.round(value);
  const sign = rounded > 0 ? "+" : "";
  const absolute = `${sign}${rounded} ${unit}`;
  if (base == null || Math.abs(base) < 1) return absolute;
  const pct = Math.round((value / Math.abs(base)) * 100);
  if (!Number.isFinite(pct)) return absolute;
  const pctSign = pct > 0 ? "+" : "";
  return `${absolute} (${pctSign}${pct}%)`;
}
