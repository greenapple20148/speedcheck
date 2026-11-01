import { afterEach, describe, expect, it, vi } from "vitest";
import { ROUTER_MANUFACTURERS, parseGatewayAddress } from "@/lib/mesh/router-admin";
import {
  ROUTER_WIZARD_STORAGE_KEY,
  backWizard,
  canContinue,
  canGoToStep,
  connectionProfile,
  continueWizard,
  emptyWizardState,
  goToStep,
  latestMeasuredResult,
  mergeLegacyChecks,
  modelKnowledge,
  openableAdminUrl,
  parseRouterWizardState,
  readWizardState,
  selectManufacturer,
  selectModel,
  selectUnknownModel,
  startOverState,
  tasksFor,
  toggleCheck,
  troubleshootingTopics,
  wizardManufacturers,
  withExactModel,
  withGateway,
  writeWizardState,
} from "@/lib/mesh/router-wizard";

afterEach(() => {
  vi.unstubAllGlobals();
});

function secretKeys(value: unknown, found: string[] = []): string[] {
  if (Array.isArray(value)) {
    value.forEach((item) => secretKeys(item, found));
    return found;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      found.push(key);
      secretKeys(child, found);
    }
  }
  return found;
}

function installStorage() {
  const storage = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
    },
  });
  return storage;
}

describe("router wizard selection", () => {
  it("lists only manufacturers already in the guide", () => {
    expect(wizardManufacturers().map((item) => item.id)).toEqual([
      "tp-link",
      "asus",
      "netgear",
      "eero",
      "google-nest",
      "linksys",
      "other",
    ]);
  });

  it("selects a manufacturer and family, and keeps an unknown model from blocking progress", () => {
    let state = emptyWizardState();
    expect(canContinue(state).ok).toBe(false);
    state = selectManufacturer(state, "netgear");
    expect(state.manufacturerId).toBe("netgear");
    expect(state.modelId).toBeNull();
    expect(canContinue(state).ok).toBe(false);
    state = selectModel(state, "orbi");
    expect(state.modelId).toBe("orbi");
    expect(selectModel(state, "deco").modelId).toBe("orbi");
    expect(canContinue(state).ok).toBe(true);

    state = selectUnknownModel(state);
    expect(state.unknownModel).toBe(true);
    expect(state.modelId).toBeNull();
    expect(canContinue(state).ok).toBe(true);
    const unknown = tasksFor(state);
    expect(unknown.every((task) => task.scopeLabel.startsWith("General"))).toBe(true);
    expect(unknown.some((task) => task.scopeLabel === "General Orbi guidance")).toBe(false);

    const orbi = tasksFor({ manufacturerId: "netgear", modelId: "orbi", unknownModel: false, ispRouting: "yes" });
    const mode = orbi.find((task) => task.id === "router:mode" && task.category === "network");
    expect(mode?.instructions).toContain("Orbi");
    expect(mode?.scopeLabel).toContain("Orbi");
    expect(orbi.find((task) => task.id === "router:move")?.instructions).toContain(
      "Place a satellite where it still receives a reliable connection from the primary router",
    );
  });

  it("does not treat a typed model number as a capability lookup", () => {
    const state = withExactModel(selectModel(selectManufacturer(emptyWizardState(), "netgear"), "orbi"), "RBK852");
    expect(state.exactModel).toBe("RBK852");
    expect(connectionProfile(state.manufacturerId, state.modelId, state.unknownModel).method).toBe("app-and-local-web");
    expect(modelKnowledge("netgear", "orbi")?.family).toBe(true);
  });
});

