/**
 * Router setup wizard state and copy.
 * Manufacturers, models, support links, and gateway suggestions come from
 * ROUTER_MANUFACTURERS and router-setup-guide. Optional capabilities stay
 * omitted unless those sources already say they are true.
 * This module does not collect passwords, scan the network, or call a router.
 */

import {
  getRouterManufacturer,
  parseGatewayAddress,
  type RouterManufacturerGuide,
  type RouterModelChoice,
} from "@/lib/mesh/router-admin";
import { routerSetupNotes, type RouterSetupNotes } from "@/lib/mesh/router-setup-guide";

export const ROUTER_WIZARD_STORAGE_KEY = "myspeedgauge_router_setup_v1";
export const ROUTER_WIZARD_SCHEMA_VERSION = 1;

export const WIZARD_STEP_LABELS = ["Select Device", "Connect", "Configure", "Verify"] as const;

/** Presentation order. A brand is included only when ROUTER_MANUFACTURERS already has it. */
const BRAND_ORDER = ["tp-link", "asus", "netgear", "eero", "google-nest", "linksys", "other"] as const;

export const WIZARD_TASK_IDS = [
  "router:mode",
  "router:isp-gateway",
  "router:nat",
  "router:internet",
  "router:primary",
  "router:pair",
  "router:confirm-app",
  "router:move",
  "router:backhaul",
  "router:firmware",
  "router:wifi-security",
  "router:guest",
  "router:admin-security",
  "router:dhcp",
  "router:channel",
  "router:band-steering",
] as const;

export type WizardTaskId = (typeof WIZARD_TASK_IDS)[number];
export type WizardStepIndex = 0 | 1 | 2 | 3;
export type WizardOs = "windows" | "macos" | "ios" | "android";
export type IspRouting = "yes" | "no" | "unsure";
export type ManagementMethod = "mobile-app" | "local-web" | "app-and-local-web";
export type WizardTaskCategory = "network" | "mesh" | "security" | "advanced";

export const SECURITY_NOTICE =
  "Your router credentials stay with your router or its official app. MySpeedGauge does not request them.";

export const PLACEMENT_SENTENCE =
  "Place a satellite where it still receives a reliable connection from the primary router, rather than directly inside the weakest coverage area.";

const TASK_ID_SET = new Set<string>(WIZARD_TASK_IDS);
const SECRET_KEY = /password|credential|secret|token/i;
const STATE_KEYS = [
  "schemaVersion",
  "manufacturerId",
  "modelId",
  "exactModel",
  "unknownModel",
  "step",
  "highestStep",
  "checkedIds",
  "selectedOs",
  "gateway",
  "ispRouting",
  "completed",
  "legacyImportDone",
] as const;

export interface RouterWizardState {
  schemaVersion: 1;
  manufacturerId: string | null;
  modelId: string | null;
  exactModel: string;
  unknownModel: boolean;
  step: WizardStepIndex;
  highestStep: WizardStepIndex;
  checkedIds: string[];
  selectedOs: WizardOs | null;
  gateway: string;
  ispRouting: IspRouting | null;
  completed: boolean;
  legacyImportDone: boolean;
}

export interface ConnectionProfile {
  method: ManagementMethod;
  methodLabel: string;
  appName: string | null;
  supportUrl: string | null;
  supportLabel: string | null;
  showLocalAdmin: boolean;
  steps: string[];
  gatewaySuggestions: string[];
  headline: string;
}

/** Family-level knowledge. Exact-model capabilities are not invented. */
export interface RouterModelKnowledge {
  manufacturerId: string;
  manufacturerName: string;
  id: string;
  label: string;
  family: true;
  management: ManagementMethod;
  appName: string | null;
  supportUrl: string | null;
  showLocalAdmin: boolean;
}

export interface WizardTask {
  id: WizardTaskId;
  category: WizardTaskCategory;
  title: string;
  instructions: string;
  scopeLabel: string;
  helpUrl: string | null;
  helpLabel: string | null;
}

export interface TroubleshootingTopic {
  id: string;
  title: string;
  steps: string[];
}

export interface AddressGuide {
  id: WizardOs;
  title: string;
  steps: readonly string[];
}

