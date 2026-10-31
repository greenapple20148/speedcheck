import { promises as fs } from "fs";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "crypto";
import type { TestResultPayload } from "@/types/speedtest";
import { resolveResultsStorePath } from "@/lib/db/results-store-path";

export interface StoredResult extends TestResultPayload {
  id: string;
  shareId: string | null;
  createdAt: string;
}

interface LocalStore {
  results: StoredResult[];
  events: Array<{ name: string; props: Record<string, unknown>; ts: number }>;
  bandwidthDaily: Array<{ day: string; bytes: number; tests: number }>;
}

function dataPath(): string {
  return resolveResultsStorePath();
}

function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function readLocal(): Promise<LocalStore> {
  try {
    const raw = await fs.readFile(/*turbopackIgnore: true*/ dataPath(), "utf8");
    return JSON.parse(raw) as LocalStore;
  } catch {
    return { results: [], events: [], bandwidthDaily: [] };
  }
}

async function writeLocal(store: LocalStore) {
  const filePath = dataPath();
  await fs.mkdir(/*turbopackIgnore: true*/ path.dirname(filePath), {
    recursive: true,
  });
  await fs.writeFile(
    /*turbopackIgnore: true*/ filePath,
    JSON.stringify(store, null, 2),
    "utf8",
  );
}

function makeId() {
  return randomBytes(8).toString("hex");
}

export async function saveResult(
  payload: TestResultPayload,
): Promise<StoredResult> {
  const id = makeId();
  const shareId = payload.isPublic ? makeId() : null;
  const createdAt = new Date().toISOString();
  const row: StoredResult = {
    ...payload,
    id,
    shareId,
    createdAt,
  };

  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from("test_results").insert({
      id,
      share_id: shareId,
      download_mbps: payload.downloadMbps,
      upload_mbps: payload.uploadMbps,
      ping_ms: payload.pingMs,
      jitter_ms: payload.jitterMs,
      mode: payload.mode,
      server_id: payload.serverId,
      server_name: payload.serverName,
      isp: payload.isp ?? null,
      city: payload.city ?? null,
      country: payload.country ?? null,
      is_public: payload.isPublic,
      created_at: createdAt,
    });
    if (error) throw error;
    return row;
  }

  const store = await readLocal();
  store.results.unshift(row);
  store.results = store.results.slice(0, 5000);
  await writeLocal(store);
  return row;
}

export async function getResult(id: string): Promise<StoredResult | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("test_results")
      .select("*")
      .or(`id.eq.${id},share_id.eq.${id}`)
      .maybeSingle();
    if (error || !data) return null;
    if (!data.is_public && data.id !== id) return null;
    return {
      id: data.id,
      shareId: data.share_id,
      downloadMbps: Number(data.download_mbps),
      uploadMbps: Number(data.upload_mbps),
      pingMs: Number(data.ping_ms),
      jitterMs: Number(data.jitter_ms),
      mode: data.mode,
      serverId: data.server_id,
      serverName: data.server_name,
      isp: data.isp,
      city: data.city,
      country: data.country,
      isPublic: data.is_public,
      createdAt: data.created_at,
    };
  }

  const store = await readLocal();
  return (
    store.results.find((r) => r.id === id || (r.isPublic && r.shareId === id)) ??
    null
  );
}

export async function makeResultPublic(id: string): Promise<StoredResult | null> {
  const supabase = getSupabase();
  const shareId = makeId();
  if (supabase) {
    const { data, error } = await supabase
      .from("test_results")
      .update({ is_public: true, share_id: shareId })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error || !data) return null;
    return getResult(id);
  }
  const store = await readLocal();
  const idx = store.results.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  store.results[idx] = {
    ...store.results[idx],
    isPublic: true,
    shareId: store.results[idx].shareId || shareId,
  };
  await writeLocal(store);
  return store.results[idx];
}

export async function recordAnalyticsEvent(
  name: string,
  props: Record<string, unknown>,
) {
  const supabase = getSupabase();
  if (supabase) {
    await supabase.from("analytics_events").insert({
      name,
      props,
      created_at: new Date().toISOString(),
    });
    return;
  }
  const store = await readLocal();
  store.events.push({ name, props, ts: Date.now() });
  store.events = store.events.slice(-2000);
  await writeLocal(store);
}

export async function getAnalyticsSummary() {
  const store = await readLocal();
  const byName: Record<string, number> = {};
  for (const e of store.events) {
    byName[e.name] = (byName[e.name] || 0) + 1;
  }
  return {
    totalResults: store.results.length,
    events: byName,
    recentResults: store.results.slice(0, 20).map((r) => ({
      id: r.id,
      downloadMbps: r.downloadMbps,
      uploadMbps: r.uploadMbps,
      pingMs: r.pingMs,
      mode: r.mode,
      createdAt: r.createdAt,
      isPublic: r.isPublic,
    })),
  };
}

export function hashIpHint(ip: string | null): string | null {
  if (!ip) return null;
  const salt = process.env.SESSION_HASH_SALT || "speedcheck";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 16);
}

export function maskIp(ip: string | null): string | null {
  if (!ip) return null;
  if (ip.includes(":")) {
    const parts = ip.split(":");
    return parts.slice(0, 3).join(":") + "::";
  }
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
}