describe("router wizard navigation", () => {
  it("blocks skipped steps and allows continue after an unknown model", () => {
    expect(continueWizard(emptyWizardState()).step).toBe(0);
    let state = selectUnknownModel(selectManufacturer(emptyWizardState(), "asus"));
    expect(canGoToStep(state, 2)).toBe(false);
    state = continueWizard(state);
    expect(state.step).toBe(1);
    expect(goToStep(state, 3).step).toBe(1);
    state = continueWizard(continueWizard(state));
    expect(state.step).toBe(3);
    expect(state.completed).toBe(true);
    expect(continueWizard(state).step).toBe(3);
    expect(backWizard(goToStep(state, 0)).step).toBe(0);
    expect(canGoToStep(state, 2)).toBe(true);
  });

  it("shows double NAT in network setup only when the ISP gateway may also route", () => {
    const shown = tasksFor({ manufacturerId: "asus", modelId: "zenwifi", unknownModel: false, ispRouting: "unsure" });
    const hidden = tasksFor({ manufacturerId: "asus", modelId: "zenwifi", unknownModel: false, ispRouting: "no" });
    expect(shown.some((task) => task.id === "router:nat" && task.category === "network")).toBe(true);
    expect(hidden.some((task) => task.id === "router:nat" && task.category === "network")).toBe(false);
    expect(hidden.some((task) => task.id === "router:nat" && task.category === "advanced")).toBe(true);
  });
});

describe("router wizard persistence", () => {
  it("rejects bad checklist data and credential fields", () => {
    expect(parseRouterWizardState(emptyWizardState()).ok).toBe(true);
    expect(parseRouterWizardState({ ...emptyWizardState(), checkedIds: ["router:nope"] }).ok).toBe(false);
    expect(parseRouterWizardState({ ...emptyWizardState(), checkedIds: "router:mode" }).ok).toBe(false);
    expect(parseRouterWizardState({ ...emptyWizardState(), schemaVersion: 2 }).ok).toBe(false);
    expect(parseRouterWizardState({ ...emptyWizardState(), password: "hunter2" }).ok).toBe(false);
    expect(parseRouterWizardState({ ...emptyWizardState(), manufacturerId: "ubiquiti" }).ok).toBe(false);
    expect(parseRouterWizardState({ ...emptyWizardState(), gateway: 15 }).ok).toBe(false);
  });

  it("restores saved progress, keeps legacy router checks, and start over clears them", () => {
    const storage = installStorage();
    const saved = continueWizard(selectModel(selectManufacturer(emptyWizardState(), "asus"), "rt"));
    writeWizardState(toggleCheck(saved, "router:mode"));
    expect(readWizardState([]).state.modelId).toBe("rt");
    expect(readWizardState([]).state.checkedIds).toEqual(["router:mode"]);

    storage.set(ROUTER_WIZARD_STORAGE_KEY, JSON.stringify({ ...emptyWizardState(), password: "hunter2" }));
    const legacy = readWizardState(["router:firmware", "modem", "router:not-a-task"]);
    expect(legacy.state.checkedIds).toEqual(["router:firmware"]);
    expect(JSON.stringify(legacy.state)).not.toMatch(/hunter2/);

    writeWizardState(startOverState());
    expect(readWizardState(["router:firmware"]).state.checkedIds).toEqual([]);
    expect(readWizardState([]).state.legacyImportDone).toBe(true);
    expect(readWizardState([]).state.gateway).toBe("");
  });

  it("merges only known router checklist ids", () => {
    expect(mergeLegacyChecks(emptyWizardState(), ["router:guest", "pair", "router:made-up"]).checkedIds).toEqual(["router:guest"]);
    expect(mergeLegacyChecks({ ...emptyWizardState(), legacyImportDone: true }, ["router:mode"]).checkedIds).toEqual([]);
  });
});