export const ADDRESS_GUIDES: readonly AddressGuide[] = [
  {
    id: "windows",
    title: "Windows",
    steps: [
      "Open Settings, then Network & internet, then the Wi-Fi or Ethernet connection you are using.",
      "Open the hardware properties for that connection, or open Command Prompt and run ipconfig.",
      "Copy the Default Gateway value into the address field.",
    ],
  },
  {
    id: "macos",
    title: "macOS",
    steps: [
      "Open System Settings, then Network, then the active Wi-Fi or Ethernet service.",
      "Open Details, then TCP/IP.",
      "Copy the Router value into the address field.",
    ],
  },
  {
    id: "ios",
    title: "iPhone/iPad",
    steps: [
      "Open Settings, then Wi-Fi.",
      "Tap the info button beside the connected network.",
      "Copy the Router value into the address field.",
    ],
  },
  {
    id: "android",
    title: "Android",
    steps: [
      "Open Settings, then Network & internet, then Internet. The names differ by phone.",
      "Tap the gear beside the connected Wi-Fi network.",
      "Look for Gateway or Router. If it is missing, use the address printed on the router or the vendor’s app.",
    ],
  },
];

export const TASK_CATEGORY_LABELS: Record<WizardTaskCategory, string> = {
  network: "Network setup",
  mesh: "Mesh nodes",
  security: "Firmware and security",
  advanced: "Advanced",
};

export function emptyWizardState(): RouterWizardState {
  return {
    schemaVersion: ROUTER_WIZARD_SCHEMA_VERSION,
    manufacturerId: null,
    modelId: null,
    exactModel: "",
    unknownModel: false,
    step: 0,
    highestStep: 0,
    checkedIds: [],
    selectedOs: null,
    gateway: "",
    ispRouting: null,
    completed: false,
    legacyImportDone: false,
  };
}

export function startOverState(): RouterWizardState {
  return { ...emptyWizardState(), legacyImportDone: true };
}

export function wizardManufacturers(): RouterManufacturerGuide[] {
  return BRAND_ORDER.flatMap((id) => {
    const manufacturer = getRouterManufacturer(id);
    return manufacturer ? [manufacturer] : [];
  });
}

export function manufacturerMonogram(id: string): string | null {
  switch (id) {
    case "tp-link":
      return "TP";
    case "asus":
      return "AS";
    case "netgear":
      return "NE";
    case "eero":
      return "e";
    case "google-nest":
      return "G";
    case "linksys":
      return "L";
    default:
      return null;
  }
}

export function modelFamilies(manufacturerId: string): RouterModelChoice[] {
  return getRouterManufacturer(manufacturerId)?.models ?? [];
}

export function showsLocalAdmin(manufacturerId: string, modelId: string | null, unknownModel: boolean): boolean {
  const manufacturer = getRouterManufacturer(manufacturerId);
  if (!manufacturer || manufacturer.management === "app") return false;
  if (!unknownModel && manufacturerId === "tp-link" && modelId === "deco") return false;
  return manufacturer.management === "web" || manufacturer.management === "app-or-web";
}

export function appNameFor(manufacturerId: string, modelId: string | null, unknownModel: boolean): string | null {
  const manufacturer = getRouterManufacturer(manufacturerId);
  if (!manufacturer) return null;
  if (!unknownModel && manufacturerId === "tp-link" && modelId === "deco") return "Deco app";
  if (!unknownModel && manufacturerId === "netgear" && modelId === "orbi") return "Orbi app";
  return manufacturer.appName;
}

export function connectionProfile(
  manufacturerId: string | null,
  modelId: string | null,
  unknownModel: boolean,
): ConnectionProfile {
  const manufacturer = (manufacturerId ? getRouterManufacturer(manufacturerId) : undefined) ?? getRouterManufacturer("other");
  if (!manufacturer) {
    return {
      method: "local-web",
      methodLabel: "Local admin page",
      appName: null,
      supportUrl: null,
      supportLabel: null,
      showLocalAdmin: false,
      steps: [],
      gatewaySuggestions: [],
      headline: "Find the admin address on the router label or in the vendor’s quick start.",
    };
  }
  const showLocalAdmin = showsLocalAdmin(manufacturer.id, modelId, unknownModel);
  const appName = appNameFor(manufacturer.id, modelId, unknownModel);
  const method: ManagementMethod = !showLocalAdmin ? "mobile-app" : appName ? "app-and-local-web" : "local-web";
  const supportUrl = manufacturer.supportUrl;
  return {
    method,
    methodLabel: method === "mobile-app" ? "Mobile app" : method === "local-web" ? "Local admin page" : "App or local admin page",
    appName,
    supportUrl,
    supportLabel: supportUrl ? `Official ${manufacturer.name} support` : null,
    showLocalAdmin,
    steps: visibleSteps(manufacturer, showLocalAdmin),
    gatewaySuggestions: showLocalAdmin ? manufacturer.gatewaySuggestions : [],
    headline: connectionHeadline(manufacturer.name, method, appName),
  };
}

