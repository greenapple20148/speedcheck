export type TestMode = "lightweight" | "standard";

export type TestPhase =
  | "idle"
  | "preparing"
  | "ping"
  | "download"
  | "upload"
  | "saving"
  | "complete"
  | "error"
  | "cancelled";

export interface ServerInfo {
  id: string;
  name: string;
  region: string;
  location: string;
  url: string;
  healthy: boolean;
  /** WGS84 degrees when configured on the measurement node */
  latitude?: number;
  longitude?: number;
}

export interface SessionConfig {
  sessionId: string;
  token: string;
  mode: TestMode;
  expiresAt: number;
  maxBytes: number;
  maxDurationMs: number;
  downloadConnections: number;
  uploadConnections: number;
  chunkSize: number;
  server: ServerInfo;
}

export type BufferbloatGrade = "A" | "B" | "C" | "D" | "F";

export type ConnectionTag = "wifi" | "wired";

export interface SpeedMetrics {
  downloadMbps: number | null;
  uploadMbps: number | null;
  pingMs: number | null;
  jitterMs: number | null;
  downloadedBytes: number;
  uploadedBytes: number;
  durationMs: number;
  /** Set when packet-loss measurement is configured (not default on public Cloudflare). */
  packetLossPercent?: number | null;
  /** Standard mode: loaded latency / bufferbloat (optional). */
  bufferbloatIdleMs?: number | null;
  bufferbloatLoadedDownMs?: number | null;
  bufferbloatLoadedUpMs?: number | null;
  bufferbloatGrade?: BufferbloatGrade | null;
}

export interface ProgressState {
  phase: TestPhase;
  progress: number;
  currentMbps: number | null;
  metrics: SpeedMetrics;
  error?: string;
}

export interface ClientNetworkInfo {
  publicIpMasked: string | null;
  publicIpSource?: "edge" | "lookup" | "unavailable";
  ispVerified?: boolean;
  isp: string | null;
  org: string | null;
  country: string | null;
  city: string | null;
  asn: string | null;
}

export interface TestResultPayload {
  id?: string;
  shareId?: string | null;
  downloadMbps: number;
  uploadMbps: number;
  pingMs: number;
  jitterMs: number;
  mode: TestMode;
  serverId: string;
  serverName: string;
  isp?: string | null;
  city?: string | null;
  country?: string | null;
  isPublic: boolean;
  createdAt?: string;
  bufferbloatIdleMs?: number | null;
  bufferbloatLoadedDownMs?: number | null;
  bufferbloatLoadedUpMs?: number | null;
  bufferbloatGrade?: BufferbloatGrade | null;
  connectionTag?: ConnectionTag | null;
}

export type SpeedtestProvider = "cloudflare" | "dedicated";

export interface SpeedTestOptions {
  mode?: TestMode;
  signal?: AbortSignal;
  onProgress?: (state: ProgressState) => void;
  baseUrl?: string;
  provider?: SpeedtestProvider;
}

export interface SpeedSample {
  /** Seconds since test start */
  testElapsedSec: number;
  /** Seconds since current download/upload phase start */
  phaseElapsedSec: number;
  mbps: number;
  kind: "download" | "upload";
}
