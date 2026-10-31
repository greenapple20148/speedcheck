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

export interface SpeedMetrics {
  downloadMbps: number | null;
  uploadMbps: number | null;
  pingMs: number | null;
  jitterMs: number | null;
  downloadedBytes: number;
  uploadedBytes: number;
  durationMs: number;
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
}

export interface SpeedTestOptions {
  mode?: TestMode;
  signal?: AbortSignal;
  onProgress?: (state: ProgressState) => void;
  baseUrl?: string;
}

export interface SpeedSample {
  /** Seconds since test start */
  testElapsedSec: number;
  /** Seconds since current download/upload phase start */
  phaseElapsedSec: number;
  mbps: number;
  kind: "download" | "upload";
}