export function modelKnowledge(manufacturerId: string, modelId: string): RouterModelKnowledge | null {
  const manufacturer = getRouterManufacturer(manufacturerId);
  const model = manufacturer?.models.find((item) => item.id === modelId);
  if (!manufacturer || !model) return null;
  const profile = connectionProfile(manufacturerId, modelId, false);
  return {
    manufacturerId,
    manufacturerName: manufacturer.name,
    id: model.id,
    label: model.label,
    family: true,
    management: profile.method,
    appName: profile.appName,
    supportUrl: profile.supportUrl,
    showLocalAdmin: profile.showLocalAdmin,
  };
}

/** Validated admin URL, or null when the product is app-managed or the address is rejected. */
export function openableAdminUrl(
  manufacturerId: string | null,
  modelId: string | null,
  unknownModel: boolean,
  address: string,
): string | null {
  if (!manufacturerId || !showsLocalAdmin(manufacturerId, modelId, unknownModel)) return null;
  const parsed = parseGatewayAddress(address);
  return parsed.ok ? parsed.url : null;
}

export function canContinue(state: RouterWizardState): { ok: boolean; reason: string | null } {
  if (state.step === 0) {
    if (!state.manufacturerId) return { ok: false, reason: "Choose a manufacturer to continue." };
    if (!state.unknownModel && !state.modelId) {
      return { ok: false, reason: "Choose a product family, or select I don't know my router model." };
    }
    return { ok: true, reason: null };
  }
  if (state.step >= 3) return { ok: false, reason: null };
  return { ok: true, reason: null };
}

export function canGoToStep(state: RouterWizardState, target: number): boolean {
  return Number.isInteger(target) && target >= 0 && target <= 3 && target <= state.highestStep;
}

export function selectManufacturer(state: RouterWizardState, manufacturerId: string): RouterWizardState {
  if (!getRouterManufacturer(manufacturerId)) return state;
  if (state.manufacturerId === manufacturerId) return state;
  return { ...state, manufacturerId, modelId: null, unknownModel: false, exactModel: "", gateway: "" };
}

export function selectModel(state: RouterWizardState, modelId: string): RouterWizardState {
  if (!state.manufacturerId) return state;
  const manufacturer = getRouterManufacturer(state.manufacturerId);
  if (!manufacturer?.models.some((model) => model.id === modelId)) return state;
  return {
    ...state,
    modelId,
    unknownModel: false,
    exactModel: state.modelId === modelId ? state.exactModel : "",
  };
}

export function selectUnknownModel(state: RouterWizardState): RouterWizardState {
  if (!state.manufacturerId) return state;
  return { ...state, modelId: null, unknownModel: true, exactModel: "" };
}

export function withExactModel(state: RouterWizardState, value: string): RouterWizardState {
  if (!state.modelId || state.unknownModel) return state;
  const exactModel = Array.from(value)
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join("")
    .slice(0, 80);
  return { ...state, exactModel };
}

export function withGateway(state: RouterWizardState, gateway: string): RouterWizardState {
  return { ...state, gateway: gateway.slice(0, 200) };
}

export function withOs(state: RouterWizardState, selectedOs: WizardOs): RouterWizardState {
  if (!ADDRESS_GUIDES.some((guide) => guide.id === selectedOs)) return state;
  return { ...state, selectedOs };
}

export function withIspRouting(state: RouterWizardState, ispRouting: IspRouting): RouterWizardState {
  return { ...state, ispRouting };
}

export function toggleCheck(state: RouterWizardState, id: string): RouterWizardState {
  if (!TASK_ID_SET.has(id)) return state;
  const checkedIds = state.checkedIds.includes(id)
    ? state.checkedIds.filter((item) => item !== id)
    : [...state.checkedIds, id];
  return { ...state, checkedIds };
}