describe("router wizard gateway and management", () => {
  it("rejects unsafe gateway URLs and keeps https", () => {
    expect(parseGatewayAddress("javascript:alert(1)").ok).toBe(false);
    expect(parseGatewayAddress("data:text/html,hi").ok).toBe(false);
    expect(parseGatewayAddress("file:///etc/passwd").ok).toBe(false);
    expect(parseGatewayAddress("http://user:secret@192.168.1.1/").ok).toBe(false);
    expect(parseGatewayAddress("ftp://192.168.1.1/").ok).toBe(false);
    expect(openableAdminUrl("netgear", "orbi", false, "javascript:alert(1)")).toBeNull();
    expect(openableAdminUrl("netgear", "orbi", false, "data:text/html,hi")).toBeNull();
    expect(openableAdminUrl("netgear", "orbi", false, "file:///tmp/router")).toBeNull();
    expect(openableAdminUrl("netgear", "orbi", false, "http://user:secret@192.168.1.1/")).toBeNull();
    expect(openableAdminUrl("netgear", "orbi", false, "ftp://192.168.1.1/")).toBeNull();
    expect(openableAdminUrl("netgear", "nighthawk", false, "https://192.168.1.1")).toBe("https://192.168.1.1/");
    expect(withGateway(emptyWizardState(), "javascript:alert(1)").gateway).toContain("javascript:");
    expect(openableAdminUrl("netgear", "orbi", false, withGateway(emptyWizardState(), "javascript:alert(1)").gateway)).toBeNull();
  });

  it("does not expose a local admin URL for app-managed brands", () => {
    expect(connectionProfile("eero", "eero-6", false).method).toBe("mobile-app");
    expect(connectionProfile("eero", "eero-6", false).showLocalAdmin).toBe(false);
    expect(connectionProfile("google-nest", "nest-wifi-pro", false).showLocalAdmin).toBe(false);
    expect(connectionProfile("tp-link", "deco", false).method).toBe("mobile-app");
    expect(connectionProfile("tp-link", "deco", false).gatewaySuggestions).toEqual([]);
    expect(connectionProfile("tp-link", null, true).method).toBe("app-and-local-web");
    expect(connectionProfile("asus", "zenwifi", false).method).toBe("app-and-local-web");
    expect(connectionProfile("other", "other", false).method).toBe("local-web");
    expect(openableAdminUrl("eero", "eero", false, "192.168.1.1")).toBeNull();
    expect(openableAdminUrl("google-nest", "nest-wifi", false, "192.168.1.1")).toBeNull();
    expect(openableAdminUrl("tp-link", "deco", false, "tplinkwifi.net")).toBeNull();
    expect(openableAdminUrl("tp-link", "archer", false, "192.168.0.1")).toBe("http://192.168.0.1/");
    const methods = new Set(
      ROUTER_MANUFACTURERS.flatMap((brand) => brand.models.map((model) => connectionProfile(brand.id, model.id, false).method)),
    );
    expect(methods.has("mobile-app")).toBe(true);
    expect(methods.has("local-web")).toBe(true);
    expect(methods.has("app-and-local-web")).toBe(true);
    expect([...methods].some((method) => method.includes("cloud"))).toBe(false);
  });

  it("does not put a password field on the knowledge model", () => {
    const knowledge = ROUTER_MANUFACTURERS.flatMap((brand) => brand.models.map((model) => modelKnowledge(brand.id, model.id)));
    const tasks = tasksFor({ manufacturerId: "tp-link", modelId: "deco", unknownModel: false, ispRouting: "yes" });
    const bag = [
      ROUTER_MANUFACTURERS,
      knowledge,
      tasks,
      troubleshootingTopics(true),
      troubleshootingTopics(false),
      emptyWizardState(),
      connectionProfile("eero", "eero", false),
    ];
    expect(secretKeys(bag).some((key) => /password|credential|secret|token/i.test(key))).toBe(false);
    for (const item of knowledge) {
      expect(item).not.toHaveProperty("supportsEthernetBackhaul");
      expect(item).not.toHaveProperty("supportsAccessPointMode");
      expect(item).not.toHaveProperty("password");
    }
    const text = troubleshootingTopics(false).flatMap((topic) => topic.steps).join(" ");
    expect(text.toLowerCase()).not.toMatch(/certificate|not private|proceed anyway|unsafe|accept the risk/);
  });
});

describe("saved speed test snapshot", () => {
  it("reads a completed saved result and ignores an empty row", () => {
    expect(latestMeasuredResult([{ downloadMbps: null, uploadMbps: null, pingMs: null, createdAt: "2026-01-01" }])).toBeNull();
    expect(latestMeasuredResult([
      { downloadMbps: 100, uploadMbps: 20, pingMs: 12, createdAt: "2026-02-01" },
      { downloadMbps: 5, uploadMbps: 1, pingMs: 40, createdAt: "2026-01-01" },
    ])).toMatchObject({ downloadMbps: 100, uploadMbps: 20 });
  });
});
