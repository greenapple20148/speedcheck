/**
 * Deterministic Wi-Fi troubleshooting session.
 * Scores are sort keys only. This module does not invent measurements,
 * claim router visibility, or start a speed test.
 */

import { summarizeRoom } from "@/lib/mesh/measurements";
import { MESH_SYMPTOMS, meshSymptomLabel, type MeshSymptom } from "@/lib/mesh/troubleshoot";
import type { BackhaulChoice, RoomMeasurement } from "@/lib/mesh/types";

export const WIFI_SESSION_KEY = "myspeedgauge_wifi_troubleshoot_v1";
export const WIFI_SESSION_VERSION = 1;

export const BACKHAUL_CAVEAT =
  "A difference between two speed tests is not, by itself, proof that the link between nodes is faulty.";

export const COMPARISON_CAVEAT =
  "A difference can come from the device, interference, the time of day, and other traffic. This is not an RSSI or backhaul measurement.";

export type WizardStep = 0 | 1 | 2;
export type VerificationStatus = "fixed" | "improved" | "unchanged" | "worse" | "untried";
export type EvidenceTone = "suggests" | "missing" | "both";

export const SYMPTOM_CATEGORIES = [
  {
    id: "slow-internet",
    label: "Slow Internet",
    description: "Downloads, uploads, or general browsing feel slow.",
    icon: "gauge",
    symptoms: ["slow-wifi", "slow-upload", "below-plan"] as const,
  },
  {
    id: "coverage",
    label: "Weak Wi-Fi Coverage",
    description: "Some rooms have weak signals or dead zones.",
    icon: "wifi-off",
    symptoms: ["dead-zone", "weak-upstairs"] as const,
  },
  {
    id: "gaming",
    label: "Gaming & Latency",
    description: "Online games lag or respond slowly.",
    icon: "gamepad",
    symptoms: ["gaming"] as const,
  },
  {
    id: "streaming",
    label: "Streaming & Video Calls",
    description: "Videos buffer or calls freeze.",
    icon: "video",
    symptoms: ["streaming", "video"] as const,
  },
  {
    id: "drops",
    label: "Connection Drops",
    description: "Devices or mesh nodes disconnect unexpectedly.",
    icon: "unplug",
    symptoms: ["node-offline", "disconnects", "smart-home", "after-firmware"] as const,
  },
  {
    id: "mesh",
    label: "Mesh Network Issues",
    description: "Mesh nodes, roaming, or backhaul may be causing problems.",
    icon: "network",
    symptoms: ["double-nat", "distant-node", "slow-backhaul"] as const,
  },
] as const;

export type SymptomCategoryId = (typeof SYMPTOM_CATEGORIES)[number]["id"];

const CATEGORY_IDS = new Set<string>(SYMPTOM_CATEGORIES.map((category) => category.id));
const SYMPTOM_SET = new Set<string>(MESH_SYMPTOMS);

const SLOW: MeshSymptom[] = ["slow-wifi", "slow-upload", "below-plan"];
const NEAR: MeshSymptom[] = ["slow-backhaul", "distant-node", "dead-zone", "weak-upstairs"];
const DROPS: MeshSymptom[] = ["node-offline", "disconnects", "smart-home", "after-firmware"];
const NODE_COUNT: MeshSymptom[] = ["slow-backhaul", "distant-node", "node-offline", "double-nat", "dead-zone", "weak-upstairs"];
const BACKHAUL_Q: MeshSymptom[] = ["slow-backhaul", "distant-node", "node-offline", "dead-zone", "weak-upstairs"];

export const RECOMMENDATION_ORDER = [
  "offline",
  "firmware",
  "nat",
  "plan",
  "slow-path",
  "upload",
  "backhaul",
  "dead-zone",
  "upstairs",
  "roaming",
  "gaming",
  "video",
  "streaming",
  "disconnects",
  "smart-home",
  "dns",
] as const;

export type RecommendationId = (typeof RECOMMENDATION_ORDER)[number];

export interface QuestionOption {
  value: string;
  label: string;
}

export interface DiagnosticQuestion {
  id: string;
  prompt: string;
  kind: "choice" | "number" | "text";
  options: QuestionOption[];
  optional: true;
}

export interface SavedAnswer {
  id: string;
  prompt: string;
  label: string;
  value: string;
  question: DiagnosticQuestion;
}

export interface SymptomNote {
  id: string;
  text: string;
}

export interface QuestionPlan {
  ask: DiagnosticQuestion[];
  saved: SavedAnswer[];
  fromSymptoms: SymptomNote[];
}

export interface KnownPlanFacts {
  nodeCount: number | null;
  backhaul: "ethernet" | "wireless" | "moca" | "powerline" | null;
  ispMbps: number | null;
  rooms: Array<{ id: string; name: string; floorName: string }>;
}

export interface AssistantContext {
  nodeCount: number;
  satelliteCount: number;
  floors: number;
  backhaul: "ethernet" | "wireless" | "moca" | "powerline" | null;
  wired: boolean;
  ispMbps: number | null;
  brandName: string | null;
  supportUrl: string | null;
  supportLabel: string | null;
  rooms: Array<{ id: string; name: string; floorName: string; problem: boolean }>;
  measurements: RoomMeasurement[];
}

export interface RankInput {
  symptoms: MeshSymptom[];
  answers: Record<string, string>;
  context: AssistantContext;
}

export interface WifiRecommendation {
  id: RecommendationId;
  title: string;
  possibleCause: string;
  why: string;
  supportingEvidence: string[];
  missingEvidence: string[];
  steps: string[];
  verification: string;
  toolHref: string;
  toolLabel: string;
  supportHref: string | null;
  supportLabel: string | null;
  /** 1 is the first check. This is an order, not a probability. */
  priority: number;
}

export interface LocationSample {
  label: string;
  downloadMbps: number | null;
  uploadMbps: number | null;
  pingMs: number | null;
  jitterMs: number | null;
}

export interface LocationComparison {
  downloadDeltaMbps: number | null;
  uploadDeltaMbps: number | null;
  pingDeltaMs: number | null;
  jitterDeltaMs: number | null;
  caveat: string;
}

export interface RoomAssociations {
  aLabel: string;
  bLabel: string;
  aRoomId: string | null;
  bRoomId: string | null;
  aHistoryId: string | null;
  bHistoryId: string | null;
}

export interface WifiSession {
  schemaVersion: 1;
  step: WizardStep;
  highestStep: WizardStep;
  symptoms: MeshSymptom[];
  openCategories: SymptomCategoryId[];
  answers: Record<string, string>;
  verifications: Partial<Record<RecommendationId, VerificationStatus>>;
  rooms: RoomAssociations;
  completed: boolean;
}

export type QueueState =
  | { status: "active"; current: WifiRecommendation; also: WifiRecommendation[] }
  | { status: "fixed"; item: WifiRecommendation }
  | { status: "exhausted" };

const YES_NO: QuestionOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "not-sure", label: "Not sure" },
];

const WHERE_OPTIONS: QuestionOption[] = [
  { value: "everywhere", label: "Everywhere" },
  { value: "one-room", label: "One room" },
  { value: "several", label: "Several rooms" },
  { value: "not-sure", label: "Not sure" },
];