export function continueWizard(state: RouterWizardState): RouterWizardState {
  if (!canContinue(state).ok || state.step >= 3) return state;
  const step = asStep(state.step + 1);
  return {
    ...state,
    step,
    highestStep: asStep(Math.max(state.highestStep, step)),
    completed: step === 3 ? true : state.completed,
  };
}

export function backWizard(state: RouterWizardState): RouterWizardState {
  if (state.step <= 0) return state;
  return { ...state, step: asStep(state.step - 1) };
}

export function goToStep(state: RouterWizardState, target: number): RouterWizardState {
  if (!canGoToStep(state, target)) return state;
  return { ...state, step: asStep(target) };
}

export function tasksFor(input: {
  manufacturerId: string | null;
  modelId: string | null;
  unknownModel: boolean;
  ispRouting: IspRouting | null;
}): WizardTask[] {
  const manufacturerId = input.manufacturerId ?? "other";
  const manufacturer = getRouterManufacturer(manufacturerId);
  const family = manufacturer?.models.find((model) => model.id === input.modelId);
  const familyLabel = !input.unknownModel && family && manufacturerId !== "other" ? family.label : null;
  const help = helpFor(manufacturer && manufacturer.id !== "other" ? manufacturer.id : null);
  const profile = connectionProfile(input.manufacturerId, input.modelId, input.unknownModel);
  const note = (field: keyof RouterSetupNotes) => noteField(manufacturerId, field, familyLabel, input.unknownModel || !input.modelId);
  const general = (text: string): { text: string; scopeLabel: string } => {
    if (input.unknownModel && manufacturer && manufacturer.id !== "other") {
      return { text, scopeLabel: `General ${manufacturer.name} guidance` };
    }
    return { text, scopeLabel: "General guidance" };
  };
  const mode = note("mode");
  const backhaul = note("backhaul");
  const pairing = note("pairing");
  const nat = note("doubleNat");
  const showNat = input.ispRouting === "yes" || input.ispRouting === "unsure";
  const confirmText = profile.appName
    ? `Open the ${profile.appName} and confirm each node is listed there. A checked box is your confirmation. This site cannot see the app.`
    : "Confirm each node in the vendor’s own app or on its admin page. A checked box is your confirmation. This site cannot see that status.";

  const network: WizardTask[] = [
    task("router:mode", "network", "Router or access-point mode", mode, help),
    task(
      "router:isp-gateway",
      "network",
      "Whether the ISP gateway also routes",
      general(
        "If a modem or gateway from your ISP sits ahead of this router, note whether that box also routes traffic. Checking this box records that you confirmed it in the vendor app or on the router page. This site cannot see the ISP device.",
      ),
      help,
    ),
    ...(showNat ? [task("router:nat", "network", "Double NAT", nat, help)] : []),
    task(
      "router:internet",
      "network",
      "Internet connectivity",
      general(
        "Confirm in the vendor app or on the router page that the internet connection is up. Checking this box records your confirmation. It is not a measurement.",
      ),
      help,
    ),
  ];

  const mesh: WizardTask[] = [
    task(
      "router:primary",
      "mesh",
      "Primary device",
      general(
        "Set up the primary router or gateway node before adding satellites. When a kit has a router unit and a satellite, the primary is the unit that connects to the modem.",
      ),
      help,
    ),
    task("router:pair", "mesh", "Pair satellites", pairing, help),
    task("router:confirm-app", "mesh", "Confirm nodes in the vendor app", general(confirmText), help),
    task(
      "router:move",
      "mesh",
      "Move nodes",
      general(`${PLACEMENT_SENTENCE} Pair near the primary first when the vendor guide says to, then move the satellite.`),
      help,
    ),
    task("router:backhaul", "mesh", "Wired or wireless backhaul", backhaul, help),
  ];

  const security: WizardTask[] = [
    task("router:firmware", "security", "Check firmware in the official app", note("firmware"), help),
    task(
      "router:wifi-security",
      "security",
      "Wi-Fi security",
      general(
        "Confirm the Wi-Fi security mode in the official app or on the router page. Do not type the Wi-Fi password into MySpeedGauge.",
      ),
      help,
    ),
    task("router:guest", "security", "Optional guest Wi-Fi", note("guest"), help),
    task(
      "router:admin-security",
      "security",
      "Admin account security",
      general(
        "Review the router admin account in the official app or on the router page. MySpeedGauge does not collect admin passwords.",
      ),
      help,
    ),
  ];

  const advanced: WizardTask[] = [
    task("router:mode", "advanced", "Router or access-point mode", mode, help),
    task("router:backhaul", "advanced", "Ethernet backhaul", backhaul, help),
    task("router:nat", "advanced", "Double NAT", {
      text: `${nat.text} Changing either one turns routing off on one of the two devices. Clients then use the device you leave as the router. This assistant does not switch the mode.`,
      scopeLabel: nat.scopeLabel,
    }, help),
    task(
      "router:dhcp",
      "advanced",
      "DHCP conflicts",
      general(
        "If the ISP gateway and this router both hand out addresses, devices can end up with conflicting addresses. Check DHCP only in the vendor app or on the router page. This site cannot see those settings.",
      ),
      help,
    ),
    task(
      "router:channel",
      "advanced",
      "Channel selection",
      general(
        "Change a Wi-Fi channel only in the vendor app or on the router page, and only if that product’s guide offers the setting. This assistant does not scan nearby networks.",
      ),
      help,
    ),
    task(
      "router:band-steering",
      "advanced",
      "Band steering",
      general(
        "Some systems use one network name for more than one band and steer devices between them. Use that setting only when the guide for the model on the label describes it. If the guide does not mention it, leave it alone.",
      ),
      help,
    ),
  ];

  return [...network, ...mesh, ...security, ...advanced];
}

