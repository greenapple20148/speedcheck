import { z } from "zod";
import { emptyPlan } from "@/lib/mesh/plan";
import { MESH_SCHEMA_VERSION, MESH_STORAGE_KEY, type MeshPlan } from "@/lib/mesh/types";

const material = z.enum(["open", "drywall", "wood", "brick", "concrete", "glass"]);
const point = z.object({ x: z.number().min(0).max(400), y: z.number().min(0).max(400) });
const room = z.object({
  id: z.string().min(1).max(80),
  name: z.string().max(80),
  x: z.number().min(0).max(400),
  y: z.number().min(0).max(400),
  w: z.number().min(1).max(200),
  h: z.number().min(1).max(200),
  material,
  priority: z.boolean(),
  problem: z.boolean(),
  points: z.array(point).min(3).max(16).optional(),
});
const node = z.object({
  id: z.string().min(1).max(80),
  name: z.string().max(40),
  x: z.number().min(0).max(400),
  y: z.number().min(0).max(400),
  role: z.enum(["primary", "satellite"]),
  band: z.enum(["2.4", "5", "6"]).optional(),
  link: z.enum(["wired", "wireless"]).optional(),
  parentId: z.string().min(1).max(80).optional(),
});
const wall = z.object({
  id: z.string().min(1).max(80),
  x1: z.number().min(0).max(400),
  y1: z.number().min(0).max(400),
  x2: z.number().min(0).max(400),
  y2: z.number().min(0).max(400),
  material,
  opening: z.boolean(),
});
const floor = z.object({
  id: z.string().min(1).max(80),
  name: z.string().max(40),
  widthFt: z.number().min(8).max(300),
  heightFt: z.number().min(8).max(300),
  rooms: z.array(room).max(40),
  nodes: z.array(node).max(12),
  outlets: z.array(z.object({ id: z.string().max(80), x: z.number().min(0).max(400), y: z.number().min(0).max(400) })).max(30),
  walls: z.array(wall).max(80).optional(),
  imageDataUrl: z.string().max(500_000).nullable().optional(),
  image: z.object({
    opacity: z.number().min(0).max(1).optional(),
    rotation: z.number().min(-360).max(360).optional(),
    scale: z.number().min(0.2).max(5).optional(),
    offsetX: z.number().min(-200).max(200).optional(),
    offsetY: z.number().min(-200).max(200).optional(),
  }).optional(),
});

const planSchema = z.object({
  schemaVersion: z.literal(MESH_SCHEMA_VERSION),
  updatedAt: z.string().max(40),
  wizardStep: z.number().int().min(0).max(3),
  home: z.object({
    area: z.number().min(0).max(20000),
    unit: z.enum(["sqft", "sqm"]),
    floors: z.number().int().min(1).max(6),
    construction: z.enum(["wood", "drywall", "brick", "concrete", "mixed"]),
    devices: z.number().int().min(0).max(500),
    ispMbps: z.number().min(0).max(10000).nullable(),
    connection: z.enum(["cable", "fiber", "dsl", "fixed-wireless", "unknown"]),
    usage: z.array(z.enum(["browsing", "streaming", "calls", "gaming", "smart-home"])).max(5),
    networkName: z.string().max(32),
    brandSlug: z.string().max(40),
    backhaul: z.enum(["unknown", "ethernet", "wireless-shared", "wireless-dedicated", "moca", "powerline"]),
    coax: z.boolean(),
  }),
  floors: z.array(floor).min(1).max(6),
  activeFloorId: z.string().min(1).max(80),
  measurements: z.array(z.object({
    roomId: z.string().max(80),
    downloadMbps: z.number().nullable(),
    uploadMbps: z.number().nullable(),
    pingMs: z.number().nullable(),
    jitterMs: z.number().nullable(),
    testedAt: z.string().max(40),
    endpointName: z.string().max(80).nullable(),
    loadedLatencyMs: z.number().nullable().optional(),
    provider: z.enum(["cloudflare", "dedicated"]).nullable().optional(),
  })).max(80),
  checkedSetup: z.array(z.string().max(80)).max(40),
});

function hasSecretKey(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasSecretKey);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, child]) => /password|credential|secret|admin/i.test(key) || hasSecretKey(child));
}

function stripOversizedImages(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(stripOversizedImages);
  const next: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === "imageDataUrl" && typeof child === "string" && child.length > 500_000) next[key] = null;
    else next[key] = stripOversizedImages(child);
  }
  return next;
}

export function parseMeshPlan(raw: unknown): { ok: true; plan: MeshPlan } | { ok: false; error: string } {
  if (hasSecretKey(raw)) {
    return { ok: false, error: "This file includes a password or credential field. Remove it and import again." };
  }
  const parsed = planSchema.safeParse(stripOversizedImages(raw));
  if (!parsed.success) return { ok: false, error: "This file is not a mesh plan this version can read." };
  return { ok: true, plan: parsed.data };
}

export function loadPlan(): MeshPlan {
  if (typeof window === "undefined") return emptyPlan();
  try {
    const raw = window.localStorage.getItem(MESH_STORAGE_KEY);
    if (!raw) return emptyPlan();
    const parsed = parseMeshPlan(JSON.parse(raw));
    return parsed.ok ? parsed.plan : emptyPlan();
  } catch {
    return emptyPlan();
  }
}

export function savePlan(plan: MeshPlan): void {
  if (typeof window === "undefined") return;
  const next = { ...plan, updatedAt: new Date().toISOString() };
  window.localStorage.setItem(MESH_STORAGE_KEY, JSON.stringify(next));
}

export function clearPlan(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(MESH_STORAGE_KEY);
}
