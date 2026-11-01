import { describe, expect, it } from "vitest";
import { MESH_SYMPTOMS, type MeshSymptom } from "@/lib/mesh/troubleshoot";
import {
  BACKHAUL_CAVEAT,
  advanceQueue,
  backSession,
  canContinue,
  compareLocations,
  continueSession,
  emptyContext,
  emptyKnown,
  emptySession,
  parseWifiSession,
  questionsFor,
  rankRecommendations,
  resetSelection,
  symptomCategoriesCoverAll,
  toggleCategory,
  toggleSymptom,
  type AssistantContext,
} from "@/lib/mesh/wifi-assistant";

const TOOLS = new Set([
  "/speed-test",
  "/upload-speed-test",
  "/mesh-wifi/dead-zone-test",
  "/mesh-wifi/planner",
  "/mesh-wifi/backhaul-advisor",
  "/gaming-speed-test",
  "/streaming-speed-test",
  "/video-call-test",
  "/router-setup",
  "/connection-stability-test",
  "/dns-speed-test",
]);

function ids(symptoms: MeshSymptom[], answers: Record<string, string> = {}, context: AssistantContext = emptyContext()) {
  return rankRecommendations({ symptoms, answers, context }).map((item) => item.id);
}

describe("wifi assistant symptoms and questions", () => {
  it("keeps every original symptom in a category", () => {
    expect(symptomCategoriesCoverAll()).toBe(true);
    expect(new Set(MESH_SYMPTOMS).size).toBe(15);
  });

  it("gives every original symptom a recommendation without invented measurements", () => {
    for (const id of MESH_SYMPTOMS) {
      const items = rankRecommendations({ symptoms: [id], answers: {}, context: emptyContext() });
      expect(items.length).toBeGreaterThan(0);
      for (const item of items) {
        expect(item.possibleCause.length).toBeGreaterThan(0);
        expect(item.steps.length).toBeGreaterThan(0);
        expect(item.verification.length).toBeGreaterThan(0);
        expect(TOOLS.has(item.toolHref)).toBe(true);
        expect(item.supportHref).toBeNull();
        const evidence = [...item.supportingEvidence, ...item.missingEvidence].join(" ");
        expect(evidence).not.toMatch(/\d/);
        expect(evidence).not.toMatch(/dBm|RSSI/i);
        if (item.supportingEvidence.length === 0) {
          expect(item.missingEvidence.join(" ")).toMatch(/not enough information yet/i);
        }
      }
    }
  });

  it("filters, dedupes, and skips questions", () => {
    const gaming = questionsFor(["gaming"], emptyKnown());
    expect(gaming.ask.map((question) => question.id)).toEqual([
      "where",
      "connection",
      "when",
      "ethernet-helps-gaming",
      "latency-during-transfers",
      "gaming-pattern",
    ]);
    const both = questionsFor(["slow-wifi", "slow-backhaul", "gaming"], emptyKnown());
    const near = both.ask.filter((question) => ["near-primary", "slow-near-router", "faster-near-primary"].includes(question.id));
    const wired = both.ask.filter((question) => ["ethernet-compare", "ethernet-faster", "ethernet-helps-gaming"].includes(question.id));
    expect(near).toHaveLength(1);
    expect(wired).toHaveLength(1);
    expect(near[0]?.id).toBe("near-primary");
    expect(wired[0]?.id).toBe("ethernet-compare");

    const ethernet = questionsFor(["slow-wifi"], emptyKnown(), { connection: "ethernet" });
    expect(ethernet.ask.map((question) => question.id)).not.toContain("ethernet-faster");

    const saved = questionsFor(["slow-backhaul"], { nodeCount: 3, backhaul: "ethernet", ispMbps: null, rooms: [] });
    expect(saved.ask.map((question) => question.id)).not.toContain("node-count");
    expect(saved.ask.map((question) => question.id)).not.toContain("backhaul");
    expect(saved.saved.find((item) => item.id === "node-count")?.label).toContain("3");

    const changed = questionsFor(["slow-backhaul"], { nodeCount: 3, backhaul: "ethernet", ispMbps: null, rooms: [] }, { "node-count": "2" });
    expect(changed.ask.map((question) => question.id)).toContain("node-count");

    const known = questionsFor(["after-firmware", "node-offline"], emptyKnown());
    expect(known.ask.map((question) => question.id)).not.toContain("after-update");
    expect(known.ask.map((question) => question.id)).not.toContain("app-offline");
    expect(known.fromSymptoms.map((note) => note.id)).toEqual(["after-update", "app-offline"]);
  });
});