export function uniqueTaskIds(tasks: WizardTask[]): string[] {
  const ids: string[] = [];
  for (const item of tasks) {
    if (!ids.includes(item.id)) ids.push(item.id);
  }
  return ids;
}

export function troubleshootingTopics(appManaged: boolean): TroubleshootingTopic[] {
  const nat = routerSetupNotes("other").doubleNat;
  return [
    {
      id: "login",
      title: "The login page will not open",
      steps: appManaged
        ? [
            "This product family is managed in its official app. A browser admin page is not the normal way to sign in.",
            "Open that app while this phone or computer is joined to the same Wi-Fi.",
            "Use the official support link for the model on the label if the app cannot find the network.",
          ]
        : [
            "Join the Wi-Fi or Ethernet network from this router, then try the address again.",
            "Compare the address with the sticker on the router. A nearby network can use a different gateway.",
            "The browser may ask before it opens a device on your local network. Allow that prompt, then choose Open Router Administration again.",
            "If a new tab was requested but did not appear, allow pop-ups for this site and choose the button again.",
            "A tab that does not load does not mean MySpeedGauge connected to the router. Type the password only on the router page or in the official app.",
          ],
    },
    {
      id: "node",
      title: "A mesh node will not connect",
      steps: [
        "Pair one satellite at a time, close to the primary node, then move it. If the app shows a different order, follow the quick start for the model on the label.",
        PLACEMENT_SENTENCE,
        "Confirm the node in the vendor app. A checkbox on this page only records that you confirmed it.",
      ],
    },
    {
      id: "slow",
      title: "Wi-Fi is slow",
      steps: [
        "Run a speed test from the verify step. The result is a measurement from this device, not a reading from the router.",
        "Compare a computer plugged into the primary node when you can. If that wired result is already slow, another satellite will not fix the ISP link.",
        "Move one satellite and test the room again before you add another node.",
      ],
    },
    {
      id: "nat",
      title: "Double NAT",
      steps: [
        nat,
        "Changing the ISP gateway to bridge mode, or putting this system in access-point mode, turns routing off on one of the two devices. Change one of those, using the model guide, and leave the other as it is. This assistant does not switch the mode for you.",
      ],
    },
  ];
}

export interface MeasuredSpeedSnapshot {
  downloadMbps: number | null;
  uploadMbps: number | null;
  pingMs: number | null;
  createdAt: string;
}