const CONNECTION_OPTIONS: QuestionOption[] = [
  { value: "wifi", label: "Wi-Fi" },
  { value: "ethernet", label: "Ethernet" },
  { value: "both", label: "Both" },
  { value: "not-sure", label: "Not sure" },
];

const WHEN_OPTIONS: QuestionOption[] = [
  { value: "always", label: "All the time" },
  { value: "peak", label: "During peak hours" },
  { value: "heavy-use", label: "During heavy network usage" },
  { value: "randomly", label: "Randomly" },
  { value: "not-sure", label: "Not sure" },
];

const BACKHAUL_OPTIONS: QuestionOption[] = [
  { value: "ethernet", label: "Ethernet" },
  { value: "wireless", label: "Wireless" },
  { value: "moca", label: "MoCA or coax" },
  { value: "powerline", label: "Powerline" },
  { value: "not-sure", label: "Not sure" },
];

const PATTERN_OPTIONS: QuestionOption[] = [
  { value: "intermittent", label: "Intermittent" },
  { value: "constant", label: "Constant" },
  { value: "not-sure", label: "Not sure" },
];

const DEVICE_OPTIONS: QuestionOption[] = [
  { value: "all", label: "All devices" },
  { value: "one", label: "Only one device" },
  { value: "not-sure", label: "Not sure" },
];

const SECRET_KEY = /password|credential|secret|token/i;
const IPV4 = /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/;
const SAFE_ID = /^[A-Za-z0-9_-]{1,80}$/;
const SESSION_KEYS = ["schemaVersion", "step", "highestStep", "symptoms", "openCategories", "answers", "verifications", "rooms", "completed"];
const ROOM_KEYS = ["aLabel", "bLabel", "aRoomId", "bRoomId", "aHistoryId", "bHistoryId"];
const VERIFICATION_SET = new Set<string>(["fixed", "improved", "unchanged", "worse", "untried"]);

interface QuestionDef {
  id: string;
  prompt: string;
  kind: "choice" | "number" | "text";
  options: QuestionOption[];
  applies: (symptoms: MeshSymptom[], answers: Record<string, string>) => boolean;
  saved?: (known: KnownPlanFacts) => { value: string; label: string } | null;
  optionsFor?: (known: KnownPlanFacts) => QuestionOption[];
  kindFor?: (known: KnownPlanFacts) => "choice" | "number" | "text";
}

function intersects(symptoms: MeshSymptom[], group: readonly MeshSymptom[]): boolean {
  return symptoms.some((id) => group.includes(id));
}

function wiredChoice(value: string | null | undefined): boolean {
  return value === "ethernet" || value === "moca";
}

const QUESTION_DEFS: QuestionDef[] = [
  {
    id: "where",
    prompt: "Where does the problem occur?",
    kind: "choice",
    options: WHERE_OPTIONS,
    applies: (symptoms) => symptoms.length > 0,
  },
  {
    id: "connection",
    prompt: "How is the affected device connected?",
    kind: "choice",
    options: CONNECTION_OPTIONS,
    applies: (symptoms) => symptoms.length > 0,
  },
  {
    id: "when",
    prompt: "When does the problem happen?",
    kind: "choice",
    options: WHEN_OPTIONS,
    applies: (symptoms) => symptoms.length > 0,
  },
  {
    id: "near-primary",
    prompt: "Is the problem also present right beside the primary router?",
    kind: "choice",
    options: YES_NO,
    applies: (symptoms) => intersects(symptoms, SLOW) && intersects(symptoms, NEAR),
  },
  {
    id: "slow-near-router",
    prompt: "Is the speed also slow right beside the main router?",
    kind: "choice",
    options: YES_NO,
    applies: (symptoms) => intersects(symptoms, SLOW) && !intersects(symptoms, NEAR),
  },
  {
    id: "faster-near-primary",
    prompt: "Does performance improve near the primary router?",
    kind: "choice",
    options: YES_NO,
    applies: (symptoms) => intersects(symptoms, NEAR) && !intersects(symptoms, SLOW),
  },
  {
    id: "ethernet-compare",
    prompt: "Does a wired connection perform better than Wi-Fi?",
    kind: "choice",
    options: YES_NO,
    applies: (symptoms, answers) => intersects(symptoms, SLOW) && symptoms.includes("gaming") && answers.connection !== "ethernet",
  },
  {
    id: "ethernet-faster",
    prompt: "Is a wired connection faster than Wi-Fi?",
    kind: "choice",
    options: YES_NO,
    applies: (symptoms, answers) => intersects(symptoms, SLOW) && !symptoms.includes("gaming") && answers.connection !== "ethernet",
  },
  {
    id: "ethernet-helps-gaming",
    prompt: "Does gaming improve when the device is connected with Ethernet?",
    kind: "choice",
    options: YES_NO,
    applies: (symptoms, answers) => symptoms.includes("gaming") && !intersects(symptoms, SLOW) && answers.connection !== "ethernet",
  },
  {
    id: "multiple-devices",
    prompt: "Is the issue present on more than one device?",
    kind: "choice",
    options: YES_NO,
    applies: (symptoms) => intersects(symptoms, SLOW),
  },
  {
    id: "isp-plan",
    prompt: "What download speed does your ISP plan advertise?",
    kind: "number",
    options: [],
    applies: (symptoms) => intersects(symptoms, SLOW),
    saved: (known) => known.ispMbps == null ? null : {
      value: String(known.ispMbps),
      label: `Saved plan download: ${known.ispMbps} Mbps. That number was entered here. It is not a new measurement.`,
    },
  },
  {
    id: "node-count",
    prompt: "How many mesh nodes are installed?",
    kind: "number",
    options: [],
    applies: (symptoms) => intersects(symptoms, NODE_COUNT),
    saved: (known) => known.nodeCount == null ? null : {
      value: String(known.nodeCount),
      label: `Saved mesh plan: ${known.nodeCount} ${known.nodeCount === 1 ? "node" : "nodes"}. That count was entered in the planner, not read from the router.`,
    },
  },
  {
    id: "backhaul",
    prompt: "Are the nodes connected with Ethernet or wireless backhaul?",
    kind: "choice",
    options: BACKHAUL_OPTIONS,
    applies: (symptoms) => intersects(symptoms, BACKHAUL_Q),
    saved: (known) => {
      if (!known.backhaul) return null;
      const labels: Record<string, string> = { ethernet: "Ethernet", wireless: "Wireless", moca: "MoCA or coax", powerline: "Powerline" };
      return {
        value: known.backhaul,
        label: `Saved backhaul: ${labels[known.backhaul]}. That choice was entered here. It was not read from the router.`,
      };
    },
  },
  {
    id: "vendor-weak",
    prompt: "Does the vendor app show a weak link between nodes?",
    kind: "choice",
    options: YES_NO,
    applies: (symptoms) => symptoms.includes("slow-backhaul") || symptoms.includes("distant-node") || symptoms.includes("node-offline"),
  },
  {
    id: "weak-room",
    prompt: "Which room has the weak coverage?",
    kind: "text",
    options: [],
    applies: (symptoms) => symptoms.includes("dead-zone") || symptoms.includes("weak-upstairs"),
    kindFor: (known) => known.rooms.length > 0 ? "choice" : "text",
    optionsFor: (known) => known.rooms.length === 0 ? [] : [
      ...known.rooms.map((room) => ({ value: room.id, label: `${room.floorName}: ${room.name}` })),
      { value: "not-sure", label: "Not sure" },
    ],
  },
  {
    id: "other-floor",
    prompt: "Is the problem on another floor?",
    kind: "choice",
    options: YES_NO,
    applies: (symptoms) => symptoms.includes("dead-zone") || symptoms.includes("weak-upstairs"),
  },
  {
    id: "obstructions",
    prompt: "Are there thick walls, floors, or other major obstructions in the way?",
    kind: "choice",
    options: YES_NO,
    applies: (symptoms) => symptoms.includes("dead-zone") || symptoms.includes("weak-upstairs"),
  },
  {
    id: "latency-during-transfers",
    prompt: "Is latency high only while something is downloading or uploading?",
    kind: "choice",
    options: YES_NO,
    applies: (symptoms) => symptoms.includes("gaming"),
  },
  {
    id: "gaming-pattern",
    prompt: "Is the gaming issue intermittent or constant?",
    kind: "choice",
    options: PATTERN_OPTIONS,
    applies: (symptoms) => symptoms.includes("gaming"),
  },
  {
    id: "which-devices",
    prompt: "Do all devices disconnect, or only one?",
    kind: "choice",
    options: DEVICE_OPTIONS,
    applies: (symptoms) => intersects(symptoms, DROPS),
  },
  {
    id: "app-offline",
    prompt: "Does the vendor app show a node offline?",
    kind: "choice",
    options: YES_NO,
    applies: (symptoms) => (symptoms.includes("disconnects") || symptoms.includes("smart-home")) && !symptoms.includes("node-offline"),
  },
  {
    id: "after-update",
    prompt: "Did the issue begin after a firmware update?",
    kind: "choice",
    options: YES_NO,
    applies: (symptoms) => intersects(symptoms, DROPS) && !symptoms.includes("after-firmware"),
  },
];