describe("wifi assistant ranking", () => {
  it("keeps a stable order and ranks a one-room problem ahead of a whole-home check", () => {
    const tied = ids(["slow-wifi", "dead-zone"]);
    expect(tied).toEqual(["slow-path", "dead-zone"]);
    expect(ids(["slow-wifi", "dead-zone"], { where: "skip", "near-primary": "not-sure" })).toEqual(tied);
    const directed = ids(["slow-wifi", "dead-zone"], { where: "one-room", "near-primary": "no" });
    expect(directed[0]).toBe("dead-zone");
    expect(directed).toEqual(ids(["slow-wifi", "dead-zone"], { where: "one-room", "near-primary": "no" }));
    const ranked = rankRecommendations({ symptoms: ["slow-wifi", "dead-zone"], answers: {}, context: emptyContext() });
    expect(ranked.map((item) => item.priority)).toEqual([1, 2]);
    expect(JSON.stringify(ranked)).not.toMatch(/confidence|probability|\d+\s*%/i);
  });

  it("cites saved medians and does not call a speed gap a faulty backhaul", () => {
    const context: AssistantContext = {
      ...emptyContext(),
      nodeCount: 2,
      satelliteCount: 1,
      rooms: [
        { id: "a", name: "Office", floorName: "Floor 1", problem: false },
        { id: "b", name: "Kitchen", floorName: "Floor 1", problem: true },
      ],
      measurements: [
        { roomId: "a", downloadMbps: 100, uploadMbps: 10, pingMs: 10, jitterMs: 2, testedAt: "2026-11-01T12:00:00.000Z", endpointName: "Edge" },
        { roomId: "b", downloadMbps: 20, uploadMbps: 4, pingMs: 30, jitterMs: 5, testedAt: "2026-11-01T12:00:00.000Z", endpointName: "Edge" },
      ],
    };
    const dead = rankRecommendations({ symptoms: ["dead-zone"], answers: {}, context });
    expect(dead[0]?.supportingEvidence.join(" ")).toContain("Kitchen");
    expect(dead[0]?.supportingEvidence.join(" ")).toMatch(/Evidence suggests/);
    expect(dead[0]?.supportingEvidence.join(" ")).not.toMatch(/dBm|RSSI/);
    const backhaul = rankRecommendations({ symptoms: ["slow-backhaul"], answers: {}, context });
    expect(backhaul[0]?.why).toContain(BACKHAUL_CAVEAT);
    expect(backhaul[0]?.possibleCause.toLowerCase()).not.toContain("faulty");
    expect(backhaul[0]?.supportingEvidence.join(" ")).toContain(BACKHAUL_CAVEAT);
  });

  it("passes a saved support URL through and omits one when none is stored", () => {
    const items = rankRecommendations({
      symptoms: ["after-firmware"],
      answers: {},
      context: { ...emptyContext(), brandName: "Amazon eero", supportUrl: "https://support.eero.com/", supportLabel: "Official Amazon eero support" },
    });
    expect(items[0]?.supportHref).toBe("https://support.eero.com/");
    expect(items[0]?.supportLabel).toBe("Official Amazon eero support");
  });
});