export function latestMeasuredResult(
  entries: Array<{ downloadMbps: number | null; uploadMbps: number | null; pingMs: number | null; createdAt: string }>,
): MeasuredSpeedSnapshot | null {
  const found = entries.find((entry) => entry.downloadMbps != null || entry.uploadMbps != null);
  if (!found) return null;
  return {
    downloadMbps: found.downloadMbps,
    uploadMbps: found.uploadMbps,
    pingMs: found.pingMs,
    createdAt: found.createdAt,
  };
}

export function parseRouterWizardState(raw: unknown): { ok: true; state: RouterWizardState } | { ok: false; error: string } {
  if (hasSecretKey(raw)) return fail("Saved setup data includes a credential field.");
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fail("Saved setup data is not valid.");
  const record = raw as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length !== STATE_KEYS.length || STATE_KEYS.some((key) => !keys.includes(key))) {
    return fail("Saved setup data is not valid.");
  }
  if (record.schemaVersion !== ROUTER_WIZARD_SCHEMA_VERSION) return fail("Saved setup data is from another version.");
  const manufacturerId = optionalId(record.manufacturerId);
  if (manufacturerId === undefined) return fail("Saved setup data is not valid.");
  if (manufacturerId && !getRouterManufacturer(manufacturerId)) return fail("Saved setup data is not valid.");
  const modelId = optionalId(record.modelId);
  if (modelId === undefined) return fail("Saved setup data is not valid.");
  if (modelId && (!manufacturerId || !getRouterManufacturer(manufacturerId)?.models.some((model) => model.id === modelId))) {
    return fail("Saved setup data is not valid.");
  }
  if (typeof record.unknownModel !== "boolean") return fail("Saved setup data is not valid.");
  if (record.unknownModel && modelId) return fail("Saved setup data is not valid.");
  if (typeof record.exactModel !== "string" || record.exactModel.length > 80) return fail("Saved setup data is not valid.");
  if (record.unknownModel && record.exactModel) return fail("Saved setup data is not valid.");
  const step = asStepOrNull(record.step);
  const highestStep = asStepOrNull(record.highestStep);
  if (step == null || highestStep == null) return fail("Saved setup data is not valid.");
  if (!Array.isArray(record.checkedIds)) return fail("Checklist data is not valid.");
  const checkedIds: string[] = [];
  for (const id of record.checkedIds) {
    if (typeof id !== "string" || !TASK_ID_SET.has(id)) return fail("Checklist data is not valid.");
    if (!checkedIds.includes(id)) checkedIds.push(id);
  }
  const selectedOs = record.selectedOs;
  if (selectedOs != null && !ADDRESS_GUIDES.some((guide) => guide.id === selectedOs)) return fail("Saved setup data is not valid.");
  if (typeof record.gateway !== "string" || record.gateway.length > 200) return fail("Saved setup data is not valid.");
  let ispRouting: IspRouting | null;
  if (record.ispRouting == null) ispRouting = null;
  else if (record.ispRouting === "yes" || record.ispRouting === "no" || record.ispRouting === "unsure") ispRouting = record.ispRouting;
  else return fail("Saved setup data is not valid.");
  if (typeof record.completed !== "boolean" || typeof record.legacyImportDone !== "boolean") {
    return fail("Saved setup data is not valid.");
  }
  return {
    ok: true,
    state: {
      schemaVersion: 1,
      manufacturerId,
      modelId,
      exactModel: record.exactModel,
      unknownModel: record.unknownModel,
      step,
      highestStep: asStep(Math.max(highestStep, step)),
      checkedIds,
      selectedOs: selectedOs as WizardOs | null,
      gateway: record.gateway,
      ispRouting,
      completed: record.completed,
      legacyImportDone: record.legacyImportDone,
    },
  };
}

export function mergeLegacyChecks(state: RouterWizardState, checkedSetup: string[]): RouterWizardState {
  if (state.legacyImportDone) return state;
  const checkedIds = [...state.checkedIds];
  for (const id of checkedSetup) {
    if (typeof id === "string" && id.startsWith("router:") && TASK_ID_SET.has(id) && !checkedIds.includes(id)) {
      checkedIds.push(id);
    }
  }
  return { ...state, checkedIds };
}