const QUESTION_INDEX = new Map(QUESTION_DEFS.map((def) => [def.id, def]));

function toQuestion(def: QuestionDef, known: KnownPlanFacts): DiagnosticQuestion {
  return {
    id: def.id,
    prompt: def.prompt,
    kind: def.kindFor?.(known) ?? def.kind,
    options: def.optionsFor?.(known) ?? def.options,
    optional: true,
  };
}

export function questionsFor(symptoms: MeshSymptom[], known: KnownPlanFacts, answers: Record<string, string> = {}): QuestionPlan {
  const ask: DiagnosticQuestion[] = [];
  const saved: SavedAnswer[] = [];
  for (const def of QUESTION_DEFS) {
    if (!def.applies(symptoms, answers)) continue;
    const question = toQuestion(def, known);
    const savedValue = def.saved?.(known) ?? null;
    if (savedValue && answers[def.id] == null) {
      saved.push({ id: def.id, prompt: def.prompt, label: savedValue.label, value: savedValue.value, question });
    } else {
      ask.push(question);
    }
  }
  const fromSymptoms: SymptomNote[] = [];
  if (symptoms.includes("after-firmware")) {
    fromSymptoms.push({
      id: "after-update",
      text: "You selected “Problems after a firmware update,” so this session treats the timing as after an update.",
    });
  }
  if (symptoms.includes("node-offline")) {
    fromSymptoms.push({
      id: "app-offline",
      text: "You selected “Mesh node offline.” This page still cannot see the node. The vendor app is where that status is shown.",
    });
  }
  return { ask, saved, fromSymptoms };
}

export function emptyKnown(): KnownPlanFacts {
  return { nodeCount: null, backhaul: null, ispMbps: null, rooms: [] };
}

export function emptyContext(): AssistantContext {
  return {
    nodeCount: 0,
    satelliteCount: 0,
    floors: 1,
    backhaul: null,
    wired: false,
    ispMbps: null,
    brandName: null,
    supportUrl: null,
    supportLabel: null,
    rooms: [],
    measurements: [],
  };
}

export function knownFromContext(context: AssistantContext): KnownPlanFacts {
  return {
    nodeCount: context.nodeCount > 0 ? context.nodeCount : null,
    backhaul: context.backhaul,
    ispMbps: context.ispMbps != null && context.ispMbps > 0 ? context.ispMbps : null,
    rooms: context.rooms.map((room) => ({ id: room.id, name: room.name, floorName: room.floorName })),
  };
}

export function mapBackhaul(value: BackhaulChoice | null | undefined): AssistantContext["backhaul"] {
  if (value === "ethernet" || value === "moca" || value === "powerline") return value;
  if (value === "wireless-shared" || value === "wireless-dedicated") return "wireless";
  return null;
}

function resolvedAnswers(symptoms: MeshSymptom[], known: KnownPlanFacts, answers: Record<string, string>): Record<string, string> {
  const resolved: Record<string, string> = {};
  for (const def of QUESTION_DEFS) {
    if (!def.applies(symptoms, answers)) continue;
    const user = answers[def.id];
    if (user === "skip" || user === "not-sure") continue;
    if (user && isAllowedAnswer(def.id, user)) {
      resolved[def.id] = user;
      continue;
    }
    const saved = def.saved?.(known);
    if (saved) resolved[def.id] = saved.value;
  }
  return resolved;
}

function problemBesidePrimary(answers: Record<string, string>): "yes" | "no" | null {
  const near = answers["near-primary"] ?? answers["slow-near-router"];
  if (near === "yes" || near === "no") return near;
  const faster = answers["faster-near-primary"];
  if (faster === "yes") return "no";
  if (faster === "no") return "yes";
  return null;
}

function ethernetBetter(answers: Record<string, string>): "yes" | "no" | null {
  const value = answers["ethernet-compare"] ?? answers["ethernet-faster"] ?? answers["ethernet-helps-gaming"];
  if (value === "yes" || value === "no") return value;
  return null;
}

interface NamedSummary {
  name: string;
  downloadMbps: number | null;
  uploadMbps: number | null;
  pingMs: number | null;
  jitterMs: number | null;
}

function namedSummaries(context: AssistantContext): NamedSummary[] {
  const ids = [...new Set(context.measurements.map((row) => row.roomId))];
  return ids.flatMap((roomId) => {
    const summary = summarizeRoom(context.measurements, roomId);
    if (!summary) return [];
    const room = context.rooms.find((item) => item.id === roomId);
    return [{
      name: room ? `${room.floorName}: ${room.name}` : "Saved room",
      downloadMbps: summary.downloadMbps,
      uploadMbps: summary.uploadMbps,
      pingMs: summary.pingMs,
      jitterMs: summary.jitterMs,
    }];
  });
}

function roomGap(measured: NamedSummary[]): { worst: { name: string; downloadMbps: number }; best: number } | null {
  const rows = measured.filter((row): row is NamedSummary & { downloadMbps: number } => row.downloadMbps != null && row.downloadMbps > 0);
  if (rows.length < 2) return null;
  const best = Math.max(...rows.map((row) => row.downloadMbps));
  const worst = rows.reduce((slow, row) => (row.downloadMbps < slow.downloadMbps ? row : slow));
  if (best <= 0 || worst.downloadMbps / best >= 0.4) return null;
  return { worst, best };
}

