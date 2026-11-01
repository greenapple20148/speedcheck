/** Shared measurement record. Values are measured, never filled in with placeholders. */

export type MeasurementMethod =
  | "http-throughput"
  | "http-rtt"
  | "http-request-loss"
  | "resource-timing-dns"
  | "derived";

export interface Measurement {
  type: string;
  value: number | null;
  unit: string;
  timestamp: string;
  endpointId: string;
  method: MeasurementMethod;
  sampleCount: number;
  confidence: "high" | "medium" | "low" | "unavailable";
  limitations: string;
  error?: string;
}

export interface EndpointRef {
  id: string;
  label: string;
}