describe("wifi assistant comparison, verification, and session", () => {
  it("subtracts only metrics that exist on both locations", () => {
    const comparison = compareLocations(
      { label: "Living room", downloadMbps: 100, uploadMbps: 10, pingMs: 20, jitterMs: 5 },
      { label: "Bedroom", downloadMbps: 40, uploadMbps: null, pingMs: 35, jitterMs: null },
    );
    expect(comparison.downloadDeltaMbps).toBe(60);
    expect(comparison.uploadDeltaMbps).toBeNull();
    expect(comparison.pingDeltaMs).toBe(-15);
    expect(comparison.jitterDeltaMs).toBeNull();
    expect(comparison.caveat).toMatch(/not an RSSI or backhaul measurement/);
    expect(comparison).not.toHaveProperty("rssi");
    const empty = compareLocations(
      { label: "A", downloadMbps: null, uploadMbps: null, pingMs: null, jitterMs: null },
      { label: "B", downloadMbps: 10, uploadMbps: 1, pingMs: 5, jitterMs: 1 },
    );
    expect(empty.downloadDeltaMbps).toBeNull();
    expect(empty.uploadDeltaMbps).toBeNull();
    expect(empty.pingDeltaMs).toBeNull();
    expect(empty.jitterDeltaMs).toBeNull();
  });

  it("advances the queue without repeating a completed check", () => {
    const ranked = rankRecommendations({
      symptoms: ["smart-home", "gaming", "dead-zone", "slow-wifi"],
      answers: {},
      context: emptyContext(),
    });
    expect(ranked.map((item) => item.id)).toEqual(["slow-path", "dead-zone", "gaming", "smart-home"]);
    const first = advanceQueue(ranked, {});
    expect(first.status).toBe("active");
    if (first.status !== "active") return;
    expect(first.current.id).toBe("slow-path");
    expect(first.also.map((item) => item.id)).toEqual(["dead-zone", "gaming"]);
    const next = advanceQueue(ranked, { "slow-path": "unchanged" });
    expect(next.status).toBe("active");
    if (next.status === "active") {
      expect(next.current.id).toBe("dead-zone");
      expect([next.current, ...next.also].map((item) => item.id)).not.toContain("slow-path");
    }
    const stayed = advanceQueue(ranked, { "slow-path": "untried" });
    expect(stayed.status).toBe("active");
    if (stayed.status === "active") expect(stayed.current.id).toBe("slow-path");
    expect(advanceQueue(ranked, { "slow-path": "fixed" }).status).toBe("fixed");
    expect(advanceQueue(ranked, {
      "slow-path": "unchanged",
      "dead-zone": "improved",
      gaming: "worse",
      "smart-home": "unchanged",
    }).status).toBe("exhausted");
  });

  it("parses a session, rejects invalid data, and resets", () => {
    const session = emptySession();
    expect(parseWifiSession(session).ok).toBe(true);
    expect(parseWifiSession({ ...session, schemaVersion: 2 }).ok).toBe(false);
    expect(parseWifiSession({ ...session, wifiPassword: "nope" }).ok).toBe(false);
    expect(parseWifiSession({ ...session, rooms: { ...session.rooms, aLabel: "192.168.1.1" } }).ok).toBe(false);
    expect(parseWifiSession({ ...session, symptoms: ["not-a-symptom"] }).ok).toBe(false);
    const reset = resetSelection({ ...session, symptoms: ["slow-wifi"], step: 2, highestStep: 2, answers: { where: "everywhere" }, verifications: { "slow-path": "unchanged" } });
    expect(reset.symptoms).toEqual([]);
    expect(reset.answers).toEqual({});
    expect(reset.step).toBe(0);
    expect(reset.verifications).toEqual({});
  });

  it("keeps a multi-select when going back and blocks continue until a symptom is chosen", () => {
    let session = toggleSymptom(emptySession(), "slow-wifi");
    session = toggleSymptom(session, "gaming");
    expect(session.symptoms).toEqual(["slow-wifi", "gaming"]);
    expect(canContinue(session).ok).toBe(true);
    session = continueSession(session);
    expect(session.step).toBe(1);
    session = backSession(session);
    expect(session.step).toBe(0);
    expect(session.symptoms).toEqual(["slow-wifi", "gaming"]);
    session = toggleCategory(session, "slow-internet");
    expect(session.symptoms).toEqual(["gaming"]);
    expect(canContinue(resetSelection(session)).ok).toBe(false);
    expect(continueSession(emptySession())).toEqual(emptySession());
  });
});