function formatMbps(value: number): string {
  return `${Math.round(value * 10) / 10} Mbps`;
}

function formatMs(value: number): string {
  return `${Math.round(value)} ms`;
}

function supportOf(context: AssistantContext): { supportHref: string | null; supportLabel: string | null } {
  if (!context.supportUrl) return { supportHref: null, supportLabel: null };
  return { supportHref: context.supportUrl, supportLabel: context.supportLabel ?? "Official support" };
}

function card(
  id: RecommendationId,
  title: string,
  possibleCause: string,
  why: string,
  supportingEvidence: string[],
  missingEvidence: string[],
  steps: string[],
  verification: string,
  toolHref: string,
  toolLabel: string,
  context: AssistantContext,
  withSupport = false,
): WifiRecommendation {
  const support = withSupport ? supportOf(context) : { supportHref: null, supportLabel: null };
  return {
    id,
    title,
    possibleCause,
    why,
    supportingEvidence,
    missingEvidence,
    steps,
    verification,
    toolHref,
    toolLabel,
    ...support,
    priority: 0,
  };
}

function noMeasurement(detail: string): string[] {
  return [`Not enough information yet. ${detail}`];
}

interface BuiltInput {
  symptoms: MeshSymptom[];
  answers: Record<string, string>;
  context: AssistantContext;
  summaries: NamedSummary[];
  gap: ReturnType<typeof roomGap>;
  beside: "yes" | "no" | null;
  wiredBetter: "yes" | "no" | null;
  nodes: number;
  satellites: number;
  backhaul: AssistantContext["backhaul"];
  wired: boolean;
  ispMbps: number | null;
}

function prepare(input: RankInput): BuiltInput {
  const known = knownFromContext(input.context);
  const answers = resolvedAnswers(input.symptoms, known, input.answers);
  const summaries = namedSummaries(input.context);
  const nodes = answers["node-count"] && /^\d+$/.test(answers["node-count"]) ? Number(answers["node-count"]) : input.context.nodeCount;
  const backhaul = (answers.backhaul as AssistantContext["backhaul"]) || input.context.backhaul;
  const ispRaw = answers["isp-plan"];
  const ispMbps = ispRaw && /^\d+$/.test(ispRaw) ? Number(ispRaw) : input.context.ispMbps;
  const satellites = answers["node-count"] ? Math.max(0, nodes - 1) : input.context.satelliteCount;
  return {
    symptoms: input.symptoms,
    answers,
    context: input.context,
    summaries,
    gap: roomGap(summaries),
    beside: problemBesidePrimary(answers),
    wiredBetter: ethernetBetter(answers),
    nodes,
    satellites,
    backhaul,
    wired: wiredChoice(backhaul) || (backhaul == null && input.context.wired),
    ispMbps: ispMbps != null && ispMbps > 0 ? ispMbps : null,
  };
}

function weakRoomLabel(input: BuiltInput): string | null {
  const value = input.answers["weak-room"];
  if (!value) return null;
  const room = input.context.rooms.find((item) => item.id === value);
  if (room) return `${room.floorName}: ${room.name}`;
  return value;
}

function gapSentence(input: BuiltInput, suffix: string): string | null {
  if (!input.gap) return null;
  return `Evidence suggests ${input.gap.worst.name} has a saved median download of ${formatMbps(input.gap.worst.downloadMbps)} against ${formatMbps(input.gap.best)} in the fastest saved room. ${suffix}`;
}

function highLatency(input: BuiltInput): NamedSummary | null {
  return input.summaries.find((row) => (row.pingMs != null && row.pingMs > 50) || (row.jitterMs != null && row.jitterMs > 20)) ?? null;
}

function lowUpload(input: BuiltInput): NamedSummary | null {
  return input.summaries.find((row) => row.uploadMbps != null && row.uploadMbps < 5 && (row.downloadMbps ?? 0) >= 25) ?? null;
}

function appliesRecommendation(id: RecommendationId, input: BuiltInput): boolean {
  const { symptoms } = input;
  switch (id) {
    case "slow-path":
      return symptoms.includes("slow-wifi");
    case "upload":
      return symptoms.includes("slow-upload");
    case "plan":
      return symptoms.includes("below-plan");
    case "dead-zone":
      return symptoms.includes("dead-zone");
    case "upstairs":
      return symptoms.includes("weak-upstairs") || (input.context.floors > 1 && symptoms.includes("slow-wifi")) || input.answers["other-floor"] === "yes";
    case "backhaul":
      return symptoms.includes("slow-backhaul") || (!input.wired && input.nodes >= 2 && (symptoms.includes("slow-wifi") || symptoms.includes("streaming")));
    case "gaming":
      return symptoms.includes("gaming");
    case "streaming":
      return symptoms.includes("streaming");
    case "video":
      return symptoms.includes("video");
    case "offline":
      return symptoms.includes("node-offline");
    case "disconnects":
      return symptoms.includes("disconnects");
    case "smart-home":
      return symptoms.includes("smart-home");
    case "firmware":
      return symptoms.includes("after-firmware") || input.answers["after-update"] === "yes";
    case "nat":
      return symptoms.includes("double-nat");
    case "roaming":
      return symptoms.includes("distant-node");
    case "dns":
      return (symptoms.includes("slow-wifi") || symptoms.includes("below-plan") || symptoms.includes("video"))
        && (input.answers.where === "everywhere" || input.beside === "yes" || input.answers.connection === "ethernet");
    default:
      return false;
  }
}

function scoreOf(id: RecommendationId, input: BuiltInput): number {
  const direct: Partial<Record<RecommendationId, MeshSymptom>> = {
    "slow-path": "slow-wifi",
    upload: "slow-upload",
    plan: "below-plan",
    "dead-zone": "dead-zone",
    upstairs: "weak-upstairs",
    backhaul: "slow-backhaul",
    gaming: "gaming",
    streaming: "streaming",
    video: "video",
    offline: "node-offline",
    disconnects: "disconnects",
    "smart-home": "smart-home",
    firmware: "after-firmware",
    nat: "double-nat",
    roaming: "distant-node",
  };
  let score = direct[id] && input.symptoms.includes(direct[id]) ? 100 : id === "dns" ? 40 : 70;
  const where = input.answers.where;
  const local = id === "dead-zone" || id === "upstairs" || id === "roaming";
  if (local && where === "one-room") score += 24;
  if (local && where === "several") score += 12;
  if (local && input.beside === "no") score += 16;
  if ((id === "dead-zone" || id === "upstairs") && input.answers["other-floor"] === "yes") score += 16;
  if ((id === "dead-zone" || id === "upstairs") && input.answers.obstructions === "yes") score += 10;
  if (id === "slow-path" || id === "plan" || id === "dns") {
    if (where === "everywhere") score += 24;
    if (input.beside === "yes") score += 24;
    if (input.wiredBetter === "no") score += 16;
    if (input.answers.connection === "ethernet") score += 16;
    if (input.answers.when === "peak" || input.answers.when === "heavy-use") score += 8;
    if (input.answers["multiple-devices"] === "yes") score += 8;
  }
  if (id === "backhaul") {
    if (input.answers.connection === "wifi") score += 8;
    if (input.beside === "no") score += 12;
    if (input.answers["vendor-weak"] === "yes") score += 16;
    if (input.backhaul === "wireless") score += 8;
  }
  if (id === "gaming" && input.answers["latency-during-transfers"] === "yes") score += 12;
  if (id === "gaming" && input.answers["gaming-pattern"] === "constant") score += 4;
  if (id === "firmware" && (input.answers["after-update"] === "yes" || input.symptoms.includes("after-firmware"))) score += 8;
  if (id === "offline" && input.answers["app-offline"] === "yes") score += 24;
  if (id === "upload" && input.wiredBetter === "yes") score += 8;
  if ((id === "dead-zone" || id === "streaming" || id === "slow-path" || id === "upstairs") && input.gap) score += 18;
  if ((id === "gaming" || id === "video") && highLatency(input)) score += 18;
  if (id === "upload" && lowUpload(input)) score += 18;
  return score;
}