export function readWizardState(legacyChecked: string[] = []): { state: RouterWizardState; resume: "saved" | "legacy" | null } {
  if (typeof window === "undefined") return { state: emptyWizardState(), resume: null };
  let parsed: RouterWizardState | null = null;
  let hadRecord = false;
  try {
    const raw = window.localStorage.getItem(ROUTER_WIZARD_STORAGE_KEY);
    hadRecord = Boolean(raw);
    if (raw) {
      const result = parseRouterWizardState(JSON.parse(raw));
      if (result.ok) parsed = result.state;
    }
  } catch {
    parsed = null;
  }
  if (parsed?.legacyImportDone) {
    return { state: parsed, resume: hadRecord && isMeaningful(parsed) ? "saved" : null };
  }
  const base = parsed ?? emptyWizardState();
  const merged = { ...mergeLegacyChecks(base, legacyChecked), legacyImportDone: true as const };
  const imported = merged.checkedIds.length > base.checkedIds.length;
  return {
    state: merged,
    resume: isMeaningful(base) ? "saved" : imported ? "legacy" : null,
  };
}

export function writeWizardState(state: RouterWizardState): void {
  if (typeof window === "undefined") return;
  const parsed = parseRouterWizardState(state);
  if (!parsed.ok) return;
  window.localStorage.setItem(ROUTER_WIZARD_STORAGE_KEY, JSON.stringify(parsed.state));
}

function visibleSteps(manufacturer: RouterManufacturerGuide, showLocalAdmin: boolean): string[] {
  if (showLocalAdmin) return manufacturer.steps;
  return manufacturer.steps.filter(
    (step) => !manufacturer.gatewaySuggestions.some((suggestion) => suggestion && step.includes(suggestion)),
  );
}

function connectionHeadline(name: string, method: ManagementMethod, appName: string | null): string {
  if (method === "mobile-app") {
    return `${name} is configured in the ${appName ?? "official app"}. This assistant does not open a browser admin page for it.`;
  }
  if (method === "local-web") {
    return "Open the router’s own admin page in a new tab when you choose to. MySpeedGauge does not sign in.";
  }
  return `You can set this up in the ${appName ?? "official app"}. Many models also open a local admin page. Opening that page does not sign MySpeedGauge in.`;
}

function noteField(
  manufacturerId: string,
  field: keyof RouterSetupNotes,
  familyLabel: string | null,
  unknownModel: boolean,
): { text: string; scopeLabel: string } {
  const brand = getRouterManufacturer(manufacturerId);
  const notes = routerSetupNotes(manufacturerId);
  const generic = routerSetupNotes("other");
  const text = notes[field];
  if (!brand || brand.id === "other") return { text: generic[field], scopeLabel: "General guidance" };
  if (unknownModel || !familyLabel) return { text, scopeLabel: `General ${brand.name} guidance` };
  if (text === generic[field]) return { text, scopeLabel: "General guidance" };
  return { text, scopeLabel: `General ${familyLabel} guidance` };
}

function helpFor(manufacturerId: string | null): { helpUrl: string | null; helpLabel: string | null } {
  const brand = manufacturerId ? getRouterManufacturer(manufacturerId) : undefined;
  if (!brand?.supportUrl) return { helpUrl: null, helpLabel: null };
  return { helpUrl: brand.supportUrl, helpLabel: `Official ${brand.name} support` };
}

function task(
  id: WizardTaskId,
  category: WizardTaskCategory,
  title: string,
  copy: { text: string; scopeLabel: string },
  help: { helpUrl: string | null; helpLabel: string | null },
): WizardTask {
  return { id, category, title, instructions: copy.text, scopeLabel: copy.scopeLabel, ...help };
}

function asStep(value: number): WizardStepIndex {
  if (value <= 0) return 0;
  if (value >= 3) return 3;
  if (value === 1 || value === 2) return value;
  return 0;
}

function asStepOrNull(value: unknown): WizardStepIndex | null {
  if (value !== 0 && value !== 1 && value !== 2 && value !== 3) return null;
  return value;
}

function optionalId(value: unknown): string | null | undefined {
  if (value == null) return null;
  if (typeof value !== "string" || !value) return undefined;
  return value;
}

function isMeaningful(state: RouterWizardState): boolean {
  return Boolean(
    state.manufacturerId || state.step > 0 || state.checkedIds.length || state.gateway || state.exactModel || state.completed,
  );
}

function hasSecretKey(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasSecretKey);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, child]) => SECRET_KEY.test(key) || hasSecretKey(child));
}

function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}