function buildRecommendation(id: RecommendationId, input: BuiltInput): WifiRecommendation {
  const named = weakRoomLabel(input);
  switch (id) {
    case "slow-path": {
      const gap = gapSentence(input, "These are speed-test medians, not a signal reading.");
      const beside = input.beside;
      const cause = beside === "yes"
        ? "The limit may be at the primary node or the ISP, because you said the problem is also there."
        : beside === "no"
          ? "The slow spot may be farther along the Wi-Fi path than the primary node."
          : "The slowdown may be on Wi-Fi, on the connection to your ISP, or both.";
      const why = beside === "no"
        ? `You said the problem is not the same beside the primary router. Two tests can check that pattern. ${BACKHAUL_CAVEAT}`
        : "A test in one room cannot show whether the same limit exists beside the primary node.";
      return card(id, "Compare the primary node with the slow spot", cause, why, gap ? [gap] : [], gap ? [] : noMeasurement("No room test is saved on this device."), [
        "Start a speed test beside the primary node. This page will not start it for you.",
        "Start the same test in the spot that feels slow, on the same device, with other large downloads paused.",
        "Compare download, upload, and latency. A gap is not a signal-strength reading.",
      ], "If the test beside the primary node is already slow, another mesh node is unlikely to fix it. If only the far spot is slow, check placement next.", "/speed-test", "Run a speed test", input.context);
    }
    case "upload": {
      const low = lowUpload(input);
      const measured = input.summaries.find((row) => row.uploadMbps != null);
      const supporting = low && low.uploadMbps != null && low.downloadMbps != null
        ? [`Evidence suggests ${low.name} has a saved median upload of ${formatMbps(low.uploadMbps)} beside download ${formatMbps(low.downloadMbps)}.`]
        : measured?.uploadMbps != null
          ? [`Evidence suggests ${measured.name} has a saved median upload of ${formatMbps(measured.uploadMbps)}. Upload has not been measured as low beside a faster download.`]
          : [];
      return card(id, "Check upload on its own", low ? "A saved room median shows low upload beside a faster download." : "Upload has not been shown to be the limit yet.", "Upload can be busy with backups while download still looks fine. This page only knows upload from a test you already saved.", supporting, supporting.length ? [] : noMeasurement("Upload has not been measured on a saved room test."), [
        "Pause cloud backups and other uploads.",
        "Start a speed test and read the upload result. This page will not start it.",
        "Compare that upload with the rate on the ISP plan you were given.",
      ], "If upload stays low beside the primary node as well, the limit is not a distant mesh node.", "/upload-speed-test", "Test upload speed", input.context);
    }
    case "plan": {
      const supporting: string[] = [];
      const missing: string[] = [];
      if (input.ispMbps != null) {
        supporting.push(`You entered an ISP plan of ${formatMbps(input.ispMbps)}. That number was typed here. It is not a measurement of the current connection.`);
      }
      const gap = gapSentence(input, "A lower room median is not proof the ISP is delivering less than the plan.");
      if (gap) supporting.push(gap);
      if (supporting.length === 0) missing.push(...noMeasurement("No plan speed and no room test are saved, so this cannot say the connection is below the plan."));
      return card(id, "Compare a wired check with the plan you were sold", "A Wi-Fi test in a far room is often lower than the speed at the modem.", "The plan number and a room test answer different questions. One was typed in. The other is a speed test from a place in the home.", supporting, missing, [
        "Start a speed test with a computer plugged into the primary node, or into the gateway if the mesh is in access-point mode.",
        "Compare that result with the weak room and with the plan number you entered.",
      ], "If the wired test matches the plan you entered and the far room does not, the gap is inside the home. If the wired test is also low, another node will not raise it.", "/speed-test", "Run a speed test", input.context);
    }
    case "dead-zone": {
      const gap = gapSentence(input, "These are speed-test medians, not a signal reading. Planner colors stay an estimate.");
      const notes = input.context.rooms.filter((room) => room.problem).map((room) => `You marked ${room.floorName}: ${room.name} as a problem area in the planner. That mark is a note you saved, not a signal reading.`);
      const place = named ? ` You named the weak spot as “${named}.”` : "";
      return card(id, "Retest the weak room against the primary node", gap ? "One saved room’s median download is much lower than another." : "A slow room is not proof of a weak Wi-Fi signal.", `A room can feel slow because of distance, walls, interference, or the device itself.${place} Planner colors are an estimate, not a measured signal map.`, [...(gap ? [gap] : []), ...notes], gap || notes.length ? [] : noMeasurement("No pair of saved room tests shows a download gap."), [
        "Start a test in the slow room and a test beside the primary node, on the same device.",
        "Move one node only after both results are saved. Do not add a node first.",
      ], "Save both medians and compare them. If they match, the room is not the limit those tests can see.", "/mesh-wifi/dead-zone-test", "Open the room test", input.context);
    }
    case "upstairs": {
      const gap = gapSentence(input, "These are speed-test medians, not a signal reading.");
      const floorNote = input.context.floors > 1 ? `The saved plan lists ${input.context.floors} floors.` : "";
      return card(id, "Check the path between floors", "Floors and stairwells often block more than an open hallway on the same level.", `${floorNote} A node on the upper floor usually belongs near the stair opening, not in a far bedroom, unless that bedroom is the only priority. Planner colors are an estimate, not a signal reading.`.trim(), gap ? [gap] : [], gap ? [] : noMeasurement("No upstairs and downstairs room tests are saved yet."), [
        "Start a room test upstairs and downstairs without moving anything else.",
        "If the upstairs result is the slow one, move one node toward the stair opening and test again.",
      ], "Keep the device and the test the same so the two results can be compared.", "/mesh-wifi/planner", "Open the floor planner", input.context);
    }
    case "backhaul": {
      const gap = input.gap
        ? `Evidence suggests ${input.gap.worst.name} has a saved median download of ${formatMbps(input.gap.worst.downloadMbps)} against ${formatMbps(input.gap.best)} in the fastest saved room. These are speed-test medians, not a backhaul reading. ${BACKHAUL_CAVEAT}`
        : null;
      const saved = input.backhaul ? `The saved backhaul choice is ${input.backhaul}. That value was entered here. It was not read from the router.` : "";
      return card(id, "Check the link between nodes", "The link between nodes is worth checking.", `Wireless hops share airtime with your devices unless that model has a radio dedicated to the hop. ${BACKHAUL_CAVEAT} ${saved}`.trim(), gap ? [gap] : [], gap ? [] : noMeasurement("No pair of saved room tests is available, and this page cannot see backhaul quality."), [
        "Start a speed test beside the primary node, then start another near the satellite on the same device.",
        "Read the link status in the vendor app. This page cannot see it.",
        input.wired ? "Confirm the cable is in a LAN port that model uses for backhaul, then retest." : "Shorten the distance between nodes, or use Ethernet if a cable path already exists.",
      ], "If the two speed tests differ, that supports a closer look at placement. It does not prove the backhaul is faulty.", "/mesh-wifi/backhaul-advisor", "Open the backhaul advisor", input.context);
    }
    case "gaming": {
      const high = highLatency(input);
      const supporting = high
        ? [`Evidence suggests ${high.name} has saved median latency ${high.pingMs == null ? "not saved" : formatMs(high.pingMs)} and jitter ${high.jitterMs == null ? "not saved" : formatMs(high.jitterMs)}.`]
        : [];
      return card(id, "Check latency where you play", high ? "A saved room median shows high latency or jitter." : "Games react to delay and jitter.", input.answers["latency-during-transfers"] === "yes" ? "You said latency shows up while other transfers are running. Pausing those transfers is the first check. This page cannot see the game server." : "This page cannot see the game server or which node the device joined.", supporting, supporting.length ? [] : noMeasurement("No saved room test shows latency or jitter for this checklist."), [
        "Pause other downloads and start a test in the room where you play.",
        "If it is practical, repeat that test with Ethernet and compare the latency.",
      ], "Compare the new result with the saved one. A lower ping on that test is the check, not a reading from the router.", "/gaming-speed-test", "Open the gaming test", input.context);
    }
    case "streaming": {
      const gap = gapSentence(input, "Buffering can still come from the stream itself.");
      return card(id, "Retest where the video buffers", gap ? "A saved room is much slower than another saved room." : "Buffering can come from the stream, the ISP, or the room.", "A buffer is not a signal-strength reading. Compare the slow room with a test beside the primary node before you move hardware.", gap ? [gap] : [], gap ? [] : noMeasurement("No saved room gap is available for the room where video buffers."), [
        "Pause other downloads and play the stream again in the slow room.",
        "Start a speed test there, then one beside the primary node.",
      ], "If the primary-node test is fine and the room test stays low, look at placement next. Do not treat that gap as a backhaul fault.", "/streaming-speed-test", "Open the streaming test", input.context);
    }
    case "video": {
      const high = highLatency(input);
      const supporting = high
        ? [`Evidence suggests ${high.name} has saved median latency ${high.pingMs == null ? "not saved" : formatMs(high.pingMs)} and jitter ${high.jitterMs == null ? "not saved" : formatMs(high.jitterMs)}.`]
        : [];
      return card(id, "Check delay where the call fails", high ? "A saved room median shows high jitter or latency." : "Video calls react to delay and jitter.", "This page cannot see the video service or which node the laptop joined.", supporting, supporting.length ? [] : noMeasurement("No saved room test shows latency or jitter for the call."), [
        "Pause other calls and downloads, then start a test in the room where the call fails.",
        "Compare latency and jitter with a test beside the primary node.",
      ], "If the follow-up test is steady and the call is still poor, the video service is outside what this page can see.", "/video-call-test", "Open the video-call test", input.context);
    }
    case "offline": {
      const missing = input.satellites < 1
        ? noMeasurement("The saved plan has no satellite node, so a mesh node cannot be confirmed offline from this page.")
        : noMeasurement("This browser cannot see node status.");
      return card(id, "Check the satellite in the vendor app", input.satellites < 1 ? "The saved plan has no satellite, so this page cannot confirm an offline node." : "The satellite may be too far from the next node, or it never finished pairing.", "This page cannot see whether a node is online.", [], missing, [
        "Open the vendor app and read the node list. This site does not sign in.",
        "If a node is offline there, move it halfway toward the primary node, power it on, and pair it again.",
        "Do not add another node until that one stays listed as online.",
      ], "The vendor app should show the node online for several minutes. Then start a room test beside it.", "/router-setup", "Open router setup", input.context, true);
    }
    case "disconnects":
      return card(id, "Note the drop, then retest the room", "A browser speed test does not record Wi-Fi disconnects.", "This page cannot see association events from the router. HTTP request failures are not packet loss, and this checklist does not turn them into one.", [], noMeasurement("No disconnect count is saved."), [
        "Note the time in the vendor app, then start a room test after the device reconnects.",
        "If it fails in one room only, compare that room with a spot beside the primary node.",
      ], "If the room test fails only in one room, placement is the next check. A single dropped page load is not a disconnect count.", "/connection-stability-test", "Open the stability test", input.context, true);
    case "smart-home":
      return card(id, "Check the device that drops", "A smart-home device may be far from a node, or it may reconnect after the Wi-Fi changes.", "This page cannot see those devices or why they drop.", [], noMeasurement("No device log is saved, and this browser cannot see smart-home clients."), [
        "Note which device drops and whether the vendor app still lists it.",
        "Start a room test where that device sits before you add hardware.",
      ], "If the room test is steady and only one device drops, the next check is that device in the vendor app.", "/mesh-wifi/planner", "Open the floor planner", input.context, true);
    case "firmware":
      return card(id, "Confirm the update finished", "A recent update can change channels or steering, or a node may not have finished updating.", "This page cannot see firmware.", [], noMeasurement("No firmware version is saved."), [
        "In the vendor app, confirm every node shows the same update as finished.",
        "Reboot the primary node only after the app says the update is done.",
        "Start the room test that failed, once, after that.",
      ], "If the same room test recovers, stop there. This page still cannot see the firmware.", "/router-setup", "Open router setup", input.context, true);
    case "nat": {
      const brand = input.context.brandName ? ` The saved plan names ${input.context.brandName}.` : "";
      return card(id, "Check for two routers in a row", "The ISP gateway and the mesh primary node may both be routing.", `You selected double NAT.${brand} This page cannot see the gateway mode.`, [], noMeasurement("Gateway mode was not read from either device."), [
        "In the ISP gateway, enable bridge mode if the provider allows it, or set the mesh system to access-point mode.",
        "Change only one of those, using the vendor’s own guide, then start a speed test.",
      ], "The vendor app or gateway page should show a single router. This site does not switch the mode.", "/router-setup", "Open router setup", input.context, true);
    }
    case "roaming":
      return card(id, "Check which node the device joined", input.satellites < 1 ? "Roaming between mesh nodes needs more than one node." : "A phone can stay attached to a farther node.", "This browser cannot see which node a device joined.", [], input.satellites < 1 ? noMeasurement("The saved plan has no satellite. This browser cannot see which node a device joined.") : noMeasurement("This browser cannot see which node a device joined."), [
        "Check the connected node in the vendor app, then start a room test.",
        "Do not rely on this page for a node name.",
      ], "If the vendor app shows a different node after you move, start the room test again.", "/mesh-wifi/planner", "Open the floor planner", input.context, true);
    case "dns":
      return card(id, "Check DNS timing separately", "Name lookup is a separate check when the problem is on the whole connection.", "A slow room test does not say whether DNS timing is involved. This checklist has not read a DNS result.", [], noMeasurement("No DNS timing result is available to this checklist."), [
        "Start a DNS timing check when you are ready. This page will not start it.",
        "Compare that with a speed test beside the primary node before you change hardware.",
      ], "If DNS timing is ordinary and the speed test beside the primary node is still low, DNS is not the limit those results show.", "/dns-speed-test", "Open DNS timing", input.context);
    default:
      return card(id, "Measure one room first", "Not enough information yet.", "The selected symptom needs a before-and-after test.", [], noMeasurement("No room test is saved yet."), [
        "Pick one weak room, start the room test, change one thing, and run the same test again.",
      ], "Keep the room, the device, and the server the same so the two results can be compared.", "/mesh-wifi/dead-zone-test", "Open the room test", input.context);
  }
}

export function rankRecommendations(input: RankInput): WifiRecommendation[] {
  if (input.symptoms.length === 0) return [];
  const prepared = prepare(input);
  const built = RECOMMENDATION_ORDER.filter((id) => appliesRecommendation(id, prepared)).map((id) => ({
    id,
    score: scoreOf(id, prepared),
    order: RECOMMENDATION_ORDER.indexOf(id),
    item: buildRecommendation(id, prepared),
  }));
  if (built.length === 0) {
    const fallback = buildRecommendation("dead-zone", prepared);
    fallback.priority = 1;
    return [fallback];
  }
  built.sort((a, b) => b.score - a.score || a.order - b.order || a.id.localeCompare(b.id));
  return built.map((entry, index) => ({ ...entry.item, priority: index + 1 }));
}

export function evidenceTone(item: WifiRecommendation): EvidenceTone {
  const hasSupport = item.supportingEvidence.length > 0;
  const hasMissing = item.missingEvidence.length > 0;
  if (hasSupport && hasMissing) return "both";
  if (hasSupport) return "suggests";
  return "missing";
}

export function advanceQueue(ranked: WifiRecommendation[], verifications: WifiSession["verifications"]): QueueState {
  const fixed = ranked.find((item) => verifications[item.id] === "fixed");
  if (fixed) return { status: "fixed", item: fixed };
  const remaining = ranked.filter((item) => {
    const status = verifications[item.id];
    return status !== "improved" && status !== "unchanged" && status !== "worse";
  });
  if (remaining.length === 0) return { status: "exhausted" };
  return { status: "active", current: remaining[0], also: remaining.slice(1, 3) };
}

export function compareLocations(a: LocationSample, b: LocationSample): LocationComparison {
  return {
    downloadDeltaMbps: delta(a.downloadMbps, b.downloadMbps),
    uploadDeltaMbps: delta(a.uploadMbps, b.uploadMbps),
    pingDeltaMs: delta(a.pingMs, b.pingMs),
    jitterDeltaMs: delta(a.jitterMs, b.jitterMs),
    caveat: COMPARISON_CAVEAT,
  };
}

export function sampleFromMetrics(label: string, metrics: {
  downloadMbps: number | null;
  uploadMbps: number | null;
  pingMs: number | null;
  jitterMs: number | null;
}): LocationSample {
  return {
    label,
    downloadMbps: finiteOrNull(metrics.downloadMbps),
    uploadMbps: finiteOrNull(metrics.uploadMbps),
    pingMs: finiteOrNull(metrics.pingMs),
    jitterMs: finiteOrNull(metrics.jitterMs),
  };
}

function finiteOrNull(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function delta(a: number | null, b: number | null): number | null {
  if (a == null || b == null) return null;
  return a - b;
}

export function emptyRooms(): RoomAssociations {
  return { aLabel: "", bLabel: "", aRoomId: null, bRoomId: null, aHistoryId: null, bHistoryId: null };
}

export function emptySession(): WifiSession {
  return {
    schemaVersion: WIFI_SESSION_VERSION,
    step: 0,
    highestStep: 0,
    symptoms: [],
    openCategories: [],
    answers: {},
    verifications: {},
    rooms: emptyRooms(),
    completed: false,
  };
}

export function categoryForSymptom(id: MeshSymptom): SymptomCategoryId | null {
  const category = SYMPTOM_CATEGORIES.find((item) => (item.symptoms as readonly MeshSymptom[]).includes(id));
  return category?.id ?? null;
}

export function toggleCategory(session: WifiSession, categoryId: string): WifiSession {
  const category = SYMPTOM_CATEGORIES.find((item) => item.id === categoryId);
  if (!category) return session;
  if (session.openCategories.includes(category.id)) {
    const symptoms = new Set<string>(category.symptoms);
    return {
      ...session,
      openCategories: session.openCategories.filter((id) => id !== category.id),
      symptoms: session.symptoms.filter((id) => !symptoms.has(id)),
      completed: false,
    };
  }
  return { ...session, openCategories: [...session.openCategories, category.id], completed: false };
}

export function toggleSymptom(session: WifiSession, id: MeshSymptom): WifiSession {
  const has = session.symptoms.includes(id);
  const symptoms = has ? session.symptoms.filter((item) => item !== id) : [...session.symptoms, id];
  const category = categoryForSymptom(id);
  const open = new Set(session.openCategories);
  if (!has && category) open.add(category);
  return { ...session, symptoms, openCategories: [...open], completed: false };
}

export function canContinue(session: WifiSession): { ok: boolean; reason: string | null } {
  if (session.step === 0 && session.symptoms.length === 0) {
    return { ok: false, reason: "Select at least one symptom to continue." };
  }
  if (session.step >= 2) return { ok: false, reason: null };
  return { ok: true, reason: null };
}

export function continueSession(session: WifiSession): WifiSession {
  if (!canContinue(session).ok) return session;
  const step = (session.step + 1) as WizardStep;
  return { ...session, step, highestStep: step > session.highestStep ? step : session.highestStep };
}

export function backSession(session: WifiSession): WifiSession {
  if (session.step === 0) return session;
  return { ...session, step: (session.step - 1) as WizardStep, completed: false };
}

export function goToStep(session: WifiSession, step: number): WifiSession {
  if (step !== 0 && step !== 1 && step !== 2) return session;
  if (step > session.highestStep) return session;
  return { ...session, step, completed: false };
}

export function resetSelection(session: WifiSession): WifiSession {
  return { ...session, step: 0, highestStep: 0, symptoms: [], openCategories: [], answers: {}, verifications: {}, completed: false };
}

export function withAnswer(session: WifiSession, id: string, value: string): WifiSession {
  if (!isAllowedAnswer(id, value) && value !== "") return session;
  const answers = { ...session.answers };
  if (value === "") delete answers[id];
  else answers[id] = value;
  return { ...session, answers };
}

export function withVerification(session: WifiSession, id: string, status: VerificationStatus): WifiSession {
  if (!RECOMMENDATION_ORDER.includes(id as RecommendationId)) return session;
  if (!VERIFICATION_SET.has(status)) return session;
  return { ...session, verifications: { ...session.verifications, [id]: status } };
}

export function withRoomAssociation(session: WifiSession, patch: Partial<RoomAssociations>): WifiSession {
  const rooms = { ...session.rooms, ...patch };
  if (!validRooms(rooms)) return session;
  return { ...session, rooms };
}

export function finishSession(session: WifiSession): WifiSession {
  return { ...session, completed: true };
}

function choiceValues(options: QuestionOption[]): Set<string> {
  return new Set([...options.map((option) => option.value), "skip"]);
}

export function isAllowedAnswer(id: string, value: string): boolean {
  const def = QUESTION_INDEX.get(id);
  if (!def || value.length > 80 || IPV4.test(value)) return false;
  if (value === "skip" || value === "not-sure") return true;
  if (id === "isp-plan") return /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 10000;
  if (id === "node-count") return /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 12;
  if (id === "weak-room") return value.trim().length > 0 && value.length <= 80;
  if (def.kind === "number" || def.kind === "text") return value.trim().length > 0;
  return choiceValues(def.options).has(value);
}

function validRooms(rooms: RoomAssociations): boolean {
  if (rooms.aLabel.length > 40 || rooms.bLabel.length > 40) return false;
  if (IPV4.test(rooms.aLabel) || IPV4.test(rooms.bLabel)) return false;
  return [rooms.aRoomId, rooms.bRoomId, rooms.aHistoryId, rooms.bHistoryId].every((id) => id == null || SAFE_ID.test(id));
}

export function parseWifiSession(raw: unknown): { ok: true; session: WifiSession } | { ok: false; error: string } {
  if (hasSecret(raw) || hasIp(raw)) return { ok: false, error: "Saved session is not valid." };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, error: "Saved session is not valid." };
  const record = raw as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length !== SESSION_KEYS.length || SESSION_KEYS.some((key) => !keys.includes(key))) {
    return { ok: false, error: "Saved session is not valid." };
  }
  if (record.schemaVersion !== WIFI_SESSION_VERSION) return { ok: false, error: "Saved session is from another version." };
  if (record.step !== 0 && record.step !== 1 && record.step !== 2) return { ok: false, error: "Saved session is not valid." };
  if (record.highestStep !== 0 && record.highestStep !== 1 && record.highestStep !== 2) return { ok: false, error: "Saved session is not valid." };
  if (record.highestStep < record.step) return { ok: false, error: "Saved session is not valid." };
  if (!Array.isArray(record.symptoms) || !Array.isArray(record.openCategories)) return { ok: false, error: "Saved session is not valid." };
  const symptoms: MeshSymptom[] = [];
  for (const id of record.symptoms) {
    if (typeof id !== "string" || !SYMPTOM_SET.has(id) || symptoms.includes(id as MeshSymptom)) return { ok: false, error: "Saved session is not valid." };
    symptoms.push(id as MeshSymptom);
  }
  const openCategories: SymptomCategoryId[] = [];
  for (const id of record.openCategories) {
    if (typeof id !== "string" || !CATEGORY_IDS.has(id) || openCategories.includes(id as SymptomCategoryId)) {
      return { ok: false, error: "Saved session is not valid." };
    }
    openCategories.push(id as SymptomCategoryId);
  }
  if (!record.answers || typeof record.answers !== "object" || Array.isArray(record.answers)) return { ok: false, error: "Saved session is not valid." };
  const answers: Record<string, string> = {};
  for (const [key, value] of Object.entries(record.answers)) {
    if (typeof value !== "string" || !isAllowedAnswer(key, value)) return { ok: false, error: "Saved session is not valid." };
    answers[key] = value;
  }
  if (!record.verifications || typeof record.verifications !== "object" || Array.isArray(record.verifications)) {
    return { ok: false, error: "Saved session is not valid." };
  }
  const verifications: WifiSession["verifications"] = {};
  for (const [key, value] of Object.entries(record.verifications)) {
    if (!RECOMMENDATION_ORDER.includes(key as RecommendationId) || typeof value !== "string" || !VERIFICATION_SET.has(value)) {
      return { ok: false, error: "Saved session is not valid." };
    }
    verifications[key as RecommendationId] = value as VerificationStatus;
  }
  if (!record.rooms || typeof record.rooms !== "object" || Array.isArray(record.rooms)) return { ok: false, error: "Saved session is not valid." };
  const roomsRecord = record.rooms as Record<string, unknown>;
  if (Object.keys(roomsRecord).length !== ROOM_KEYS.length || ROOM_KEYS.some((key) => !Object.prototype.hasOwnProperty.call(roomsRecord, key))) {
    return { ok: false, error: "Saved session is not valid." };
  }
  if (typeof roomsRecord.aLabel !== "string" || typeof roomsRecord.bLabel !== "string") return { ok: false, error: "Saved session is not valid." };
  const aRoomId = nullableId(roomsRecord.aRoomId);
  const bRoomId = nullableId(roomsRecord.bRoomId);
  const aHistoryId = nullableId(roomsRecord.aHistoryId);
  const bHistoryId = nullableId(roomsRecord.bHistoryId);
  if (aRoomId === undefined || bRoomId === undefined || aHistoryId === undefined || bHistoryId === undefined) {
    return { ok: false, error: "Saved session is not valid." };
  }
  const rooms: RoomAssociations = {
    aLabel: roomsRecord.aLabel,
    bLabel: roomsRecord.bLabel,
    aRoomId,
    bRoomId,
    aHistoryId,
    bHistoryId,
  };
  if (!validRooms(rooms)) return { ok: false, error: "Saved session is not valid." };
  if (typeof record.completed !== "boolean") return { ok: false, error: "Saved session is not valid." };
  return {
    ok: true,
    session: {
      schemaVersion: 1,
      step: record.step,
      highestStep: record.highestStep,
      symptoms,
      openCategories,
      answers,
      verifications,
      rooms,
      completed: record.completed,
    },
  };
}

function nullableId(value: unknown): string | null | undefined {
  if (value == null) return null;
  if (typeof value !== "string") return undefined;
  return value;
}

function hasSecret(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasSecret);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, child]) => SECRET_KEY.test(key) || hasSecret(child));
}

function hasIp(value: unknown): boolean {
  if (typeof value === "string") return IPV4.test(value);
  if (Array.isArray(value)) return value.some(hasIp);
  if (!value || typeof value !== "object") return false;
  return Object.values(value).some(hasIp);
}

export function sessionIsMeaningful(session: WifiSession): boolean {
  return session.symptoms.length > 0 || session.step > 0 || session.completed || Object.keys(session.verifications).length > 0;
}

export function symptomCategoriesCoverAll(): boolean {
  const covered = SYMPTOM_CATEGORIES.flatMap((category) => [...category.symptoms]);
  return covered.length === MESH_SYMPTOMS.length && MESH_SYMPTOMS.every((id) => covered.includes(id));
}

export function meshSymptomChoices(): Array<{ id: MeshSymptom; label: string }> {
  return MESH_SYMPTOMS.map((id) => ({ id, label: meshSymptomLabel(id) }));
}
